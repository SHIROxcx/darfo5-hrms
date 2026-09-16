<?php

namespace App\Notifications;

use App\Models\LeaveRequest;
use Illuminate\Notifications\Notification;

/**
 * Deliberately NOT queued: see LeaveRequestSubmittedNotification for why —
 * same reasoning applies here relative to the matching LeaveRequestReviewed
 * broadcast in LeaveService::approveRequest()/denyRequest().
 */
class LeaveRequestReviewedNotification extends Notification
{
    public function __construct(protected LeaveRequest $leaveRequest) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $verb = $this->leaveRequest->status === 'approved' ? 'approved' : 'denied';

        return [
            'message' => "Your {$this->leaveRequest->leaveType->name} request ({$this->leaveRequest->start_date->format('M j')}–{$this->leaveRequest->end_date->format('M j')}) was {$verb}.",
            'url' => '/my-leave',
        ];
    }
}
