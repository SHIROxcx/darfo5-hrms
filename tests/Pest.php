<?php

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

pest()->extend(Tests\TestCase::class)
    ->use(Tests\Concerns\RefreshesDatabaseWithFakeDisks::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

/**
 * A verified, approved user holding the given role (PDS tests).
 */
function pdsUser(string $role = 'employee'): \App\Models\User
{
    \Spatie\Permission\Models\Role::findOrCreate($role);

    $user = \App\Models\User::factory()->create();
    $user->assignRole($role);

    return $user;
}

/**
 * A minimal valid work experience row as the PDS form posts it.
 */
function pdsWorkRow(array $overrides = []): array
{
    return array_merge([
        'position_title' => 'Agriculturist I',
        'department' => 'Department of Agriculture',
        'date_from' => '2020-01-01',
        'date_to' => '2021-01-01',
        'is_present' => '0',
        'status_of_appointment' => 'Permanent',
        'is_government_service' => '1',
    ], $overrides);
}

/**
 * A payload the given PDS save section accepts, so a test can change exactly one thing.
 */
function pdsSectionPayload(string $section): array
{
    return match ($section) {
        'personal' => [
            'last_name' => 'Cruz', 'first_name' => 'Maria', 'sex' => 'Female', 'birth_place' => 'Naga City',
            'civil_status' => 'Single', 'mobile_number' => '09171234567', 'date_of_birth' => '1990-05-17',
            'citizenship' => 'Filipino', 'res_house_no' => '12', 'res_street' => 'Rizal St', 'res_barangay' => 'Triangulo',
            'res_city' => 'Naga City', 'res_province' => 'Camarines Sur', 'perm_house_no' => '12', 'perm_street' => 'Rizal St',
            'perm_barangay' => 'Triangulo', 'perm_city' => 'Naga City', 'perm_province' => 'Camarines Sur',
            'pagibig_number' => '1234-5678-9012', 'philhealth_number' => '12-345678901-2', 'philsys_number' => '1234-5678-9012-3456', 'tin_number' => '123-456-789',
        ],
        'family' => ['children' => [['full_name' => 'Juan Cruz', 'date_of_birth' => '2015-06-01']]],
        'education' => ['education' => [['level' => 'College', 'school_name' => 'BSU', 'course' => 'BS Agriculture']]],
        'eligibility' => ['eligibilities' => [[
            'career_service' => 'Career Service Professional', 'rating' => '85.5', 'date_of_examination' => '2010-03-14',
            'place_of_examination' => 'Legazpi City', 'license_number' => 'L-1', 'license_validity' => null,
        ]]],
        'work_experience' => ['work_experience' => [pdsWorkRow()]],
        'voluntary_work' => ['voluntary_work' => [[
            'organization_name' => 'Farmers Association', 'organization_address' => 'Naga City', 'date_from' => '2012-01-01',
            'date_to' => '2012-12-31', 'number_of_hours' => 120, 'position' => 'Member',
        ]]],
        'trainings' => ['trainings' => [[
            'title' => 'Rice Production', 'date_from' => '2015-02-02', 'date_to' => '2015-02-06',
            'number_of_hours' => 40, 'type_of_ld' => 'Technical', 'conducted_by' => 'PhilRice',
        ]]],
        'other_info' => ['special_skills' => ['Welding'], 'non_academic_distinctions' => ['Employee of the Year'], 'organization_memberships' => ['PSAE']],
        'questions' => [],
        'references' => [
            'references' => [['name' => 'Ana Reyes', 'address' => 'Naga City', 'telephone' => '09171234567']],
            'id_type' => 'Passport', 'id_number' => 'P1234567', 'date_of_issuance' => '2022-01-15',
            'place_of_issuance' => 'DFA Naga', 'date_accomplished' => '2026-11-18',
        ],
    };
}

/** [section, model, folder the controller stores that section's files in]. */
function pdsAttachmentSections(): array
{
    return [
        'eligibility' => [\App\Models\PdsEligibility::class, 'eligibilities'],
        'work experience' => [\App\Models\PdsWorkExperience::class, 'work_experience'],
        'voluntary work' => [\App\Models\PdsVoluntaryWork::class, 'voluntary_work'],
        'trainings' => [\App\Models\PdsTraining::class, 'trainings'],
    ];
}

function pdsAttachmentRoute(string $label): string
{
    return ['eligibility' => 'eligibility', 'work experience' => 'work_experience', 'voluntary work' => 'voluntary_work', 'trainings' => 'trainings'][$label];
}

/** An employee row that already carries `$path`, as an earlier save would have left it. */
function pdsAttachedRow(string $label, int $userId, string $path): void
{
    [$model] = pdsAttachmentSections()[$label];

    $model::create(match ($label) {
        'eligibility' => ['user_id' => $userId, 'career_service' => 'CSP', 'attachment' => $path, 'sort_order' => 0],
        'work experience' => ['user_id' => $userId, 'position_title' => 'Agriculturist I', 'attachment' => $path, 'sort_order' => 0],
        'voluntary work' => ['user_id' => $userId, 'organization_name' => 'Farmers', 'attachment' => $path, 'sort_order' => 0],
        'trainings' => ['user_id' => $userId, 'title' => 'Rice Production', 'attachment' => $path, 'sort_order' => 0],
    });
}

/**
 * Every PDS text field's maximum length, by section and field path. The server rules in PdsController must match,
 * and so must resources/js/lib/pds-limits.ts (PdsLimitsParityTest).
 */
function pdsTextLimits(): array
{
    return [
        'personal' => [
            'last_name' => 100, 'first_name' => 100, 'middle_name' => 100, 'name_ext' => 10, 'birth_place' => 60,
            'mobile_number' => 20, 'citizenship' => 30, 'citizenship_type' => 30, 'citizenship_country' => 50,
            'blood_type' => 5, 'agency_employee_no' => 30, 'telephone' => 30,
            'res_house_no' => 30, 'res_street' => 60, 'res_subdivision' => 30, 'res_barangay' => 60, 'res_city' => 60,
            'res_province' => 60, 'res_zipcode' => 10,
            'perm_house_no' => 30, 'perm_street' => 60, 'perm_subdivision' => 30, 'perm_barangay' => 60, 'perm_city' => 60,
            'perm_province' => 60, 'perm_zipcode' => 10,
            'umid_number' => 25, 'pagibig_number' => 25,
            'philhealth_number' => 25, 'philsys_number' => 25, 'tin_number' => 25,
        ],
        'family' => [
            'spouse_surname' => 60, 'spouse_first_name' => 60, 'spouse_middle_name' => 60, 'spouse_name_ext' => 10,
            'spouse_occupation' => 60, 'spouse_employer' => 100, 'spouse_business_address' => 100, 'spouse_telephone' => 30,
            'father_surname' => 60, 'father_first_name' => 60, 'father_middle_name' => 60, 'father_name_ext' => 10,
            'mother_surname' => 60, 'mother_first_name' => 60, 'mother_middle_name' => 60,
            'children.0.full_name' => 100,
        ],
        'education' => [
            'education.0.school_name' => 100, 'education.0.course' => 100, 'education.0.period_from' => 20,
            'education.0.period_to' => 20, 'education.0.highest_level' => 50, 'education.0.year_graduated' => 20,
            'education.0.honors_received' => 60,
        ],
        'eligibility' => [
            'eligibilities.0.career_service' => 255, 'eligibilities.0.rating' => 20,
            'eligibilities.0.place_of_examination' => 100, 'eligibilities.0.license_number' => 30,
        ],
        'work_experience' => [
            'work_experience.0.position_title' => 255, 'work_experience.0.department' => 100, 'work_experience.0.office' => 100,
            'work_experience.0.supervisor' => 60, 'work_experience.0.location' => 100,
            'work_experience.0.status_of_appointment' => 50, 'work_experience.0.accomplishments' => 2000,
            'work_experience.0.actual_duties' => 2000,
        ],
        'voluntary_work' => [
            'voluntary_work.0.organization_name' => 100, 'voluntary_work.0.organization_address' => 100,
            'voluntary_work.0.position' => 60,
        ],
        'trainings' => ['trainings.0.title' => 255, 'trainings.0.conducted_by' => 100],
        'other_info' => [
            'special_skills.0' => 100, 'non_academic_distinctions.0' => 100, 'organization_memberships.0' => 100,
        ],
        'questions' => [
            'q34_details' => 255, 'q35_a_details' => 255, 'q35_b_date' => 50, 'q35_b_status' => 50, 'q36_details' => 255,
            'q37_details' => 255, 'q38_a_details' => 255, 'q38_b_details' => 255, 'q39_details' => 255,
            'q40_a_details' => 255, 'q40_b_details' => 255, 'q40_c_details' => 255,
        ],
        'references' => [
            'references.0.name' => 60, 'references.0.address' => 150, 'references.0.telephone' => 30,
            'id_type' => 50, 'id_number' => 30, 'date_of_issuance' => 60, 'place_of_issuance' => 60,
            'date_accomplished' => 30,
        ],
    ];
}

function pdsLimitPost($test, string $section, array $payload)
{
    return $test->actingAs(pdsUser())->post("/pds/save/{$section}", $payload);
}

function pdsFirstError($test, string $section, array $payload): ?string
{
    $response = $test->actingAs(pdsUser())->postJson("/pds/save/{$section}", $payload)->assertUnprocessable();

    return collect($response->json('errors'))->flatten()->first();
}

/**
 * A value of exactly `$length` characters that passes the box's format check, so a length test fails only because of
 * the length. Boxes without a format check just get letters.
 */
function pdsFiller(string $path, int $length): string
{
    $field = last(explode('.', $path));
    $digitsNeeded = ['philsys_number' => 16, 'tin_number' => 9, 'philhealth_number' => 12, 'pagibig_number' => 12, 'umid_number' => 12];

    return match (true) {
        isset($digitsNeeded[$field]) => '1'.str_repeat(' ', $length - $digitsNeeded[$field]).str_repeat('1', $digitsNeeded[$field] - 1),
        $field === 'mobile_number' => '09'.str_repeat(' ', $length - 11).'123456789',
        str_ends_with($field, 'telephone') || $field === 'telephone' => '1'.str_repeat(' ', $length - 5).'2345',
        default => str_repeat('a', $length),
    };
}

/**
 * An approved, verified admin (or superadmin) for the memo tests.
 */
function memoAdmin(string $role = 'admin'): \App\Models\User
{
    // The pages' shared layout looks roles up, so all three must exist, as they do in the real database.
    foreach (['superadmin', 'admin', 'employee'] as $name) {
        \Spatie\Permission\Models\Role::findOrCreate($name);
    }

    $user = \App\Models\User::factory()->create(['is_approved' => true, 'email_verified_at' => now()]);
    $user->assignRole($role);

    return $user;
}

/** What PHP hands over for a file that is over its upload limit. */
function memoRefusedUpload(string $name = 'scan.pdf', string $mime = 'application/pdf'): \Illuminate\Http\UploadedFile
{
    $path = tempnam(sys_get_temp_dir(), 'memo');
    file_put_contents($path, '%PDF-1.4');

    return new \Illuminate\Http\UploadedFile($path, $name, $mime, UPLOAD_ERR_INI_SIZE, true);
}

/** A small PDF to attach to a memo. The memo is titled with its name. */
function memoUpload(string $name = 'Memorandum Circular 58.pdf', int $kb = 100): \Illuminate\Http\UploadedFile
{
    return \Illuminate\Http\UploadedFile::fake()->create($name, $kb, 'application/pdf');
}

/** A saved draft that has its file, saved the way the form saves it. */
function uploadedDraft(?\App\Models\User $by = null, string $name = 'Memorandum Circular 58.pdf'): \App\Models\Memo
{
    return app(\App\Services\MemoService::class)->saveDraft(memoUpload($name), $by ?? memoAdmin());
}

/** Store a file for a memo on the private disk, the way the service stores it, and point the memo at it. */
function attachMemoFile(\App\Models\Memo $memo, string $extension = 'pdf', ?string $content = null, string $name = 'Memo.pdf'): \App\Models\Memo
{
    $path = "memos/{$memo->id}/file/stored.{$extension}";
    \App\Support\MemoFiles::disk()->put($path, $content ?? "bytes-of-memo-{$memo->id}");
    $memo->update(['file_path' => $path, 'file_name' => $name]);

    return $memo->fresh();
}
