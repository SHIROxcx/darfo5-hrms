<?php

use App\Broadcasting\MemoChannel;
use App\Events\MemoPublished;
use App\Models\Memo;
use App\Models\User;
use App\Notifications\MemoEmailNotification;
use App\Notifications\MemoPublishedNotification;
use App\Services\MemoNotifier;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

// Telling employees about a published memo: a bell row, an email, and a live push. Nothing here may fail a publish.

function publishedMemoFor(array $attributes = []): Memo
{
    return Memo::factory()->published()->create(array_merge([
        'subject' => 'Declaration of Laguna as Avian Influenza Free Province',
        'memo_date' => '2026-11-09',
        'file_path' => 'memos/58/file/stored.pdf',
        'file_name' => 'Circular 58.pdf',
    ], $attributes));
}

test('sends the bell row and the email to approved, verified employees, not to the publisher or an unapproved account', function () {
    Notification::fake();
    Event::fake();

    $publisher = memoAdmin();
    $employee = memoAdmin('employee');
    $otherAdmin = memoAdmin('admin');
    $unapproved = User::factory()->create(['is_approved' => false]);
    $unverified = User::factory()->unverified()->create(['is_approved' => true]);
    $memo = publishedMemoFor(['published_by' => $publisher->id]);

    app(MemoNotifier::class)->publishedMemo($memo);

    foreach ([$employee, $otherAdmin] as $recipient) {
        Notification::assertSentTo($recipient, MemoPublishedNotification::class);
        Notification::assertSentTo($recipient, MemoEmailNotification::class);
    }
    foreach ([$publisher, $unapproved, $unverified] as $skipped) {
        Notification::assertNotSentTo($skipped, MemoPublishedNotification::class);
        Notification::assertNotSentTo($skipped, MemoEmailNotification::class);
    }
    Event::assertDispatched(MemoPublished::class);
});

test('reaches everyone when there are more recipients than one chunk', function () {
    Notification::fake();
    Event::fake();

    $publisher = memoAdmin();
    User::factory()->count(130)->create(['is_approved' => true]);
    $memo = publishedMemoFor(['published_by' => $publisher->id]);

    $expected = User::where('is_approved', true)->whereNotNull('email_verified_at')->where('id', '!=', $publisher->id)->count();

    app(MemoNotifier::class)->publishedMemo($memo);

    // More than one chunk of 100, and every one of them reached.
    expect($expected)->toBeGreaterThan(100);
    Notification::assertSentTimes(MemoPublishedNotification::class, $expected);
    Notification::assertSentTimes(MemoEmailNotification::class, $expected);
});

test('the database payload is exactly message and url', function () {
    $memo = publishedMemoFor();

    $payload = (new MemoPublishedNotification($memo))->toDatabase(memoAdmin('employee'));

    expect($payload)->toBe([
        'message' => 'New memo: Declaration of Laguna as Avian Influenza Free Province',
        'url' => "/memos/{$memo->id}",
    ]);
});

test('the bell row is stored for real and the notification is not queued', function () {
    Event::fake();

    $publisher = memoAdmin();
    $employee = memoAdmin('employee');
    $memo = publishedMemoFor(['published_by' => $publisher->id]);

    app(MemoNotifier::class)->publishedMemo($memo);

    $row = $employee->notifications()->where('type', MemoPublishedNotification::class)->first();
    expect($row)->not->toBeNull()
        ->and($row->data)->toBe([
            'message' => 'New memo: Declaration of Laguna as Avian Influenza Free Province',
            'url' => "/memos/{$memo->id}",
        ]);
    expect((new MemoPublishedNotification($memo)))->not->toBeInstanceOf(Illuminate\Contracts\Queue\ShouldQueue::class);
});

test('the email names the subject and links to /memos/{id}', function () {
    $memo = publishedMemoFor();
    $employee = User::factory()->create(['first_name' => 'Maria']);

    $notification = new MemoEmailNotification($memo);
    $mail = $notification->toMail($employee);

    expect($notification)->toBeInstanceOf(Illuminate\Contracts\Queue\ShouldQueue::class)
        ->and($notification->via($employee))->toBe(['mail'])
        ->and($mail->subject)->toBe('New memo: Declaration of Laguna as Avian Influenza Free Province')
        ->and($mail->greeting)->toBe('Hello, Maria!')
        ->and($mail->actionText)->toBe('View Memo')
        ->and($mail->actionUrl)->toBe(url("/memos/{$memo->id}"))
        ->and($mail->salutation)->toBe('DA RFO 5 - HRIS')
        ->and($mail->introLines)->toBe([
            'A new memo, dated November 9, 2026, was published.',
            '**Declaration of Laguna as Avian Influenza Free Province**',
        ]);
});

test('the email and the bell say nothing about the stored file', function () {
    $memo = publishedMemoFor();

    $mail = (new MemoEmailNotification($memo))->toMail(User::factory()->create(['first_name' => 'Maria']));
    $bell = (new MemoPublishedNotification($memo))->toDatabase(memoAdmin('employee'));

    expect(implode(' ', $mail->introLines).' '.json_encode($bell))->not->toContain('stored.pdf')->not->toContain('Circular 58.pdf');
});

test('the broadcast payload is only the message and the link', function () {
    $memo = publishedMemoFor();

    $event = new MemoPublished($memo);

    expect($event->payload)->toBe([
        'message' => 'New memo: Declaration of Laguna as Avian Influenza Free Province',
        'url' => "/memos/{$memo->id}",
    ])
        ->and(json_encode($event->broadcastWith()))->not->toContain('stored.pdf')->not->toContain('Circular 58.pdf')
        ->and($event->broadcastAs())->toBe('memo-published')
        ->and($event->broadcastOn()[0]->name)->toBe('private-memos');
});

test('a broadcast failure is logged and does not throw, and the notifications are already sent', function () {
    Notification::fake();
    Log::spy();
    Event::listen(MemoPublished::class, fn () => throw new RuntimeException('Reverb is down'));

    $publisher = memoAdmin();
    $employee = memoAdmin('employee');
    $memo = publishedMemoFor(['published_by' => $publisher->id]);

    app(MemoNotifier::class)->publishedMemo($memo);

    Notification::assertSentTo($employee, MemoPublishedNotification::class);
    Log::shouldHaveReceived('warning')->withArgs(fn ($message) => str_contains($message, 'Reverb is down'))->once();
});

test('MemoChannel::join is true for an approved verified employee, an admin and a superadmin, false for an unapproved or unverified user', function () {
    $channel = new MemoChannel;

    expect($channel->join(memoAdmin('employee')))->toBeTrue()
        ->and($channel->join(memoAdmin('admin')))->toBeTrue()
        ->and($channel->join(memoAdmin('superadmin')))->toBeTrue()
        ->and($channel->join(User::factory()->create(['is_approved' => false])))->toBeFalse()
        ->and($channel->join(User::factory()->unverified()->create(['is_approved' => true])))->toBeFalse();
});

test('the memos channel is registered for the private channel name', function () {
    $registered = collect(app(Illuminate\Broadcasting\BroadcastManager::class)->driver()->getChannels()->keys());

    expect($registered)->toContain('memos');
});
