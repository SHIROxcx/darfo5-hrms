<?php

// Format checks on the PDS save endpoints: government IDs, mobile, telephone, zip code and person names.
// Examples come from tests/Fixtures/pds-formats.json, which the browser-side rules are checked against as well.

/** form field => [save section, request path]. */
function pdsFormatTargets(): array
{
    return [
        'philsys_number' => ['personal', 'philsys_number'],
        'tin_number' => ['personal', 'tin_number'],
        'philhealth_number' => ['personal', 'philhealth_number'],
        'pagibig_number' => ['personal', 'pagibig_number'],
        'umid_number' => ['personal', 'umid_number'],
        'mobile_number' => ['personal', 'mobile_number'],
        'telephone' => ['personal', 'telephone'],
        'first_name' => ['personal', 'first_name'],
        'last_name' => ['personal', 'last_name'],
        'middle_name' => ['personal', 'middle_name'],
        'name_ext' => ['personal', 'name_ext'],
        'reference_contact' => ['references', 'references.0.telephone'],
        'child_full_name' => ['family', 'children.0.full_name'],
    ];
}

function pdsFormatExamples(string $kind): array
{
    // Not base_path(): Pest builds these example lists before Laravel has started.
    $fixture = json_decode(file_get_contents(dirname(__DIR__, 2).'/Fixtures/pds-formats.json'), true);

    $cases = [];
    foreach (pdsFormatTargets() as $field => [$section, $path]) {
        foreach ($fixture[$field][$kind] as $value) {
            $cases["{$field}: {$value}"] = [$section, $path, $value];
        }
    }

    return $cases;
}

dataset('pds valid formats', fn () => pdsFormatExamples('valid'));
dataset('pds invalid formats', fn () => pdsFormatExamples('invalid'));

test('accepts a value in the right format', function (string $section, string $path, string $value) {
    $payload = pdsSectionPayload($section);
    data_set($payload, $path, $value);

    pdsLimitPost($this, $section, $payload)->assertSessionHasNoErrors();
})->with('pds valid formats');

test('rejects a value in the wrong format', function (string $section, string $path, string $value) {
    $payload = pdsSectionPayload($section);
    data_set($payload, $path, $value);

    pdsLimitPost($this, $section, $payload)->assertSessionHasErrors($path);
})->with('pds invalid formats');

// The words an employee reads. The sentences live in the shared fixture so the browser check compares to the same text.
test('a wrong format says what is expected', function (string $field) {
    $sample = json_decode(file_get_contents(dirname(__DIR__, 2).'/Fixtures/pds-formats.json'), true)['messages'][$field];
    [$section, $path] = pdsFormatTargets()[$field];

    $payload = pdsSectionPayload($section);
    data_set($payload, $path, $sample['value']);

    expect(pdsFirstError($this, $section, $payload))->toBe($sample['message']);
})->with(['philsys_number', 'tin_number', 'philhealth_number', 'pagibig_number', 'umid_number', 'mobile_number', 'telephone', 'first_name', 'last_name', 'middle_name']);

// Boxes inside a repeated row name the row.
test('a wrong format inside a row names the row', function (string $section, string $path, string $value, string $expected) {
    $payload = pdsSectionPayload($section);
    data_set($payload, $path, $value);

    expect(pdsFirstError($this, $section, $payload))->toBe($expected);
})->with([
    'a child' => ['family', 'children.0.full_name', 'Baby 2', "The Child #1: full name may only have letters, spaces and . - ' , ( ) (no numbers). Write N/A if none."],
    'a reference contact' => ['references', 'references.0.telephone', 'none', 'The Reference #1: contact must be a phone number (for example 09171234567) or an email address.'],
]);

test('a blank optional box is fine, a blank required one still says required', function () {
    $payload = pdsSectionPayload('personal');
    $payload['umid_number'] = '';
    $payload['telephone'] = '';
    $payload['middle_name'] = '';
    $payload['name_ext'] = '';
    $payload['res_zipcode'] = '';
    pdsLimitPost($this, 'personal', $payload)->assertSessionHasNoErrors();

    $payload['philsys_number'] = '';
    pdsLimitPost($this, 'personal', $payload)->assertSessionHasErrors(['philsys_number' => 'PhilSys Card Number (PCN) is required.']);
});

test('the other family-member names get the name check, with N/A allowed', function (string $field) {
    $payload = ['spouse_surname' => 'Cruz', 'children' => []];
    $payload[$field] = 'R3yes';
    pdsLimitPost($this, 'family', $payload)->assertSessionHasErrors($field);

    $payload[$field] = 'N/A';
    pdsLimitPost($this, 'family', $payload)->assertSessionHasNoErrors();

    $payload[$field] = "O'Neil-Sy";
    pdsLimitPost($this, 'family', $payload)->assertSessionHasNoErrors();
})->with([
    'spouse_surname', 'spouse_first_name', 'spouse_middle_name', 'spouse_name_ext',
    'father_surname', 'father_first_name', 'father_middle_name', 'father_name_ext',
    'mother_surname', 'mother_first_name', 'mother_middle_name',
]);

test('the spouse telephone gets the telephone check, worded for the spouse', function () {
    expect(pdsFirstError($this, 'family', ['spouse_telephone' => 'call me']))
        ->toBe('Spouse telephone No. may only have numbers, spaces and ( ) + - . / for example (054) 123-4567, optionally followed by loc. 101. Write N/A if none.');

    pdsLimitPost($this, 'family', ['spouse_telephone' => '(054) 914-9970'])->assertSessionHasNoErrors();
    pdsLimitPost($this, 'family', ['spouse_telephone' => 'N/A'])->assertSessionHasNoErrors();
});

// The ZIP code is filled in from the chosen city and the box is read-only, so a value saved by the older free-text box
// ("N/A", a 5-digit code) must not stop the whole section from saving: the employee could not fix it.
test('an old stored zip code does not block saving the personal information', function (string $zip) {
    $payload = pdsSectionPayload('personal');
    $payload['res_zipcode'] = $zip;
    $payload['perm_zipcode'] = $zip;

    pdsLimitPost($this, 'personal', $payload)->assertSessionHasNoErrors();
})->with(['N/A', '44000', '4400-A', '4400']);

test('a reference name is checked like a person name', function () {
    $payload = pdsSectionPayload('references');
    $payload['references'][0]['name'] = 'Ana 2';

    pdsLimitPost($this, 'references', $payload)->assertSessionHasErrors('references.0.name');
});
