<?php

use App\Support\PdsRules;

// The form's instant messages come from resources/js/lib/pds-formats.ts, the server's refusal from PdsRules. Both must
// accept and refuse the same values, so the ID table and the patterns are compared here (the examples themselves are
// shared through tests/Fixtures/pds-formats.json).

function pdsFormatsSource(): string
{
    $file = base_path('resources/js/lib/pds-formats.ts');
    expect(file_exists($file))->toBeTrue('resources/js/lib/pds-formats.ts does not exist');

    return file_get_contents($file);
}

test('the browser ID table matches the server table', function () {
    preg_match_all("/(\w+_number): \{ label: '([^']*)', digits: \[([\d, ]+)\], example: '([^']*)' \}/", pdsFormatsSource(), $found, PREG_SET_ORDER);

    $client = [];
    foreach ($found as [, $field, $label, $digits, $example]) {
        $client[$field] = [$label, array_map('intval', explode(',', $digits)), $example];
    }

    expect($client)->toBe(PdsRules::ID_FORMATS);
});

test('the browser patterns match the server patterns', function () {
    preg_match_all('/^\s+(\w+): String\.raw`([^`]*)`,$/m', pdsFormatsSource(), $found);

    expect(array_combine($found[1], $found[2]))->toBe(PdsRules::PATTERNS);
});
