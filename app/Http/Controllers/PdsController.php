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
use App\Support\PdsFiles;
use App\Support\PdsRules;
use App\Support\UploadMessages;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
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
        try {
            return $this->dispatchSave($request, $section);
        } catch (ValidationException $e) {
            // The form shows only the first error in a pop-up, so it has to be readable.
            throw ValidationException::withMessages($this->readableErrors($e->errors()));
        }
    }

    private function dispatchSave(Request $request, string $section)
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
            default:
                return response()->json(['message' => 'Invalid section'], 400);
        }
    }

    private function savePersonal(Request $request, int $userId)
    {
        $data = $request->validate([
            // Name fields — surname and first name required
            'last_name'            => ['required', 'string', 'max:100', PdsRules::personName('Surname')],
            'first_name'           => ['required', 'string', 'max:100', PdsRules::personName('First name')],
            'middle_name'          => ['nullable', 'string', 'max:100', PdsRules::personName('Middle name', true)],
            'name_ext'             => ['nullable', 'string', 'max:10', PdsRules::personName('Name extension', true)],
            // Personal info — required
            'sex'                  => 'required|in:Male,Female',
            'birth_place'          => 'required|string|max:60',
            'civil_status'         => 'required|in:Single,Married,Widowed,Separated,Other',
            'mobile_number'        => ['required', 'string', 'max:20', PdsRules::mobile()],
            // Citizenship & physical
            'date_of_birth'        => 'required|date|before_or_equal:today',
            'citizenship'          => 'required|string|max:30',
            'citizenship_type'     => 'nullable|string|max:30',
            'citizenship_country'  => 'nullable|string|max:50',
            'height'               => 'nullable|numeric|min:0|max:3',   // metres, as the form labels it
            'weight'               => 'nullable|numeric|min:0|max:500', // kilograms
            'blood_type'           => 'nullable|string|max:5',
            // agency_employee_no — editable by everyone in the PDS
            'agency_employee_no' => 'nullable|string|max:30',
            // Residential Address — required
            'res_house_no'         => 'required|string|max:30',
            'res_street'           => 'required|string|max:60',
            'res_subdivision'      => 'nullable|string|max:30',
            'res_barangay'         => 'required|string|max:60',
            'res_city'             => 'required|string|max:60',
            'res_province'         => 'required|string|max:60',
            'res_zipcode'          => 'nullable|string|max:10',
            // Permanent Address — required
            'perm_house_no'        => 'required|string|max:30',
            'perm_street'          => 'required|string|max:60',
            'perm_subdivision'     => 'nullable|string|max:30',
            'perm_barangay'        => 'required|string|max:60',
            'perm_city'            => 'required|string|max:60',
            'perm_province'        => 'required|string|max:60',
            'perm_zipcode'         => 'nullable|string|max:10',
            // Contact — email not submitted (read-only on form)
            'telephone'            => ['nullable', 'string', 'max:30', PdsRules::telephone(true)],
            // Government IDs — required (except UMID). The 2026 form has no GSIS or SSS number.
            'umid_number'          => ['nullable', 'string', 'max:25', PdsRules::governmentId('umid_number')],
            'pagibig_number'       => ['required', 'string', 'max:25', PdsRules::governmentId('pagibig_number')],
            'philhealth_number'    => ['required', 'string', 'max:25', PdsRules::governmentId('philhealth_number')],
            'philsys_number'       => ['required', 'string', 'max:25', PdsRules::governmentId('philsys_number')],
            'tin_number'           => ['required', 'string', 'max:25', PdsRules::governmentId('tin_number')],
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
            'philsys_number.required'    => 'PhilSys Card Number (PCN) is required.',
            'tin_number.required'        => 'TIN No. is required.',
        ]);

        // 1. Update name fields on the users table
        \App\Models\User::where('id', $userId)->update([
            'last_name'   => $data['last_name'] ?? null,
            'first_name'  => $data['first_name'] ?? null,
            'middle_name' => $data['middle_name'] ?? null,
            'name_ext'    => $data['name_ext'] ?? null,
        ]);

        // 2. Save all PDS personal fields (name fields stripped out)
        $pdsFields = collect($data)
            ->except(['last_name', 'first_name', 'middle_name', 'name_ext'])
            ->toArray();

        // Sync agency_employee_no ↔ employee_profiles.employee_number so both stay identical.
        // Everyone can edit their own employee number in the PDS.
        if (array_key_exists('agency_employee_no', $pdsFields) && $pdsFields['agency_employee_no'] !== null) {
            \App\Models\EmployeeProfile::where('user_id', $userId)
                ->update(['employee_number' => $pdsFields['agency_employee_no']]);
        }

        PdsPersonalInfo::updateOrCreate(
            ['user_id' => $userId],
            $pdsFields
        );

        return back()->with('success', 'Personal information saved.');
    }

    private function saveFamily(Request $request, int $userId)
    {
        $data = $request->validate([
            'spouse_surname' => ['nullable', 'string', 'max:60', PdsRules::personName('Spouse surname', true)],
            'spouse_first_name' => ['nullable', 'string', 'max:60', PdsRules::personName('Spouse first name', true)],
            'spouse_middle_name' => ['nullable', 'string', 'max:60', PdsRules::personName('Spouse middle name', true)],
            'spouse_name_ext' => ['nullable', 'string', 'max:10', PdsRules::personName('Spouse name extension', true)],
            'spouse_occupation' => 'nullable|string|max:60',
            'spouse_employer' => 'nullable|string|max:100',
            'spouse_business_address' => 'nullable|string|max:100',
            'spouse_telephone' => ['nullable', 'string', 'max:30', PdsRules::telephone(true, 'Spouse telephone No.')],
            'father_surname' => ['nullable', 'string', 'max:60', PdsRules::personName('Father surname', true)],
            'father_first_name' => ['nullable', 'string', 'max:60', PdsRules::personName('Father first name', true)],
            'father_middle_name' => ['nullable', 'string', 'max:60', PdsRules::personName('Father middle name', true)],
            'father_name_ext' => ['nullable', 'string', 'max:10', PdsRules::personName('Father name extension', true)],
            'mother_surname' => ['nullable', 'string', 'max:60', PdsRules::personName('Mother surname', true)],
            'mother_first_name' => ['nullable', 'string', 'max:60', PdsRules::personName('Mother first name', true)],
            'mother_middle_name' => ['nullable', 'string', 'max:60', PdsRules::personName('Mother middle name', true)],
            'children' => 'nullable|array|max:30',
            'children.*.full_name' => ['required_with:children', 'string', 'max:100', PdsRules::personName(null, true)],
            'children.*.date_of_birth' => 'nullable|date|before_or_equal:today',
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
            'education' => 'required|array|max:15',
            // The column is an enum: any other value would crash the save instead of being reported.
            'education.*.level' => 'required|in:Elementary,Secondary,Vocational,College,Graduate Studies',
            'education.*.school_name' => 'nullable|string|max:100',
            'education.*.course' => 'nullable|string|max:100',
            'education.*.period_from' => 'nullable|string|max:20',
            'education.*.period_to' => 'nullable|string|max:20',
            'education.*.highest_level' => 'nullable|string|max:50',
            'education.*.year_graduated' => 'nullable|string|max:20',
            'education.*.honors_received' => 'nullable|string|max:60',
        ]);

        PdsEducation::where('user_id', $userId)->delete();
        foreach ($request->education as $edu) {
            PdsEducation::create(array_merge($edu, ['user_id' => $userId]));
        }

        return back()->with('success', 'Educational background saved.');
    }

    private function saveEligibility(Request $request, int $userId)
    {
        $data = $request->all();
            foreach ($data['eligibilities'] ?? [] as $i => $item) {
                foreach (['date_of_examination', 'license_validity'] as $dateField) {
                    if (isset($item[$dateField]) && $item[$dateField] === '') {
                        $data['eligibilities'][$i][$dateField] = null;
                    }
                }
            }
        $request->replace($data);

        $request->validate([
            'eligibilities'                          => 'nullable|array|max:30',
            'eligibilities.*.career_service'         => 'required|string|max:255',
            'eligibilities.*.rating'                 => 'required|string|max:20',
            'eligibilities.*.date_of_examination'    => 'required|date_format:Y-m-d',
            'eligibilities.*.place_of_examination'   => 'required|string|max:100',
            'eligibilities.*.license_number'         => 'required|string|max:30',
            'eligibilities.*.license_validity'       => 'nullable|date_format:Y-m-d',
            'attachments'                            => 'nullable|array|max:30',
            'attachments.*'                          => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'existing_attachments'                   => 'nullable|array|max:30',
            'existing_attachments.*'                 => 'nullable|string|max:255',
        ], [
            'attachments.*.mimes' => 'The attachment field must be a file of type jpeg, jpg, png, or pdf.',
            'attachments.*.max'   => 'The attachment must not exceed 5 MB.',
            'attachments.*.file'  => 'The attachment must be a valid file.',
            'attachments.*.uploaded' => self::uploadFailedMessage(5),
        ]);

        $oldPaths = PdsEligibility::where('user_id', $userId)
            ->pluck('attachment')
            ->filter()
            ->values();

        $this->assertOwnAttachments($request, $oldPaths);

        PdsEligibility::where('user_id', $userId)->delete();

        $keptPaths   = [];
            $allFiles    = $request->file('attachments') ?? [];
            $allExisting = $request->input('existing_attachments') ?? [];

            foreach ($request->eligibilities as $i => $item) {
                $attachmentPath = null;

                if (!empty($allFiles[$i]) && $allFiles[$i]->isValid()) {
                    $file      = $allFiles[$i];
                    $extension = strtolower($file->getClientOriginalExtension());
                    $baseName  = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                    $safeName  = substr(preg_replace('/[^a-zA-Z0-9_\-]/', '_', $baseName), 0, 100);

                    $attachmentPath = $file->storeAs(
                        "pds/{$userId}/eligibilities",
                        $safeName . '_' . uniqid() . '.' . $extension,
                        PdsFiles::DISK
                    );
                } elseif (!empty($allExisting[$i])) {
                    $attachmentPath = $allExisting[$i];
                    $keptPaths[]    = $attachmentPath;
                }

                $rowData = collect($item)->except(['attachment'])->toArray();

                PdsEligibility::create(array_merge($rowData, [
                    'user_id'    => $userId,
                    'sort_order' => $i,
                    'attachment' => $attachmentPath,
                ]));
            }

            foreach ($oldPaths as $oldPath) {
                if (!in_array($oldPath, $keptPaths)) {
                    PdsFiles::disk()->delete($oldPath);
                }
            }

            return back()->with('success', 'Eligibilities saved.');
    }

    private function saveWorkExperience(Request $request, int $userId)
    {
        $request->validate([
            'work_experience'                         => 'nullable|array|max:60',
            'work_experience.*.date_from'             => 'nullable|date_format:Y-m-d',
            'work_experience.*.date_to'               => 'nullable|date_format:Y-m-d',
            'work_experience.*.position_title'        => 'nullable|string|max:255',
            'work_experience.*.department'            => 'nullable|string|max:100',
            'work_experience.*.office'                => 'nullable|string|max:100',
            'work_experience.*.supervisor'            => 'nullable|string|max:60',
            'work_experience.*.location'              => 'nullable|string|max:100',
            'work_experience.*.status_of_appointment' => 'nullable|string|max:50',
            'work_experience.*.accomplishments'       => 'nullable|string|max:2000',
            'work_experience.*.actual_duties'         => 'nullable|string|max:2000',
            'work_experience.*.is_present'            => 'nullable|in:0,1,true,false',
            'work_experience.*.is_government_service' => 'nullable|in:0,1,true,false',
            'work_experience.*.monthly_salary'        => 'nullable|numeric|min:0|max:9999999999.99',
            // A bare grade ("24") is still accepted: rows saved before the 2026 update hold one, and every save posts all rows.
            // The form asks for the step whenever a row is added or edited.
            'work_experience.*.salary_grade'          => ['nullable', 'regex:/^\d{1,2}(-\d)?$/'],
            'attachments'                             => 'nullable|array|max:60',
            'attachments.*'                           => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'existing_attachments'                    => 'nullable|array|max:60',
            'existing_attachments.*'                  => 'nullable|string|max:255',
        ], [
            'work_experience.*.position_title.required'        => 'Position title is required.',
            'work_experience.*.department.required'            => 'Department / Agency / Company is required.',
            'work_experience.*.date_from.required'             => 'Date from is required.',
            'work_experience.*.date_from.date_format'          => 'Date from must be a valid date.',
            'work_experience.*.date_to.date_format'            => 'Date to must be a valid date.',
            'work_experience.*.status_of_appointment.required' => 'Status of appointment is required.',
            'work_experience.*.monthly_salary.numeric'         => 'Monthly salary must be a plain number, e.g. 21877.00.',
            'work_experience.*.monthly_salary.min'             => 'Monthly salary must be a plain number, e.g. 21877.00.',
            'work_experience.*.salary_grade.regex'             => 'Salary grade and step must look like 24-2.',
            'attachments.*.mimes'                              => 'The attachment must be a jpeg, jpg, png, or pdf file.',
            'attachments.*.max'                                => 'The attachment must not exceed 5 MB.',
            'attachments.*.file'                               => 'The attachment must be a valid file.',
            'attachments.*.uploaded'                           => self::uploadFailedMessage(5),
        ]);

        $oldPaths = PdsWorkExperience::where('user_id', $userId)
            ->pluck('attachment')->filter()->values();

        $this->assertOwnAttachments($request, $oldPaths);

        PdsWorkExperience::where('user_id', $userId)->delete();

        $allFiles    = $request->file('attachments') ?? [];
        $allExisting = $request->input('existing_attachments') ?? [];
        $keptPaths   = [];

        foreach ($request->work_experience as $i => $item) {
            $attachmentPath = null;

            if (!empty($allFiles[$i])) {
                $attachmentPath = $allFiles[$i]->store("pds/{$userId}/work_experience", PdsFiles::DISK);
            } elseif (!empty($allExisting[$i])) {
                $attachmentPath = $allExisting[$i];
                $keptPaths[]    = $attachmentPath;
            }

            $rowData = collect($item)
                ->except(['attachment'])
                ->map(fn($val, $key) => in_array($key, ['is_present', 'is_government_service'])
                    ? filter_var($val, FILTER_VALIDATE_BOOLEAN)
                    : $val)
                ->toArray();

            PdsWorkExperience::create(array_merge($rowData, [
                'user_id'    => $userId,
                'sort_order' => $i,
                'attachment' => $attachmentPath,
            ]));
        }

        foreach ($oldPaths as $oldPath) {
            if (!in_array($oldPath, $keptPaths)) {
                PdsFiles::disk()->delete($oldPath);
            }
        }

        return back()->with('success', 'Work experience saved.');
    }

    private function saveVoluntaryWork(Request $request, int $userId)
    {
        $request->validate([
            'voluntary_work'                        => 'nullable|array|max:40',
            'voluntary_work.*'                      => 'array',
            'voluntary_work.*.organization_name'    => 'nullable|string|max:100',
            'voluntary_work.*.organization_address' => 'nullable|string|max:100',
            'voluntary_work.*.date_from'            => 'nullable|date_format:Y-m-d',
            'voluntary_work.*.date_to'              => 'nullable|date_format:Y-m-d',
            'voluntary_work.*.number_of_hours'      => 'nullable|numeric|min:0|max:9999',
            'voluntary_work.*.position'             => 'nullable|string|max:60',
            'attachments'                           => 'nullable|array|max:40',
            'attachments.*'                         => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'existing_attachments'                  => 'nullable|array|max:40',
            'existing_attachments.*'                => 'nullable|string|max:255',
        ], [
            'attachments.*.mimes'    => 'The attachment must be a jpeg, jpg, png, or pdf file.',
            'attachments.*.max'      => 'The attachment must not exceed 5 MB.',
            'attachments.*.uploaded' => self::uploadFailedMessage(5),
        ]);

        $oldPaths = PdsVoluntaryWork::where('user_id', $userId)
            ->pluck('attachment')->filter()->values();

        $this->assertOwnAttachments($request, $oldPaths);

        PdsVoluntaryWork::where('user_id', $userId)->delete();

        $allFiles    = $request->file('attachments') ?? [];
        $allExisting = $request->input('existing_attachments') ?? [];
        $keptPaths   = [];

        foreach ($request->voluntary_work ?? [] as $i => $item) {
            $attachmentPath = null;

            if (!empty($allFiles[$i])) {
                $attachmentPath = $allFiles[$i]->store("pds/{$userId}/voluntary_work", PdsFiles::DISK);
            } elseif (!empty($allExisting[$i])) {
                $attachmentPath = $allExisting[$i];
                $keptPaths[]    = $attachmentPath;
            }

            $rowData = collect($item)->except(['attachment'])->toArray();

            PdsVoluntaryWork::create(array_merge($rowData, [
                'user_id'    => $userId,
                'sort_order' => $i,
                'attachment' => $attachmentPath,
            ]));
        }

        foreach ($oldPaths as $oldPath) {
            if (!in_array($oldPath, $keptPaths)) {
                PdsFiles::disk()->delete($oldPath);
            }
        }

        return back()->with('success', 'Voluntary work saved.');
    }

    private function saveTrainings(Request $request, int $userId)
    {
        $data = $request->all();

        $data['trainings'] = array_values(
            array_filter($data['trainings'] ?? [], fn($t) => is_array($t) && !empty($t['title']))
        );

        foreach ($data['trainings'] as $i => $item) {   
            foreach (['date_from', 'date_to'] as $dateField) {
                if (isset($item[$dateField]) && $item[$dateField] === '') {
                    $data['trainings'][$i][$dateField] = null;
                }
            }
        }
        $request->replace($data);

        $request->validate([
            'trainings'                        => 'nullable|array|max:100',
            'trainings.*.title'                => 'required|string|max:255',
            'trainings.*.date_from'            => 'nullable|date_format:Y-m-d',
            'trainings.*.date_to'              => 'nullable|date_format:Y-m-d',
            'trainings.*.number_of_hours'      => 'required|numeric|min:1|max:9999',
            'trainings.*.type_of_ld'           => 'required|string|in:Managerial,Supervisory,Technical,Etc.',
            'trainings.*.conducted_by'         => 'required|string|max:100',
            'attachments'                      => 'nullable|array|max:100',
            'attachments.*'                    => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'existing_attachments'             => 'nullable|array|max:100',
            'existing_attachments.*'           => 'nullable|string|max:255',
        ], [
            'trainings.*.title.required'           => 'Training title is required.',
            'trainings.*.number_of_hours.required' => 'Number of hours is required.',
            'trainings.*.number_of_hours.numeric'  => 'Number of hours must be a number.',
            'trainings.*.type_of_ld.required'      => 'Type of L&D is required.',
            'trainings.*.type_of_ld.in'            => 'Invalid L&D type selected.',
            'trainings.*.conducted_by.required'    => 'Conducted/Sponsored by is required.',
            'attachments.*.mimes'                  => 'The attachment must be a jpeg, jpg, png, or pdf file.',
            'attachments.*.max'                    => 'The attachment must not exceed 5 MB.',
            'attachments.*.uploaded'               => self::uploadFailedMessage(5),
        ]);

        $oldPaths = PdsTraining::where('user_id', $userId)
            ->pluck('attachment')->filter()->values();

        $this->assertOwnAttachments($request, $oldPaths);

        PdsTraining::where('user_id', $userId)->delete();

        $allFiles    = $request->file('attachments') ?? [];
        $allExisting = $request->input('existing_attachments') ?? [];
        $keptPaths   = [];

        $trainings = array_filter($request->trainings ?? [], fn($t) => is_array($t));
        foreach ($trainings as $i => $item) {
            $attachmentPath = null;

            if (!empty($allFiles[$i]) && $allFiles[$i]->isValid()) {
                $file      = $allFiles[$i];
                $extension = strtolower($file->getClientOriginalExtension());
                $baseName  = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $safeName  = substr(preg_replace('/[^a-zA-Z0-9_\-]/', '_', $baseName), 0, 100);

                $attachmentPath = $file->storeAs(
                    "pds/{$userId}/trainings",
                    $safeName . '_' . uniqid() . '.' . $extension,
                    PdsFiles::DISK
                );
            } elseif (!empty($allExisting[$i])) {
                $attachmentPath = $allExisting[$i];
                $keptPaths[]    = $attachmentPath;
            }

            $rowData = collect($item)->except(['attachment'])->toArray();

            PdsTraining::create(array_merge($rowData, [
                'user_id'    => $userId,
                'sort_order' => $i,
                'attachment' => $attachmentPath,
            ]));
        }

        foreach ($oldPaths as $oldPath) {
            if (!in_array($oldPath, $keptPaths)) {
                PdsFiles::disk()->delete($oldPath);
            }
        }

        return back()->with('success', 'Trainings saved.');
    }

    private function saveOtherInfo(Request $request, int $userId)
    {
        $data = $request->validate([
            'special_skills' => 'nullable|array|max:50',
            'special_skills.*' => 'string|max:100',
            'non_academic_distinctions' => 'nullable|array|max:50',
            'non_academic_distinctions.*' => 'string|max:100',
            'organization_memberships' => 'nullable|array|max:50',
            'organization_memberships.*' => 'string|max:100',
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
            'q34_a'         => 'nullable|boolean',
            'q34_b'         => 'nullable|boolean',
            'q34_details'   => 'nullable|string|max:255',
            'q35_a'         => 'nullable|boolean',
            'q35_a_details' => 'nullable|string|max:255',
            'q35_b'         => 'nullable|boolean',
            'q35_b_date'    => 'nullable|string|max:50',
            'q35_b_status'  => 'nullable|string|max:50',
            'q36'           => 'nullable|boolean',
            'q36_details'   => 'nullable|string|max:255',
            'q37'           => 'nullable|boolean',
            'q37_details'   => 'nullable|string|max:255',
            'q38_a'         => 'nullable|boolean',
            'q38_a_details' => 'nullable|string|max:255',
            'q38_b'         => 'nullable|boolean',
            'q38_b_details' => 'nullable|string|max:255',
            'q39'           => 'nullable|boolean',
            'q39_details'   => 'nullable|string|max:255',
            'q40_a'         => 'nullable|boolean',
            'q40_a_details' => 'nullable|string|max:255',
            'q40_b'         => 'nullable|boolean',
            'q40_b_details' => 'nullable|string|max:255',
            'q40_c'         => 'nullable|boolean',
            'q40_c_details' => 'nullable|string|max:255',
        ]);

        PdsQuestion::updateOrCreate(['user_id' => $userId], $data);

        return back()->with('success', 'Questions saved.');
    }

    private function saveReferences(Request $request, int $userId)
    {
        // With a photo or signature the form posts the list as JSON text. Decode on the text itself, not on a file being there:
        // a file PHP refused counts as "no file", and the list was then rejected as "must be an array" instead of the real reason.
        if (is_string($request->input('references'))) {
            $request->merge(['references' => json_decode($request->input('references'), true) ?? []]);
        }

        $request->validate([
            'references'             => 'required|array|max:3',
            'references.*.name'      => ['required', 'string', 'max:60', PdsRules::personName()],
            'references.*.address'   => 'required|string|max:150', // the column is varchar(255): 500 crashed the save
            'references.*.telephone' => ['required', 'string', 'max:30', PdsRules::contact()],
            'id_type'                => 'required|string|max:50',
            'id_number'              => 'required|string|max:30',
            'date_of_issuance'       => 'required|string|max:60',
            'place_of_issuance'      => 'required|string|max:60',
            'date_accomplished'      => 'required|string|max:30',
            'passport_photo'         => 'nullable|image|max:4096',
            'signature'              => 'nullable|image|max:2048',
        ], [
            'passport_photo.uploaded' => self::uploadFailedMessage(4),
            'signature.uploaded'      => self::uploadFailedMessage(2),
        ]);

        // Save references
        PdsReference::where('user_id', $userId)->delete();
        foreach ($request->input('references') as $i => $ref) {
            PdsReference::create([
                'user_id'    => $userId,
                'sort_order' => $i,
                'name'       => $ref['name'],
                'address'    => $ref['address'],
                'telephone'  => $ref['telephone'],
            ]);
        }

        // Save government ID fields
        $govUpdates = [
            'id_type'           => $request->input('id_type'),
            'id_number'         => $request->input('id_number'),
            'date_of_issuance'  => $request->input('date_of_issuance'),
            'place_of_issuance' => $request->input('place_of_issuance'),
            'date_accomplished' => $request->input('date_accomplished'),
        ];

        // Handle passport photo
        if ($request->hasFile('passport_photo')) {
            $existing = PdsGovernmentId::where('user_id', $userId)->value('passport_photo');
            if ($existing) {
                PdsFiles::disk()->delete($existing);
            }
            $govUpdates['passport_photo'] = $request->file('passport_photo')
                ->store("pds/{$userId}", PdsFiles::DISK);
        }

        // Handle signature
        if ($request->hasFile('signature')) {
            $existing = PdsGovernmentId::where('user_id', $userId)->value('signature');
            if ($existing) {
                PdsFiles::disk()->delete($existing);
            }
            $govUpdates['signature'] = $request->file('signature')
                ->store("pds/{$userId}", PdsFiles::DISK);
        }

        PdsGovernmentId::updateOrCreate(['user_id' => $userId], $govUpdates);

        return response()->json(['message' => 'Saved successfully.']);
    }

    /** What a row of each list section is called in an error message. */
    private const ROW_LABELS = [
        'children' => 'Child', 'education' => 'Education', 'eligibilities' => 'Eligibility',
        'work_experience' => 'Work experience', 'voluntary_work' => 'Voluntary work', 'trainings' => 'Training',
        'references' => 'Reference', 'special_skills' => 'Special skill', 'non_academic_distinctions' => 'Distinction',
        'organization_memberships' => 'Membership', 'attachments' => 'Attachment', 'existing_attachments' => 'Attachment',
    ];

    /**
     * Turn Laravel's field-name messages into plain ones: "The work_experience.3.accomplishments field must not be
     * greater than 2000 characters." becomes "Work experience #4: accomplishments is too long (maximum 2000
     * characters)." Messages written for people elsewhere in this controller are left as they are.
     *
     * @param  array<string, list<string>>  $errors
     * @return array<string, list<string>>
     */
    /**
     * What an employee reads when PHP itself refused a file. PHP stops a file bigger than its own upload_max_filesize (2 MB on a
     * fresh WAMP install) before Laravel sees it, even though the forms promise more, and Laravel's default ("The Attachment #1
     * failed to upload.") does not say what to do.
     */
    private static function uploadFailedMessage(int $limitMb): string
    {
        return UploadMessages::failed($limitMb);
    }

    private function readableErrors(array $errors): array
    {
        $readable = [];

        foreach ($errors as $key => $messages) {
            $label = $this->fieldLabel($key);

            $readable[$key] = array_map(function (string $message) use ($key, $label) {
                if (preg_match('/ field must not be greater than (\d+) characters\.$/', $message, $m)) {
                    return "{$label} is too long (maximum {$m[1]} characters).";
                }

                if (preg_match('/ field must not have more than (\d+) items\.$/', $message, $m)) {
                    return "{$label}: too many entries (maximum {$m[1]}).";
                }

                // Dotted keys ("work_experience.1.date_from") are never readable as Laravel prints them.
                return str_contains($key, '.') ? str_replace($key, $label, $message) : $message;
            }, $messages);
        }

        return $readable;
    }

    /** "work_experience.3.accomplishments" => "Work experience #4: accomplishments"; "res_street" => "Residential street". */
    private function fieldLabel(string $key): string
    {
        if (preg_match('/^([a-z_]+)\.(\d+)\.([a-z0-9_]+)$/', $key, $m)) {
            $row = self::ROW_LABELS[$m[1]] ?? ucfirst(str_replace('_', ' ', $m[1]));
            // A reference's "telephone" column is the "Contact No. / Email" box on the form.
            $box = $m[1] === 'references' && $m[3] === 'telephone' ? 'contact' : str_replace('_', ' ', $m[3]);

            return $row.' #'.($m[2] + 1).': '.$box;
        }

        if (preg_match('/^([a-z_]+)\.(\d+)$/', $key, $m)) {
            return (self::ROW_LABELS[$m[1]] ?? ucfirst(str_replace('_', ' ', $m[1]))).' #'.($m[2] + 1);
        }

        if (isset(self::ROW_LABELS[$key])) {
            return self::ROW_LABELS[$key];
        }

        if (preg_match('/^q(\d+)(?:_([a-c]))?_(\w+)$/', $key, $m)) {
            return "Question {$m[1]}{$m[2]} ".str_replace('_', ' ', $m[3]);
        }

        $words = str_replace('_', ' ', $key);
        $words = preg_replace(['/^res /', '/^perm /'], ['residential ', 'permanent '], $words);

        return ucfirst($words);
    }

    /**
     * A row may keep an attachment only if it is already attached to one of this employee's own rows in the section.
     * The path is posted by the browser: trusting it would let one employee point a row at another employee's file,
     * and the old-file cleanup would then delete that file. Run it before anything is deleted or stored.
     */
    private function assertOwnAttachments(Request $request, Collection $ownPaths): void
    {
        foreach ((array) $request->input('existing_attachments', []) as $i => $path) {
            if ($path !== null && $path !== '' && ! in_array($path, $ownPaths->all(), true)) {
                throw ValidationException::withMessages([
                    "existing_attachments.{$i}" => 'Invalid attachment path.',
                ]);
            }
        }
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