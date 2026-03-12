<?php

namespace App\Http\Controllers;

use App\Models\EmployeeDegree;
use App\Models\EmployeeEligibility;
use App\Models\EmployeeGraduateStudy;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserProfileController extends Controller
{
    public function show(Request $request, ?int $id = null)
    {
        $authUser = $request->user();
        $target   = $id
            ? User::with(['employeeProfile','degrees','graduateStudies','eligibilities'])->findOrFail($id)
            : $authUser->load(['employeeProfile','degrees','graduateStudies','eligibilities']);

        if ($id && $authUser->id !== $id && ! $authUser->hasRole('admin')) {
            abort(403);
        }

        return Inertia::render('Profile/Show', [
            'profileUser'    => $this->format($target),
            'canEditCompany' => $authUser->hasRole('admin'),
            'divisionAbbreviations' => \App\Models\Division::pluck('abbreviation', 'name'),
            'sectionAbbreviations'  => \App\Models\Section::pluck('abbreviation', 'name'),
            'bachelorsDegrees' => \App\Models\BachelorsDegree::orderBy('degree')->get(['id', 'degree', 'abbreviation']),
            'graduatePrograms' => \App\Models\GraduateProgram::orderBy('program')->get(['id', 'program', 'abbreviation']),
            'eligibilityTitles' => \App\Models\Eligibility::orderBy('title')->get(['id', 'title', 'abbreviation']),
        ]);
    }

    // Personal info (owner only)
    public function updatePersonal(Request $request)
    {
        $user = $request->user();
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

        $user->employeeProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'sex'           => $data['sex'],
                'birth_place'   => $data['birth_place'],
                'civil_status'  => $data['civil_status'],
                'mobile_number' => $data['mobile_number'],
            ]
        );

        return back();
    }

    // Company info (admin only)
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

    // Government IDs (admin only)
    public function updateGovernment(Request $request, int $id)
    {
        $authUser = $request->user();
        abort_unless($authUser->hasRole('admin') || $authUser->id === $id, 403);

        $user = User::findOrFail($id);
        $data = $request->validate([
            'gsis_number'       => 'nullable|string|max:50',
            'sss_number'        => 'nullable|string|max:50',
            'pagibig_number'    => 'nullable|string|max:50',
            'tin_number'        => 'nullable|string|max:50',
            'philhealth_number' => 'nullable|string|max:50',
        ]);

        $user->employeeProfile()->updateOrCreate(['user_id' => $user->id], $data);

        return back();
    }

    // Photo (owner only)
    public function updatePhoto(Request $request)
    {
        $request->validate(['photo' => 'required|image|max:2048']);
        $path = $request->file('photo')->store('photos', 'public');
        $request->user()->update(['photo' => $path]);
        return back();
    }

    // Degree (owner only)
    public function storeDegree(Request $request, int $userId)
    {
        abort_unless($request->user()->id === $userId, 403);
        $data = $request->validate([
            'degree'      => 'required|string|max:255',
            'start_month' => 'nullable|string|max:20',
            'start_year'  => 'nullable|integer|min:1900|max:2100',
            'end_month'   => 'nullable|string|max:20',
            'end_year'    => 'nullable|integer|min:1900|max:2100',
        ]);
        EmployeeDegree::create(['user_id' => $userId, ...$data]);
        return back();
    }

    public function updateDegree(Request $request, int $degreeId)
    {
        $degree = EmployeeDegree::findOrFail($degreeId);
        abort_unless($request->user()->id === $degree->user_id, 403);
        $data = $request->validate([
            'degree'      => 'required|string|max:255',
            'start_month' => 'nullable|string|max:20',
            'start_year'  => 'nullable|integer',
            'end_month'   => 'nullable|string|max:20',
            'end_year'    => 'nullable|integer',
        ]);
        $degree->update($data);
        return back();
    }

    // Graduate Studies (owner only)
    public function storeGraduateStudy(Request $request, int $userId)
    {
        abort_unless($request->user()->id === $userId, 403);
        $data = $request->validate([
            'program'     => 'required|string|max:255',
            'start_month' => 'nullable|string|max:20',
            'start_year'  => 'nullable|integer|min:1900|max:2100',
            'end_month'   => 'nullable|string|max:20',
            'end_year'    => 'nullable|integer|min:1900|max:2100',
        ]);
        EmployeeGraduateStudy::create(['user_id' => $userId, ...$data]);
        return back();
    }

    public function updateGraduateStudy(Request $request, int $programId)
    {
        $program = EmployeeGraduateStudy::findOrFail($programId);
        abort_unless($request->user()->id === $program->user_id, 403);
        $data = $request->validate([
            'program'     => 'required|string|max:255',
            'start_month' => 'nullable|string|max:20',
            'start_year'  => 'nullable|integer',
            'end_month'   => 'nullable|string|max:20',
            'end_year'    => 'nullable|integer',
        ]);
        $program->update($data);
        return back();
    }

    // Eligibility (owner only)
    public function storeEligibility(Request $request, int $userId)
    {
        abort_unless($request->user()->id === $userId, 403);
        $data = $request->validate([
            'eligibility'  => 'required|string|max:255',
            'issue_month'  => 'nullable|string|max:20',
            'issue_year'   => 'nullable|integer',
            'date_issued'  => 'nullable|date',
            'place_issued' => 'nullable|string|max:255',
        ]);
        EmployeeEligibility::create(['user_id' => $userId, ...$data]);
        return back();
    }

    public function updateEligibility(Request $request, int $eligibilityId)
    {
        $item = EmployeeEligibility::findOrFail($eligibilityId);
        abort_unless($request->user()->id === $item->user_id, 403);
        $data = $request->validate([
            'eligibility'  => 'required|string|max:255',
            'issue_month'  => 'nullable|string|max:20',
            'issue_year'   => 'nullable|integer',
            'date_issued'  => 'nullable|date',
            'place_issued' => 'nullable|string|max:255',
        ]);
        $item->update($data);
        return back();
    }

    // Format helper
    private function format(User $u): array
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
                'sex'              => $ep->sex,
                'birth_place'      => $ep->birth_place,
                'civil_status'     => $ep->civil_status,
                'mobile_number'    => $ep->mobile_number,
                'employee_number'  => $ep->employee_number,
                'employment_type'  => $ep->employment_type,
                'position'         => $ep->position,
                'salary_grade'     => $ep->salary_grade,
                'place_assign'     => $ep->place_assign,
                'division'         => $ep->division,
                'section'          => $ep->section,
                'date_hired'       => $ep->date_hired,
                'is_active'        => $ep->is_active,
                'gsis_number'      => $ep->gsis_number,
                'sss_number'       => $ep->sss_number,
                'pagibig_number'   => $ep->pagibig_number,
                'tin_number'       => $ep->tin_number,
                'philhealth_number'=> $ep->philhealth_number,
            ] : null,
            'degrees'          => $u->degrees->toArray(),
            'graduate_studies' => $u->graduateStudies->toArray(),
            'eligibilities'    => $u->eligibilities->toArray(),
        ];
    }
}