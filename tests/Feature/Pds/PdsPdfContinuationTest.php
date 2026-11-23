<?php

use App\Models\PdsChild;
use App\Models\PdsEducation;
use App\Models\PdsEligibility;
use App\Models\PdsOtherInfo;
use App\Models\PdsTraining;
use App\Models\PdsVoluntaryWork;
use App\Models\PdsWorkExperience;
use App\Services\PdsPdfService;

function seedPdsSection(string $section, int $userId, int $count): void
{
    if ($section === 'other') {
        PdsOtherInfo::create([
            'user_id' => $userId,
            'special_skills' => array_map(fn ($n) => "Skill $n", range(1, $count)),
        ]);

        return;
    }

    foreach (range(1, $count) as $n) {
        match ($section) {
            'work' => PdsWorkExperience::create(['user_id' => $userId, 'position_title' => "Position $n", 'sort_order' => $n]),
            'eligibility' => PdsEligibility::create(['user_id' => $userId, 'career_service' => "Eligibility $n", 'sort_order' => $n]),
            'learning' => PdsTraining::create(['user_id' => $userId, 'title' => "Training $n", 'sort_order' => $n]),
            'voluntary' => PdsVoluntaryWork::create(['user_id' => $userId, 'organization_name' => "Org $n", 'sort_order' => $n]),
            'children' => PdsChild::create(['user_id' => $userId, 'full_name' => "Child $n", 'sort_order' => $n]),
        };
    }
}

function renderSeeded(array $sections): string
{
    $user = pdsUser();
    foreach ($sections as $section => $count) {
        seedPdsSection($section, $user->id, $count);
    }

    return app(PdsPdfService::class)->buildHtml($user);
}

/** The HTML of one continuation sheet, from its opening tag to the next page or the end. */
function continuationSheetHtml(string $html, string $sheet, int $nth = 0): string
{
    $parts = explode('<div class="page" data-sheet="'.$sheet.'"', $html);
    $part = $parts[$nth + 1] ?? '';

    return explode('<div class="page"', $part)[0];
}

dataset('overflowing sections', [
    'work experience' => ['work', 'C6', 24, 'Position'],
    'eligibility' => ['eligibility', 'C9', 7, 'Eligibility'],
    'learning and development' => ['learning', 'C5', 17, 'Training'],
    'voluntary work' => ['voluntary', 'C10', 9, 'Org'],
    'children' => ['children', 'C7', 13, 'Child'],
    'other information' => ['other', 'C11', 7, 'Skill'],
]);

test('prints no continuation sheet at capacity', function (string $section, string $sheet, int $capacity) {
    $html = renderSeeded([$section => $capacity]);

    expect(substr_count($html, 'data-sheet="'.$sheet.'"'))->toBe(0);
})->with('overflowing sections');

test('prints one continuation sheet at capacity plus one, holding the extra row', function (string $section, string $sheet, int $capacity, string $marker) {
    $html = renderSeeded([$section => $capacity + 1]);

    $extra = $marker.' '.($capacity + 1);

    expect(substr_count($html, 'data-sheet="'.$sheet.'"'))->toBe(1)
        ->and(stripos(continuationSheetHtml($html, $sheet), $extra))->not->toBeFalse()
        ->and(stripos(pdsPageHtml($html, 1).pdsPageHtml($html, 2).pdsPageHtml($html, 3), $extra))->toBeFalse();
})->with('overflowing sections');

test('prints several sheets for a large record', function () {
    $html = renderSeeded(['work' => 24 + 34 + 1]);

    expect(substr_count($html, 'data-sheet="C6"'))->toBe(2)
        ->and(stripos(continuationSheetHtml($html, 'C6', 1), 'Position 59'))->not->toBeFalse();
});

test('extra education rows for one level go to C8', function () {
    $user = pdsUser();
    PdsEducation::create(['user_id' => $user->id, 'level' => 'College', 'school_name' => 'First College']);
    PdsEducation::create(['user_id' => $user->id, 'level' => 'College', 'school_name' => 'Second College']);

    $html = app(PdsPdfService::class)->buildHtml($user);

    expect(substr_count($html, 'data-sheet="C8"'))->toBe(1)
        ->and(pdsPageHtml($html, 1))->toContain('First College')->not->toContain('Second College')
        ->and(continuationSheetHtml($html, 'C8'))->toContain('Second College');
});

test('every sheet carries the footer but only the four main pages carry a page number', function () {
    $html = renderSeeded(['work' => 25]);

    expect(substr_count($html, 'CS FORM 212 (Revised 2026)'))->toBe(5)
        ->and(substr_count($html, 'Page 1 of 4'))->toBe(1)
        ->and(continuationSheetHtml($html, 'C6'))->not->toContain(' of 4');
});

test('continuation sheets follow the order C5 to C11', function () {
    $html = renderSeeded(['work' => 25, 'learning' => 18, 'voluntary' => 10]);

    expect(strpos($html, 'data-sheet="C5"'))->toBeLessThan(strpos($html, 'data-sheet="C6"'))
        ->and(strpos($html, 'data-sheet="C6"'))->toBeLessThan(strpos($html, 'data-sheet="C10"'));
});
