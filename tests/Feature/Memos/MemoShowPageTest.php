<?php

use App\Models\Memo;
use App\Services\MemoPdfService;
use App\Services\MemoService;
use App\Support\MemoFiles;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

// The admin page for one memo: the memo as saved, its history, and what the admin may do with it.

beforeEach(function () {
    Notification::fake();
    $this->partialMock(MemoPdfService::class, fn ($mock) => $mock->shouldReceive('buildPdf')->andReturn('%PDF-test'));
});

afterEach(fn () => Carbon::setTestNow());

test("the page's props carry the memo, its signatories and its events newest first with plain-word labels", function () {
    $admin = memoAdmin();
    $service = app(MemoService::class);
    Carbon::setTestNow(Carbon::parse('2026-06-15 10:00:00', 'UTC'));

    $memo = writtenDraft();
    Carbon::setTestNow(Carbon::parse('2026-06-15 10:05:00', 'UTC'));
    $service->saveDraft(memoPayload(['subject' => 'A better subject', 'memo_date' => '2026-12-01']), null, $admin, $memo);
    Carbon::setTestNow(Carbon::parse('2026-06-15 10:10:00', 'UTC'));
    $service->publish($memo, $admin);
    Carbon::setTestNow(Carbon::parse('2026-06-15 10:15:00', 'UTC'));
    $service->withdraw($memo, $admin, 'Wrong date printed.');
    Carbon::setTestNow(Carbon::parse('2026-06-15 10:20:00', 'UTC'));
    $service->restore($memo, $admin);

    $this->actingAs($admin)->get("/admin/memos/{$memo->id}")->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('Admin/Memos/Show')
        ->where('memo.id', $memo->id)
        ->where('memo.status', 'published')
        ->where('memo.type', 'Memorandum')
        ->where('memo.number_label', 'No. 1, Series of 2026')
        ->where('memo.subject', 'A better subject')
        ->where('memo.addressed_to', 'All DA RFO 5 Employees')
        ->where('memo.memo_date', '2026-12-01')
        ->where('memo.memo_time', '14:30')
        ->where('memo.mode', 'written')
        ->where('memo.body', "Please submit your IPCR on or before November 30.\n\nThank you.")
        ->where('memo.reference', null)
        ->where('memo.published_by_name', $admin->name)
        ->where('memo.withdrawn_reason', null)
        ->where('memo.has_file', true)
        ->where('signatories', [['label' => 'Approved by', 'name' => 'Maria Santos', 'position' => 'Regional Executive Director', 'has_signature' => false]])
        ->where('events', fn ($events) => $events->pluck('label')->all() === [
            'Restored',
            'Withdrawn: Wrong date printed.',
            'Published as No. 1, Series of 2026',
            'Edited: subject, date',
            'Draft created',
        ])
        ->where('events.0.user_name', $admin->name)
        ->where('events.1.details', ['reason' => 'Wrong date printed.'])
        ->where('events.3.details', ['changed' => ['subject', 'memo_date']])
        ->where('events.0.created_at', '2026-06-15T10:20:00+00:00'));
});

test('an event sends only what the timeline shows', function () {
    $admin = memoAdmin();
    $memo = writtenDraft();

    $this->actingAs($admin)->get("/admin/memos/{$memo->id}")->assertInertia(fn (Assert $page) => $page
        ->has('events', 1)
        ->has('events.0', fn (Assert $event) => $event->hasAll(['id', 'action', 'label', 'user_name', 'created_at', 'details'])));
});

test('events that happened at the same moment keep their order, newest first', function () {
    $admin = memoAdmin();
    Carbon::setTestNow(Carbon::parse('2026-06-15 10:00:00', 'UTC'));
    $memo = writtenDraft();
    app(MemoService::class)->publish($memo, $admin);
    app(MemoService::class)->withdraw($memo, $admin, 'Mistake.');

    $this->actingAs($admin)->get("/admin/memos/{$memo->id}")->assertInertia(fn (Assert $page) => $page
        ->where('events', fn ($events) => $events->pluck('action')->all() === ['withdrawn', 'published', 'created']));
});

test('a draft shows its signatories as the saved list is now, and a published memo shows its own copies', function () {
    $admin = memoAdmin();
    $signatory = makeSignatory(['name' => 'Maria Santos', 'position' => 'Regional Executive Director']);
    MemoFiles::disk()->put('memos/signatories/'.$signatory->id.'/signature.png', memoPng());
    $draft = writtenDraft([], $signatory);
    $published = app(MemoService::class)->publish(writtenDraft([], $signatory), $admin);

    $signatory->update(['name' => 'Maria Reyes-Santos', 'position' => 'Assistant Regional Director', 'signature_path' => 'memos/signatories/'.$signatory->id.'/signature.png']);

    $this->actingAs($admin)->get("/admin/memos/{$draft->id}")->assertInertia(fn (Assert $page) => $page
        ->where('signatories', [['label' => 'Approved by', 'name' => 'Maria Reyes-Santos', 'position' => 'Assistant Regional Director', 'has_signature' => true]]));

    $this->actingAs($admin)->get("/admin/memos/{$published->id}")->assertInertia(fn (Assert $page) => $page
        ->where('signatories', [['label' => 'Approved by', 'name' => 'Maria Santos', 'position' => 'Regional Executive Director', 'has_signature' => false]]));
});

test('a withdrawn memo shows its reason and who published it', function () {
    $admin = memoAdmin();
    $memo = app(MemoService::class)->publish(writtenDraft(), $admin);
    app(MemoService::class)->withdraw($memo, $admin, 'Issued by mistake.');

    $this->actingAs($admin)->get("/admin/memos/{$memo->id}")->assertInertia(fn (Assert $page) => $page
        ->where('memo.status', 'withdrawn')
        ->where('memo.withdrawn_reason', 'Issued by mistake.')
        ->where('memo.published_by_name', $admin->name));
});

test('has_file is true for an uploaded file and a published written memo, and false for a written draft', function () {
    $admin = memoAdmin();
    $uploaded = Memo::factory()->uploaded()->create();
    MemoFiles::disk()->put($uploaded->file_path, '%PDF-up');
    $uploaded->update(['file_path' => "memos/{$uploaded->id}/file/stored.pdf"]);
    MemoFiles::disk()->put($uploaded->file_path, '%PDF-up');

    $draft = writtenDraft();
    $published = app(MemoService::class)->publish(writtenDraft(), $admin);

    foreach ([[$uploaded, true], [$draft, false], [$published, true]] as [$memo, $expected]) {
        $this->actingAs($admin)->get("/admin/memos/{$memo->id}")->assertInertia(fn (Assert $page) => $page->where('memo.has_file', $expected));
    }
    $this->actingAs($admin)->get("/admin/memos/{$uploaded->id}")->assertInertia(fn (Assert $page) => $page
        ->where('memo.mode', 'uploaded')->where('memo.file_name', 'memo.pdf')->where('memo.body', null));
});

test('can follows the status and the role', function () {
    $draft = Memo::factory()->create();
    $published = Memo::factory()->published()->create();
    $withdrawn = Memo::factory()->withdrawn()->create();
    $expected = [
        [$draft, ['edit' => true, 'publish' => true, 'withdraw' => false, 'restore' => false, 'delete' => true]],
        [$published, ['edit' => false, 'publish' => false, 'withdraw' => true, 'restore' => false, 'delete' => false]],
        [$withdrawn, ['edit' => false, 'publish' => false, 'withdraw' => false, 'restore' => true, 'delete' => false]],
    ];

    foreach (['admin', 'superadmin'] as $role) {
        $user = memoAdmin($role);
        foreach ($expected as [$memo, $can]) {
            $this->actingAs($user)->get("/admin/memos/{$memo->id}")->assertOk()->assertInertia(fn (Assert $page) => $page->where('can', $can));
        }
    }
});

test('an unknown or trashed memo is 404, and a guest or an employee is refused', function () {
    $memo = Memo::factory()->create();
    $trashed = Memo::factory()->create();
    $trashed->delete();
    $admin = memoAdmin();

    $this->actingAs($admin)->get('/admin/memos/999999')->assertNotFound();
    $this->actingAs($admin)->get("/admin/memos/{$trashed->id}")->assertNotFound();
    $this->actingAs(memoAdmin('employee'))->get("/admin/memos/{$memo->id}")->assertForbidden();

    auth()->forgetGuards();
    $this->get("/admin/memos/{$memo->id}")->assertRedirect('/login');
});

test('the fixed memo paths still win over the memo page', function () {
    $admin = memoAdmin();

    $this->actingAs($admin)->get('/admin/memos/create')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/Memos/Create'));
    $this->actingAs($admin)->get('/admin/memos/signatories')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/Memos/Signatories/Index'));
});

test('publishing from the page sends the admin to the published memo', function () {
    $admin = memoAdmin();
    $draft = writtenDraft();

    $this->actingAs($admin)->post("/admin/memos/{$draft->id}/publish")->assertRedirect("/admin/memos/{$draft->id}");
});
