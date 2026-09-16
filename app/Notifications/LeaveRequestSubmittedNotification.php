<?php

namespace App\Notifications;

use App\Models\LeaveRequest;
use Illuminate\Notifications\Notification;

/**
 * Deliberately NOT queued: it's sent right before the matching
 * LeaveRequestSubmitted broadcast (ShouldBroadcastNow, fires immediately) in
 * LeaveService::submitRequest(). Sending it synchronously guarantees the
 * database row exists before the admin's browser even receives the push, so
 * the notification drawer's "load from server" fetch can never race a queued
 * write and wipe out the live-pushed entry before it's been seen.
 */
class LeaveRequestSubmittedNotification extends Notification
{
    public function __construct(protected LeaveRequest $leaveRequest) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'message' => "{$this->leaveRequest->user->full_name} applied for {$this->leaveRequest->leaveType->name}.",
            'url' => '/admin/leave?highlight='.$this->leaveRequest->id,
        ];
    }
}
