<?php

use App\Models\Announcement;
use App\Models\User;
use App\Notifications\AnnouncementEmailNotification;
use App\Notifications\AnnouncementNotification;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['admin', 'superadmin', 'employee'] as $role) {
        Role::findOrCreate($role);
    }
    Notification::fake();
});

function announcementUser(string $role, array $attributes = []): User
{
    $user = User::factory()->create(array_merge([
        'is_approved' => true,
        'email_verified_at' => now(),
    ], $attributes));
    $user->assignRole($role);

    return $user;
}

function memoInput(array $overrides = []): array
{
    return array_merge([
        'title' => 'Office closure',
        'body' => 'The office will be closed on Friday for the training.',
        'date' => now()->toDateString(),
        'tag' => 'Reminder',
    ], $overrides);
}

test('an admin memo notifies approved, verified employees by database and email, but not the poster or unapproved users', function () {
    $admin = announcementUser('admin');
    $employee = announcementUser('employee');
    $pending = announcementUser('employee', ['is_approved' => false]);

    $this->actingAs($admin)->post('/announcements', memoInput())->assertSessionHas('success');

    Notification::assertSentTo($employee, AnnouncementNotification::class);
    Notification::assertSentTo($employee, AnnouncementEmailNotification::class);
    Notification::assertNotSentTo($pending, AnnouncementEmailNotification::class);
    Notification::assertNotSentTo($admin, AnnouncementEmailNotification::class);
});

test('a memo body longer than 200 characters is accepted up to 5000', function () {
    $admin = announcementUser('admin');

    $this->actingAs($admin)->post('/announcements', memoInput(['body' => str_repeat('a', 1500)]))
        ->assertSessionHasNoErrors();
    expect(Announcement::first()->body)->toHaveLength(1500);

    $this->actingAs($admin)->post('/announcements', memoInput(['body' => str_repeat('a', 5001)]))
        ->assertSessionHasErrors('body');
});

test('employees cannot post a memo', function () {
    $employee = announcementUser('employee');

    $this->actingAs($employee)->post('/announcements', memoInput())->assertForbidden();

    expect(Announcement::count())->toBe(0);
    Notification::assertNothingSent();
});

test('the memo email shows the title, body and a link to the announcements panel', function () {
    $employee = announcementUser('employee', ['first_name' => 'Maria']);

    $mail = (new AnnouncementEmailNotification('Office closure', 'Closed on Friday.', 'Nov 20, 2026', 'Reminder'))
        ->toMail($employee);

    expect($mail->subject)->toBe('New announcement: Office closure')
        ->and($mail->greeting)->toBe('Hello, Maria!')
        ->and($mail->actionUrl)->toEndWith('/dashboard#announcements-panel')
        ->and(implode(' ', $mail->introLines))->toContain('Closed on Friday.');
});

// A memo whose attachment is refused must say why. Before, the admin pressed Post and nothing at all appeared: the form had
// no place to show an attachment error, and the server's own message ("attachments.0 failed to upload") was unreadable anyway.

test('a file the server could not receive says so, with the size it does accept', function () {
    Storage::fake('public');
    $path = tempnam(sys_get_temp_dir(), 'memo');
    file_put_contents($path, '%PDF-1.4');
    // This is what PHP hands over when the file is bigger than its upload_max_filesize.
    $tooBigForPhp = new UploadedFile($path, 'big.pdf', 'application/pdf', UPLOAD_ERR_INI_SIZE, true);

    $response = $this->actingAs(announcementUser('admin'))
        ->post('/announcements', memoInput(['attachments' => [$tooBigForPhp]]));

    $response->assertSessionHasErrors('attachments.0');
    $message = session('errors')->first('attachments.0');
    expect($message)->toContain('could not be uploaded')->toContain('MB each')->not->toContain('attachments.0');
    expect(Announcement::count())->toBe(0);
    @unlink($path);
});

test('a file over 10 MB says it is too large', function () {
    Storage::fake('public');

    $this->actingAs(announcementUser('admin'))
        ->post('/announcements', memoInput(['attachments' => [UploadedFile::fake()->create('big.pdf', 10241, 'application/pdf')]]))
        ->assertSessionHasErrors(['attachments.0' => 'A file is too large (maximum 10 MB each).']);
    expect(Announcement::count())->toBe(0);
});

test('a file type that is not allowed says which types are', function () {
    Storage::fake('public');

    $this->actingAs(announcementUser('admin'))
        ->post('/announcements', memoInput(['attachments' => [UploadedFile::fake()->create('virus.exe', 10, 'application/x-msdownload')]]))
        ->assertSessionHasErrors(['attachments.0' => 'That file type is not allowed. Attach a PDF, Word, Excel, PowerPoint, image or ZIP file.']);
});

test('editing a memo gives the same plain message when a file is refused', function () {
    Storage::fake('public');
    $admin = announcementUser('admin');
    $memo = Announcement::create(['title' => 'Old', 'body' => 'Old body', 'date' => now()->toDateString(), 'tag' => 'General', 'created_by' => $admin->id]);

    $this->actingAs($admin)
        ->put("/announcements/{$memo->id}", memoInput(['attachments' => [UploadedFile::fake()->create('big.pdf', 10241, 'application/pdf')]]))
        ->assertSessionHasErrors(['attachments.0' => 'A file is too large (maximum 10 MB each).']);
});

test('a good attachment still posts', function () {
    Storage::fake('public');

    $this->actingAs(announcementUser('admin'))
        ->post('/announcements', memoInput(['attachments' => [UploadedFile::fake()->create('memo.pdf', 100, 'application/pdf')]]))
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success');

    expect(Announcement::first()->attachments)->toHaveCount(1);
    Storage::disk('public')->assertExists(Announcement::first()->attachments[0]);
});
