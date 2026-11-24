<?php

namespace App\Http\Controllers;

use App\Events\AnnouncementDeleted;
use App\Events\AnnouncementPosted;
use App\Events\AnnouncementUpdated;
use App\Models\Announcement;
use App\Models\RecordEvent;
use App\Models\User;
use App\Notifications\AnnouncementEmailNotification;
use App\Notifications\AnnouncementNotification;
use App\Support\AnnouncementFiles;
use App\Support\FileTitle;
use App\Support\UploadMessages;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * Announcements: HR uploads a file and employees see it on their dashboard. The file is the whole announcement: its title is
 * the file's name, and the date and category are filled in by the system. HR can still choose a date to have it removed.
 */
class AnnouncementController extends Controller
{
    private const FILE_TYPES = 'pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,zip';

    private const MAX_FILE_KB = 10240;

    // Helpers

    private static function formatPayload(Announcement $a): array
    {
        $dateFormatted = Carbon::parse($a->date)->format('M d, Y');

        // Build public URLs for the file(s). Announcements written before this change can hold several.
        $attachments = collect($a->attachments ?? [])->map(fn ($path) => [
            'path' => $path,
            'url' => Storage::url($path),
            'name' => basename($path),
        ])->values()->toArray();

        return [
            'id' => $a->id,
            'title' => $a->title,
            'body' => $a->body,
            'date' => $dateFormatted,
            'tag' => $a->tag,
            'tagColor' => self::tagColor($a->tag),
            'attachments' => $attachments,
            'auto_delete' => $a->auto_delete,
            'delete_after' => $a->delete_after ? Carbon::parse($a->delete_after)->format('M d, Y') : null,
        ];
    }

    private static function tagColor(string $tag): string
    {
        return Announcement::tagColor($tag);
    }

    /** The rules shared by posting and editing. Only the file differs: it is required to post and optional to edit. */
    private static function rules(bool $fileRequired): array
    {
        return [
            'file' => ['bail', $fileRequired ? 'required' : 'nullable', 'file', 'mimes:'.self::FILE_TYPES, 'max:'.self::MAX_FILE_KB],
            'auto_delete' => ['nullable', 'boolean'],
            'delete_after' => ['nullable', 'date', 'required_if:auto_delete,true', 'after:today'],
        ];
    }

    /**
     * What the admin reads when the file is refused. The form shows these as they are, so they have to make sense on their
     * own: Laravel's default ("The file field must not be greater than 10240 kilobytes.") does not.
     */
    private static function messages(): array
    {
        return [
            'file.required' => 'Attach the announcement file.',
            'file.file' => 'The announcement file must be a valid file.',
            'file.uploaded' => UploadMessages::failed(intdiv(self::MAX_FILE_KB, 1024)),
            'file.max' => 'The file is too large (maximum '.intdiv(self::MAX_FILE_KB, 1024).' MB).',
            'file.mimes' => 'That file type is not allowed. Attach a PDF, Word, Excel, PowerPoint, image or ZIP file.',
            'delete_after.required_if' => 'Please specify the delete-after date.',
            'delete_after.after' => 'The auto-delete date must be a future date — today or a past date is not allowed.',
        ];
    }

    // Store

    public function store(Request $request)
    {
        $user = $request->user();
        if (! $user->hasAnyRole(['admin', 'superadmin'])) {
            abort(403);
        }

        $validated = $request->validate(self::rules(fileRequired: true), self::messages());
        $file = $request->file('file');

        $announcement = Announcement::create([
            'title' => FileTitle::from($file, 'Announcement'),
            'body' => null,
            // Today's date in the office's time zone (the app itself runs in UTC, which is a day behind in the early morning).
            'date' => now(config('memos.timezone'))->toDateString(),
            'tag' => 'General',
            'created_by' => $user->id,
            'attachments' => [AnnouncementFiles::store($file)],
            'auto_delete' => $validated['auto_delete'] ?? false,
            'delete_after' => ($validated['auto_delete'] ?? false) ? $validated['delete_after'] : null,
        ]);

        RecordEvent::record($announcement, 'created', ['title' => $announcement->title], $user);

        $payload = self::formatPayload($announcement);

        self::broadcastSafely(new AnnouncementPosted($payload));

        $notification = new AnnouncementNotification(
            announcementId: $announcement->id,
            title: $announcement->title,
            body: $announcement->body,
            date: $payload['date'],
            tag: $announcement->tag,
            tagColor: $payload['tagColor'],
        );

        $emailNotification = new AnnouncementEmailNotification(
            title: $announcement->title,
            body: $announcement->body,
            date: $payload['date'],
        );

        User::where('is_approved', true)
            ->whereNotNull('email_verified_at')
            ->where('id', '!=', $user->id)
            ->select(['id', 'first_name', 'email'])
            ->chunk(100, fn ($users) => $users->each(function (User $recipient) use ($notification, $emailNotification) {
                $recipient->notify($notification);
                $recipient->notify($emailNotification);
            }));

        return back()->with('success', 'Announcement posted successfully.');
    }

    // Update

    public function update(Request $request, Announcement $announcement)
    {
        if (! $request->user()->hasAnyRole(['admin', 'superadmin'])) {
            abort(403);
        }

        $validated = $request->validate(self::rules(fileRequired: false), self::messages());

        $changes = [
            'auto_delete' => $validated['auto_delete'] ?? false,
            'delete_after' => ($validated['auto_delete'] ?? false) ? $validated['delete_after'] : null,
        ];

        // A new file replaces the old one (or ones, for an announcement written before this change), and the title follows it.
        $replaced = [];
        if ($file = $request->file('file')) {
            $replaced = $announcement->attachments ?? [];
            $changes['attachments'] = [AnnouncementFiles::store($file)];
            $changes['title'] = FileTitle::from($file, 'Announcement');
        }

        $announcement->update($changes);

        // The old files go only once the new one is saved.
        foreach ($replaced as $path) {
            Storage::disk('public')->delete($path);
        }

        // What this edit changed, for the history (updated_at always moves, so it does not count).
        $changed = array_keys(Arr::except($announcement->getChanges(), ['updated_at']));
        if ($changed !== []) {
            RecordEvent::record($announcement, 'updated', ['changed' => $changed], $request->user());
        }

        $payload = self::formatPayload($announcement);
        self::broadcastSafely(new AnnouncementUpdated($payload));

        return back()->with('success', 'Announcement updated.');
    }

    // Destroy

    public function destroy(Request $request, Announcement $announcement)
    {
        if (! $request->user()->hasAnyRole(['admin', 'superadmin'])) {
            abort(403);
        }

        // The record is kept: removing an announcement archives it (see the announcement history page). Its files are kept too,
        // but moved off the public disk, which anyone with the address can read.
        $id = $announcement->id;
        AnnouncementFiles::archive($announcement);

        // Delete all notifications referencing this announcement
        \DB::table('notifications')
            ->whereJsonContains('data->announcement_id', $id)
            ->delete();

        RecordEvent::record($announcement, 'deleted', [], $request->user());
        $announcement->delete();

        self::broadcastSafely(new AnnouncementDeleted($id));

        return back()->with('success', 'Announcement deleted.');
    }

    // Latest (for initial page load)

    public static function latest(int $limit = 20): array
    {
        return Announcement::latest()
            ->limit($limit)
            ->get()
            ->map(fn ($a) => self::formatPayload($a))
            ->toArray();
    }

    /**
     * Broadcasting is a best-effort real-time nicety (Reverb), not the source
     * of truth — the database write it follows has already succeeded by the
     * time this runs. If Reverb is unreachable, log it and move on instead of
     * turning a successful create/update/delete into a 500 for the admin.
     */
    private static function broadcastSafely(object $event): void
    {
        try {
            broadcast($event);
        } catch (\Throwable $e) {
            \Log::warning('Announcement broadcast failed: '.$e->getMessage());
        }
    }
}
