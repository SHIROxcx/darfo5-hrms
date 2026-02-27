<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $employees = User::role('employee')
            ->with(['employeeProfile'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhereHas('employeeProfile', function ($q) use ($search) {
                          $q->where('employee_number', 'like', "%{$search}%")
                            ->orWhere('position', 'like', "%{$search}%");
                      });
                });
            })
            ->when($request->status, function ($query, $status) {
                if ($status === 'active') {
                    $query->whereHas('employeeProfile', fn($q) => $q->where('is_active', true));
                } elseif ($status === 'inactive') {
                    $query->whereHas('employeeProfile', fn($q) => $q->where('is_active', false));
                } elseif ($status === 'pending') {
                    $query->where('is_approved', false);
                }
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Employees/Index', [
            'employees' => $employees,
            'filters'   => $request->only(['search', 'status']),
        ]);
    }

    public function show(User $user)
    {
        $user->load([
            'employeeProfile',
            'degrees',
            'graduateStudies',
            'eligibilities',
        ]);

        return Inertia::render('Admin/Employees/Show', [
            'employee' => $user,
        ]);
    }

    public function approve(User $user)
    {
        // Make sure email is verified before approving
        if (! $user->hasVerifiedEmail()) {
            return back()->with('error', 'This employee has not verified their email yet.');
        }
        $user->update(['is_approved' => true]);

        // Send approval email
        $user->notify(new \App\Notifications\AccountApprovedNotification());

        return back()->with('success', "{$user->first_name} {$user->last_name}'s account has been approved.");
    }

    public function toggleApproval(User $user)
    {
        $user->update(['is_approved' => ! $user->is_approved]);
        $status = $user->is_approved ? 'approved' : 'revoked';
        return back()->with('success', "Access {$status} for {$user->first_name} {$user->last_name}.");
    }

    public function destroy(User $user)
    {
        $name = "{$user->first_name} {$user->last_name}";
        $user->delete();
        return back()->with('success', "{$name} has been permanently deleted.");
    }
}