<?php

use App\Models\PdsWorkExperience;

function saveWorkExperienceAs($test, $user, array $overrides = [])
{
    return $test->actingAs($user)->post('/pds/save/work_experience', [
        'work_experience' => [pdsWorkRow($overrides)],
    ]);
}

test('saves monthly salary and grade-step', function () {
    $user = pdsUser();

    saveWorkExperienceAs($this, $user, ['monthly_salary' => '21877.5', 'salary_grade' => '24-2'])
        ->assertSessionHasNoErrors();

    $row = PdsWorkExperience::where('user_id', $user->id)->firstOrFail();

    expect($row->monthly_salary)->toBe('21877.50')
        ->and($row->salary_grade)->toBe('24-2');
});

test('accepts an empty monthly salary and grade', function () {
    saveWorkExperienceAs($this, pdsUser(), ['monthly_salary' => '', 'salary_grade' => ''])
        ->assertSessionHasNoErrors();
});

test('rejects a monthly salary that is not a plain number', function (string $value) {
    saveWorkExperienceAs($this, pdsUser(), ['monthly_salary' => $value])
        ->assertSessionHasErrors('work_experience.0.monthly_salary');
})->with(['P21,877.00', 'abc', '-5']);

test('rejects a grade without a step', function (string $value) {
    saveWorkExperienceAs($this, pdsUser(), ['salary_grade' => $value])
        ->assertSessionHasErrors('work_experience.0.salary_grade');
})->with(['24-', 'x-1', '1-23']);

// Rows saved before the 2026 update hold a bare grade such as "24" (the position picker used to store only the grade).
// Every save posts all rows, so rejecting a stored "24" would block saving the whole section.
test('keeps a stored grade without a step so other rows can still be saved', function () {
    $user = pdsUser();

    $this->actingAs($user)->post('/pds/save/work_experience', [
        'work_experience' => [
            pdsWorkRow(['position_title' => 'Old row', 'salary_grade' => '24']),
            pdsWorkRow(['position_title' => 'New row', 'salary_grade' => '11-1']),
        ],
    ])->assertSessionHasNoErrors();

    expect(PdsWorkExperience::where('user_id', $user->id)->orderBy('sort_order')->pluck('salary_grade')->all())
        ->toBe(['24', '11-1']);
});
