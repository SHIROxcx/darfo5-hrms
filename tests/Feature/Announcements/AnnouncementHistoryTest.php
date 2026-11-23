<?php

use App\Http\Controllers\AnnouncementController;
use App\Models\Announcement;
use App\Models\RecordEvent;
use App\Models\User;
use App\Notifications\AnnouncementNotification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

// Removing an announcement used to erase it for good. Now it is archived, and every post, edit and removal is in the history.

beforeEach(function () {
    foreach (['admin', 'superadmin', 'employee'] as $role) {
        Role::findOrCreate($role);
    }
});

function historyUser(string $role): User
{
    $user = User::factory()->create(['is_approved' => true, 'email_verified_at' => now()]);
    $user->assignRole($role);

    return $user;
}

function archivableAnnouncement(User $by, array $overrides = []): Announcement
{
    return Announcement::create(array_merge([
        'title' => 'Office closure',
        'body' => 'The office is closed on Friday.',
        'date' => now()->toDateString(),
        'tag' => 'General',
        'created_by' => $by->id,
    ], $overrides));
}

test('deleting an announcement keeps its record and text, and moves its files off the public disk', function () {
    $admin = historyUser('admin');
    $employee = historyUser('employee');
    Storage::disk('public')->put('announcements/attachments/circular.pdf', 'file');
    $announcement = archivableAnnouncement($admin, ['attachments' => ['announcements/attachments/circular.pdf']]);
    $employee->notify(new AnnouncementNotification($announcement->id, 'Office closure', 'Closed Friday.', 'Nov 21, 2026', 'General', 'bg-gray-100'));

    $this->actingAs($admin)->delete("/announcements/{$announcement->id}")->assertRedirect();

    $kept = Announcement::withTrashed()->find($announcement->id);
    expect($kept)->not->toBeNull()
        ->and($kept->trashed())->toBeTrue()
        ->and($kept->body)->toBe('The office is closed on Friday.');
    // The file is no longer reachable by its public address; it is kept on the private disk and the record points there.
    Storage::disk('public')->assertMissing('announcements/attachments/circular.pdf');
    $kept_path = "announcements/archive/{$announcement->id}/circular.pdf";
    Storage::disk('local')->assertExists($kept_path);
    expect(Storage::disk('local')->get($kept_path))->toBe('file')
        ->and($kept->attachments)->toBe([$kept_path]);
    expect(DB::table('notifications')->whereJsonContains('data->announcement_id', $announcement->id)->count())->toBe(0);

    $event = RecordEvent::for($kept)->first();
    expect($event->action)->toBe('deleted')->and($event->user_id)->toBe($admin->id);
});

test('an attachment whose file is already gone does not stop the archive and is left out of the record', function () {
    $admin = historyUser('admin');
    Storage::disk('public')->put('announcements/attachments/there.pdf', 'file');
    $announcement = archivableAnnouncement($admin, ['attachments' => ['announcements/attachments/there.pdf', 'announcements/attachments/gone.pdf']]);

    $this->actingAs($admin)->delete("/announcements/{$announcement->id}")->assertRedirect();

    $kept = Announcement::withTrashed()->find($announcement->id);
    expect($kept->trashed())->toBeTrue()
        ->and($kept->attachments)->toBe(["announcements/archive/{$announcement->id}/there.pdf"]);
});

test('an announcement without attachments archives as before', function () {
    $admin = historyUser('admin');
    $announcement = archivableAnnouncement($admin, ['attachments' => null]);

    $this->actingAs($admin)->delete("/announcements/{$announcement->id}")->assertRedirect();

    expect(Announcement::withTrashed()->find($announcement->id)->trashed())->toBeTrue()
        ->and(Announcement::withTrashed()->find($announcement->id)->attachments)->toBeNull();
});

test('a deleted announcement no longer appears in the lists employees and the dashboard use', function () {
    $admin = historyUser('admin');
    $gone = archivableAnnouncement($admin, ['title' => 'Old news']);
    archivableAnnouncement($admin, ['title' => 'Current news']);

    $this->actingAs($admin)->delete("/announcements/{$gone->id}");

    expect(collect(AnnouncementController::latest())->pluck('title')->all())->toBe(['Current news']);
});

test('the expiry command archives instead of deleting, and records "expired" with nobody as the user', function () {
    $admin = historyUser('admin');
    Storage::disk('public')->put('announcements/attachments/old.pdf', 'file');
    $expired = archivableAnnouncement($admin, [
        'attachments' => ['announcements/attachments/old.pdf'],
        'auto_delete' => true,
        'delete_after' => Carbon::yesterday()->toDateString(),
    ]);
    $stays = archivableAnnouncement($admin, ['title' => 'Still current', 'auto_delete' => true, 'delete_after' => Carbon::tomorrow()->toDateString()]);

    $this->artisan('announcements:delete-expired')->assertSuccessful();

    expect(Announcement::withTrashed()->find($expired->id)->trashed())->toBeTrue()
        ->and(Announcement::find($stays->id))->not->toBeNull();
    Storage::disk('public')->assertMissing('announcements/attachments/old.pdf');
    Storage::disk('local')->assertExists("announcements/archive/{$expired->id}/old.pdf");
    expect(Announcement::withTrashed()->find($expired->id)->attachments)->toBe(["announcements/archive/{$expired->id}/old.pdf"]);

    $event = RecordEvent::for($expired)->first();
    expect($event->action)->toBe('expired')->and($event->user_id)->toBeNull();
});

test('posting and editing write history, and an edit lists the fields it changed', function () {
    Notification::fake();
    $admin = historyUser('admin');

    $this->actingAs($admin)->post('/announcements', [
        'title' => 'Flag ceremony', 'body' => 'Every Monday.', 'date' => now()->toDateString(), 'tag' => 'Reminder',
    ])->assertSessionHasNoErrors();
    $announcement = Announcement::firstOrFail();

    $this->actingAs($admin)->put("/announcements/{$announcement->id}", [
        'title' => 'Flag ceremony moved', 'body' => 'Every Monday.', 'date' => now()->toDateString(), 'tag' => 'Reminder',
    ])->assertSessionHasNoErrors();

    $history = RecordEvent::for($announcement)->get();
    expect($history->pluck('action')->all())->toBe(['updated', 'created'])
        ->and($history->first()->details)->toBe(['changed' => ['title']])
        ->and($history->last()->details)->toBe(['title' => 'Flag ceremony']);
});

test('the history page lists archived announcements with who removed them and why, for admins only', function () {
    $admin = historyUser('admin');
    $removedByHand = archivableAnnouncement($admin, ['title' => 'Removed by HR']);
    $expired = archivableAnnouncement($admin, ['title' => 'Ran out', 'auto_delete' => true, 'delete_after' => Carbon::yesterday()->toDateString()]);
    archivableAnnouncement($admin, ['title' => 'Still posted']);

    $this->actingAs($admin)->delete("/announcements/{$removedByHand->id}");
    Auth::forgetGuards(); // the scheduler has nobody logged in
    $this->artisan('announcements:delete-expired');

    $this->actingAs($admin)->get('/admin/announcements/history')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Announcements/History')
            ->has('announcements.data', 2)
            ->where('announcements.data', fn ($rows) => collect($rows)->pluck('title')->sort()->values()->all() === ['Ran out', 'Removed by HR']
                && collect($rows)->firstWhere('title', 'Removed by HR')['reason'] === 'deleted'
                && collect($rows)->firstWhere('title', 'Removed by HR')['removed_by'] === $admin->name
                && collect($rows)->firstWhere('title', 'Ran out')['reason'] === 'expired'
                && collect($rows)->firstWhere('title', 'Ran out')['removed_by'] === null));

    expect($expired->fresh()->trashed())->toBeTrue();
});

test('the history page is for admins and superadmins, not employees or guests', function () {
    $this->get('/admin/announcements/history')->assertRedirect('/login');
    $this->actingAs(historyUser('employee'))->get('/admin/announcements/history')->assertForbidden();
    $this->actingAs(historyUser('superadmin'))->get('/admin/announcements/history')->assertOk();
});
