<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\RecordEvent;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementHistoryController extends Controller
{
    /** Archived announcements (removed by hand or expired), the most recently removed first. */
    public function index(): Response
    {
        $page = Announcement::onlyTrashed()
            ->with('creator:id,name')
            ->orderByDesc('deleted_at')
            ->orderByDesc('id')
            ->paginate(20);

        // Who removed each one and why: the last "deleted" or "expired" line of its history, fetched in one query.
        $removals = RecordEvent::query()
            ->where('subject_type', Announcement::class)
            ->whereIn('subject_id', $page->pluck('id'))
            ->whereIn('action', ['deleted', 'expired'])
            ->with('user:id,name')
            ->orderBy('id')
            ->get()
            ->keyBy('subject_id');

        $page->through(function (Announcement $announcement) use ($removals) {
            $removal = $removals->get($announcement->id);

            return [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'tag' => $announcement->tag,
                'date' => Carbon::parse($announcement->date)->toDateString(),
                'body' => $announcement->body,
                'created_by_name' => $announcement->creator?->name,
                'deleted_at' => $announcement->deleted_at?->toIso8601String(),
                'reason' => $removal?->action ?? 'deleted',
                'removed_by' => $removal?->user?->name,
            ];
        });

        return Inertia::render('Admin/Announcements/History', ['announcements' => $page]);
    }
}
