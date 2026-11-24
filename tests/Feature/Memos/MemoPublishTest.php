<?php

use App\Models\Memo;
use App\Models\RecordEvent;
use App\Models\User;
use App\Notifications\MemoPublishedNotification;
use App\Services\MemoNotifier;
use App\Services\MemoService;
use App\Support\MemoFiles;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

// Publishing, withdrawing and restoring an uploaded memo.

beforeEach(fn () => Notification::fake());

afterEach(fn () => Carbon::setTestNow());

/** The error messages a failed publish gives, keyed by the field they belong to. */
function publishErrors(Memo $memo, User $by): array
{
    try {
        app(MemoService::class)->publish($memo, $by);
    } catch (ValidationException $e) {
        return $e->errors();
    }

    return [];
}

function httpStatusOf(Closure $action): ?int
{
    try {
        $action();
    } catch (HttpException $e) {
        return $e->getStatusCode();
    }

    return null;
}

test('publishing needs the memo file, and the message says so', function () {
    $admin = memoAdmin();
    $noFile = Memo::factory()->create();
    $goneFile = Memo::factory()->create(['file_path' => 'memos/77/file/missing.pdf', 'file_name' => 'missing.pdf']);

    foreach ([$noFile, $goneFile] as $memo) {
        $errors = publishErrors($memo, $admin);

        expect($errors)->toHaveKey('file')->and($errors['file'][0])->toContain('Upload the memo file');
        expect($memo->fresh()->status)->toBe(Memo::STATUS_DRAFT);
    }

    Notification::assertNothingSent();
});

test('publish makes the memo published, records who and when, and leaves its title and file alone', function () {
    $admin = memoAdmin();
    $draft = uploadedDraft(by: $admin);

    $published = app(MemoService::class)->publish($draft, $admin);

    expect($published->status)->toBe(Memo::STATUS_PUBLISHED)
        ->and($published->published_by)->toBe($admin->id)
        ->and($published->published_at)->not->toBeNull()
        ->and($published->subject)->toBe($draft->subject)
        ->and($published->file_path)->toBe($draft->file_path);

    $event = RecordEvent::for($published)->where('action', 'published')->first();
    expect($event)->not->toBeNull()->and($event->user_id)->toBe($admin->id);
});

test("a memo is dated with the day it is published, in the office's time zone", function () {
    $admin = memoAdmin();
    Carbon::setTestNow(Carbon::parse('2026-12-01 08:00:00', 'UTC'));
    $draft = uploadedDraft(by: $admin);
    // 20:00 UTC on 4 December is already 5 December, 04:00, in Manila.
    Carbon::setTestNow(Carbon::parse('2026-12-04 20:00:00', 'UTC'));

    $published = app(MemoService::class)->publish($draft, $admin);

    expect($draft->memo_date->toDateString())->toBe('2026-12-01')
        ->and($published->memo_date->toDateString())->toBe('2026-12-05');
});

test('publish tells the employees once the memo is published, and not the publisher', function () {
    $admin = memoAdmin();
    $employee = memoAdmin('employee');

    $published = app(MemoService::class)->publish(uploadedDraft(by: $admin), $admin);

    Notification::assertSentTo($employee, MemoPublishedNotification::class, fn ($n) => $n->toDatabase($employee)['url'] === "/memos/{$published->id}");
    Notification::assertNotSentTo($admin, MemoPublishedNotification::class);
});

test('a failure while telling employees does not undo a publish that has been saved', function () {
    $this->mock(MemoNotifier::class, fn ($mock) => $mock->shouldReceive('publishedMemo')->andThrow(new RuntimeException('Mail server down')));

    $published = app(MemoService::class)->publish(uploadedDraft(), memoAdmin());

    expect($published->fresh()->status)->toBe(Memo::STATUS_PUBLISHED);
});

test('a published memo cannot be published, edited or deleted again', function () {
    $admin = memoAdmin();
    $published = app(MemoService::class)->publish(uploadedDraft(by: $admin), $admin);

    expect(httpStatusOf(fn () => app(MemoService::class)->publish($published, $admin)))->toBe(409);

    $this->actingAs($admin)->post("/admin/memos/{$published->id}/publish")->assertStatus(409);
    $this->actingAs($admin)->put("/admin/memos/{$published->id}", ['file' => memoUpload('Changed after publishing.pdf')])->assertForbidden();
    $this->actingAs($admin)->delete("/admin/memos/{$published->id}")->assertForbidden();
    $this->actingAs($admin)->get("/admin/memos/{$published->id}/edit")->assertForbidden();

    $withdrawn = Memo::factory()->withdrawn()->create();
    $this->actingAs($admin)->post("/admin/memos/{$withdrawn->id}/publish")->assertStatus(409);
    $this->actingAs($admin)->delete("/admin/memos/{$withdrawn->id}")->assertForbidden();

    expect($published->fresh()->subject)->not->toBe('Changed after publishing');
});

test('the publish route publishes a draft, says so, and goes to the memo page', function () {
    $admin = memoAdmin();
    $draft = uploadedDraft(by: $admin);

    $this->actingAs($admin)->post("/admin/memos/{$draft->id}/publish")
        ->assertRedirect("/admin/memos/{$draft->id}")
        ->assertSessionHas('success');

    expect($draft->fresh()->status)->toBe(Memo::STATUS_PUBLISHED);

    $noFile = Memo::factory()->create();
    $this->actingAs($admin)->post("/admin/memos/{$noFile->id}/publish")->assertSessionHasErrors('file');
    expect($noFile->fresh()->status)->toBe(Memo::STATUS_DRAFT);
});

test('saving or deleting a draft that was published a moment ago is refused and changes nothing', function () {
    $admin = memoAdmin();
    $service = app(MemoService::class);
    $draft = uploadedDraft(by: $admin);
    // What a second admin's request loaded while the memo was still a draft.
    $stale = Memo::find($draft->id);
    $published = $service->publish($draft, $admin);

    $saveErrors = [];
    try {
        $service->saveDraft(memoUpload('Changed after publishing.pdf'), $admin, $stale);
    } catch (ValidationException $e) {
        $saveErrors = $e->errors();
    }

    $deleteErrors = [];
    try {
        $service->deleteDraft($stale, $admin);
    } catch (ValidationException $e) {
        $deleteErrors = $e->errors();
    }

    expect($saveErrors)->toHaveKey('form')
        ->and($saveErrors['form'][0])->toContain('no longer a draft')
        ->and($deleteErrors)->toHaveKey('memo')
        ->and($deleteErrors['memo'][0])->toContain('no longer a draft');

    $after = Memo::find($draft->id);
    expect($after)->not->toBeNull()
        ->and($after->subject)->toBe($published->subject)
        ->and($after->file_name)->toBe('Memorandum Circular 58.pdf')
        ->and($after->status)->toBe(Memo::STATUS_PUBLISHED)
        ->and(MemoFiles::disk()->exists($published->file_path))->toBeTrue()
        ->and(RecordEvent::for($draft)->where('action', 'deleted')->exists())->toBeFalse()
        ->and(RecordEvent::for($draft)->where('action', 'updated')->exists())->toBeFalse();
});

test('withdraw needs a reason, hides the memo, removes its bell rows and records withdrawn', function () {
    $admin = memoAdmin();
    $employee = memoAdmin('employee');
    $memo = Memo::factory()->published()->create();
    $other = Memo::factory()->published()->create();
    foreach ([$memo, $other] as $published) {
        // The bell row the notifier stores when a memo is published.
        $employee->notifications()->create([
            'id' => (string) Illuminate\Support\Str::uuid(),
            'type' => MemoPublishedNotification::class,
            'data' => ['message' => "New memo: {$published->subject}", 'url' => "/memos/{$published->id}"],
        ]);
    }

    foreach (['', '   ', str_repeat('x', 256)] as $bad) {
        $this->actingAs($admin)->post("/admin/memos/{$memo->id}/withdraw", ['reason' => $bad])->assertSessionHasErrors('reason');
    }
    $this->actingAs($admin)->post("/admin/memos/{$memo->id}/withdraw", ['reason' => ['not', 'text']])->assertSessionHasErrors('reason');
    expect($memo->fresh()->status)->toBe(Memo::STATUS_PUBLISHED);

    $this->actingAs($admin)->post("/admin/memos/{$memo->id}/withdraw", ['reason' => '  Wrong date printed.  '])
        ->assertRedirect()
        ->assertSessionHas('success');

    $memo->refresh();
    expect($memo->status)->toBe(Memo::STATUS_WITHDRAWN)
        ->and($memo->withdrawn_reason)->toBe('Wrong date printed.')
        ->and(Memo::visibleTo($employee)->whereKey($memo->id)->exists())->toBeFalse()
        ->and(Memo::visibleTo($admin)->whereKey($memo->id)->exists())->toBeTrue();

    $urls = $employee->notifications()->get()->pluck('data.url')->all();
    expect($urls)->not->toContain("/memos/{$memo->id}")->toContain("/memos/{$other->id}");

    $event = RecordEvent::for($memo)->where('action', 'withdrawn')->first();
    expect($event->details)->toBe(['reason' => 'Wrong date printed.'])->and($event->user_id)->toBe($admin->id);
});

test('only a published memo can be withdrawn', function () {
    $admin = memoAdmin();

    foreach ([Memo::factory()->create(), Memo::factory()->withdrawn()->create()] as $memo) {
        $this->actingAs($admin)->post("/admin/memos/{$memo->id}/withdraw", ['reason' => 'Mistake.'])->assertStatus(409);
    }
});

test('restore brings a withdrawn memo back without notifying again', function () {
    $admin = memoAdmin();
    $memo = Memo::factory()->withdrawn()->create();

    $this->actingAs($admin)->post("/admin/memos/{$memo->id}/restore")->assertRedirect()->assertSessionHas('success');

    $memo->refresh();
    expect($memo->status)->toBe(Memo::STATUS_PUBLISHED)
        ->and($memo->withdrawn_reason)->toBeNull()
        ->and(Memo::visibleTo(memoAdmin('employee'))->whereKey($memo->id)->exists())->toBeTrue()
        ->and(RecordEvent::for($memo)->where('action', 'restored')->where('user_id', $admin->id)->exists())->toBeTrue();
    Notification::assertNothingSent();
});

test('only a withdrawn memo can be restored', function () {
    $admin = memoAdmin();

    foreach ([Memo::factory()->create(), Memo::factory()->published()->create()] as $memo) {
        $this->actingAs($admin)->post("/admin/memos/{$memo->id}/restore")->assertStatus(409);
    }
});

test('guests are sent to log in and employees are refused on publish, withdraw and restore', function () {
    $memo = Memo::factory()->create();
    $routes = [
        ['post', "/admin/memos/{$memo->id}/publish", []],
        ['post', "/admin/memos/{$memo->id}/withdraw", ['reason' => 'x']],
        ['post', "/admin/memos/{$memo->id}/restore", []],
    ];

    foreach ($routes as [$method, $url, $data]) {
        $this->actingAs(memoAdmin('employee'))->{$method}($url, $data)->assertForbidden();
    }

    auth()->forgetGuards();
    foreach ($routes as [$method, $url, $data]) {
        $this->{$method}($url, $data)->assertRedirect('/login');
    }

    expect($memo->fresh()->status)->toBe(Memo::STATUS_DRAFT);
});
