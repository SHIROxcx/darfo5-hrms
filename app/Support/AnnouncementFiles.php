<?php

namespace App\Support;

use App\Models\Announcement;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * An announcement's file: what it is called, where it is kept, and what happens to it when the announcement is archived
 * (deleted by hand or expired).
 */
final class AnnouncementFiles
{
    /**
     * Keep the file on the public disk, which is where employees open it from, and return its path.
     *
     * The stored name stays readable (it is what employees see and download), but only plain characters are kept, so it is
     * safe in an address, and the extension comes from what the file really is, never from what it was called: a PDF that
     * was named "page.html" must not be stored, and later served, as a web page. Each file gets its own folder, so two files
     * with the same name never overwrite each other.
     */
    public static function store(UploadedFile $file): string
    {
        $name = (string) preg_replace('/[^\p{L}\p{N} ._()-]+/u', '', pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $name = trim((string) preg_replace('/\s+/u', ' ', $name), ' .');
        $name = trim(mb_substr($name, 0, 100), ' .');

        return $file->storeAs('announcements/attachments/'.Str::uuid(), ($name === '' ? 'announcement' : $name).'.'.($file->extension() ?: 'bin'), 'public');
    }

    /** Move each attachment to "announcements/archive/{id}/" on the private disk and point the record at the new place. */
    public static function archive(Announcement $announcement): void
    {
        $public = Storage::disk('public');
        $private = Storage::disk('local');
        $kept = [];

        foreach ($announcement->attachments ?? [] as $path) {
            if (! is_string($path) || ! $public->exists($path)) {
                continue;
            }

            $target = "announcements/archive/{$announcement->id}/".basename($path);

            // Write the private copy first, so a failure leaves the public file where it was.
            $stream = $public->readStream($path);
            $private->writeStream($target, $stream);
            if (is_resource($stream)) {
                fclose($stream);
            }

            $public->delete($path);
            $kept[] = $target;
        }

        $announcement->attachments = $kept !== [] ? $kept : null;
        $announcement->save();
    }
}
