<?php

use App\Services\PdsPdfService;

// Wording the official CS Form 212 (Revised 2026) workbook prints, checked against the form the app produces.

function printedPds(int $page): string
{
    $html = app(PdsPdfService::class)->buildHtml(pdsUser());

    return explode('<div class="page"', $html)[$page] ?? '';
}

test('the Eligibility heading on page 2 is the one on the 2026 form', function () {
    $page = printedPds(2);

    expect($page)->toContain('CAREER SERVICE/ RA 1080 (BOARD/ BAR) UNDER SPECIAL LAWS/ CES/ CSEE')
        ->toContain("BARANGAY ELIGIBILITY / DRIVER'S LICENSE")
        ->not->toContain('ELIGIBILITIES FOR UNIFORMED');
});

test('question 40 is spelled as on the form', function () {
    $page = printedPds(4);

    expect($page)->toContain('(RA 7277, as amended)')->not->toContain('ammended');
});

test('the three "If YES" prompts under question 40 say "please specify", as on the form', function () {
    $page = printedPds(4);

    expect(substr_count($page, 'If YES, please specify:'))->toBe(1)
        ->and(substr_count($page, 'If YES, please specify ID No:'))->toBe(2);
});
