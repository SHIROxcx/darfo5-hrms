<?php

// The form boxes stop typing at the same length the server enforces. The browser copy is a hand-kept list, so this
// fails the moment the two disagree (a limit changed on one side, or a field added to one side only).

/** The key resources/js/lib/pds-limits.ts uses for a server field path. */
function pdsClientLimitKey(string $path): string
{
    $field = last(explode('.', $path));

    return match (true) {
        str_ends_with($path, '.0') => 'tag', // an other-information list item, e.g. special_skills.0
        str_starts_with($path, 'references.0.') => 'reference_'.$field,
        $path === 'children.0.full_name' => 'child_full_name',
        default => $field,
    };
}

function pdsClientLimits(): array
{
    $file = base_path('resources/js/lib/pds-limits.ts');
    expect(file_exists($file))->toBeTrue('resources/js/lib/pds-limits.ts does not exist');

    preg_match_all('/^\s*([a-z0-9_]+):\s*(\d+),?\s*$/m', file_get_contents($file), $found);

    return array_map('intval', array_combine($found[1], $found[2]));
}

test('the browser limits match the server limits, field for field', function () {
    $server = [];
    foreach (pdsTextLimits() as $fields) {
        foreach ($fields as $path => $max) {
            $key = pdsClientLimitKey($path);
            expect($server[$key] ?? $max)->toBe($max, "{$key} has two different server limits");
            $server[$key] = $max;
        }
    }

    $client = pdsClientLimits();
    ksort($server);
    ksort($client);

    expect($client)->toBe($server);
});
