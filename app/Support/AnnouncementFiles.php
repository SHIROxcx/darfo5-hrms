<?php

namespace App\Support;

use App\Models\Announcement;
use Illuminate\Support\Facades\Storage;

/**
 * What happens to an announcement's attachments when it is archived (deleted by hand or expired).
 *
 * The record and its files are kept for the history, but the public disk is reachable by address without a login, so the files
 * are moved to the private disk: removing an announcement must take its files off the web, not leave them readable forever.
 */
final class AnnouncementFiles
{
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
