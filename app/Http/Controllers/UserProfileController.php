<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsPdsData;
use App\Models\EmployeeProfile;
use App\Models\PdsPersonalInfo;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class UserProfileController extends Controller
{
    use BuildsPdsData;
    /**
     * Show the authenticated user's own profile.
     */
    public function show($userId = null)
    {
        $authUser = Auth::user();
        $targetId = $userId ?? $authUser->id;

        $user = User::with([
            'employeeProfile',
            'pdsPersonalInfo',
            'pdsEducation',
            'pdsEligibilities',
            'serviceRecords',
        ])->findOrFail($targetId);

        $isOwn   = $authUser->id === (int) $targetId;
        $isAdmin = $authUser->hasAnyRole(['admin', 'superadmin', 'hr']);

        if (!$isOwn && !$isAdmin) {
            abort(403, 'Unauthorized');
        }

        return Inertia::render('Profile/Show', [
            'profileUser'    => $this->formatUser($user),
            'canEditCompany' => $authUser->can('manage employees'),
            'pdsData'        => $this->getPdsData($targetId),   // ← confirm this line exists
            'serviceRecords' => $user->serviceRecords,
            'divisionAbbreviations' => \App\Models\Division::pluck('abbreviation', 'name'),
            'sectionAbbreviations'  => \App\Models\Section::pluck('abbreviation', 'name'),
        ]);
    }

    /**
     * Update personal info (users table + pds_personal_info).
     * Accessible by the user themselves OR an admin viewing their profile.
     */
    public function updatePersonal(Request $request, ?int $userId = null)
    {
        $targetId = $userId ?? Auth::id();
        $this->authorizeProfileEdit($targetId);

        $data = $request->validate([
            'first_name'    => 'required|string|max:100',
            'middle_name'   => 'nullable|string|max:100',
            'last_name'     => 'required|string|max:100',
            'name_ext'      => 'nullable|string|max:20',
            'sex'           => 'required|in:Male,Female',
            'birth_place'   => 'required|string',
            'date_of_birth' => 'required|date',
            'civil_status'  => 'required|in:Single,Married,Widowed,Separated,Other',
            'mobile_number' => 'required|string|max:20',
            'height'        => 'required|numeric',
            'weight'        => 'required|numeric',
            'blood_type'    => 'required|string|max:5',
        ]);

        // Update users table
        User::where('id', $targetId)->update([
            'first_name'  => $data['first_name']  ?? null,
            'middle_name' => $data['middle_name'] ?? null,
            'last_name'   => $data['last_name']   ?? null,
            'name_ext'    => $data['name_ext']    ?? null,
        ]);

        // Update pds_personal_info for personal fields
        PdsPersonalInfo::updateOrCreate(
            ['user_id' => $targetId],
            [
                'sex'           => $data['sex']           ?? null,
                'birth_place'   => $data['birth_place']   ?? null,
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'civil_status'  => $data['civil_status']  ?? null,
                'mobile_number' => $data['mobile_number'] ?? null,
                'height'        => $data['height']        ?? null,
                'weight'        => $data['weight']        ?? null,
                'blood_type'    => $data['blood_type']    ?? null,
            ]
        );

        return back()->with('success', 'Personal information updated.');
    }

    /**
     * Update company info (employee_profiles table)
     * Also syncs employee_number → pds_personal_info.agency_employee_no
     */
    public function updateCompany(Request $request, int $userId)
    {
        // Only admins/superadmins can update company info
        $this->authorizeAdminEdit();

        $data = $request->validate([
            'employee_number' => 'nullable|string|max:50',
            'employment_type' => 'nullable|string',
            'position'        => 'nullable|string',
            'salary_grade'    => 'nullable|string',
            'division'        => 'nullable|string',
            'section'         => 'nullable|string',
            'date_hired'      => 'nullable|date',
        ]);

        EmployeeProfile::where('user_id', $userId)->update($data);

        // Sync employee_number → pds_personal_info.agency_employee_no
        // so both tables always hold the same value.
        if (array_key_exists('employee_number', $data) && $data['employee_number'] !== null) {
            PdsPersonalInfo::updateOrCreate(
                ['user_id' => $userId],
                ['agency_employee_no' => $data['employee_number']]
            );
        }

        return back()->with('success', 'Company information updated.');
    }

    /**
     * Upload profile photo.
     */
    public function uploadPhoto(Request $request)
    {
        $request->validate(['photo' => 'required|image|max:2048']);

        $user = Auth::user();

        // Delete the previous photo from storage
        if ($user->photo && Storage::disk('public')->exists($user->photo)) {
            Storage::disk('public')->delete($user->photo);
        }

        // Store the new one
        $path = $request->file('photo')->store('photos', 'public');

        User::where('id', $user->id)->update(['photo' => $path]);

        return back()->with('success', 'Photo updated.');
    }

    // Helpers

    private function authorizeProfileEdit(int $targetId): void
    {
        $user = Auth::user();
        $isOwn  = $user->id === $targetId;
        $isAdmin = $user->hasAnyRole(['admin', 'superadmin', 'hr']);

        if (!$isOwn && !$isAdmin) {
            abort(403, 'Unauthorized');
        }
    }

    private function authorizeAdminEdit(): void
    {
        if (!Auth::user()->can('manage employees')) {
            abort(403, 'Only administrators can update company information.');
        }
    }

    public function formatUser(User $u): array
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

            // Company data — from employee_profiles only
            'employee_profile' => $ep ? [
                'employee_number' => $ep->employee_number,
                'employment_type' => $ep->employment_type,
                'position'        => $ep->position,
                'salary_grade'    => $ep->salary_grade,
                'place_assign'    => $ep->place_assign,
                'division'        => $ep->division,
                'section'         => $ep->section,
                'date_hired'      => $ep->date_hired,
                'is_active'       => $ep->is_active,
            ] : null,

            // Personal & gov't ID data — from pds_personal_info
            'personal_info' => $pds ? [
                'sex'               => $pds->sex,
                'birth_place'       => $pds->birth_place,
                'date_of_birth'     => $pds->date_of_birth,
                'civil_status'      => $pds->civil_status,
                'mobile_number'     => $pds->mobile_number,
                'height'            => $pds->height,
                'weight'            => $pds->weight,
                'blood_type'        => $pds->blood_type,
                'umid_number'       => $pds->umid_number,
                'pagibig_number'    => $pds->pagibig_number,
                'philhealth_number' => $pds->philhealth_number,
                'philsys_number'    => $pds->philsys_number,
                'tin_number'        => $pds->tin_number,
            ] : null,

            // Education sourced from pds_education
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

            // Eligibilities sourced from pds_eligibilities
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