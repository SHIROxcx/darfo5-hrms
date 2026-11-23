<?php

use App\Models\Announcement;
use App\Models\RecordEvent;
use App\Models\User;
use Illuminate\Support\Carbon;

// The shared history: one append-only table that memos and announcements both write to.

function historySubject(): Announcement
{
    return Announcement::create([
        'title' => 'Office closure',
        'body' => 'The office is closed on Friday.',
        'date' => now()->toDateString(),
        'tag' => 'General',
        'created_by' => User::factory()->create()->id,
    ]);
}

test('records who did what to which thing, with details', function () {
    $admin = User::factory()->create();
    $subject = historySubject();

    $event = RecordEvent::record($subject, 'updated', ['changed' => ['title', 'date']], $admin);

    $saved = RecordEvent::find($event->id);
    expect($saved->user_id)->toBe($admin->id)
        ->and($saved->action)->toBe('updated')
        ->and($saved->subject_type)->toBe(Announcement::class)
        ->and($saved->subject_id)->toBe($subject->id)
        ->and($saved->details)->toBe(['changed' => ['title', 'date']])
        ->and($saved->created_at)->not->toBeNull();
});

test('the logged-in user is used when none is given, and nobody when nobody is logged in', function () {
    $admin = User::factory()->create();
    $subject = historySubject();

    $byNobody = RecordEvent::record($subject, 'expired');
    $this->actingAs($admin);
    $byAdmin = RecordEvent::record($subject, 'deleted');

    expect($byNobody->user_id)->toBeNull()
        ->and($byAdmin->user_id)->toBe($admin->id);
});

test('the history of one record lists only its own events, newest first', function () {
    $mine = historySubject();
    $other = historySubject();

    Carbon::setTestNow('2026-11-20 09:00:00');
    RecordEvent::record($mine, 'created');
    Carbon::setTestNow('2026-11-20 10:00:00');
    RecordEvent::record($other, 'created');
    Carbon::setTestNow('2026-11-21 08:00:00');
    RecordEvent::record($mine, 'updated');
    Carbon::setTestNow();

    $history = RecordEvent::for($mine)->get();

    expect($history->pluck('action')->all())->toBe(['updated', 'created'])
        ->and($history->pluck('subject_id')->unique()->all())->toBe([$mine->id]);
});

test('an event cannot be updated or deleted', function () {
    $event = RecordEvent::record(historySubject(), 'created');

    expect(fn () => $event->update(['action' => 'changed']))->toThrow(LogicException::class);

    $event->action = 'changed';
    expect(fn () => $event->save())->toThrow(LogicException::class);
    expect(fn () => $event->delete())->toThrow(LogicException::class);
    expect(fn () => $event->forceDelete())->toThrow(LogicException::class);

    expect(RecordEvent::find($event->id)->action)->toBe('created');
});

test('an event survives its user being deleted', function () {
    $admin = User::factory()->create();
    $event = RecordEvent::record(historySubject(), 'created', [], $admin);

    $admin->delete();

    $saved = RecordEvent::find($event->id);
    expect($saved)->not->toBeNull()
        ->and($saved->user_id)->toBeNull();
});
