<?php

// An over-limit value is reported in plain words that say which box (and which row), because the form shows only the
// first server error in a pop-up. "The work_experience.3.accomplishments field must not be greater than ..." is not
// something an employee can act on.

test('a too-long value names the row and the box', function (string $section, string $path, int $length, string $expected) {
    $payload = pdsSectionPayload($section);
    data_set($payload, $path, str_repeat('a', $length));

    expect(pdsFirstError($this, $section, $payload))->toBe($expected);
})->with([
    'work experience row 1' => ['work_experience', 'work_experience.0.accomplishments', 2001, 'Work experience #1: accomplishments is too long (maximum 2000 characters).'],
    'education row 1' => ['education', 'education.0.school_name', 101, 'Education #1: school name is too long (maximum 100 characters).'],
    'a child' => ['family', 'children.0.full_name', 101, 'Child #1: full name is too long (maximum 100 characters).'],
    'a reference' => ['references', 'references.0.address', 151, 'Reference #1: address is too long (maximum 150 characters).'],
    'a skill tag' => ['other_info', 'special_skills.0', 101, 'Special skill #1 is too long (maximum 100 characters).'],
    'residential subdivision' => ['personal', 'res_subdivision', 31, 'Residential subdivision is too long (maximum 30 characters).'],
    'permanent street' => ['personal', 'perm_street', 61, 'Permanent street is too long (maximum 60 characters).'],
    'place of birth' => ['personal', 'birth_place', 61, 'Birth place is too long (maximum 60 characters).'],
    'a question detail' => ['questions', 'q35_a_details', 256, 'Question 35a details is too long (maximum 255 characters).'],
]);

test('the row number counts from 1 for the row that is actually too long', function () {
    $payload = pdsSectionPayload('work_experience');
    $payload['work_experience'] = [pdsWorkRow(), pdsWorkRow(), pdsWorkRow(['position_title' => str_repeat('a', 256)])];

    expect(pdsFirstError($this, 'work_experience', $payload))
        ->toBe('Work experience #3: position title is too long (maximum 255 characters).');
});

test('too many rows is reported without raw field names', function () {
    $payload = pdsSectionPayload('work_experience');
    $payload['work_experience'] = array_fill(0, 61, pdsWorkRow());

    expect(pdsFirstError($this, 'work_experience', $payload))->toBe('Work experience: too many entries (maximum 60).');
});

test('any other error in a row names the row too', function () {
    $payload = pdsSectionPayload('education');
    $payload['education'] = [
        ['level' => 'College', 'school_name' => 'BSU'],
        ['level' => 'Doctorate', 'school_name' => 'BSU'],
    ];

    expect(pdsFirstError($this, 'education', $payload))->toBe('The selected Education #2: level is invalid.');
});

test('messages that were already written for people are left alone', function () {
    $this->actingAs(pdsUser())->postJson('/pds/save/personal', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['philsys_number' => 'PhilSys Card Number (PCN) is required.']);
});
