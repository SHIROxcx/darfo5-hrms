<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $notifications = $user->notifications()
            ->latest()
            ->take(20)
            ->get()
            ->map(fn($n) => [
                'id'         => $n->id,
                'data'       => $n->data,
                'read_at'    => $n->read_at,
                'created_at' => $n->created_at,
            ]);

        $pendingUsers = [];

        if ($user->hasRole('admin')) {
            $pendingUsers = User::role('employee')
                ->where('is_approved', false)
                ->whereNotNull('email_verified_at')
                ->latest()
                ->get()
                ->map(fn($u) => [
                    'id'         => $u->id,
                    'first_name' => $u->first_name,
                    'last_name'  => $u->last_name,
                    'email'      => $u->email,
                    'photo'      => $u->photo,
                    'created_at' => $u->created_at,
                ]);
        }

        return response()->json([
            'notifications' => $notifications,
            'pendingUsers'  => $pendingUsers,
        ]);
    }

    public function markAsRead(Request $request, string $id)
    {
        $notification = $request->user()
            ->notifications()
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json(['ok' => true]);
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['ok' => true]);
    }
}