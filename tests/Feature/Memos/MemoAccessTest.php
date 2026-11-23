<?php

use App\Models\Memo;
use App\Models\User;
use App\Support\MemoFiles;
use Inertia\Testing\AssertableInertia as Assert;

// What employees can see of memos: the list, one memo, and its file. Drafts and withdrawn memos stay hidden from them.

/** A published written memo whose final PDF is stored. */
function memoWithPdf(array $attributes = []): Memo
{
    $memo = Memo::factory()->published()->create($attributes);
    MemoFiles::disk()->put("memos/{$memo->id}/final.pdf", "%PDF-final-{$memo->id}");
    $memo->update(['final_pdf_path' => "memos/{$memo->id}/final.pdf"]);

    return $memo->fresh();
}

/** A published memo that is a ready-made file, with its file stored. */
function memoWithUpload(string $extension, string $content, string $name, array $state = []): Memo
{
    $memo = Memo::factory()->published()->uploaded()->create($state);
    $path = "memos/{$memo->id}/file/stored.{$extension}";
    MemoFiles::disk()->put($path, $content);
    $memo->update(['file_path' => $path, 'file_name' => $name]);

    return $memo->fresh();
}

/** An account that is signed up and verified but not approved by HR. */
function unapprovedEmployee(): User
{
    memoAdmin(); // makes sure the three roles exist
    $user = User::factory()->create(['is_approved' => false]);
    $user->assignRole('employee');

    return $user;
}

test("an employee's list holds only published memos, newest first, with search and year filters", function () {
    $employee = memoAdmin('employee');
    $old = Memo::factory()->published()->create(['subject' => 'Leave rules for 2025', 'memo_date' => '2025-03-10']);
    $middle = Memo::factory()->published()->create(['subject' => 'Office hours in December', 'memo_date' => '2026-02-01']);
    $newest = Memo::factory()->published()->create(['subject' => 'Leave filing reminder', 'memo_date' => '2026-06-01']);
    Memo::factory()->create(['subject' => 'Secret draft', 'memo_date' => '2026-07-01']);
    Memo::factory()->withdrawn()->create(['subject' => 'Withdrawn memo', 'memo_date' => '2026-08-01']);

    $this->actingAs($employee)->get('/memos')->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('Memos/Index')
        ->where('memos.data', fn ($rows) => $rows->pluck('id')->all() === [$newest->id, $middle->id, $old->id])
        ->where('years', [2026, 2025])
        ->where('filters', ['search' => null, 'year' => null]));

    $this->actingAs($employee)->get('/memos?search=leave')->assertInertia(fn (Assert $page) => $page
        ->where('memos.data', fn ($rows) => $rows->pluck('id')->all() === [$newest->id, $old->id])
        ->where('filters.search', 'leave'));

    $this->actingAs($employee)->get('/memos?year=2025')->assertInertia(fn (Assert $page) => $page
        ->where('memos.data', fn ($rows) => $rows->pluck('id')->all() === [$old->id])
        ->where('filters.year', 2025));

    $this->actingAs($employee)->get('/memos?search=leave&year=2026')->assertInertia(fn (Assert $page) => $page
        ->where('memos.data', fn ($rows) => $rows->pluck('id')->all() === [$newest->id]));
});

test('a search with percent or underscore signs and a nonsense year are handled as plain text', function () {
    $employee = memoAdmin('employee');
    Memo::factory()->published()->create(['subject' => 'Plain subject']);
    Memo::factory()->published()->create(['subject' => '100% attendance_rule']);

    $this->actingAs($employee)->get('/memos?search=100%25')->assertInertia(fn (Assert $page) => $page->has('memos.data', 1));
    $this->actingAs($employee)->get('/memos?search=%25')->assertInertia(fn (Assert $page) => $page->has('memos.data', 1));
    $this->actingAs($employee)->get('/memos?year=abc')->assertOk()->assertInertia(fn (Assert $page) => $page->has('memos.data', 2)->where('filters.year', null));
    $this->actingAs($employee)->get('/memos?year[]=2026&search[]=x')->assertOk();
});

test('the list is paginated by 15 and sends only what the list shows', function () {
    $employee = memoAdmin('employee');
    Memo::factory()->published()->count(17)->create();
    Memo::factory()->published()->create(['memo_time' => '14:30:00', 'addressed_to' => 'All DA RFO 5 Employees', 'body' => 'Never in the list.']);

    $this->actingAs($employee)->get('/memos')->assertInertia(fn (Assert $page) => $page
        ->has('memos.data', 15)
        ->where('memos.total', 18)
        ->has('memos.data.0', fn (Assert $row) => $row
            ->hasAll(['id', 'type', 'number_label', 'subject', 'memo_date', 'memo_time', 'addressed_to'])));
});

test('the show page sends the memo and its signatories in order, and the file address', function () {
    $employee = memoAdmin('employee');
    $memo = memoWithPdf(['type' => 'Memorandum Circular', 'series_year' => 2026, 'number' => 7, 'subject' => 'Declaration of Laguna',
        'memo_time' => '14:30:00', 'body' => "First line\nSecond line\n\nNew paragraph"]);
    foreach ([['Regional Executive Director', 'Maria Santos', 'Approved by'], ['Chief, Administrative Division', 'Juan Dela Cruz', null]] as $order => [$position, $name, $label]) {
        $memo->signatories()->create(['signatory_id' => makeSignatory()->id, 'sort_order' => $order, 'label' => $label, 'name' => $name, 'position' => $position]);
    }

    $this->actingAs($employee)->get("/memos/{$memo->id}")->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('Memos/Show')
        ->where('memo.id', $memo->id)
        ->where('memo.type', 'Memorandum Circular')
        ->where('memo.number_label', 'No. 7, Series of 2026')
        ->where('memo.subject', 'Declaration of Laguna')
        ->where('memo.memo_time', '14:30')
        ->where('memo.mode', 'written')
        ->where('memo.body', "First line\nSecond line\n\nNew paragraph")
        ->where('memo.has_file', true)
        ->where('signatories', [
            ['label' => 'Approved by', 'name' => 'Maria Santos', 'position' => 'Regional Executive Director'],
            ['label' => null, 'name' => 'Juan Dela Cruz', 'position' => 'Chief, Administrative Division'],
        ])
        ->where('file_url', "/memos/{$memo->id}/file"));
});

test('an uploaded memo shows its file name and no body', function () {
    $employee = memoAdmin('employee');
    $memo = memoWithUpload('pdf', '%PDF-up', 'Quarterly Schedule.pdf');

    $this->actingAs($employee)->get("/memos/{$memo->id}")->assertInertia(fn (Assert $page) => $page
        ->where('memo.mode', 'uploaded')
        ->where('memo.body', null)
        ->where('memo.file_name', 'Quarterly Schedule.pdf')
        ->where('memo.has_file', true)
        ->where('file_url', "/memos/{$memo->id}/file"));
});

test('a published memo without a stored file has no file address', function () {
    $memo = Memo::factory()->published()->create(['final_pdf_path' => null]);

    $this->actingAs(memoAdmin('employee'))->get("/memos/{$memo->id}")->assertInertia(fn (Assert $page) => $page
        ->where('memo.has_file', false)
        ->where('file_url', null));
});

test('an employee gets 404 for a draft or a withdrawn memo, on the page and on the file route', function () {
    $employee = memoAdmin('employee');
    $draft = Memo::factory()->uploaded()->create();
    MemoFiles::disk()->put($draft->file_path, '%PDF-draft');
    $withdrawn = memoWithPdf();
    $withdrawn->update(['status' => Memo::STATUS_WITHDRAWN, 'withdrawn_reason' => 'Mistake.']);
    $deleted = memoWithPdf();
    $deleted->delete();

    foreach ([$draft, $withdrawn, $deleted] as $memo) {
        $this->actingAs($employee)->get("/memos/{$memo->id}")->assertNotFound();
        $this->actingAs($employee)->get("/memos/{$memo->id}/file")->assertNotFound();
    }
    $this->actingAs($employee)->get('/memos/999999')->assertNotFound();
    $this->actingAs($employee)->get('/memos/999999/file')->assertNotFound();
});

test('the employee pages show published memos to admins too, and nothing else', function () {
    $draft = Memo::factory()->create();
    $published = Memo::factory()->published()->create();

    foreach (['admin', 'superadmin'] as $role) {
        $user = memoAdmin($role);
        $this->actingAs($user)->get('/memos')->assertOk()->assertInertia(fn (Assert $page) => $page->where('memos.data', fn ($rows) => $rows->pluck('id')->all() === [$published->id]));
        $this->actingAs($user)->get("/memos/{$draft->id}")->assertNotFound();
        $this->actingAs($user)->get("/memos/{$published->id}")->assertOk();
    }
});

test('an unapproved account gets 403 on the list, the page and the file', function () {
    $memo = memoWithPdf();
    $unapproved = unapprovedEmployee();

    foreach (['/memos', "/memos/{$memo->id}", "/memos/{$memo->id}/file"] as $url) {
        $this->actingAs($unapproved)->get($url)->assertForbidden();
    }
});

test('a guest is sent to login on every memo route', function () {
    $memo = memoWithPdf();

    foreach (['/memos', "/memos/{$memo->id}", "/memos/{$memo->id}/file", "/admin/memos/{$memo->id}/file"] as $url) {
        $this->get($url)->assertRedirect('/login');
    }
});

test('admins and superadmins see every memo on the admin file route', function () {
    $draftUpload = memoWithUpload('pdf', '%PDF-draft-upload', 'Draft.pdf', ['status' => Memo::STATUS_DRAFT, 'published_at' => null]);
    $published = memoWithPdf();
    $withdrawn = memoWithPdf();
    $withdrawn->update(['status' => Memo::STATUS_WITHDRAWN, 'withdrawn_reason' => 'Mistake.']);

    foreach (['admin', 'superadmin'] as $role) {
        $user = memoAdmin($role);
        foreach ([$draftUpload, $published, $withdrawn] as $memo) {
            $this->actingAs($user)->get("/admin/memos/{$memo->id}/file")->assertOk();
        }
    }
});

test('the admin file route refuses employees, a draft that was written (use the preview), and a deleted memo', function () {
    $admin = memoAdmin();
    $published = memoWithPdf();
    $writtenDraft = Memo::factory()->create();
    $deleted = memoWithPdf();
    $deleted->delete();

    $this->actingAs(memoAdmin('employee'))->get("/admin/memos/{$published->id}/file")->assertForbidden();
    $this->actingAs($admin)->get("/admin/memos/{$writtenDraft->id}/file")->assertNotFound();
    $this->actingAs($admin)->get("/admin/memos/{$deleted->id}/file")->assertNotFound();
});

test('the file route serves the stored final PDF inline, with its type and nosniff', function () {
    $memo = memoWithPdf(['type' => 'Memorandum Circular', 'series_year' => 2026, 'number' => 58]);

    $response = $this->actingAs(memoAdmin('employee'))->get("/memos/{$memo->id}/file")->assertOk();

    expect($response->headers->get('Content-Type'))->toStartWith('application/pdf')
        ->and($response->headers->get('X-Content-Type-Options'))->toBe('nosniff')
        ->and($response->headers->get('Content-Disposition'))->toStartWith('inline')->toContain('Memorandum-Circular-No-58-S2026.pdf')
        ->and($response->streamedContent())->toBe("%PDF-final-{$memo->id}");
});

test('the file route serves an uploaded file with the right type and disposition for each kind', function () {
    $employee = memoAdmin('employee');
    $cases = [
        ['pdf', 'application/pdf', 'inline', 'Schedule.pdf'],
        ['png', 'image/png', 'inline', 'Poster.png'],
        ['jpg', 'image/jpeg', 'inline', 'Poster.jpg'],
        ['doc', 'application/msword', 'attachment', 'Form.doc'],
        ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'attachment', 'Form.docx'],
    ];

    foreach ($cases as [$extension, $type, $disposition, $name]) {
        $memo = memoWithUpload($extension, "bytes-of-{$extension}", $name);

        $response = $this->actingAs($employee)->get("/memos/{$memo->id}/file")->assertOk();

        expect($response->headers->get('Content-Type'))->toStartWith($type)
            ->and($response->headers->get('Content-Disposition'))->toStartWith($disposition)->toContain($name)
            ->and($response->headers->get('X-Content-Type-Options'))->toBe('nosniff')
            ->and($response->streamedContent())->toBe("bytes-of-{$extension}");
    }
});

test('a stored file of an unknown kind is only ever offered as a download', function () {
    $memo = memoWithUpload('html', '<script>alert(1)</script>', 'trick.html');

    $response = $this->actingAs(memoAdmin('employee'))->get("/memos/{$memo->id}/file")->assertOk();

    expect($response->headers->get('Content-Type'))->toStartWith('application/octet-stream')
        ->and($response->headers->get('Content-Disposition'))->toStartWith('attachment');
});

test('the file route ignores any path in the query and serves only what the memo row says', function () {
    $employee = memoAdmin('employee');
    $memo = memoWithPdf();
    $other = memoWithPdf();
    MemoFiles::disk()->put('memos/secret/other.pdf', 'someone else');

    foreach (['memos/secret/other.pdf', "memos/{$other->id}/final.pdf", '../../.env', 'path=/etc/passwd'] as $path) {
        $response = $this->actingAs($employee)->get("/memos/{$memo->id}/file?path=".urlencode($path).'&file='.urlencode($path))->assertOk();

        expect($response->streamedContent())->toBe("%PDF-final-{$memo->id}");
    }
});

test('no route serves a signature picture to an employee', function () {
    $employee = memoAdmin('employee');
    $signatory = makeSignatory();
    $memo = memoWithPdf();
    MemoFiles::disk()->put("memos/{$memo->id}/signatures/0.png", 'frozen picture');
    MemoFiles::disk()->put(MemoFiles::signatoryDir($signatory->id).'/pic.png', 'saved picture');
    $signatory->update(['signature_path' => MemoFiles::signatoryDir($signatory->id).'/pic.png']);

    // The saved picture's route belongs to HR only.
    $this->actingAs($employee)->get("/admin/memos/signatories/{$signatory->id}/signature")->assertForbidden();
    // There is no route to a memo's frozen copy, and asking for one by path still returns the memo's own PDF.
    $this->actingAs($employee)->get("/memos/{$memo->id}/signatures/0.png")->assertNotFound();
    $response = $this->actingAs($employee)->get("/memos/{$memo->id}/file?path=".urlencode("memos/{$memo->id}/signatures/0.png"))->assertOk();
    expect($response->streamedContent())->toBe("%PDF-final-{$memo->id}");
});

test('a memo row that points at a signature picture or outside its own folder is never served', function () {
    $employee = memoAdmin('employee');
    $memo = Memo::factory()->published()->uploaded()->create();
    MemoFiles::disk()->put("memos/{$memo->id}/signatures/0.png", 'frozen picture');
    MemoFiles::disk()->put('memos/signatories/3/pic.png', 'saved picture');

    foreach ([
        "memos/{$memo->id}/signatures/0.png",
        'memos/signatories/3/pic.png',
        "memos/{$memo->id}/file/../signatures/0.png",
    ] as $path) {
        $memo->update(['file_path' => $path, 'file_name' => 'x.png']);

        $this->actingAs($employee)->get("/memos/{$memo->id}/file")->assertNotFound();
        $this->actingAs(memoAdmin())->get("/admin/memos/{$memo->id}/file")->assertNotFound();
    }
});

test('a missing stored file is a plain 404', function () {
    $memo = Memo::factory()->published()->create(['final_pdf_path' => 'memos/55/final.pdf']);
    $upload = Memo::factory()->published()->uploaded()->create(['file_path' => 'memos/56/file/gone.pdf']);

    foreach ([$memo, $upload] as $row) {
        $this->actingAs(memoAdmin('employee'))->get("/memos/{$row->id}/file")->assertNotFound();
    }
});
