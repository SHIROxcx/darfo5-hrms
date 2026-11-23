<?php

use App\Models\PdsChild;
use App\Models\PdsGovernmentId;
use App\Models\PdsWorkExperience;
use App\Services\PdsPdfService;

function renderPds($user = null, bool $preview = false): string
{
    return app(PdsPdfService::class)->buildHtml($user ?? pdsUser(), $preview);
}

/** The HTML of one printed page (1-4); the head of the document is part 0. */
function pdsPageHtml(string $html, int $page): string
{
    return explode('<div class="page"', $html)[$page] ?? '';
}

test('renders four pages for a user with no PDS data', function () {
    $html = renderPds();

    expect(substr_count($html, 'CS FORM 212 (Revised 2026)'))->toBe(4)
        ->and($html)->toContain('Page 1 of 4')
        ->and($html)->toContain('Page 2 of 4')
        ->and($html)->toContain('Page 3 of 4')
        ->and($html)->toContain('Page 4 of 4')
        ->and($html)->toContain('N/A');
});

test('the view can be rendered more than once in one process', function () {
    $user = pdsUser();

    expect(renderPds($user))->toBe(renderPds($user));
});

test('the on-screen page outline appears only in preview mode', function () {
    expect(renderPds(null, true))->toContain('id="pds-preview-outline"')
        ->and(renderPds())->not->toContain('id="pds-preview-outline"');
});

test('page 1 uses the 2026 signature caption', function () {
    $page = pdsPageHtml(renderPds(), 1);

    expect($page)->toContain('(e-signature/digital certificate)')
        ->and($page)->not->toContain('wet signature');
});

test('page 1 prints the signature date as dd/mm/yyyy', function () {
    $user = pdsUser();
    PdsGovernmentId::create(['user_id' => $user->id, 'date_accomplished' => '2026-03-05']);

    $page = pdsPageHtml(renderPds($user), 1);

    expect($page)->toContain('05/03/2026')
        ->and($page)->not->toContain('March 5, 2026');
});

test('page 1 prints thirteen children rows', function () {
    expect(substr_count(pdsPageHtml(renderPds(), 1), 'data-row="child"'))->toBe(13);
});

test('each of thirteen children is printed once and in order', function () {
    $user = pdsUser();
    foreach (range(1, 13) as $n) {
        PdsChild::create(['user_id' => $user->id, 'full_name' => sprintf('Child %02d', $n), 'sort_order' => $n]);
    }

    $page = pdsPageHtml(renderPds($user), 1);

    $positions = [];
    foreach (range(1, 13) as $n) {
        $name = sprintf('CHILD %02d', $n);
        expect(substr_count($page, $name))->toBe(1);
        $positions[] = strpos($page, $name);
    }
    expect($positions)->toBe(collect($positions)->sort()->values()->all());
});

test('page 2 prints seven eligibility rows and twenty-four work experience rows', function () {
    $page = pdsPageHtml(renderPds(), 2);

    expect(substr_count($page, 'data-row="eligibility"'))->toBe(7)
        ->and(substr_count($page, 'data-row="work-experience"'))->toBe(24);
});

test('page 2 prints the monthly salary with the peso prefix and the grade-step as stored', function () {
    $user = pdsUser();
    PdsWorkExperience::create([
        'user_id' => $user->id, 'position_title' => 'Agriculturist I',
        'monthly_salary' => '21877.5', 'salary_grade' => '24-2', 'sort_order' => 0,
    ]);

    expect(pdsPageHtml(renderPds($user), 2))->toContain('P21,877.50')->toContain('24-2');
});

test('page 2 prints Present for a job that is still held', function () {
    $user = pdsUser();
    PdsWorkExperience::create([
        'user_id' => $user->id, 'position_title' => 'Agriculturist I',
        'date_from' => '2020-01-01', 'is_present' => true, 'sort_order' => 0,
    ]);

    expect(pdsPageHtml(renderPds($user), 2))->toContain('01/01/2020')->toContain('Present');
});

test('page 2 prints user text escaped', function () {
    $user = pdsUser();
    PdsWorkExperience::create(['user_id' => $user->id, 'position_title' => '<b>x</b>', 'sort_order' => 0]);

    $page = pdsPageHtml(renderPds($user), 2);

    expect($page)->toContain('&lt;b&gt;x&lt;/b&gt;')
        ->and($page)->not->toContain('<b>x</b>');
});

test('page 2 uses the 2026 signature caption', function () {
    $page = pdsPageHtml(renderPds(), 2);

    expect($page)->toContain('(e-signature/digital certificate)')
        ->and($page)->not->toContain('wet signature');
});

test('page 3 puts L&D first as item 29 and Voluntary Work second as item 30', function () {
    expect(pdsPageHtml(renderPds(), 3))
        ->toMatch('/VI\. LEARNING.*?<p>29\.<\/p>.*?VII\. VOLUNTARY.*?<p>30\.<\/p>/s');
});

test('page 3 prints seventeen L&D, nine voluntary work and seven other-information rows', function () {
    $page = pdsPageHtml(renderPds(), 3);

    expect(substr_count($page, 'data-row="learning-development"'))->toBe(17)
        ->and(substr_count($page, 'data-row="voluntary-work"'))->toBe(9)
        ->and(substr_count($page, 'data-row="other-info"'))->toBe(7);
});

test('page 3 uses the 2026 signature caption', function () {
    $page = pdsPageHtml(renderPds(), 3);

    expect($page)->toContain('(e-signature/digital certificate)')
        ->and($page)->not->toContain('wet signature');
});

test('page 4 has no wet-signature wording and keeps the notary caption', function () {
    $page = pdsPageHtml(renderPds(), 4);

    expect($page)->not->toContain('wet signature')
        ->and($page)->toContain('(e-signature/digital certificate except for notary public)')
        ->and($page)->toContain('(e-signature/digital certificate)');
});

test('page 4 prints Date Accomplished and the date of issuance as dd/mm/yyyy', function () {
    $user = pdsUser();
    PdsGovernmentId::create([
        'user_id' => $user->id, 'date_accomplished' => '2026-03-05',
        'date_of_issuance' => '2020-12-31', 'place_of_issuance' => 'Manila',
    ]);

    $page = pdsPageHtml(renderPds($user), 4);

    expect($page)->toContain('05/03/2026')
        ->and($page)->toContain('31/12/2020 / Manila')
        ->and($page)->not->toContain('March 5, 2026');
});

test('page 4 prints three reference rows with the 2026 columns', function () {
    $page = pdsPageHtml(renderPds(), 4);

    expect(substr_count($page, 'data-row="reference"'))->toBe(3)
        ->and($page)->toContain('OFFICE / RESIDENTIAL ADDRESS')
        ->and($page)->toContain('CONTACT NO.');
});

test('page 4 still renders when the date of issuance is free text', function () {
    $user = pdsUser();
    PdsGovernmentId::create([
        'user_id' => $user->id, 'date_of_issuance' => '2020-01-01 (renewed)', 'place_of_issuance' => 'Manila',
    ]);

    expect(pdsPageHtml(renderPds($user), 4))->toContain('2020-01-01 (renewed) / Manila');
});

// Chrome runs this script before printing; the tests cannot execute it, so they only guard that it ships.
// Its behaviour is checked by rendering a worst-case record in Chrome (long text in every wrapping cell).
test('the document carries the fit-to-page safeguard for long text', function () {
    expect(renderPds())->toContain('id="pds-fit-to-page"')->toContain('.page');
});
