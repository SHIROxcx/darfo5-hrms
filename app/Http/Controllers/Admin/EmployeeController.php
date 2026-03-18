<?php

namespace App\Http\Controllers\Admin;

use App\Events\AccountApproved;
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

        $profileController = new \App\Http\Controllers\UserProfileController();

        return Inertia::render('Profile/Show', [
            'profileUser'    => $this->formatUser($user),
            // Admin can always edit company and government IDs
            'canEditCompany' => true,
            'divisionAbbreviations' => \App\Models\Division::pluck('abbreviation', 'name'),
            'sectionAbbreviations'  => \App\Models\Section::pluck('abbreviation', 'name'),
            'bachelorsDegrees' => \App\Models\BachelorsDegree::orderBy('degree')->get(['id', 'degree', 'abbreviation']),
            'graduatePrograms' => \App\Models\GraduateProgram::orderBy('program')->get(['id', 'program', 'abbreviation']),
            'eligibilityTitles' => \App\Models\Eligibility::orderBy('title')->get(['id', 'title', 'abbreviation']),
            'adminContext'   => true,
        ]);
    }

    private function formatUser(User $u): array
    {
        $ep = $u->employeeProfile;
        return [
            'id'          => $u->id,
            'name'        => $u->name,
            'first_name'  => $u->first_name,
            'middle_name' => $u->middle_name,
            'last_name'   => $u->last_name,
            'name_ext'    => $u->name_ext,
            'email'       => $u->email,
            'photo'       => $u->photo,
            'is_approved' => $u->is_approved,
            'roles'       => $u->getRoleNames()->values()->toArray(),
            'employee_profile' => $ep ? [
                'sex'               => $ep->sex,
                'birth_place'       => $ep->birth_place,
                'civil_status'      => $ep->civil_status,
                'mobile_number'     => $ep->mobile_number,
                'employee_number'   => $ep->employee_number,
                'employment_type'   => $ep->employment_type,
                'position'          => $ep->position,
                'salary_grade'      => $ep->salary_grade,
                'place_assign'      => $ep->place_assign,
                'division'          => $ep->division,
                'section'           => $ep->section,
                'date_hired'        => $ep->date_hired,
                'is_active'         => $ep->is_active,
                'gsis_number'       => $ep->gsis_number,
                'sss_number'        => $ep->sss_number,
                'pagibig_number'    => $ep->pagibig_number,
                'tin_number'        => $ep->tin_number,
                'philhealth_number' => $ep->philhealth_number,
            ] : null,
            'degrees'          => $u->degrees->toArray(),
            'graduate_studies' => $u->graduateStudies->toArray(),
            'eligibilities'    => $u->eligibilities->toArray(),
        ];
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

        // Broadcast real-time event to the employee
        AccountApproved::dispatch($user);  

        return back()->with('success', "{$user->first_name} {$user->last_name}'s account has been approved.");
    }

    public function toggleApproval(User $user)
    {
        $user->update(['is_approved' => ! $user->is_approved]);

        // Only send approval email when toggled to approved
        if ($user->is_approved) {
            $user->notify(new \App\Notifications\AccountApprovedNotification());
            // Broadcast real-time event to the employee
            AccountApproved::dispatch($user);  
        }

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