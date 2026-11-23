<?php

use App\Models\Memo;
use App\Services\MemoPdfService;
use App\Support\MemoFiles;

// The printed memo. Headless Chrome does not run in tests, so these check the page the PDF is made from (buildHtml).

/** A published memo with signatory rows, ready to print. */
function printableMemo(array $attributes = [], array $rows = []): Memo
{
    $memo = Memo::factory()->published()->create(array_merge([
        'type' => 'Memorandum Circular',
        'series_year' => 2026,
        'number' => 58,
        'subject' => 'Declaration of Laguna as Avian Influenza Free Province',
        'addressed_to' => 'All DA RFO 5 Employees',
        'memo_date' => '2026-11-09',
        'memo_time' => '14:30:00',
        'body' => 'WHEREAS, the province has recorded nineteen cases.',
    ], $attributes));

    foreach ($rows as $order => $row) {
        $memo->signatories()->create(array_merge(['signatory_id' => makeSignatory()->id, 'sort_order' => $order], $row));
    }

    return $memo->load('signatories');
}

function printedHtml(Memo $memo, bool $preview = false): string
{
    return app(MemoPdfService::class)->buildHtml($memo, $preview);
}

test('prints the letterhead, the title, the number and series, and TO, SUBJECT and DATE with the time', function () {
    $html = printedHtml(printableMemo());

    expect($html)
        ->toContain('Republic of the Philippines')
        ->toContain('DEPARTMENT OF AGRICULTURE')
        ->toContain('REGIONAL FIELD OFFICE 5')
        ->toContain('MEMORANDUM CIRCULAR')
        ->toContain('No. 58')
        ->toContain('Series of 2026')
        ->toContain('TO:')
        ->toContain('All DA RFO 5 Employees')
        ->toContain('SUBJECT:')
        ->toContain('Declaration of Laguna as Avian Influenza Free Province')
        ->toContain('DATE:')
        ->toContain('November 9, 2026, 2:30 PM');
});

test('a plain memorandum has its own title and leaves the time out when there is none', function () {
    $html = printedHtml(printableMemo(['type' => 'Memorandum', 'memo_time' => null]));

    expect($html)->toContain('MEMORANDUM')
        ->not->toContain('MEMORANDUM CIRCULAR')
        ->toContain('November 9, 2026')
        ->not->toContain('November 9, 2026,');
});

test('the address and contact lines of the letterhead print only when they are set', function () {
    expect(printedHtml(printableMemo()))->not->toContain('San Agustin, Pili');

    config(['memos.letterhead.address' => 'San Agustin, Pili, Camarines Sur', 'memos.letterhead.contact' => '(054) 477-0000']);
    $html = printedHtml(printableMemo(['number' => 59]));

    expect($html)->toContain('San Agustin, Pili, Camarines Sur')->toContain('(054) 477-0000');
});

test('keeps the body line breaks and prints HTML as text', function () {
    $html = printedHtml(printableMemo(['body' => "First line\nSecond line\n\nNew <b>paragraph</b> <script>alert(1)</script>"]));

    expect($html)->toContain('First line<br />')
        ->toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
        ->toContain('&lt;b&gt;paragraph&lt;/b&gt;')
        ->not->toContain('<script>alert')
        ->and(substr_count($html, 'class="para"'))->toBe(2);
});

test('a very long unbroken word gets a wrap rule so it cannot run off the page', function () {
    $html = printedHtml(printableMemo(['body' => str_repeat('A', 400)]));

    expect($html)->toContain('overflow-wrap')->toContain(str_repeat('A', 400));
});

test('a paragraph with a very long unbroken word is left-aligned so its other words are not stretched apart', function () {
    $html = printedHtml(printableMemo(['body' => 'A link was shared: https://example.test/'.str_repeat('abcdef', 40)."\n\nAn ordinary paragraph of normal words."]));

    expect($html)->toContain('class="para ragged"')
        ->and(substr_count($html, 'class="para"'))->toBe(1);
});

test('prints the signatories in order with the name in capitals, the position, the label and the picture only when there is one', function () {
    MemoFiles::disk()->put('memos/1/signatures/0.png', memoPng());
    $memo = printableMemo([], [
        ['name' => 'Maria Santos', 'position' => 'Regional Executive Director', 'label' => 'Approved by', 'signature_path' => 'memos/1/signatures/0.png'],
        ['name' => 'Juan Dela Cruz', 'position' => 'Chief, Administrative Division', 'label' => null],
    ]);

    $html = printedHtml($memo);

    expect(strpos($html, 'MARIA SANTOS'))->toBeInt()->toBeLessThan(strpos($html, 'JUAN DELA CRUZ'));
    expect($html)->toContain('Regional Executive Director')
        ->toContain('Chief, Administrative Division')
        ->toContain('Approved by')
        ->and(substr_count($html, 'class="signature"'))->toBe(1);
});

test('the circular prints the "Done this" line and the plain memorandum does not', function () {
    expect(printedHtml(printableMemo()))->toContain('Done this 9th day of November, 2026.');
    expect(printedHtml(printableMemo(['type' => 'Memorandum', 'number' => 60])))->not->toContain('Done this');
});

test('the DRAFT watermark appears only in a preview', function () {
    $memo = printableMemo();

    expect(printedHtml($memo, preview: false))->not->toContain('class="watermark"');
    expect(printedHtml($memo, preview: true))->toContain('class="watermark"')->toContain('DRAFT');
});

test('an unnumbered draft shows blanks for the number and series', function () {
    $draft = Memo::factory()->create(['type' => 'Memorandum', 'subject' => 'Draft only', 'memo_date' => '2026-11-09']);

    expect(printedHtml($draft, preview: true))->toContain('No. ____')->toContain('Series of ____');
});

test('a draft preview shows the saved list as it is now, but a published memo shows the rows copied into it', function () {
    $signatory = makeSignatory(['name' => 'Maria Santos', 'position' => 'Regional Executive Director']);

    $draft = Memo::factory()->create();
    $draft->signatories()->create(['signatory_id' => $signatory->id, 'sort_order' => 0, 'name' => 'Maria Santos', 'position' => 'Regional Executive Director']);

    $published = printableMemo();
    $published->signatories()->create(['signatory_id' => $signatory->id, 'sort_order' => 0, 'name' => 'Maria Santos', 'position' => 'Regional Executive Director']);

    $signatory->update(['name' => 'Maria Reyes-Santos', 'position' => 'Assistant Regional Director']);

    expect(printedHtml($draft->fresh('signatories'), preview: true))->toContain('MARIA REYES-SANTOS')->toContain('Assistant Regional Director');
    expect(printedHtml($published->fresh('signatories')))->toContain('MARIA SANTOS')->toContain('Regional Executive Director')->not->toContain('REYES-SANTOS');
});

test('the page footer counts the pages', function () {
    $footer = app(MemoPdfService::class)->footerHtml();

    expect($footer)->toContain('class="pageNumber"')->toContain('class="totalPages"')->toContain('Page');
});

test('the file name says what the memo is', function () {
    $service = app(MemoPdfService::class);

    expect($service->filenameFor(printableMemo()))->toBe('Memorandum-Circular-No-58-S2026.pdf');
    expect($service->filenameFor(printableMemo(['type' => 'Memorandum', 'number' => 3])))->toBe('Memorandum-No-3-S2026.pdf');

    $draft = Memo::factory()->create();
    expect($service->filenameFor($draft))->toBe("Memo-draft-{$draft->id}.pdf");
});

test('the preview route streams a watermarked PDF for a draft, and the stored final copy for a published memo', function () {
    $admin = memoAdmin();
    $this->partialMock(MemoPdfService::class, fn ($mock) => $mock->shouldReceive('buildPdf')
        ->once()
        ->withArgs(fn ($memo, $preview) => $preview === true)
        ->andReturn('%PDF-draft'));

    $draft = Memo::factory()->create();
    $response = $this->actingAs($admin)->get("/admin/memos/{$draft->id}/preview")->assertOk();
    expect($response->headers->get('Content-Type'))->toBe('application/pdf')
        ->and($response->getContent())->toBe('%PDF-draft')
        ->and($response->headers->get('Content-Disposition'))->toContain('inline');

    MemoFiles::disk()->put('memos/9/final.pdf', '%PDF-final');
    $published = Memo::factory()->published()->create(['final_pdf_path' => 'memos/9/final.pdf']);
    $this->actingAs($admin)->get("/admin/memos/{$published->id}/preview")->assertOk()->assertSee('%PDF-final', false);
});

test('the preview route refuses an uploaded memo, a published memo without a final copy, employees and guests', function () {
    $admin = memoAdmin();

    $uploaded = Memo::factory()->uploaded()->create();
    $this->actingAs($admin)->get("/admin/memos/{$uploaded->id}/preview")->assertNotFound();

    $noCopy = Memo::factory()->published()->create(['final_pdf_path' => null]);
    $this->actingAs($admin)->get("/admin/memos/{$noCopy->id}/preview")->assertNotFound();

    $this->actingAs(memoAdmin('employee'))->get("/admin/memos/{$noCopy->id}/preview")->assertForbidden();
    auth()->forgetGuards();
    $this->get("/admin/memos/{$noCopy->id}/preview")->assertRedirect('/login');
});
