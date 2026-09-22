<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Runs every minute (rather than once a day) so an announcement disappears
// for everyone — via the AnnouncementDeleted broadcast — within a minute of
// its auto-delete date arriving, instead of sitting until the next 00:05 run.
Schedule::command('announcements:delete-expired')->everyMinute();
Schedule::command('notifications:prune')->dailyAt('00:10');
