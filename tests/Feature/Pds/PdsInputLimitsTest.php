<?php

// Server-side length, count and format limits for every PDS save endpoint.
// The forms have no maxLength, and the columns are varchar(255): without a rule a long value either goes through
// (under 255) or crashes the save with a database error (over 255).

test('accepts a text value exactly at its limit', function (string $section, string $path, int $max) {
    $payload = pdsSectionPayload($section);
    data_set($payload, $path, pdsFiller($path, $max));

    pdsLimitPost($this, $section, $payload)->assertSessionHasNoErrors();
})->with('pds text limits');

test('rejects a text value one character over its limit', function (string $section, string $path, int $max) {
    $payload = pdsSectionPayload($section);
    data_set($payload, $path, pdsFiller($path, $max + 1));

    pdsLimitPost($this, $section, $payload)->assertSessionHasErrors($path);
})->with('pds text limits');

// A section posts every row on each save, so the row count is bounded too.
test('rejects more rows than a section may hold', function (string $section, string $key, int $cap) {
    $payload = pdsSectionPayload($section);
    $payload[$key] = array_fill(0, $cap + 1, $payload[$key][0]);

    pdsLimitPost($this, $section, $payload)->assertSessionHasErrors($key);
})->with([
    'children' => ['family', 'children', 30],
    'education' => ['education', 'education', 15],
    'eligibilities' => ['eligibility', 'eligibilities', 30],
    'work experience' => ['work_experience', 'work_experience', 60],
    'voluntary work' => ['voluntary_work', 'voluntary_work', 40],
    'trainings' => ['trainings', 'trainings', 100],
]);

test('accepts a section filled to its row cap', function (string $section, string $key, int $cap) {
    $payload = pdsSectionPayload($section);
    $payload[$key] = array_fill(0, $cap, $payload[$key][0]);

    pdsLimitPost($this, $section, $payload)->assertSessionHasNoErrors();
})->with([
    'children' => ['family', 'children', 30],
    'education' => ['education', 'education', 15],
    'eligibilities' => ['eligibility', 'eligibilities', 30],
    'work experience' => ['work_experience', 'work_experience', 60],
    'voluntary work' => ['voluntary_work', 'voluntary_work', 40],
    'trainings' => ['trainings', 'trainings', 100],
]);

test('rejects more tags than an other-information list may hold', function (string $key) {
    $payload = pdsSectionPayload('other_info');
    $payload[$key] = array_fill(0, 51, 'tag');

    pdsLimitPost($this, 'other_info', $payload)->assertSessionHasErrors($key);
})->with(['special_skills', 'non_academic_distinctions', 'organization_memberships']);

test('rejects an other-information tag that is not text', function () {
    $payload = pdsSectionPayload('other_info');
    $payload['special_skills'] = [['nested' => 'x']];

    pdsLimitPost($this, 'other_info', $payload)->assertSessionHasErrors('special_skills.0');
});

// Format and range checks.
test('rejects values outside a sensible range or format', function (string $section, string $path, mixed $value) {
    $payload = pdsSectionPayload($section);
    data_set($payload, $path, $value);

    pdsLimitPost($this, $section, $payload)->assertSessionHasErrors($path);
})->with([
    'height over 3 m' => ['personal', 'height', '3.01'],
    'negative height' => ['personal', 'height', '-1'],
    'weight over 500 kg' => ['personal', 'weight', '501'],
    'weight not a number' => ['personal', 'weight', 'heavy'],
    'birth date in the future' => ['personal', 'date_of_birth', '2999-01-01'],
    'child birth date in the future' => ['family', 'children.0.date_of_birth', '2999-01-01'],
    'education level not offered' => ['education', 'education.0.level', 'Doctorate'],
    'work start date in another format' => ['work_experience', 'work_experience.0.date_from', '01/02/2020'],
    'work end date not a date' => ['work_experience', 'work_experience.0.date_to', 'last year'],
    'volunteer start date in another format' => ['voluntary_work', 'voluntary_work.0.date_from', '01/02/2020'],
    'volunteer hours not a number' => ['voluntary_work', 'voluntary_work.0.number_of_hours', 'many'],
    'volunteer hours over 9999' => ['voluntary_work', 'voluntary_work.0.number_of_hours', '10000'],
    'volunteer hours negative' => ['voluntary_work', 'voluntary_work.0.number_of_hours', '-1'],
    'training hours over 9999' => ['trainings', 'trainings.0.number_of_hours', '10000'],
    'volunteer row that is not an object' => ['voluntary_work', 'voluntary_work.0', 'text'],
]);

test('accepts the boundary values of the ranges', function (string $section, string $path, mixed $value) {
    $payload = pdsSectionPayload($section);
    data_set($payload, $path, $value);

    pdsLimitPost($this, $section, $payload)->assertSessionHasNoErrors();
})->with([
    'height 3 m' => ['personal', 'height', '3'],
    'weight 500 kg' => ['personal', 'weight', '500'],
    'born today' => ['personal', 'date_of_birth', date('Y-m-d')],
    'volunteer hours 9999' => ['voluntary_work', 'voluntary_work.0.number_of_hours', '9999'],
    'volunteer hours empty' => ['voluntary_work', 'voluntary_work.0.number_of_hours', ''],
    'training hours 9999' => ['trainings', 'trainings.0.number_of_hours', '9999'],
]);

// An attachment reference is a stored path (255-character column).
test('rejects an existing-attachment path longer than the column', function (string $section, string $key) {
    $payload = pdsSectionPayload($section);
    $payload['existing_attachments'] = [str_repeat('a', 256)];

    pdsLimitPost($this, $section, $payload)->assertSessionHasErrors('existing_attachments.0');
})->with([
    ['eligibility', 'eligibilities'],
    ['work_experience', 'work_experience'],
    ['voluntary_work', 'voluntary_work'],
    ['trainings', 'trainings'],
]);
