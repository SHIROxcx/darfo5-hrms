<?php

use App\Models\Memo;
use App\Models\RecordEvent;
use App\Models\User;
use App\Notifications\MemoPublishedNotification;
use App\Services\MemoNotifier;
use App\Services\MemoPdfService;
use App\Services\MemoService;
use App\Support\MemoFiles;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

// Publishing, withdrawing and restoring a memo. Headless Chrome does not run in tests, so the PDF is faked.

beforeEach(function () {
    Notification::fake();
    $this->partialMock(MemoPdfService::class, fn ($mock) => $mock->shouldReceive('buildPdf')->andReturn('%PDF-test'));
});

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

test('numbers run 1, 2, 3 per type and year, and another type or year starts again at 1', function () {
    $admin = memoAdmin();
    $service = app(MemoService::class);
    Carbon::setTestNow(Carbon::parse('2026-06-15 10:00:00', 'UTC'));

    $numbers = collect(range(1, 3))->map(fn () => $service->publish(writtenDraft(), $admin)->number)->all();
    $circular = $service->publish(writtenDraft(['type' => 'Memorandum Circular']), $admin);

    Carbon::setTestNow(Carbon::parse('2027-02-01 10:00:00', 'UTC'));
    $nextYear = $service->publish(writtenDraft(), $admin);

    expect($numbers)->toBe([1, 2, 3])
        ->and($circular->number)->toBe(1)->and($circular->series_year)->toBe(2026)
        ->and($nextYear->number)->toBe(1)->and($nextYear->series_year)->toBe(2027);

    Carbon::setTestNow();
});

test('a memo published at 16:30 UTC on 31 December belongs to the next Manila year', function () {
    $admin = memoAdmin();
    $service = app(MemoService::class);

    Carbon::setTestNow(Carbon::parse('2026-12-31 15:30:00', 'UTC')); // 23:30 in Manila: still 2026
    $before = $service->publish(writtenDraft(), $admin);

    Carbon::setTestNow(Carbon::parse('2026-12-31 16:30:00', 'UTC')); // 00:30 on 1 January in Manila
    $after = $service->publish(writtenDraft(), $admin);

    expect($before->series_year)->toBe(2026)->and($before->number)->toBe(1)
        ->and($after->series_year)->toBe(2027)->and($after->number)->toBe(1);

    Carbon::setTestNow();
});

test('a number collision is retried and the memo still ends up published with a unique number', function () {
    $admin = memoAdmin();
    $draft = writtenDraft();
    $attempts = 0;

    // Just as this memo is about to take its number, another memo takes the same one: a real unique-index collision.
    // (Both share this test's one connection, so the failed attempt rolls the rival back too; what is checked is the retry.)
    Memo::updating(function (Memo $memo) use (&$attempts) {
        if ($memo->isDirty('number') && $memo->number !== null && ++$attempts === 1) {
            DB::table('memos')->insert([
                'type' => $memo->type, 'series_year' => $memo->series_year, 'number' => $memo->number,
                'subject' => 'Published at the same moment', 'addressed_to' => 'All', 'memo_date' => '2026-11-21',
                'mode' => 'written', 'status' => 'published', 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
    });

    $published = app(MemoService::class)->publish($draft, $admin);
    Memo::flushEventListeners();

    $numbers = Memo::where('type', $published->type)->where('series_year', $published->series_year)->whereNotNull('number')->pluck('number');

    expect($attempts)->toBe(2)
        ->and($published->status)->toBe(Memo::STATUS_PUBLISHED)
        ->and($published->number)->not->toBeNull()
        ->and($numbers->unique()->count())->toBe($numbers->count());
});

test('a number that keeps colliding stops after three tries with a plain message and leaves the draft alone', function () {
    $admin = memoAdmin();
    $draft = writtenDraft();
    $tries = 0;

    Memo::updating(function (Memo $memo) use (&$tries) {
        if ($memo->isDirty('number') && $memo->number !== null) {
            $tries++;
            DB::table('memos')->insert([
                'type' => $memo->type, 'series_year' => $memo->series_year, 'number' => $memo->number,
                'subject' => 'Rival '.$tries, 'addressed_to' => 'All', 'memo_date' => '2026-11-21',
                'mode' => 'written', 'status' => 'published', 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
    });

    $errors = publishErrors($draft, $admin);
    Memo::flushEventListeners();

    expect($tries)->toBe(3)
        ->and($errors)->toHaveKey('publish')
        ->and($draft->fresh()->status)->toBe(Memo::STATUS_DRAFT)
        ->and($draft->fresh()->number)->toBeNull();
});

test('an uploaded memo is published without a number or a PDF', function () {
    $admin = memoAdmin();
    $this->partialMock(MemoPdfService::class, fn ($mock) => $mock->shouldNotReceive('buildPdf'));
    $memo = Memo::factory()->uploaded()->create(['reference' => 'DA-HR-2026-114', 'file_path' => 'memos/1/file/memo.pdf']);
    MemoFiles::disk()->put('memos/1/file/memo.pdf', '%PDF-uploaded');

    $published = app(MemoService::class)->publish($memo, $admin);

    expect($published->status)->toBe(Memo::STATUS_PUBLISHED)
        ->and($published->number)->toBeNull()
        ->and($published->series_year)->toBe(now(config('memos.timezone'))->year)
        ->and($published->reference)->toBe('DA-HR-2026-114')
        ->and($published->final_pdf_path)->toBeNull()
        ->and($published->published_by)->toBe($admin->id);
});

test('a written memo needs a body and a signatory, an uploaded one needs its file, and the message says which', function () {
    $admin = memoAdmin();

    $noBody = writtenDraft();
    $noBody->update(['body' => "  \n "]);
    expect(publishErrors($noBody, $admin))->toHaveKey('body')
        ->and(publishErrors($noBody, $admin)['body'][0])->toContain('memo text');

    $noSigner = Memo::factory()->create(['body' => 'Some text.']);
    expect(publishErrors($noSigner, $admin))->toHaveKey('signatories')
        ->and(publishErrors($noSigner, $admin)['signatories'][0])->toContain('at least one signatory');

    $noFile = Memo::factory()->uploaded()->create(['file_path' => null, 'file_name' => null]);
    expect(publishErrors($noFile, $admin))->toHaveKey('file')
        ->and(publishErrors($noFile, $admin)['file'][0])->toContain('Upload the memo file');

    $goneFile = Memo::factory()->uploaded()->create(['file_path' => 'memos/77/file/missing.pdf']);
    expect(publishErrors($goneFile, $admin))->toHaveKey('file');

    foreach ([$noBody, $noSigner, $noFile, $goneFile] as $memo) {
        expect($memo->fresh()->status)->toBe(Memo::STATUS_DRAFT)->and($memo->fresh()->number)->toBeNull();
    }
});

test('a signatory who was turned off after the draft was saved blocks publishing, and the message names them', function () {
    $signatory = makeSignatory(['name' => 'Maria Santos']);
    $draft = writtenDraft([], $signatory);
    $signatory->update(['is_active' => false]);

    $errors = publishErrors($draft, memoAdmin());

    expect($errors)->toHaveKey('signatories')
        ->and($errors['signatories'][0])->toContain('Maria Santos')
        ->and($draft->fresh()->status)->toBe(Memo::STATUS_DRAFT);
});

test('publishing copies the saved signatory as it is now, not as it was when the draft was saved', function () {
    $signatory = makeSignatory(['name' => 'Maria Santos', 'position' => 'Regional Executive Director']);
    $draft = writtenDraft([], $signatory);
    $signatory->update(['name' => 'Maria Reyes-Santos', 'position' => 'Assistant Regional Director']);

    $published = app(MemoService::class)->publish($draft, memoAdmin());
    $row = $published->signatories->first();

    expect($row->name)->toBe('Maria Reyes-Santos')
        ->and($row->position)->toBe('Assistant Regional Director')
        ->and($row->label)->toBe('Approved by');
});

test('publishing freezes the memo: renaming or deactivating the saved signatory and replacing its picture afterwards changes nothing', function () {
    $signatory = makeSignatory(['name' => 'Maria Santos', 'position' => 'Regional Executive Director']);
    $original = memoPng();
    MemoFiles::disk()->put('memos/signatories/'.$signatory->id.'/signature.png', $original);
    $signatory->update(['signature_path' => 'memos/signatories/'.$signatory->id.'/signature.png']);
    $draft = writtenDraft([], $signatory);

    $published = app(MemoService::class)->publish($draft, memoAdmin());
    $row = $published->signatories->first();
    $copy = "memos/{$published->id}/signatures/0.png";

    expect($row->signature_path)->toBe($copy)
        ->and(MemoFiles::disk()->get($copy))->toBe($original);

    // The saved person changes in every way: new name, new position, turned off, a different picture.
    MemoFiles::disk()->put('memos/signatories/'.$signatory->id.'/signature.png', 'a different picture');
    $signatory->update(['name' => 'Someone Else', 'position' => 'Another Post', 'is_active' => false]);

    $row = $published->fresh('signatories')->signatories->first();
    expect($row->name)->toBe('Maria Santos')
        ->and($row->position)->toBe('Regional Executive Director')
        ->and($row->signature_path)->toBe($copy)
        ->and(MemoFiles::disk()->get($copy))->toBe($original);
});

test('a signatory with no picture publishes with no picture copy', function () {
    $published = app(MemoService::class)->publish(writtenDraft(), memoAdmin());

    expect($published->signatories->first()->signature_path)->toBeNull();
});

test('publish stores the final PDF privately and records published with the number', function () {
    $admin = memoAdmin();
    Carbon::setTestNow(Carbon::parse('2026-06-15 10:00:00', 'UTC'));

    $published = app(MemoService::class)->publish(writtenDraft(), $admin);

    expect($published->final_pdf_path)->toBe("memos/{$published->id}/final.pdf")
        ->and(MemoFiles::disk()->get($published->final_pdf_path))->toBe('%PDF-test')
        ->and(Storage::disk('public')->exists($published->final_pdf_path))->toBeFalse()
        ->and($published->status)->toBe(Memo::STATUS_PUBLISHED)
        ->and($published->published_by)->toBe($admin->id)
        ->and($published->published_at)->not->toBeNull();

    $event = RecordEvent::for($published)->where('action', 'published')->first();
    expect($event)->not->toBeNull()
        ->and($event->user_id)->toBe($admin->id)
        ->and($event->details)->toBe(['number' => 1, 'series_year' => 2026]);

    Carbon::setTestNow();
});

test('publish tells the employees once the memo is published', function () {
    $admin = memoAdmin();
    $employee = memoAdmin('employee');

    $published = app(MemoService::class)->publish(writtenDraft(), $admin);

    Notification::assertSentTo($employee, MemoPublishedNotification::class, fn ($n) => $n->toDatabase($employee)['url'] === "/memos/{$published->id}");
    Notification::assertNotSentTo($admin, MemoPublishedNotification::class);
});

test('a PDF that cannot be made publishes nothing, uses no number and leaves no files behind', function () {
    $admin = memoAdmin();
    $signatory = makeSignatory();
    MemoFiles::disk()->put('memos/signatories/'.$signatory->id.'/signature.png', memoPng());
    $signatory->update(['signature_path' => 'memos/signatories/'.$signatory->id.'/signature.png']);
    $draft = writtenDraft([], $signatory);
    $this->partialMock(MemoPdfService::class, fn ($mock) => $mock->shouldReceive('buildPdf')->andThrow(new RuntimeException('Chrome crashed')));

    $errors = publishErrors($draft, $admin);

    expect($errors)->toHaveKey('publish')
        ->and($errors['publish'][0])->toContain('nothing was published')
        ->and($draft->fresh()->status)->toBe(Memo::STATUS_DRAFT)
        ->and($draft->fresh()->number)->toBeNull()
        ->and(MemoFiles::disk()->exists("memos/{$draft->id}/signatures/0.png"))->toBeFalse()
        ->and(MemoFiles::disk()->exists("memos/{$draft->id}/final.pdf"))->toBeFalse()
        ->and(RecordEvent::for($draft)->where('action', 'published')->exists())->toBeFalse();
    Notification::assertNothingSent();

    // The next try gets the number the failed one did not use.
    $this->partialMock(MemoPdfService::class, fn ($mock) => $mock->shouldReceive('buildPdf')->andReturn('%PDF-test'));
    expect(app(MemoService::class)->publish($draft->fresh(), $admin)->number)->toBe(1);
});

test('a failure while telling employees does not undo a publish that has been saved', function () {
    $this->mock(MemoNotifier::class, fn ($mock) => $mock->shouldReceive('publishedMemo')->andThrow(new RuntimeException('Mail server down')));

    $published = app(MemoService::class)->publish(writtenDraft(), memoAdmin());

    expect($published->fresh()->status)->toBe(Memo::STATUS_PUBLISHED);
});

test('a published memo cannot be published, edited or deleted again', function () {
    $admin = memoAdmin();
    $published = app(MemoService::class)->publish(writtenDraft(), $admin);

    expect(httpStatusOf(fn () => app(MemoService::class)->publish($published, $admin)))->toBe(409);

    $this->actingAs($admin)->post("/admin/memos/{$published->id}/publish")->assertStatus(409);
    $this->actingAs($admin)->put("/admin/memos/{$published->id}", memoPayload(['subject' => 'Changed after publishing']))->assertForbidden();
    $this->actingAs($admin)->delete("/admin/memos/{$published->id}")->assertForbidden();
    $this->actingAs($admin)->get("/admin/memos/{$published->id}/edit")->assertForbidden();

    $withdrawn = Memo::factory()->withdrawn()->create();
    $this->actingAs($admin)->post("/admin/memos/{$withdrawn->id}/publish")->assertStatus(409);
    $this->actingAs($admin)->delete("/admin/memos/{$withdrawn->id}")->assertForbidden();

    expect($published->fresh()->subject)->not->toBe('Changed after publishing');
});

test('the publish route publishes a draft and says so', function () {
    $admin = memoAdmin();
    $draft = writtenDraft();

    $this->actingAs($admin)->post("/admin/memos/{$draft->id}/publish")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($draft->fresh()->status)->toBe(Memo::STATUS_PUBLISHED);

    $notReady = Memo::factory()->create(['body' => 'Text but nobody signs.']);
    $this->actingAs($admin)->post("/admin/memos/{$notReady->id}/publish")->assertSessionHasErrors('signatories');
    expect($notReady->fresh()->status)->toBe(Memo::STATUS_DRAFT);
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

test('restore brings a withdrawn memo back without notifying again, and it keeps its number', function () {
    $admin = memoAdmin();
    $memo = Memo::factory()->withdrawn()->create(['series_year' => 2026, 'number' => 9]);

    $this->actingAs($admin)->post("/admin/memos/{$memo->id}/restore")->assertRedirect()->assertSessionHas('success');

    $memo->refresh();
    expect($memo->status)->toBe(Memo::STATUS_PUBLISHED)
        ->and($memo->withdrawn_reason)->toBeNull()
        ->and($memo->number)->toBe(9)
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

test('saving or deleting a draft that was published a moment ago is refused and changes nothing', function () {
    $admin = memoAdmin();
    $service = app(MemoService::class);
    $draft = writtenDraft();
    // What a second admin's request loaded while the memo was still a draft.
    $stale = Memo::find($draft->id);
    $published = $service->publish($draft, $admin);

    $saveErrors = [];
    try {
        // This payload would also wipe the signatories if it were let through.
        $service->saveDraft(memoPayload(['subject' => 'Changed after publishing', 'signatories' => []]), null, $admin, $stale);
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

    $after = Memo::with('signatories')->find($draft->id);
    expect($after)->not->toBeNull()
        ->and($after->subject)->toBe($published->subject)
        ->and($after->status)->toBe(Memo::STATUS_PUBLISHED)
        ->and($after->signatories)->toHaveCount(1)
        ->and($after->signatories->first()->name)->toBe('Maria Santos')
        ->and(MemoFiles::disk()->exists("memos/{$draft->id}/final.pdf"))->toBeTrue()
        ->and(RecordEvent::for($draft)->where('action', 'deleted')->exists())->toBeFalse()
        ->and(RecordEvent::for($draft)->where('action', 'updated')->exists())->toBeFalse();
});
