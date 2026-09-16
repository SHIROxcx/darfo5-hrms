<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PruneOldNotifications extends Command
{
    protected $signature = 'notifications:prune';

    protected $description = 'Delete notification-drawer entries older than 30 days (admin and employee alike)';

    public function handle(): void
    {
        $deleted = DB::table('notifications')
            ->where('created_at', '<', Carbon::now()->subDays(30))
            ->delete();

        $this->info("Deleted {$deleted} notification(s) older than 30 days.");
    }
}
