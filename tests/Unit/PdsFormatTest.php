<?php

use App\Support\PdsFormat;
use Carbon\Carbon;

test('text prints N/A for empty values', function ($value) {
    expect(PdsFormat::text($value))->toBe('N/A');
})->with([null, '', '   ']);

test('text returns the trimmed string', function () {
    expect(PdsFormat::text('  Maria '))->toBe('Maria');
});

test('date formats a date string as dd/mm/yyyy', function () {
    expect(PdsFormat::date('2026-03-05'))->toBe('05/03/2026');
});

test('date formats a date object as dd/mm/yyyy', function () {
    expect(PdsFormat::date(Carbon::parse('2026-03-05')))->toBe('05/03/2026');
});

test('date prints N/A for empty values', function ($value) {
    expect(PdsFormat::date($value))->toBe('N/A');
})->with([null, '']);

test('date leaves a plain year unchanged', function () {
    expect(PdsFormat::date('1996'))->toBe('1996');
});

test('money prints a peso prefix and thousands separators', function () {
    expect(PdsFormat::money('21877.5'))->toBe('P21,877.50');
});

test('money prints N/A when empty or not a number', function ($value) {
    expect(PdsFormat::money($value))->toBe('N/A');
})->with([null, '', 'abc']);

test('checkbox shows a check mark only when checked', function () {
    expect((string) PdsFormat::checkbox(true))->toContain('✓')
        ->and((string) PdsFormat::checkbox(false))->not->toContain('✓');
});

// date_of_issuance is a free-text field: anything that is not exactly a calendar date must print as typed, never throw.
test('date prints free text that merely starts like a date exactly as typed', function (string $text) {
    expect(PdsFormat::date($text))->toBe($text);
})->with(['2020-01-01 (renewed)', '2020-01-01 to 2025', '2020-02-30', '2020-13-01', '12/31/2020', 'March 5, 2026']);

test('date formats a date with a time part as dd/mm/yyyy', function (string $text) {
    expect(PdsFormat::date($text))->toBe('05/03/2026');
})->with(['2026-03-05 00:00:00', '2026-03-05T00:00:00.000000Z', '2026-03-05T08:30:00+08:00']);
