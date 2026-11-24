<?php

// The memo form's boxes stop typing at the same length the server enforces. The browser copy is a hand-kept list, so this
// fails the moment the two disagree (a limit changed on one side only). Modelled on tests/Feature/Pds/PdsLimitsParityTest.php.

function memoClientLimitsFile(): string
{
    $file = base_path('resources/js/lib/memo-limits.ts');
    expect(file_exists($file))->toBeTrue('resources/js/lib/memo-limits.ts does not exist');

    return file_get_contents($file);
}

test('the browser text limits match config/memos.php, box for box', function () {
    preg_match_all('/^\s*([a-z_]+):\s*(\d+),?\s*$/m', memoClientLimitsFile(), $found);
    $client = array_map('intval', array_combine($found[1], $found[2]));
    $server = config('memos.limits');
    ksort($client);
    ksort($server);

    expect($client)->toBe($server)->and(array_keys($server))->toBe(['withdraw_reason']);
});

test('the browser file size and file type limits match config/memos.php', function () {
    $file = memoClientLimitsFile();

    expect($file)->toContain('MEMO_FILE_MAX_MB = '.intdiv(config('memos.file.max_kb'), 1024).';')
        ->toContain("MEMO_FILE_EXTENSIONS = ['".implode("', '", config('memos.file.mimes'))."'];");
});

test('nothing about writing a memo or signatories is left in the limits', function () {
    expect(config('memos'))->not->toHaveKeys(['max_signatories', 'signature', 'letterhead', 'types'])
        ->and(memoClientLimitsFile())->not->toContain('SIGNATOR')->not->toContain('body');
});
