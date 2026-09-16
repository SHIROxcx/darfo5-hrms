<?php

namespace App\Events;

use App\Models\LeaveCredit;
use App\Models\LeaveRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast when an admin approves or denies a leave request.
 *
 * Goes out on two channels at once:
 *  - user.{id} — the employee's own channel. Carries {message,url} (reused by
 *    the notification drawer's NotifRow) plus the updated request/credit so
 *    EmployeeLeaveIndex.tsx can patch its status badge, remarks and credit
 *    bar live.
 *  - admin.notifications — a pure data-sync signal (no badge/drawer entry,
 *    same idea as LeaveCalendarUpdated) so every admin tab's scoreboard and
 *    activity table stay in sync even when a *different* admin reviewed it.
 */
class LeaveRequestReviewed implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $payload;

    public int $userId;

    public function __construct(LeaveRequest $leaveRequest, LeaveCredit $credit)
    {
        $leaveRequest->loadMissing(['leaveType:id,name,code']);

        $this->userId = $leaveRequest->user_id;

        $verb = $leaveRequest->status === 'approved' ? 'approved' : 'denied';

        $this->payload = [
            'message' => "Your {$leaveRequest->leaveType->name} request ({$leaveRequest->start_date->format('M j')}–{$leaveRequest->end_date->format('M j')}) was {$verb}.",
            'url' => '/my-leave',
            'request' => [
                'id' => $leaveRequest->id,
                'status' => $leaveRequest->status,
                'remarks' => $leaveRequest->remarks,
                'leave_type' => $leaveRequest->leaveType->name,
                'type_code' => $leaveRequest->leaveType->code,
            ],
            'credit' => [
                'type_code' => $leaveRequest->leaveType->code,
                'total' => $credit->total_credits,
                'used' => $credit->used_credits,
                'pending' => $credit->pending_credits,
                'available' => $credit->available,
            ],
        ];
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.'.$this->userId),
            new PrivateChannel('admin.notifications'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'leave-request-reviewed';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
