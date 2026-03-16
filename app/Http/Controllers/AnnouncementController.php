<?php

namespace App\Http\Controllers;

use App\Events\AnnouncementPosted;
use App\Models\Announcement;
use App\Models\User;
use App\Notifications\AnnouncementNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AnnouncementController extends Controller
{
    /**
     * Store a new announcement, broadcast it in real-time,
     * and persist a database notification for every user so it
     * survives page refreshes.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body'  => ['required', 'string', 'max:200'],
            'date'  => ['required', 'date'],
            'tag'   => ['required', 'string', 'in:Reminder,Policy,Health,Holiday,General'],
        ]);

        $user = $request->user();
        if (! $user->hasAnyRole(['admin', 'superadmin'])) {
            abort(403);
        }

        $announcement = Announcement::create([
            'title'      => $validated['title'],
            'body'       => $validated['body'],
            'date'       => $validated['date'],
            'tag'        => $validated['tag'],
            'created_by' => $user->id,
        ]);

        $tagColor = Announcement::tagColor($announcement->tag);
        $dateFormatted = Carbon::parse($announcement->date)->format('M d, Y');

        $payload = [
            'id'       => $announcement->id,
            'title'    => $announcement->title,
            'body'     => $announcement->body,
            'date'     => $dateFormatted,
            'tag'      => $announcement->tag,
            'tagColor' => $tagColor,
        ];

        // 1. Real-time WebSocket broadcast to all connected clients
        broadcast(new AnnouncementPosted($payload));

        // 2. Persist to notifications table for ALL approved users
        //    so the notification survives page refreshes.
        //    We chunk to avoid memory issues with large user bases.
        $notification = new AnnouncementNotification(
            announcementId: $announcement->id,
            title:          $announcement->title,
            body:           $announcement->body,
            date:           $dateFormatted,
            tag:            $announcement->tag,
            tagColor:       $tagColor,
        );

        User::where('is_approved', true)
            ->whereNotNull('email_verified_at')
            ->select('id')
            ->chunk(100, function ($users) use ($notification) {
                foreach ($users as $u) {
                    $u->notify($notification);
                }
            });

        return back()->with('success', 'Announcement posted successfully.');
    }

    /**
     * Return the latest announcements for initial page load.
     */
    public static function latest(int $limit = 20): array
    {
        return Announcement::latest()
            ->limit($limit)
            ->get()
            ->map(fn ($a) => [
                'id'       => $a->id,
                'title'    => $a->title,
                'body'     => $a->body,
                'date'     => Carbon::parse($a->date)->format('M d, Y'),
                'tag'      => $a->tag,
                'tagColor' => Announcement::tagColor($a->tag),
            ])
            ->toArray();
    }
}