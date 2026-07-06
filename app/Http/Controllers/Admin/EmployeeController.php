<?php

namespace App\Http\Controllers\Admin;

use App\Events\AccountApproved;
use App\Http\Controllers\Concerns\BuildsPdsData;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    use BuildsPdsData;

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
            'pdsPersonalInfo',
            'pdsEducation',
            'pdsEligibilities',
        ]);

        return Inertia::render('Profile/Show', [
            'profileUser'    => $this->formatUser($user),
            'canEditCompany' => true,
            'pdsData'        => $this->getPdsData($user->id),
            'divisionAbbreviations' => \App\Models\Division::pluck('abbreviation', 'name'),
            'sectionAbbreviations'  => \App\Models\Section::pluck('abbreviation', 'name'),
            'bachelorsDegrees'  => \App\Models\BachelorsDegree::orderBy('degree')->get(['id', 'degree', 'abbreviation']),
            'graduatePrograms'  => \App\Models\GraduateProgram::orderBy('program')->get(['id', 'program', 'abbreviation']),
            'eligibilityTitles' => \App\Models\Eligibility::orderBy('title')->get(['id', 'title', 'abbreviation']),
            'adminContext'   => true,
        ]);
    }

    private function formatUser(User $u): array
    {
        $ep  = $u->employeeProfile;
        $pds = $u->pdsPersonalInfo;

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

            // Company data from employee_profiles.
            // employee_number display is sourced from pds_personal_info.agency_employee_no
            // (falls back to employee_profiles.employee_number for legacy records).
            // It is NOT editable from the profile page — only via the PDS form.
            'employee_profile' => $ep ? [
                'employee_number'  => $pds?->agency_employee_no ?? $ep->employee_number,
                'employment_type'  => $ep->employment_type,
                'position'         => $ep->position,
                'salary_grade'     => $ep->salary_grade,
                'place_assign'     => $ep->place_assign,
                'division'         => $ep->division,
                'section'          => $ep->section,
                'date_hired'       => $ep->date_hired,
                'is_active'        => $ep->is_active,
            ] : null,

            // Personal / government data — all from pds_personal_info
            'personal_info' => $pds ? [
                'sex'               => $pds->sex,
                'birth_place'       => $pds->birth_place,
                'civil_status'      => $pds->civil_status,
                'mobile_number'     => $pds->mobile_number,
                'agency_employee_no'=> $pds->agency_employee_no,
                'umid_number'       => $pds->umid_number,
                'pagibig_number'    => $pds->pagibig_number,
                'philhealth_number' => $pds->philhealth_number,
                'philsys_number'    => $pds->philsys_number,
                'tin_number'        => $pds->tin_number,
            ] : null,

            'degrees' => $u->pdsEducation
                ->where('level', 'College')
                ->values()
                ->map(fn($e) => [
                    'id'              => $e->id,
                    'degree'          => $e->course,
                    'school_name'     => $e->school_name,
                    'period_from'     => $e->period_from,
                    'period_to'       => $e->period_to,
                    'year_graduated'  => $e->year_graduated,
                    'honors_received' => $e->honors_received,
                ])->toArray(),

            'graduate_studies' => $u->pdsEducation
                ->where('level', 'Graduate Studies')
                ->values()
                ->map(fn($e) => [
                    'id'          => $e->id,
                    'program'     => $e->course,
                    'school_name' => $e->school_name,
                    'period_from' => $e->period_from,
                    'period_to'   => $e->period_to,
                ])->toArray(),

            'eligibilities' => $u->pdsEligibilities
                ->map(fn($e) => [
                    'id'                   => $e->id,
                    'eligibility'          => $e->career_service,
                    'rating'               => $e->rating,
                    'date_of_examination'  => $e->date_of_examination,
                    'place_of_examination' => $e->place_of_examination,
                    'license_number'       => $e->license_number,
                    'license_validity'     => $e->license_validity,
                ])->toArray(),
        ];
    }

    public function approve(User $user)
    {
        if (! $user->hasVerifiedEmail()) {
            return back()->with('error', 'This employee has not verified their email yet.');
        }

        $user->update(['is_approved' => true]);
        $user->notify(new \App\Notifications\AccountApprovedNotification());
        AccountApproved::dispatch($user);

        return back()->with('success', "{$user->first_name} {$user->last_name}'s account has been approved.");
    }

    public function toggleApproval(User $user)
    {
        $user->update(['is_approved' => ! $user->is_approved]);

        if ($user->is_approved) {
            $user->notify(new \App\Notifications\AccountApprovedNotification());
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