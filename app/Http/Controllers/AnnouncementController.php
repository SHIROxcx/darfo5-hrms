<?php

namespace App\Http\Controllers;

use App\Events\AnnouncementDeleted;
use App\Events\AnnouncementPosted;
use App\Models\Announcement;
use App\Models\User;
use App\Notifications\AnnouncementNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class AnnouncementController extends Controller
{
    // Helpers

    private static function formatPayload(Announcement $a): array
    {
        $dateFormatted = Carbon::parse($a->date)->format('M d, Y');

        // Build public URLs for attachments
        $attachments = collect($a->attachments ?? [])->map(fn ($path) => [
            'path' => $path,
            'url'  => Storage::url($path),
            'name' => basename($path),
        ])->values()->toArray();

        return [
            'id'          => $a->id,
            'title'       => $a->title,
            'body'        => $a->body,
            'date'        => $dateFormatted,
            'tag'         => $a->tag,
            'tagColor'    => self::tagColor($a->tag),
            'attachments' => $attachments,
            'auto_delete' => $a->auto_delete,
            'delete_after'=> $a->delete_after ? Carbon::parse($a->delete_after)->format('M d, Y') : null,
        ];
    }

    private static function tagColor(string $tag): string
    {
        return Announcement::tagColor($tag);
    }

    // Store

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'        => ['required', 'string', 'max:255'],
            'body'         => ['required', 'string', 'max:200'],
            'date'         => ['required', 'date'],
            'tag'          => ['required', 'string', 'in:Reminder,Policy,Health,Holiday,General'],
            'auto_delete'  => ['nullable', 'boolean'],
            'delete_after' => ['nullable', 'date', 'required_if:auto_delete,true'],
            'attachments.*'=> ['nullable', 'file', 'max:10240', 'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,zip'],
        ]);

        $user = $request->user();
        if (! $user->hasAnyRole(['admin', 'superadmin'])) abort(403);

        // Handle file uploads
        $paths = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $paths[] = $file->store('announcements/attachments', 'public');
            }
        }

        $announcement = Announcement::create([
            'title'        => $validated['title'],
            'body'         => $validated['body'],
            'date'         => $validated['date'],
            'tag'          => $validated['tag'],
            'created_by'   => $user->id,
            'attachments'  => $paths ?: null,
            'auto_delete'  => $validated['auto_delete'] ?? false,
            'delete_after' => ($validated['auto_delete'] ?? false) ? $validated['delete_after'] : null,
        ]);

        $payload = self::formatPayload($announcement);

        broadcast(new AnnouncementPosted($payload));

        $notification = new AnnouncementNotification(
            announcementId: $announcement->id,
            title:          $announcement->title,
            body:           $announcement->body,
            date:           $payload['date'],
            tag:            $announcement->tag,
            tagColor:       $payload['tagColor'],
        );

        User::where('is_approved', true)
            ->whereNotNull('email_verified_at')
            ->select('id')
            ->chunk(100, fn ($users) => $users->each->notify($notification));

        return back()->with('success', 'Announcement posted successfully.');
    }

    // Update

    public function update(Request $request, Announcement $announcement)
    {
        if (! $request->user()->hasAnyRole(['admin', 'superadmin'])) abort(403);

        $validated = $request->validate([
            'title'        => ['required', 'string', 'max:255'],
            'body'         => ['required', 'string', 'max:200'],
            'date'         => ['required', 'date'],
            'tag'          => ['required', 'string', 'in:Reminder,Policy,Health,Holiday,General'],
            'auto_delete'  => ['nullable', 'boolean'],
            'delete_after' => ['nullable', 'date', 'required_if:auto_delete,true'],
            'attachments.*'=> ['nullable', 'file', 'max:10240', 'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,zip'],
            'removed_attachments' => ['nullable', 'string'], // JSON array of paths to remove
        ]);

        // Handle removed attachments
        $existingPaths = $announcement->attachments ?? [];
        if (!empty($validated['removed_attachments'])) {
            $toRemove = json_decode($validated['removed_attachments'], true) ?? [];
            foreach ($toRemove as $path) {
                Storage::disk('public')->delete($path);
            }
            $existingPaths = array_values(array_diff($existingPaths, $toRemove));
        }

        // Handle new file uploads
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $existingPaths[] = $file->store('announcements/attachments', 'public');
            }
        }
        $announcement->update([
            'title'        => $validated['title'],
            'body'         => $validated['body'],
            'date'         => $validated['date'],
            'tag'          => $validated['tag'],
            'attachments'  => $existingPaths ?: null,
            'auto_delete'  => $validated['auto_delete'] ?? false,
            'delete_after' => ($validated['auto_delete'] ?? false) ? $validated['delete_after'] : null,
        ]);

        return back()->with('success', 'Announcement updated.');
    }

    // Destroy

    public function destroy(Request $request, Announcement $announcement)
    {
        if (! $request->user()->hasAnyRole(['admin', 'superadmin'])) abort(403);

        // Delete stored files
        foreach ($announcement->attachments ?? [] as $path) {
            Storage::disk('public')->delete($path);
        }

        $id = $announcement->id;
        $announcement->delete();

        broadcast(new AnnouncementDeleted($id));

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
}