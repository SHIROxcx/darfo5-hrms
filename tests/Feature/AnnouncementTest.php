<?php

use App\Http\Controllers\AnnouncementController;
use App\Models\Announcement;
use App\Models\RecordEvent;
use App\Models\User;
use App\Notifications\AnnouncementEmailNotification;
use App\Notifications\AnnouncementNotification;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

// An announcement is an uploaded file and nothing else: HR picks a file, the title is the file's name, and the date and
// category are filled in by the system. HR can still choose to have it removed on a date.

beforeEach(function () {
    foreach (['admin', 'superadmin', 'employee'] as $role) {
        Role::findOrCreate($role);
    }
    Notification::fake();
    Storage::fake('public');
    Storage::fake('local');
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

/** What the announcement form sends: the file, and (optionally) the auto-delete choice. */
function announcementInput(array $overrides = []): array
{
    return array_merge([
        'file' => UploadedFile::fake()->create('Office closure notice.pdf', 100, 'application/pdf'),
    ], $overrides);
}

function postedAnnouncement(User $by, array $overrides = []): Announcement
{
    test()->actingAs($by)->post('/announcements', announcementInput($overrides))->assertSessionHasNoErrors();

    return Announcement::latest('id')->firstOrFail();
}

test('an admin posts a file: the title is its name, the date is today, and employees are told by bell and email', function () {
    $admin = announcementUser('admin');
    $employee = announcementUser('employee');
    $pending = announcementUser('employee', ['is_approved' => false]);

    $this->actingAs($admin)->post('/announcements', announcementInput())->assertSessionHas('success');

    $announcement = Announcement::firstOrFail();
    expect($announcement->title)->toBe('Office closure notice')
        ->and($announcement->body)->toBeNull()
        ->and($announcement->tag)->toBe('General')
        ->and(Carbon::parse($announcement->date)->toDateString())->toBe(now(config('memos.timezone'))->toDateString())
        ->and($announcement->created_by)->toBe($admin->id)
        ->and($announcement->attachments)->toHaveCount(1)
        ->and($announcement->auto_delete)->toBeFalse()
        ->and($announcement->delete_after)->toBeNull();
    Storage::disk('public')->assertExists($announcement->attachments[0]);

    Notification::assertSentTo($employee, AnnouncementNotification::class);
    Notification::assertSentTo($employee, AnnouncementEmailNotification::class);
    Notification::assertNotSentTo($pending, AnnouncementEmailNotification::class);
    Notification::assertNotSentTo($admin, AnnouncementEmailNotification::class);
});

test('the history says the announcement was created, with its title', function () {
    $admin = announcementUser('admin');

    $announcement = postedAnnouncement($admin);

    $event = RecordEvent::for($announcement)->firstOrFail();
    expect($event->action)->toBe('created')->and($event->details)->toBe(['title' => 'Office closure notice'])->and($event->user_id)->toBe($admin->id);
});

test('an announcement needs its file, and nothing is posted or sent without one', function () {
    $this->actingAs(announcementUser('admin'))->post('/announcements', [])
        ->assertSessionHasErrors(['file' => 'Attach the announcement file.']);

    expect(Announcement::count())->toBe(0);
    Notification::assertNothingSent();
});

test('only one file is taken, and the written fields of the old form are ignored', function () {
    $this->actingAs(announcementUser('admin'))->post('/announcements', announcementInput([
        'title' => 'A title nobody asked for',
        'body' => 'Some text that is no longer part of an announcement.',
        'date' => '2020-01-01',
        'tag' => 'Policy',
    ]))->assertSessionHasNoErrors();

    $announcement = Announcement::firstOrFail();
    expect($announcement->title)->toBe('Office closure notice')
        ->and($announcement->body)->toBeNull()
        ->and($announcement->tag)->toBe('General')
        ->and(Carbon::parse($announcement->date)->toDateString())->toBe(now(config('memos.timezone'))->toDateString());
});

test('the title is made from the file name: underscores become spaces, long names are cut, a bare extension gets a plain title', function () {
    $admin = announcementUser('admin');
    $cases = [
        ['Memo_for__flag_ceremony.pdf', 'Memo for flag ceremony'],
        [str_repeat('L', 300).'.pdf', str_repeat('L', 255)],
        ['.pdf', 'Announcement'],
        ['  spaced   out  .pdf', 'spaced out'],
    ];

    foreach ($cases as [$fileName, $title]) {
        $announcement = postedAnnouncement($admin, ['file' => UploadedFile::fake()->create($fileName, 10, 'application/pdf')]);

        expect($announcement->title)->toBe($title);
    }
});

test('the stored file keeps a readable name but takes its extension from what the file is, never from what it is called', function () {
    $admin = announcementUser('admin');

    // A PDF that was named like a web page must not be stored (and later served) as one.
    $announcement = postedAnnouncement($admin, ['file' => UploadedFile::fake()->create('Notice: "Q1" #2 100% <draft>?.html', 10, 'application/pdf')]);

    $stored = basename($announcement->attachments[0]);
    expect($stored)->toBe('Notice Q1 2 100 draft.pdf')
        ->and($announcement->title)->toBe('Notice: "Q1" #2 100% <draft>?');
    expect($announcement->attachments[0])->toStartWith('announcements/attachments/');

    // A name that is nothing but odd characters still gets a usable stored name.
    $bare = postedAnnouncement($admin, ['file' => UploadedFile::fake()->create('###.pdf', 10, 'application/pdf')]);
    expect(basename($bare->attachments[0]))->toBe('announcement.pdf');

    // A very long name is cut so the path stays short enough for any disk.
    $long = postedAnnouncement($admin, ['file' => UploadedFile::fake()->create(str_repeat('L', 300).'.pdf', 10, 'application/pdf')]);
    expect(mb_strlen(basename($long->attachments[0])))->toBe(100 + 4);
});

test('two files with the same name do not overwrite each other', function () {
    $admin = announcementUser('admin');

    $first = postedAnnouncement($admin, ['file' => UploadedFile::fake()->createWithContent('Notice.pdf', 'first')]);
    $second = postedAnnouncement($admin, ['file' => UploadedFile::fake()->createWithContent('Notice.pdf', 'second')]);

    expect($first->attachments[0])->not->toBe($second->attachments[0])
        ->and(Storage::disk('public')->get($first->attachments[0]))->toBe('first')
        ->and(Storage::disk('public')->get($second->attachments[0]))->toBe('second');
});

test('employees cannot post an announcement', function () {
    $employee = announcementUser('employee');

    $this->actingAs($employee)->post('/announcements', announcementInput())->assertForbidden();

    expect(Announcement::count())->toBe(0);
    Notification::assertNothingSent();
});

// A file that is refused must say why. Before, the admin pressed Post and nothing at all appeared.

test('a file the server could not receive says so, with the size it does accept', function () {
    $path = tempnam(sys_get_temp_dir(), 'announcement');
    file_put_contents($path, '%PDF-1.4');
    // This is what PHP hands over when the file is bigger than its upload_max_filesize.
    $tooBigForPhp = new UploadedFile($path, 'big.pdf', 'application/pdf', UPLOAD_ERR_INI_SIZE, true);

    $this->actingAs(announcementUser('admin'))->post('/announcements', announcementInput(['file' => $tooBigForPhp]))
        ->assertSessionHasErrors('file');

    expect(session('errors')->first('file'))->toContain('could not be uploaded')->toContain('MB')->not->toContain('file field');
    expect(Announcement::count())->toBe(0);
    @unlink($path);
});

test('a file over 10 MB says it is too large', function () {
    $this->actingAs(announcementUser('admin'))
        ->post('/announcements', announcementInput(['file' => UploadedFile::fake()->create('big.pdf', 10241, 'application/pdf')]))
        ->assertSessionHasErrors(['file' => 'The file is too large (maximum 10 MB).']);

    expect(Announcement::count())->toBe(0);
});

test('a file type that is not allowed says which types are', function () {
    $this->actingAs(announcementUser('admin'))
        ->post('/announcements', announcementInput(['file' => UploadedFile::fake()->create('virus.exe', 10, 'application/x-msdownload')]))
        ->assertSessionHasErrors(['file' => 'That file type is not allowed. Attach a PDF, Word, Excel, PowerPoint, image or ZIP file.']);
});

test('a list of files instead of one file is refused', function () {
    $this->actingAs(announcementUser('admin'))
        ->post('/announcements', ['file' => [UploadedFile::fake()->create('a.pdf', 10, 'application/pdf')]])
        ->assertSessionHasErrors('file');

    expect(Announcement::count())->toBe(0);
});

// Auto-delete: the one choice HR still makes besides the file.

test('auto-delete needs a future date, and keeps the date only when it is switched on', function () {
    $admin = announcementUser('admin');
    $tomorrow = Carbon::tomorrow()->toDateString();

    $this->actingAs($admin)->post('/announcements', announcementInput(['auto_delete' => true]))
        ->assertSessionHasErrors('delete_after');
    $this->actingAs($admin)->post('/announcements', announcementInput(['auto_delete' => true, 'delete_after' => Carbon::today()->toDateString()]))
        ->assertSessionHasErrors(['delete_after' => 'The auto-delete date must be a future date — today or a past date is not allowed.']);
    $this->actingAs($admin)->post('/announcements', announcementInput(['auto_delete' => true, 'delete_after' => Carbon::yesterday()->toDateString()]))
        ->assertSessionHasErrors('delete_after');
    expect(Announcement::count())->toBe(0);

    $this->actingAs($admin)->post('/announcements', announcementInput(['auto_delete' => true, 'delete_after' => $tomorrow]))->assertSessionHasNoErrors();
    $this->actingAs($admin)->post('/announcements', announcementInput(['auto_delete' => false, 'delete_after' => $tomorrow]))->assertSessionHasNoErrors();

    [$on, $off] = Announcement::orderBy('id')->get()->all();
    expect($on->auto_delete)->toBeTrue()->and($on->delete_after->toDateString())->toBe($tomorrow)
        ->and($off->auto_delete)->toBeFalse()->and($off->delete_after)->toBeNull();
});

// Editing: the file can be replaced and the auto-delete choice changed. The title follows the file.

test('replacing the file removes the old one, takes the new title and records what changed', function () {
    $admin = announcementUser('admin');
    $announcement = postedAnnouncement($admin);
    $oldPath = $announcement->attachments[0];

    $this->actingAs($admin)->put("/announcements/{$announcement->id}", announcementInput([
        'file' => UploadedFile::fake()->create('Revised notice.docx', 50, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
    ]))->assertSessionHasNoErrors()->assertSessionHas('success');

    $announcement->refresh();
    expect($announcement->title)->toBe('Revised notice')
        ->and($announcement->attachments)->toHaveCount(1)
        ->and($announcement->attachments[0])->not->toBe($oldPath);
    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($announcement->attachments[0]);

    $event = RecordEvent::for($announcement)->where('action', 'updated')->firstOrFail();
    expect($event->details['changed'])->toEqualCanonicalizing(['title', 'attachments']);
});

test('saving without a new file keeps the file and the title, and an unchanged save writes no history', function () {
    $admin = announcementUser('admin');
    $announcement = postedAnnouncement($admin);
    $path = $announcement->attachments[0];

    $this->actingAs($admin)->put("/announcements/{$announcement->id}", [])->assertSessionHasNoErrors();

    $announcement->refresh();
    expect($announcement->title)->toBe('Office closure notice')->and($announcement->attachments)->toBe([$path]);
    Storage::disk('public')->assertExists($path);
    expect(RecordEvent::for($announcement)->pluck('action')->all())->toBe(['created']);
});

test('the auto-delete choice can be changed on its own', function () {
    $admin = announcementUser('admin');
    $announcement = postedAnnouncement($admin);
    $tomorrow = Carbon::tomorrow()->toDateString();

    $this->actingAs($admin)->put("/announcements/{$announcement->id}", ['auto_delete' => true, 'delete_after' => $tomorrow])->assertSessionHasNoErrors();

    $announcement->refresh();
    expect($announcement->auto_delete)->toBeTrue()->and($announcement->delete_after->toDateString())->toBe($tomorrow);
    $event = RecordEvent::for($announcement)->where('action', 'updated')->firstOrFail();
    expect($event->details['changed'])->toEqualCanonicalizing(['auto_delete', 'delete_after']);

    $this->actingAs($admin)->put("/announcements/{$announcement->id}", [])->assertSessionHasNoErrors();
    expect($announcement->fresh()->auto_delete)->toBeFalse()->and($announcement->fresh()->delete_after)->toBeNull();
});

test('editing gives the same plain message when the new file is refused, and keeps the old one', function () {
    $admin = announcementUser('admin');
    $announcement = postedAnnouncement($admin);
    $path = $announcement->attachments[0];

    $this->actingAs($admin)
        ->put("/announcements/{$announcement->id}", announcementInput(['file' => UploadedFile::fake()->create('big.pdf', 10241, 'application/pdf')]))
        ->assertSessionHasErrors(['file' => 'The file is too large (maximum 10 MB).']);

    expect($announcement->fresh()->attachments)->toBe([$path]);
    Storage::disk('public')->assertExists($path);
});

test('an announcement written before this change keeps its text and every file when it is edited without a new file', function () {
    $admin = announcementUser('admin');
    Storage::disk('public')->put('announcements/attachments/one.pdf', 'one');
    Storage::disk('public')->put('announcements/attachments/two.pdf', 'two');
    $old = Announcement::create([
        'title' => 'Old way', 'body' => 'Text that was written by hand.', 'date' => now()->toDateString(), 'tag' => 'Policy',
        'created_by' => $admin->id, 'attachments' => ['announcements/attachments/one.pdf', 'announcements/attachments/two.pdf'],
    ]);

    $this->actingAs($admin)->put("/announcements/{$old->id}", ['auto_delete' => false])->assertSessionHasNoErrors();

    $old->refresh();
    expect($old->title)->toBe('Old way')->and($old->body)->toBe('Text that was written by hand.')->and($old->tag)->toBe('Policy')
        ->and($old->attachments)->toBe(['announcements/attachments/one.pdf', 'announcements/attachments/two.pdf']);
});

test('employees cannot edit an announcement', function () {
    $announcement = postedAnnouncement(announcementUser('admin'));

    $this->actingAs(announcementUser('employee'))->put("/announcements/{$announcement->id}", announcementInput())->assertForbidden();

    expect($announcement->fresh()->title)->toBe('Office closure notice');
});

// What the dashboards and the live push receive.

test('the announcement as the dashboards receive it has a readable file name and no written text', function () {
    $announcement = postedAnnouncement(announcementUser('admin'));

    $row = collect(AnnouncementController::latest())->firstWhere('id', $announcement->id);

    expect($row['title'])->toBe('Office closure notice')
        ->and($row['body'])->toBeNull()
        ->and($row['attachments'])->toHaveCount(1)
        ->and($row['attachments'][0]['name'])->toBe(basename($announcement->attachments[0]))->toStartWith('Office closure notice')->toEndWith('.pdf')
        ->and($row['attachments'][0]['url'])->toContain('announcements/attachments/');
});

// The notices.

test('the email names the announcement and points to the announcements panel, and carries no text when there is none', function () {
    $employee = announcementUser('employee', ['first_name' => 'Maria']);

    $mail = (new AnnouncementEmailNotification('Office closure notice', null, 'Nov 20, 2026'))->toMail($employee);

    expect($mail->subject)->toBe('New announcement: Office closure notice')
        ->and($mail->greeting)->toBe('Hello, Maria!')
        ->and($mail->actionUrl)->toEndWith('/dashboard#announcements-panel')
        ->and($mail->introLines)->toBe([
            'A new announcement was posted on Nov 20, 2026.',
            '**Office closure notice**',
        ]);
});

test('the bell notice keeps working for an announcement that has no text', function () {
    $employee = announcementUser('employee');

    $data = (new AnnouncementNotification(7, 'Office closure notice', null, 'Nov 20, 2026', 'General', 'bg-gray-100 text-gray-600'))->toDatabase($employee);

    expect($data)->toMatchArray(['type' => 'announcement', 'announcement_id' => 7, 'title' => 'Office closure notice', 'body' => null]);
});
