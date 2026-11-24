<?php

use App\Models\Memo;
use App\Models\RecordEvent;
use App\Support\MemoFiles;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

// Saving a memo draft. A memo is only an uploaded file (a PDF, Word document or picture): its title is the file's name and
// its date is filled in by the system.

afterEach(fn () => Carbon::setTestNow());

test('a guest is sent to login and an employee is refused on every memo route', function () {
    $memo = Memo::factory()->create();
    $requests = [['post', '/admin/memos'], ['put', "/admin/memos/{$memo->id}"], ['delete', "/admin/memos/{$memo->id}"]];

    foreach ($requests as [$method, $uri]) {
        $this->{$method}($uri, ['file' => memoUpload()])->assertRedirect('/login');
    }

    $employee = memoAdmin('employee');
    foreach ($requests as [$method, $uri]) {
        $this->actingAs($employee)->{$method}($uri, ['file' => memoUpload()])->assertForbidden();
    }

    expect(Memo::count())->toBe(1);
});

test('an admin saves a draft with only a file: the title is its name, the date is today, and the history says "created"', function () {
    $admin = memoAdmin();

    $this->actingAs($admin)->post('/admin/memos', ['file' => memoUpload()])->assertSessionHasNoErrors();

    $memo = Memo::firstOrFail();
    expect($memo->status)->toBe(Memo::STATUS_DRAFT)
        ->and($memo->subject)->toBe('Memorandum Circular 58')
        ->and($memo->memo_date->toDateString())->toBe(now(config('memos.timezone'))->toDateString())
        ->and($memo->file_name)->toBe('Memorandum Circular 58.pdf')
        ->and($memo->created_by)->toBe($admin->id);

    $event = RecordEvent::for($memo)->first();
    expect($event->action)->toBe('created')->and($event->details)->toBe(['subject' => 'Memorandum Circular 58'])->and($event->user_id)->toBe($admin->id);
});

test('the date is the office date, not the UTC one', function () {
    // 20:00 UTC on 4 December is already 5 December, 04:00, in Manila.
    Carbon::setTestNow(Carbon::parse('2026-12-04 20:00:00', 'UTC'));

    $this->actingAs(memoAdmin())->post('/admin/memos', ['file' => memoUpload()])->assertSessionHasNoErrors();

    expect(Memo::firstOrFail()->memo_date->toDateString())->toBe('2026-12-05');
});

test('the title is made from the file name: underscores become spaces, long names are cut, a bare extension gets a plain title', function () {
    $admin = memoAdmin();
    $cases = [
        ['Memo_for__flag_ceremony.pdf', 'Memo for flag ceremony'],
        [str_repeat('L', 300).'.pdf', str_repeat('L', 255)],
        ['.pdf', 'Memo'],
        ['  spaced   out  .pdf', 'spaced out'],
    ];

    foreach ($cases as [$fileName, $title]) {
        $this->actingAs($admin)->post('/admin/memos', ['file' => memoUpload($fileName)])->assertSessionHasNoErrors();

        expect(Memo::latest('id')->firstOrFail()->subject)->toBe($title);
    }
});

test('a memo needs its file, and the file is kept on the private disk', function () {
    $admin = memoAdmin();

    $this->actingAs($admin)->post('/admin/memos', [])->assertSessionHasErrors(['file' => 'Attach the memo file.']);
    expect(Memo::count())->toBe(0);

    $this->actingAs($admin)->post('/admin/memos', ['file' => memoUpload('Memorandum Circular 58.pdf', 200)])->assertSessionHasNoErrors();

    $memo = Memo::firstOrFail();
    expect($memo->file_name)->toBe('Memorandum Circular 58.pdf')
        ->and($memo->file_path)->toStartWith("memos/{$memo->id}/file/");
    Storage::disk('local')->assertExists($memo->file_path);
    Storage::disk('public')->assertMissing($memo->file_path);
});

test('a file the server could not receive says so and names the real limit', function () {
    $this->actingAs(memoAdmin())->post('/admin/memos', ['file' => memoRefusedUpload()])->assertSessionHasErrors('file');

    expect(session('errors')->first('file'))->toContain('could not be uploaded')->toContain('MB each');
    expect(Memo::count())->toBe(0);
});

test('a file over 10 MB, of the wrong kind, or a list of files is refused', function () {
    $admin = memoAdmin();

    $this->actingAs($admin)->post('/admin/memos', ['file' => UploadedFile::fake()->create('big.pdf', 10241, 'application/pdf')])
        ->assertSessionHasErrors(['file' => 'The file must not be larger than 10 MB.']);
    $this->actingAs($admin)->post('/admin/memos', ['file' => UploadedFile::fake()->create('virus.exe', 10, 'application/x-msdownload')])
        ->assertSessionHasErrors(['file' => 'The file must be a PDF, Word document or picture (pdf, doc, docx, jpg, png).']);
    $this->actingAs($admin)->post('/admin/memos', ['file' => [memoUpload()]])->assertSessionHasErrors('file');

    expect(Memo::count())->toBe(0);
});

test('anything else sent with the file is ignored: not stored and not an error', function () {
    $this->actingAs(memoAdmin())->post('/admin/memos', [
        'file' => memoUpload(),
        'subject' => 'A subject nobody asked for',
        'memo_date' => '2020-01-01',
        'type' => 'Memorandum Circular',
        'reference' => 'MC No. 1',
        'mode' => 'written',
        'body' => 'Some text that is no longer part of a memo.',
        'signatories' => [['signatory_id' => 1, 'label' => 'Approved by']],
    ])->assertSessionHasNoErrors();

    $memo = Memo::firstOrFail();
    expect(Memo::count())->toBe(1)
        ->and($memo->subject)->toBe('Memorandum Circular 58')
        ->and($memo->memo_date->toDateString())->toBe(now(config('memos.timezone'))->toDateString())
        ->and($memo->getAttributes())->not->toHaveKeys(['body', 'mode', 'type', 'reference']);
});

test('replacing the file of a draft takes the new title, removes the old file and records what changed', function () {
    $admin = memoAdmin();
    $memo = uploadedDraft(by: $admin);
    $oldPath = $memo->file_path;

    $this->actingAs($admin)->put("/admin/memos/{$memo->id}", ['file' => memoUpload('Revised circular.pdf', 120)])->assertSessionHasNoErrors();

    $memo->refresh();
    expect($memo->subject)->toBe('Revised circular')
        ->and($memo->file_name)->toBe('Revised circular.pdf')
        ->and($memo->file_path)->not->toBe($oldPath);
    Storage::disk('local')->assertMissing($oldPath);
    Storage::disk('local')->assertExists($memo->file_path);

    $event = RecordEvent::for($memo)->where('action', 'updated')->firstOrFail();
    expect($event->details['changed'])->toEqualCanonicalizing(['subject', 'file'])->and($event->user_id)->toBe($admin->id);
});

test('a file with the same name changes only the file in the history', function () {
    $admin = memoAdmin();
    $memo = uploadedDraft(by: $admin);

    $this->actingAs($admin)->put("/admin/memos/{$memo->id}", ['file' => memoUpload('Memorandum Circular 58.pdf', 150)])->assertSessionHasNoErrors();

    expect(RecordEvent::for($memo)->where('action', 'updated')->firstOrFail()->details['changed'])->toBe(['file']);
});

test('an update needs a file, and without one nothing changes', function () {
    $admin = memoAdmin();
    $memo = uploadedDraft(by: $admin);
    $path = $memo->file_path;

    $this->actingAs($admin)->put("/admin/memos/{$memo->id}", [])->assertSessionHasErrors(['file' => 'Attach the memo file.']);

    expect($memo->fresh()->file_path)->toBe($path);
    Storage::disk('local')->assertExists($path);
    expect(RecordEvent::for($memo)->pluck('action')->all())->toBe(['created']);
});

test('only a draft can be updated or deleted', function () {
    $admin = memoAdmin();
    $published = Memo::factory()->published()->create();

    $this->actingAs($admin)->put("/admin/memos/{$published->id}", ['file' => memoUpload()])->assertForbidden();
    $this->actingAs($admin)->delete("/admin/memos/{$published->id}")->assertForbidden();

    expect($published->fresh()->trashed())->toBeFalse();
});

test('deleting a draft hides it, removes its file and records "deleted"', function () {
    $admin = memoAdmin();
    $memo = uploadedDraft(by: $admin);
    Storage::disk('local')->assertExists($memo->file_path);

    $this->actingAs($admin)->delete("/admin/memos/{$memo->id}")->assertRedirect('/admin/memos');

    expect(Memo::find($memo->id))->toBeNull()->and(Memo::withTrashed()->find($memo->id)->trashed())->toBeTrue();
    expect(MemoFiles::disk()->exists($memo->file_path))->toBeFalse();
    expect(RecordEvent::for($memo)->where('action', 'deleted')->exists())->toBeTrue();
});
