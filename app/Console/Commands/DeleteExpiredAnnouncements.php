<?php

namespace App\Console\Commands;

use App\Events\AnnouncementDeleted;
use App\Models\Announcement;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class DeleteExpiredAnnouncements extends Command
{
    protected $signature   = 'announcements:delete-expired';
    protected $description = 'Delete announcements whose auto-delete date has passed';

    public function handle(): void
    {
        $expired = Announcement::where('auto_delete', true)
            ->whereNotNull('delete_after')
            ->whereDate('delete_after', '<=', Carbon::today())
            ->get();

        foreach ($expired as $announcement) {
            // Delete stored attachment files
            foreach ($announcement->attachments ?? [] as $path) {
                Storage::disk('public')->delete($path);
            }

            // Delete related notifications
            \DB::table('notifications')
                ->whereJsonContains('data->announcement_id', $announcement->id)
                ->delete();

            $id = $announcement->id;
            $announcement->delete();

            // Broadcast so all open tabs/clients remove it in real time
            broadcast(new AnnouncementDeleted($id));
        }

        $this->info("Deleted {$expired->count()} expired announcement(s).");
    }
}