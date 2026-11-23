<?php

namespace App\Console\Commands;

use App\Events\AnnouncementDeleted;
use App\Models\Announcement;
use App\Models\RecordEvent;
use App\Support\AnnouncementFiles;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class DeleteExpiredAnnouncements extends Command
{
    protected $signature = 'announcements:delete-expired';

    protected $description = 'Archive announcements whose auto-delete date has passed';

    public function handle(): void
    {
        $expired = Announcement::where('auto_delete', true)
            ->whereNotNull('delete_after')
            ->whereDate('delete_after', '<=', Carbon::today())
            ->get();

        $archived = 0;

        foreach ($expired as $announcement) {
            // The record is kept (archived) and its files move off the public disk; only the employees' bell rows go.
            // If the files cannot be moved the announcement stays as it is, and the rest of the batch still runs.
            try {
                AnnouncementFiles::archive($announcement);
            } catch (\Throwable $e) {
                \Log::error("Announcement {$announcement->id} was not archived, its files could not be moved: ".$e->getMessage());

                continue;
            }

            // Delete related notifications
            \DB::table('notifications')
                ->whereJsonContains('data->announcement_id', $announcement->id)
                ->delete();

            $id = $announcement->id;
            RecordEvent::record($announcement, 'expired', ['delete_after' => $announcement->delete_after?->toDateString()]);
            $announcement->delete();
            $archived++;

            // Broadcast so all open tabs/clients remove it in real time. Best
            // effort only — if Reverb is down, the deletion above must still
            // stand and the rest of the batch must still run.
            try {
                broadcast(new AnnouncementDeleted($id));
            } catch (\Throwable $e) {
                \Log::warning('Announcement broadcast failed: '.$e->getMessage());
            }
        }

        $this->info("Archived {$archived} expired announcement(s).");
    }
}
