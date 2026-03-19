<?php

namespace App\Http\Controllers;

use App\Models\PdsPersonalInfo;
use App\Models\PdsFamilyBackground;
use App\Models\PdsChild;
use App\Models\PdsEducation;
use App\Models\PdsEligibility;
use App\Models\PdsWorkExperience;
use App\Models\PdsVoluntaryWork;
use App\Models\PdsTraining;
use App\Models\PdsOtherInfo;
use App\Models\PdsQuestion;
use App\Models\PdsReference;
use App\Models\PdsGovernmentId;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PdsController extends Controller
{
    public function index()
    {
        $user = Auth::user()->load('employeeProfile');

        $pdsData = $this->getPdsData($user->id);

        return Inertia::render('pds/Index', [
            'user' => $user,
            'pdsData' => $pdsData,
        ]);
    }

    public function show($userId = null)
    {
        $user = Auth::user();
        $targetUserId = $userId ?? $user->id;

        // Only allow viewing own PDS unless admin
        if ($targetUserId != $user->id) {
            abort(403, 'Unauthorized');
        }

        $targetUser = \App\Models\User::with('employeeProfile')->findOrFail($targetUserId);
        $pdsData = $this->getPdsData($targetUserId);

        return Inertia::render('pds/Index', [
            'user' => $targetUser,
            'pdsData' => $pdsData,
        ]);
    }

    public function saveSection(Request $request, string $section)
    {
        $userId = Auth::id();

        switch ($section) {
            case 'personal':
                return $this->savePersonal($request, $userId);
            case 'family':
                return $this->saveFamily($request, $userId);
            case 'education':
                return $this->saveEducation($request, $userId);
            case 'eligibility':
                return $this->saveEligibility($request, $userId);
            case 'work_experience':
                return $this->saveWorkExperience($request, $userId);
            case 'voluntary_work':
                return $this->saveVoluntaryWork($request, $userId);
            case 'trainings':
                return $this->saveTrainings($request, $userId);
            case 'other_info':
                return $this->saveOtherInfo($request, $userId);
            case 'questions':
                return $this->saveQuestions($request, $userId);
            case 'references':
                return $this->saveReferences($request, $userId);
            case 'government_id':
                return $this->saveGovernmentId($request, $userId);
            default:
                return response()->json(['message' => 'Invalid section'], 400);
        }
    }

    private function savePersonal(Request $request, int $userId)
    {
        $data = $request->validate([
            // Name fields — surname and first name required
            'last_name'            => 'required|string|max:100',
            'first_name'           => 'required|string|max:100',
            'middle_name'          => 'nullable|string|max:100',
            'name_ext'             => 'nullable|string|max:20',
            // Personal info — required
            'sex'                  => 'required|in:Male,Female',
            'birth_place'          => 'required|string',
            'civil_status'         => 'required|in:Single,Married,Widowed,Separated,Other',
            'mobile_number'        => 'required|string|max:20',
            // Citizenship & physical
            'date_of_birth'        => 'required|date',
            'citizenship'          => 'required|string',
            'citizenship_type'     => 'nullable|string',
            'citizenship_country'  => 'nullable|string',
            'height'               => 'nullable|numeric',
            'weight'               => 'nullable|numeric',
            'blood_type'           => 'nullable|string|max:5',
            // agency_employee_no intentionally excluded — admin-only
            // Residential Address — required
            'res_house_no'         => 'required|string',
            'res_street'           => 'required|string',
            'res_subdivision'      => 'nullable|string',
            'res_barangay'         => 'required|string',
            'res_city'             => 'required|string',
            'res_province'         => 'required|string',
            'res_zipcode'          => 'nullable|string|max:10',
            // Permanent Address — required
            'perm_house_no'        => 'required|string',
            'perm_street'          => 'required|string',
            'perm_subdivision'     => 'nullable|string',
            'perm_barangay'        => 'required|string',
            'perm_city'            => 'required|string',
            'perm_province'        => 'required|string',
            'perm_zipcode'         => 'nullable|string|max:10',
            // Contact — email not submitted (read-only on form)
            'telephone'            => 'nullable|string',
            // Government IDs — required (except UMID/GSIS/SSS)
            'umid_number'          => 'nullable|string',
            'pagibig_number'       => 'required|string',
            'philhealth_number'    => 'required|string',
            'philsys_number'       => 'required|string',
            'tin_number'           => 'required|string',
        ], [
            'last_name.required'         => 'Surname is required.',
            'first_name.required'        => 'First Name is required.',
            'sex.required'               => 'Sex is required.',
            'birth_place.required'       => 'Place of Birth is required.',
            'civil_status.required'      => 'Civil Status is required.',
            'mobile_number.required'     => 'Mobile No. is required.',
            'date_of_birth.required'     => 'Date of Birth is required.',
            'citizenship.required'       => 'Citizenship is required.',
            'res_house_no.required'      => 'Residential House/Block/Lot No. is required.',
            'res_street.required'        => 'Residential Street is required.',
            'res_barangay.required'      => 'Residential Barangay is required.',
            'res_city.required'          => 'Residential City/Municipality is required.',
            'res_province.required'      => 'Residential Province is required.',
            'perm_house_no.required'     => 'Permanent House/Block/Lot No. is required.',
            'perm_street.required'       => 'Permanent Street is required.',
            'perm_barangay.required'     => 'Permanent Barangay is required.',
            'perm_city.required'         => 'Permanent City/Municipality is required.',
            'perm_province.required'     => 'Permanent Province is required.',
            'pagibig_number.required'    => 'PAG-IBIG ID No. is required.',
            'philhealth_number.required' => 'PhilHealth No. is required.',
            'philsys_number.required'    => 'PhilSys No. is required.',
            'tin_number.required'        => 'TIN No. is required.',
        ]);

        // 1. Update name fields on the users table
        \App\Models\User::where('id', $userId)->update([
            'last_name'   => $data['last_name'] ?? null,
            'first_name'  => $data['first_name'] ?? null,
            'middle_name' => $data['middle_name'] ?? null,
            'name_ext'    => $data['name_ext'] ?? null,
        ]);

        // 2. Save all PDS personal fields (name fields stripped out, agency_employee_no never touched)
        $pdsFields = collect($data)
            ->except(['last_name', 'first_name', 'middle_name', 'name_ext'])
            ->toArray();

        PdsPersonalInfo::updateOrCreate(
            ['user_id' => $userId],
            $pdsFields
        );

        return back()->with('success', 'Personal information saved.');
    }

    private function saveFamily(Request $request, int $userId)
    {
        $data = $request->validate([
            'spouse_surname' => 'nullable|string',
            'spouse_first_name' => 'nullable|string',
            'spouse_middle_name' => 'nullable|string',
            'spouse_name_ext' => 'nullable|string',
            'spouse_occupation' => 'nullable|string',
            'spouse_employer' => 'nullable|string',
            'spouse_business_address' => 'nullable|string',
            'spouse_telephone' => 'nullable|string',
            'father_surname' => 'nullable|string',
            'father_first_name' => 'nullable|string',
            'father_middle_name' => 'nullable|string',
            'father_name_ext' => 'nullable|string',
            'mother_surname' => 'nullable|string',
            'mother_first_name' => 'nullable|string',
            'mother_middle_name' => 'nullable|string',
            'children' => 'nullable|array',
            'children.*.full_name' => 'required_with:children|string',
            'children.*.date_of_birth' => 'nullable|date',
        ]);

        PdsFamilyBackground::updateOrCreate(
            ['user_id' => $userId],
            collect($data)->except('children')->toArray()
        );

        if (isset($data['children'])) {
            PdsChild::where('user_id', $userId)->delete();
            foreach ($data['children'] as $i => $child) {
                PdsChild::create([
                    'user_id' => $userId,
                    'full_name' => $child['full_name'],
                    'date_of_birth' => $child['date_of_birth'] ?? null,
                    'sort_order' => $i,
                ]);
            }
        }

        return back()->with('success', 'Family background saved.');
    }

    private function saveEducation(Request $request, int $userId)
    {
        $request->validate([
            'education' => 'required|array',
            'education.*.level' => 'required|string',
            'education.*.school_name' => 'nullable|string',
            'education.*.course' => 'nullable|string',
            'education.*.period_from' => 'nullable|string',
            'education.*.period_to' => 'nullable|string',
            'education.*.highest_level' => 'nullable|string',
            'education.*.year_graduated' => 'nullable|string',
            'education.*.honors_received' => 'nullable|string',
        ]);

        PdsEducation::where('user_id', $userId)->delete();
        foreach ($request->education as $edu) {
            PdsEducation::create(array_merge($edu, ['user_id' => $userId]));
        }

        return back()->with('success', 'Educational background saved.');
    }

    private function saveEligibility(Request $request, int $userId)
    {
        $request->validate([
            'eligibilities' => 'required|array',
        ]);

        PdsEligibility::where('user_id', $userId)->delete();
        foreach ($request->eligibilities as $i => $item) {
            PdsEligibility::create(array_merge($item, [
                'user_id' => $userId,
                'sort_order' => $i,
            ]));
        }

        return back()->with('success', 'Eligibilities saved.');
    }

    private function saveWorkExperience(Request $request, int $userId)
    {
        $request->validate([
            'work_experience' => 'required|array',
        ]);

        PdsWorkExperience::where('user_id', $userId)->delete();
        foreach ($request->work_experience as $i => $item) {
            PdsWorkExperience::create(array_merge($item, [
                'user_id' => $userId,
                'sort_order' => $i,
            ]));
        }

        return back()->with('success', 'Work experience saved.');
    }

    private function saveVoluntaryWork(Request $request, int $userId)
    {
        $request->validate([
            'voluntary_work' => 'required|array',
        ]);

        PdsVoluntaryWork::where('user_id', $userId)->delete();
        foreach ($request->voluntary_work as $i => $item) {
            PdsVoluntaryWork::create(array_merge($item, [
                'user_id' => $userId,
                'sort_order' => $i,
            ]));
        }

        return back()->with('success', 'Voluntary work saved.');
    }

    private function saveTrainings(Request $request, int $userId)
    {
        $request->validate([
            'trainings' => 'required|array',
        ]);

        PdsTraining::where('user_id', $userId)->delete();
        foreach ($request->trainings as $i => $item) {
            PdsTraining::create(array_merge($item, [
                'user_id' => $userId,
                'sort_order' => $i,
            ]));
        }

        return back()->with('success', 'Trainings saved.');
    }

    private function saveOtherInfo(Request $request, int $userId)
    {
        $data = $request->validate([
            'special_skills' => 'nullable|array',
            'non_academic_distinctions' => 'nullable|array',
            'organization_memberships' => 'nullable|array',
        ]);

        PdsOtherInfo::updateOrCreate(
            ['user_id' => $userId],
            $data
        );

        return back()->with('success', 'Other information saved.');
    }

    private function saveQuestions(Request $request, int $userId)
    {
        $data = $request->validate([
            'q34_a' => 'nullable|boolean',
            'q34_b' => 'nullable|boolean',
            'q34_details' => 'nullable|string',
            'q35_a' => 'nullable|boolean',
            'q35_a_details' => 'nullable|string',
            'q35_b' => 'nullable|boolean',
            'q35_b_date' => 'nullable|string',
            'q35_b_status' => 'nullable|string',
            'q36' => 'nullable|boolean',
            'q36_details' => 'nullable|string',
            'q37_a' => 'nullable|boolean',
            'q37_a_details' => 'nullable|string',
            'q37_b' => 'nullable|boolean',
            'q37_b_details' => 'nullable|string',
            'q38' => 'nullable|boolean',
            'q38_details' => 'nullable|string',
            'q39' => 'nullable|boolean',
            'q39_details' => 'nullable|string',
            'q40_a' => 'nullable|boolean',
            'q40_a_details' => 'nullable|string',
            'q40_b' => 'nullable|boolean',
            'q40_b_details' => 'nullable|string',
            'q40_c' => 'nullable|boolean',
            'q40_c_details' => 'nullable|string',
        ]);

        PdsQuestion::updateOrCreate(['user_id' => $userId], $data);

        return back()->with('success', 'Questions saved.');
    }

    private function saveReferences(Request $request, int $userId)
    {
        $request->validate([
            'references' => 'required|array',
            'references.*.name' => 'nullable|string',
            'references.*.address' => 'nullable|string',
            'references.*.telephone' => 'nullable|string',
        ]);

        PdsReference::where('user_id', $userId)->delete();
        foreach ($request->references as $i => $ref) {
            PdsReference::create(array_merge($ref, [
                'user_id' => $userId,
                'sort_order' => $i,
            ]));
        }

        return back()->with('success', 'References saved.');
    }

    private function saveGovernmentId(Request $request, int $userId)
    {
        $data = $request->validate([
            'id_type' => 'nullable|string',
            'id_number' => 'nullable|string',
            'date_of_issuance' => 'nullable|string',
            'place_of_issuance' => 'nullable|string',
        ]);

        PdsGovernmentId::updateOrCreate(['user_id' => $userId], $data);

        return back()->with('success', 'Government ID saved.');
    }

    private function getPdsData(int $userId): array
    {
        return [
            'personal' => PdsPersonalInfo::where('user_id', $userId)->first(),
            'family' => PdsFamilyBackground::where('user_id', $userId)->first(),
            'children' => PdsChild::where('user_id', $userId)->orderBy('sort_order')->get(),
            'education' => PdsEducation::where('user_id', $userId)->get(),
            'eligibilities' => PdsEligibility::where('user_id', $userId)->orderBy('sort_order')->get(),
            'work_experience' => PdsWorkExperience::where('user_id', $userId)->orderBy('sort_order')->get(),
            'voluntary_work' => PdsVoluntaryWork::where('user_id', $userId)->orderBy('sort_order')->get(),
            'trainings' => PdsTraining::where('user_id', $userId)->orderBy('sort_order')->get(),
            'other_info' => PdsOtherInfo::where('user_id', $userId)->first(),
            'questions' => PdsQuestion::where('user_id', $userId)->first(),
            'references' => PdsReference::where('user_id', $userId)->orderBy('sort_order')->get(),
            'government_id' => PdsGovernmentId::where('user_id', $userId)->first(),
        ];
    }
}