<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\PdsEducation;
use App\Models\PdsEligibility;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserProfileController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────────
    // SHOW
    // ─────────────────────────────────────────────────────────────────────────

    public function show(Request $request, ?int $id = null)
    {
        $authUser = $request->user();

        $target = $id
            ? User::with([
                'employeeProfile',
                'pdsPersonalInfo',
                'pdsEducation',         // all education records
                'pdsEligibilities',     // all eligibility records
            ])->findOrFail($id)
            : $authUser->load([
                'employeeProfile',
                'pdsPersonalInfo',
                'pdsEducation',
                'pdsEligibilities',
            ]);

        if ($id && $authUser->id !== $id && ! $authUser->hasRole('admin')) {
            abort(403);
        }

        return Inertia::render('Profile/Show', [
            'profileUser'    => $this->format($target),
            'canEditCompany' => $authUser->hasRole('admin'),
            'divisionAbbreviations' => \App\Models\Division::pluck('abbreviation', 'name'),
            'sectionAbbreviations'  => \App\Models\Section::pluck('abbreviation', 'name'),
            // These are kept for the searchable dropdowns in the modals.
            // Editing now only happens in the PDS page, but we still need them
            // if you ever re-enable inline editing here.
            'bachelorsDegrees' => \App\Models\BachelorsDegree::orderBy('degree')->get(['id', 'degree', 'abbreviation']),
            'graduatePrograms' => \App\Models\GraduateProgram::orderBy('program')->get(['id', 'program', 'abbreviation']),
            'eligibilityTitles' => \App\Models\Eligibility::orderBy('title')->get(['id', 'title', 'abbreviation']),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PERSONAL INFO  (owner or admin)
    // ─────────────────────────────────────────────────────────────────────────

    public function updatePersonal(Request $request)
    {
        $user = $request->user();
        $this->savePersonal($request, $user);
        return back();
    }

    public function updatePersonalFor(Request $request, int $id)
    {
        abort_unless($request->user()->hasAnyRole(['admin', 'superadmin']), 403);
        $user = User::findOrFail($id);
        $this->savePersonal($request, $user);
        return back();
    }

    private function savePersonal(Request $request, User $user): void
    {
        $data = $request->validate([
            'first_name'    => 'required|string|max:255',
            'middle_name'   => 'nullable|string|max:255',
            'last_name'     => 'required|string|max:255',
            'name_ext'      => 'nullable|string|max:20',
            'email'         => 'required|email|unique:users,email,' . $user->id,
            'sex'           => 'nullable|in:Male,Female',
            'birth_place'   => 'nullable|string|max:255',
            'civil_status'  => 'nullable|in:Single,Married,Widowed,Separated,Other',
            'mobile_number' => 'nullable|string|max:20',
        ]);

        $user->update([
            'first_name'  => $data['first_name'],
            'middle_name' => $data['middle_name'],
            'last_name'   => $data['last_name'],
            'name_ext'    => $data['name_ext'],
            'name'        => trim($data['first_name'] . ' ' . $data['last_name']),
            'email'       => $data['email'],
        ]);

        // Personal profile details live in pds_personal_info now.
        $user->pdsPersonalInfo()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'sex'           => $data['sex'],
                'birth_place'   => $data['birth_place'],
                'civil_status'  => $data['civil_status'],
                'mobile_number' => $data['mobile_number'],
                'email'         => $data['email'],
            ]
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMPANY INFO  (admin only)
    // ─────────────────────────────────────────────────────────────────────────

    public function updateCompany(Request $request, int $id)
    {
        abort_unless($request->user()->hasRole('admin'), 403);

        $user = User::findOrFail($id);
        $data = $request->validate([
            'employee_number' => 'nullable|string|max:50',
            'employment_type' => 'nullable|string|max:100',
            'position'        => 'nullable|string|max:255',
            'salary_grade'    => 'nullable|string|max:50',
            'place_assign'    => 'nullable|string|max:255',
            'division'        => 'nullable|string|max:255',
            'section'         => 'nullable|string|max:255',
            'date_hired'      => 'nullable|date',
        ]);

        $user->employeeProfile()->updateOrCreate(['user_id' => $user->id], $data);

        return back();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GOVERNMENT IDs  (admin or owner)
    // Stored in pds_personal_info — single source of truth per PDS schema.
    // ─────────────────────────────────────────────────────────────────────────

    public function updateGovernment(Request $request, int $id)
    {
        $authUser = $request->user();
        abort_unless($authUser->hasRole('admin') || $authUser->id === $id, 403);

        $user = User::findOrFail($id);
        $data = $request->validate([
            'umid_number'       => 'nullable|string|max:50',
            'pagibig_number'    => 'nullable|string|max:50',
            'philsys_number'    => 'nullable|string|max:50',
            'philhealth_number' => 'nullable|string|max:50',
            'tin_number'        => 'nullable|string|max:50',
        ]);

        // Write to pds_personal_info (not employee_profiles).
        $user->pdsPersonalInfo()->updateOrCreate(['user_id' => $user->id], $data);

        return back();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PHOTO
    // ─────────────────────────────────────────────────────────────────────────

    public function updatePhoto(Request $request)
    {
        $request->validate(['photo' => 'required|image|max:2048']);
        $path = $request->file('photo')->store('photos', 'public');
        $request->user()->update(['photo' => $path]);
        return back();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FORMAT HELPER
    // Maps PDS table records into the shape Show.tsx expects.
    // ─────────────────────────────────────────────────────────────────────────

    private function format(User $u): array
    {
        $ep  = $u->employeeProfile;
        $pds = $u->pdsPersonalInfo;   // may be null until user fills PDS

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

            // Company / HR data still lives in employee_profiles.
            'employee_profile' => $ep ? [
                'employee_number'  => $ep->employee_number,
                'employment_type'  => $ep->employment_type,
                'position'         => $ep->position,
                'salary_grade'     => $ep->salary_grade,
                'place_assign'     => $ep->place_assign,
                'division'         => $ep->division,
                'section'          => $ep->section,
                'date_hired'       => $ep->date_hired,
                'is_active'        => $ep->is_active,
            ] : null,

            // Personal / government data from pds_personal_info.
            'personal_info' => $pds ? [
                'sex'              => $pds->sex,
                'birth_place'      => $pds->birth_place,
                'civil_status'     => $pds->civil_status,
                'mobile_number'    => $pds->mobile_number,
                'umid_number'      => $pds->umid_number,
                'pagibig_number'   => $pds->pagibig_number,
                'philhealth_number'=> $pds->philhealth_number,
                'philsys_number'   => $pds->philsys_number,
                'tin_number'       => $pds->tin_number,
            ] : null,

            // College records from pds_education (level = College).
            'degrees' => $u->pdsEducation
                ->where('level', 'College')
                ->values()
                ->map(fn($e) => [
                    'id'          => $e->id,
                    'degree'      => $e->course,          // "course" = degree title in PDS
                    'school_name' => $e->school_name,
                    'period_from' => $e->period_from,
                    'period_to'   => $e->period_to,
                    'year_graduated' => $e->year_graduated,
                    'honors_received' => $e->honors_received,
                ])->toArray(),

            // Graduate Studies records from pds_education (level = Graduate Studies).
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

            // Eligibilities from pds_eligibilities.
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
}