<?php

use App\Models\Memo;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

// What employees can see of memos: the list, one memo, and its file. Drafts and withdrawn memos stay hidden from them.

/** A published memo whose file is stored. */
function publishedWithFile(array $attributes = [], string $extension = 'pdf', ?string $content = null, string $name = 'Memo.pdf'): Memo
{
    return attachMemoFile(Memo::factory()->published()->create($attributes), $extension, $content, $name);
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
    Memo::factory()->published()->create(['file_path' => 'memos/1/file/a.pdf']);

    $this->actingAs($employee)->get('/memos')->assertInertia(fn (Assert $page) => $page
        ->has('memos.data', 15)
        ->where('memos.total', 18)
        ->has('memos.data.0', fn (Assert $row) => $row
            ->hasAll(['id', 'subject', 'memo_date'])));
});

test('the show page sends the memo and the file address', function () {
    $employee = memoAdmin('employee');
    $memo = publishedWithFile(['subject' => 'Declaration of Laguna'], name: 'Circular 7.pdf');

    $this->actingAs($employee)->get("/memos/{$memo->id}")->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('Memos/Show')
        ->where('memo', [
            'id' => $memo->id,
            'subject' => 'Declaration of Laguna',
            'memo_date' => $memo->memo_date->toDateString(),
            'file_name' => 'Circular 7.pdf',
            'has_file' => true,
        ])
        ->where('file_url', "/memos/{$memo->id}/file")
        ->missing('signatories'));
});

test('a published memo without a stored file has no file address', function () {
    $memo = Memo::factory()->published()->create();

    $this->actingAs(memoAdmin('employee'))->get("/memos/{$memo->id}")->assertInertia(fn (Assert $page) => $page
        ->where('memo.has_file', false)
        ->where('file_url', null));
});

test('an employee gets 404 for a draft or a withdrawn memo, on the page and on the file route', function () {
    $employee = memoAdmin('employee');
    $draft = attachMemoFile(Memo::factory()->create());
    $withdrawn = attachMemoFile(Memo::factory()->withdrawn()->create());
    $deleted = publishedWithFile();
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
    $memo = publishedWithFile();
    $unapproved = unapprovedEmployee();

    foreach (['/memos', "/memos/{$memo->id}", "/memos/{$memo->id}/file"] as $url) {
        $this->actingAs($unapproved)->get($url)->assertForbidden();
    }
});

test('a guest is sent to login on every memo route', function () {
    $memo = publishedWithFile();

    foreach (['/memos', "/memos/{$memo->id}", "/memos/{$memo->id}/file", "/admin/memos/{$memo->id}/file"] as $url) {
        $this->get($url)->assertRedirect('/login');
    }
});

test('admins and superadmins see every memo on the admin file route', function () {
    $draft = attachMemoFile(Memo::factory()->create());
    $published = publishedWithFile();
    $withdrawn = attachMemoFile(Memo::factory()->withdrawn()->create());

    foreach (['admin', 'superadmin'] as $role) {
        $user = memoAdmin($role);
        foreach ([$draft, $published, $withdrawn] as $memo) {
            $this->actingAs($user)->get("/admin/memos/{$memo->id}/file")->assertOk();
        }
    }
});

test('the admin file route refuses employees, a memo with no file, and a deleted memo', function () {
    $admin = memoAdmin();
    $published = publishedWithFile();
    $noFile = Memo::factory()->create();
    $deleted = publishedWithFile();
    $deleted->delete();

    $this->actingAs(memoAdmin('employee'))->get("/admin/memos/{$published->id}/file")->assertForbidden();
    $this->actingAs($admin)->get("/admin/memos/{$noFile->id}/file")->assertNotFound();
    $this->actingAs($admin)->get("/admin/memos/{$deleted->id}/file")->assertNotFound();
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
        $memo = publishedWithFile([], $extension, "bytes-of-{$extension}", $name);

        $response = $this->actingAs($employee)->get("/memos/{$memo->id}/file")->assertOk();

        expect($response->headers->get('Content-Type'))->toStartWith($type)
            ->and($response->headers->get('Content-Disposition'))->toStartWith($disposition)->toContain($name)
            ->and($response->headers->get('X-Content-Type-Options'))->toBe('nosniff')
            ->and($response->streamedContent())->toBe("bytes-of-{$extension}");
    }
});

test('a stored file of an unknown kind is only ever offered as a download', function () {
    $memo = publishedWithFile([], 'html', '<script>alert(1)</script>', 'trick.html');

    $response = $this->actingAs(memoAdmin('employee'))->get("/memos/{$memo->id}/file")->assertOk();

    expect($response->headers->get('Content-Type'))->toStartWith('application/octet-stream')
        ->and($response->headers->get('Content-Disposition'))->toStartWith('attachment');
});

test('the file route ignores any path in the query and serves only what the memo row says', function () {
    $employee = memoAdmin('employee');
    $memo = publishedWithFile();
    $other = publishedWithFile();
    Illuminate\Support\Facades\Storage::disk('local')->put('memos/secret/other.pdf', 'someone else');

    foreach (['memos/secret/other.pdf', "memos/{$other->id}/file/stored.pdf", '../../.env', 'path=/etc/passwd'] as $path) {
        $response = $this->actingAs($employee)->get("/memos/{$memo->id}/file?path=".urlencode($path).'&file='.urlencode($path))->assertOk();

        expect($response->streamedContent())->toBe("bytes-of-memo-{$memo->id}");
    }
});

test('a memo row that points outside its own folder is never served', function () {
    $employee = memoAdmin('employee');
    $other = publishedWithFile();
    $memo = Memo::factory()->published()->create();
    Illuminate\Support\Facades\Storage::disk('local')->put('memos/secret/other.pdf', 'someone else');

    foreach ([
        $other->file_path,
        'memos/secret/other.pdf',
        "memos/{$memo->id}/signatures/0.png",
        "memos/{$memo->id}/file/../../secret/other.pdf",
    ] as $path) {
        $memo->update(['file_path' => $path, 'file_name' => 'x.pdf']);

        $this->actingAs($employee)->get("/memos/{$memo->id}/file")->assertNotFound();
        $this->actingAs(memoAdmin())->get("/admin/memos/{$memo->id}/file")->assertNotFound();
    }
});

test('a missing stored file is a plain 404', function () {
    $memo = Memo::factory()->published()->create(['file_path' => 'memos/56/file/gone.pdf', 'file_name' => 'gone.pdf']);

    $this->actingAs(memoAdmin('employee'))->get("/memos/{$memo->id}/file")->assertNotFound();
});
