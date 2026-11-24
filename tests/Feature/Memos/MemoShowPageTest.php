<?php

use App\Models\Memo;
use App\Services\MemoService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

// The admin page for one memo: the memo as saved, its history, and what the admin may do with it.

beforeEach(fn () => Notification::fake());

afterEach(fn () => Carbon::setTestNow());

test("the page's props carry the memo and its events newest first with plain-word labels", function () {
    $admin = memoAdmin();
    $service = app(MemoService::class);
    Carbon::setTestNow(Carbon::parse('2026-06-15 10:00:00', 'UTC'));

    $memo = uploadedDraft(by: $admin);
    Carbon::setTestNow(Carbon::parse('2026-06-15 10:05:00', 'UTC'));
    $service->saveDraft(memoUpload('A better title.pdf'), $admin, $memo);
    Carbon::setTestNow(Carbon::parse('2026-06-15 10:10:00', 'UTC'));
    $service->publish($memo, $admin);
    Carbon::setTestNow(Carbon::parse('2026-06-15 10:15:00', 'UTC'));
    $service->withdraw($memo, $admin, 'Wrong file attached.');
    Carbon::setTestNow(Carbon::parse('2026-06-15 10:20:00', 'UTC'));
    $service->restore($memo, $admin);

    $this->actingAs($admin)->get("/admin/memos/{$memo->id}")->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('Admin/Memos/Show')
        ->where('memo', [
            'id' => $memo->id,
            'status' => 'published',
            'subject' => 'A better title',
            'memo_date' => '2026-06-15',
            'file_name' => 'A better title.pdf',
            'has_file' => true,
            'published_at' => '2026-06-15T10:10:00+00:00',
            'published_by_name' => $admin->name,
            'withdrawn_reason' => null,
        ])
        ->where('events', fn ($events) => $events->pluck('label')->all() === [
            'Restored',
            'Withdrawn: Wrong file attached.',
            'Published',
            'Edited: subject, file',
            'Draft created',
        ])
        ->where('events.0.user_name', $admin->name)
        ->where('events.1.details', ['reason' => 'Wrong file attached.'])
        ->where('events.3.details', ['changed' => ['subject', 'file']])
        ->where('events.0.created_at', '2026-06-15T10:20:00+00:00')
        ->missing('signatories'));
});

test('an event sends only what the timeline shows', function () {
    $admin = memoAdmin();
    $memo = uploadedDraft(by: $admin);

    $this->actingAs($admin)->get("/admin/memos/{$memo->id}")->assertInertia(fn (Assert $page) => $page
        ->has('events', 1)
        ->has('events.0', fn (Assert $event) => $event->hasAll(['id', 'action', 'label', 'user_name', 'created_at', 'details'])));
});

test('events that happened at the same moment keep their order, newest first', function () {
    $admin = memoAdmin();
    Carbon::setTestNow(Carbon::parse('2026-06-15 10:00:00', 'UTC'));
    $memo = uploadedDraft(by: $admin);
    app(MemoService::class)->publish($memo, $admin);
    app(MemoService::class)->withdraw($memo, $admin, 'Mistake.');

    $this->actingAs($admin)->get("/admin/memos/{$memo->id}")->assertInertia(fn (Assert $page) => $page
        ->where('events', fn ($events) => $events->pluck('action')->all() === ['withdrawn', 'published', 'created']));
});

test('a withdrawn memo shows its reason and who published it', function () {
    $admin = memoAdmin();
    $memo = app(MemoService::class)->publish(uploadedDraft(by: $admin), $admin);
    app(MemoService::class)->withdraw($memo, $admin, 'Issued by mistake.');

    $this->actingAs($admin)->get("/admin/memos/{$memo->id}")->assertInertia(fn (Assert $page) => $page
        ->where('memo.status', 'withdrawn')
        ->where('memo.withdrawn_reason', 'Issued by mistake.')
        ->where('memo.published_by_name', $admin->name));
});

test('has_file is true when the file is stored and false for a draft that has none', function () {
    $admin = memoAdmin();
    $withFile = uploadedDraft(by: $admin);
    $without = Memo::factory()->create();
    $missing = Memo::factory()->create(['file_path' => 'memos/77/file/gone.pdf', 'file_name' => 'gone.pdf']);

    foreach ([[$withFile, true], [$without, false], [$missing, false]] as [$memo, $expected]) {
        $this->actingAs($admin)->get("/admin/memos/{$memo->id}")->assertInertia(fn (Assert $page) => $page->where('memo.has_file', $expected));
    }
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

test('an unknown or trashed memo is 404', function () {
    $trashed = Memo::factory()->create();
    $trashed->delete();
    $admin = memoAdmin();

    $this->actingAs($admin)->get('/admin/memos/999999')->assertNotFound();
    $this->actingAs($admin)->get("/admin/memos/{$trashed->id}")->assertNotFound();
});

test('the fixed memo paths still win over the memo page', function () {
    $this->actingAs(memoAdmin())->get('/admin/memos/create')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/Memos/Create'));
});

test('publishing from the page sends the admin to the published memo', function () {
    $admin = memoAdmin();
    $draft = uploadedDraft(by: $admin);

    $this->actingAs($admin)->post("/admin/memos/{$draft->id}/publish")->assertRedirect("/admin/memos/{$draft->id}");
});
