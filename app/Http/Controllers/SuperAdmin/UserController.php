<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a paginated list of all users excluding the superadmin.
     * withQueryString() preserves search/filter params across pagination pages.
     */
    public function index(Request $request)
    {
        $users = User::withoutRole('superadmin')
            ->with('roles')
            ->when($request->search, function ($query, $search) {
                // Filter by name or email if a search term is provided
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->role, function ($query, $role) {
                $query->role($role);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        /**
         * only expose 'admin' and 'employee' as assignable roles.
         * superadmin is excluded — it should never be assignable from the UI.
         */
        $roles = Role::whereIn('name', ['admin', 'employee'])->get();

        return Inertia::render('SuperAdmin/Users/Index', [
            'users'   => $users,
            'roles'   => $roles,
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    /**
     * assign a new role to a user.
     *
     * syncRoles() removes ALL existing roles first, then assigns the new one.
     * This ensures a user can only have ONE role at a time,
     * HRMS (a user is either admin OR employee,
     * never both).
     *
     * Validate that the role being assigned is only 'admin' or 'employee'
     */
    public function assignRole(Request $request, User $user)
    {
        $request->validate([
            'role' => ['required', 'string', 'in:admin,employee'],
        ]);

        // Extra safety: never allow modifying a superadmin account
        if ($user->hasRole('superadmin')) {
            return back()->with('error', 'The superadmin account cannot be modified.');
        }

        $user->syncRoles([$request->role]);

        return back()->with('success', "Role updated to '{$request->role}' for {$user->first_name} {$user->last_name}.");
    }

    /**
     * Soft-toggle a user's is_approved status.
     *
     * let superadmin revoke or re-grant access without deleting the account
     */
    public function toggleApproval(User $user)
    {
        // extra safety: never allow modifying a superadmin account
        if ($user->hasRole('superadmin')) {
            return back()->with('error', 'The superadmin account cannot be modified.');
        }

        $user->update(['is_approved' => ! $user->is_approved]);

        $status = $user->is_approved ? 'approved' : 'revoked';

        return back()->with('success', "Access {$status} for {$user->first_name} {$user->last_name}.");
    }

    /**
     * permanently delete a user and all their related data.
     *
     * foreign keys use cascadeOnDelete(), deleting the user
     * will automatically remove their employee_profile, degrees,
     * graduate_studies, and eligibilities records too.
     *
     * never allow deleting the currently authenticated user or a superadmin.
     */
    public function destroy(Request $request, User $user)
    {
        if ($user->hasRole('superadmin')) {
            return back()->with('error', 'The superadmin account cannot be deleted.');
        }

        if ($request->user()->id === $user->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $name = "{$user->first_name} {$user->last_name}";
        $user->delete();

        return back()->with('success', "{$name} has been permanently deleted.");
    }
}