<?php

use App\Models\Memo;
use App\Models\RecordEvent;
use App\Models\Signatory;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

// Saving, changing and deleting a memo draft. (The pages arrive in the next task; these tests use the routes only.)

test('a guest is sent to login and an employee is refused on every memo route', function () {
    $memo = Memo::factory()->create();
    $routes = [['post', '/admin/memos'], ['put', "/admin/memos/{$memo->id}"], ['delete', "/admin/memos/{$memo->id}"]];

    foreach ($routes as [$method, $uri]) {
        $this->{$method}($uri)->assertRedirect('/login');
    }

    $employee = memoAdmin('employee');
    foreach ($routes as [$method, $uri]) {
        $this->actingAs($employee)->{$method}($uri, memoPayload())->assertForbidden();
    }
});

test('an admin saves a written draft with its signatories in the order given, and the history says "created"', function () {
    $admin = memoAdmin();
    $first = makeSignatory(['name' => 'Maria Santos', 'position' => 'Regional Executive Director']);
    $second = makeSignatory(['name' => 'Juan Dela Cruz', 'position' => 'Chief, Administrative Division']);

    $this->actingAs($admin)->post('/admin/memos', memoPayload([
        'signatories' => [
            ['signatory_id' => $second->id, 'label' => 'Prepared by'],
            ['signatory_id' => $first->id, 'label' => ''],
        ],
    ]))->assertSessionHasNoErrors();

    $memo = Memo::firstOrFail();
    expect($memo->status)->toBe('draft')
        ->and($memo->mode)->toBe('written')
        ->and($memo->type)->toBe('Memorandum')
        ->and($memo->subject)->toBe('Submission of IPCR for the first semester')
        ->and($memo->memo_date->toDateString())->toBe('2026-11-21')
        ->and($memo->memo_time)->toBe('14:30:00')
        ->and($memo->created_by)->toBe($admin->id)
        ->and($memo->number)->toBeNull();

    $rows = $memo->signatories;
    expect($rows->pluck('name')->all())->toBe(['Juan Dela Cruz', 'Maria Santos'])
        ->and($rows->pluck('position')->all())->toBe(['Chief, Administrative Division', 'Regional Executive Director'])
        ->and($rows->pluck('label')->all())->toBe(['Prepared by', null]);

    $event = RecordEvent::for($memo)->first();
    expect($event->action)->toBe('created')->and($event->user_id)->toBe($admin->id);
});

test('a blank "addressed to" gets the default', function () {
    $this->actingAs(memoAdmin())->post('/admin/memos', memoPayload(['addressed_to' => '']))->assertSessionHasNoErrors();

    expect(Memo::firstOrFail()->addressed_to)->toBe('All DA RFO 5 Employees');
});

test('an uploaded memo needs its file and keeps it on the private disk', function () {
    $admin = memoAdmin();
    $payload = memoPayload(['mode' => 'uploaded', 'body' => 'ignored text']);

    $this->actingAs($admin)->post('/admin/memos', $payload)
        ->assertSessionHasErrors(['file' => 'Attach the memo file.']);
    expect(Memo::count())->toBe(0);

    $payload['file'] = UploadedFile::fake()->create('Memorandum Circular 58.pdf', 200, 'application/pdf');
    $this->actingAs($admin)->post('/admin/memos', $payload)->assertSessionHasNoErrors();

    $memo = Memo::firstOrFail();
    expect($memo->mode)->toBe('uploaded')
        ->and($memo->body)->toBeNull()
        ->and($memo->file_name)->toBe('Memorandum Circular 58.pdf')
        ->and($memo->file_path)->toStartWith("memos/{$memo->id}/file/");
    Storage::disk('local')->assertExists($memo->file_path);
    Storage::disk('public')->assertMissing($memo->file_path);
});

test('a file the server could not receive says so and names the real limit', function () {
    $this->actingAs(memoAdmin())->post('/admin/memos', memoPayload(['mode' => 'uploaded', 'file' => memoRefusedUpload()]))
        ->assertSessionHasErrors('file');

    expect(session('errors')->first('file'))->toContain('could not be uploaded')->toContain('MB each');
    expect(Memo::count())->toBe(0);
});

test('limits and formats are enforced with plain messages', function () {
    $admin = memoAdmin();
    $signatories = collect(range(1, 7))->map(fn () => makeSignatory());
    $active = $signatories->first();
    $inactive = makeSignatory(['is_active' => false]);

    $cases = [
        'subject too long' => [['subject' => str_repeat('S', 256)], ['subject' => 'Subject is too long (maximum 255 characters).']],
        'no subject' => [['subject' => ''], ['subject' => 'Subject is required.']],
        'body too long' => [['body' => str_repeat('b', 20001)], ['body' => 'The memo text is too long (maximum 20,000 characters).']],
        'no body when written' => [['body' => ''], ['body' => 'Write the memo, or switch to uploading a file.']],
        'addressed to too long' => [['addressed_to' => str_repeat('T', 151)], ['addressed_to' => 'The "addressed to" line is too long (maximum 150 characters).']],
        'reference too long' => [['reference' => str_repeat('R', 51)], ['reference' => 'The reference is too long (maximum 50 characters).']],
        'unknown type' => [['type' => 'Press Release'], ['type' => 'Choose a memo type from the list.']],
        'bad date' => [['memo_date' => '21/11/2026'], ['memo_date' => 'Date must be a valid date.']],
        'no date' => [['memo_date' => ''], ['memo_date' => 'Date is required.']],
        'bad time' => [['memo_time' => '2:30 PM'], ['memo_time' => 'Time must look like 14:30.']],
        'unknown mode' => [['mode' => 'drawn'], ['mode' => 'Choose whether to write the memo or upload a file.']],
        'seven signatories' => [['signatories' => $signatories->map(fn ($s) => ['signatory_id' => $s->id])->all()], ['signatories' => 'A memo can have at most 6 signatories.']],
        'the same signatory twice' => [['signatories' => [['signatory_id' => $active->id], ['signatory_id' => $active->id]]], ['signatories.1.signatory_id' => 'The same signatory is listed twice.']],
        'an inactive signatory' => [['signatories' => [['signatory_id' => $inactive->id]]], ['signatories.0.signatory_id' => 'That signatory is not in the active list.']],
        'a label too long' => [['signatories' => [['signatory_id' => $active->id, 'label' => str_repeat('L', 41)]]], ['signatories.0.label' => 'A label can have at most 40 characters.']],
    ];

    foreach ($cases as [$override, $expected]) {
        $this->actingAs($admin)->post('/admin/memos', memoPayload($override))->assertSessionHasErrors($expected);
    }

    expect(Memo::count())->toBe(0);
});

test('a file over 10 MB or of the wrong kind is refused', function () {
    $admin = memoAdmin();

    $this->actingAs($admin)->post('/admin/memos', memoPayload(['mode' => 'uploaded', 'file' => UploadedFile::fake()->create('big.pdf', 10241, 'application/pdf')]))
        ->assertSessionHasErrors(['file' => 'The file must not be larger than 10 MB.']);
    $this->actingAs($admin)->post('/admin/memos', memoPayload(['mode' => 'uploaded', 'file' => UploadedFile::fake()->create('virus.exe', 10, 'application/x-msdownload')]))
        ->assertSessionHasErrors(['file' => 'The file must be a PDF, Word document or picture (pdf, doc, docx, jpg, png).']);

    expect(Memo::count())->toBe(0);
});

test('updating a draft records what changed and replaces its file', function () {
    $admin = memoAdmin();
    $payload = memoPayload(['mode' => 'uploaded', 'file' => UploadedFile::fake()->create('old.pdf', 50, 'application/pdf')]);
    $this->actingAs($admin)->post('/admin/memos', $payload);
    $memo = Memo::firstOrFail();
    $oldFile = $memo->file_path;

    $this->actingAs($admin)->put("/admin/memos/{$memo->id}", memoPayload([
        'mode' => 'uploaded',
        'subject' => 'Corrected subject',
        'file' => UploadedFile::fake()->create('new.pdf', 60, 'application/pdf'),
    ]))->assertSessionHasNoErrors();

    $memo->refresh();
    expect($memo->subject)->toBe('Corrected subject')->and($memo->file_name)->toBe('new.pdf');
    Storage::disk('local')->assertMissing($oldFile);
    Storage::disk('local')->assertExists($memo->file_path);

    $event = RecordEvent::for($memo)->first();
    expect($event->action)->toBe('updated')
        ->and($event->details['changed'])->toContain('subject')->toContain('file');
});

test('an update that changes nothing writes no history', function () {
    $admin = memoAdmin();
    $this->actingAs($admin)->post('/admin/memos', memoPayload());
    $memo = Memo::firstOrFail();

    $this->actingAs($admin)->put("/admin/memos/{$memo->id}", memoPayload())->assertSessionHasNoErrors();

    expect(RecordEvent::for($memo)->pluck('action')->all())->toBe(['created']);
});

test('switching a draft from an uploaded file to written text removes the file', function () {
    $admin = memoAdmin();
    $this->actingAs($admin)->post('/admin/memos', memoPayload(['mode' => 'uploaded', 'file' => UploadedFile::fake()->create('memo.pdf', 50, 'application/pdf')]));
    $memo = Memo::firstOrFail();
    $file = $memo->file_path;

    $this->actingAs($admin)->put("/admin/memos/{$memo->id}", memoPayload(['mode' => 'written']))->assertSessionHasNoErrors();

    $memo->refresh();
    expect($memo->mode)->toBe('written')->and($memo->file_path)->toBeNull()->and($memo->file_name)->toBeNull()
        ->and($memo->body)->toContain('IPCR');
    Storage::disk('local')->assertMissing($file);
});

test('only a draft can be updated or deleted', function () {
    $admin = memoAdmin();
    $published = Memo::factory()->published()->create();
    $withdrawn = Memo::factory()->withdrawn()->create();

    foreach ([$published, $withdrawn] as $memo) {
        $this->actingAs($admin)->put("/admin/memos/{$memo->id}", memoPayload())->assertForbidden();
        $this->actingAs($admin)->delete("/admin/memos/{$memo->id}")->assertForbidden();
        expect(Memo::find($memo->id))->not->toBeNull();
    }
});

test('deleting a draft hides it, removes its files and records "deleted"', function () {
    $admin = memoAdmin();
    $this->actingAs($admin)->post('/admin/memos', memoPayload(['mode' => 'uploaded', 'file' => UploadedFile::fake()->create('memo.pdf', 50, 'application/pdf')]));
    $memo = Memo::firstOrFail();
    $file = $memo->file_path;

    $this->actingAs($admin)->delete("/admin/memos/{$memo->id}")->assertRedirect('/admin/memos');

    expect(Memo::find($memo->id))->toBeNull()
        ->and(Memo::withTrashed()->find($memo->id)->trashed())->toBeTrue();
    Storage::disk('local')->assertMissing($file);
    expect(RecordEvent::for($memo)->first()->action)->toBe('deleted');
});

test('a draft only offers active signatories and keeps the signatory rows it was saved with', function () {
    $admin = memoAdmin();
    $signatory = makeSignatory(['name' => 'Maria Santos']);
    $this->actingAs($admin)->post('/admin/memos', memoPayload(['signatories' => [['signatory_id' => $signatory->id, 'label' => 'Approved by']]]));
    $memo = Memo::firstOrFail();

    // Deactivating or renaming the saved signatory later does not break or change the draft's own rows.
    $signatory->update(['name' => 'Someone Else', 'is_active' => false]);

    expect($memo->fresh()->signatories->first()->name)->toBe('Maria Santos')
        ->and(Signatory::find($signatory->id)->is_active)->toBeFalse();
});
