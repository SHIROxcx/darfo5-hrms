<?php

namespace App\Events;

use App\Models\LeaveRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast to every admin when an employee submits a new leave request.
 * Carries both a generic {message,url} shape (reused by the notification
 * drawer's existing NotifRow) and the full activity-table row shape, so
 * AdminLeaveIndex.tsx can prepend it to its local activity list without a
 * round trip.
 */
class LeaveRequestSubmitted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $payload;

    public function __construct(LeaveRequest $leaveRequest)
    {
        $leaveRequest->loadMissing([
            'user:id,first_name,last_name,name_ext,photo,email',
            'user.employeeProfile:user_id,position,employee_number',
            'leaveType:id,name,code',
        ]);

        $this->payload = [
            'message' => "{$leaveRequest->user->full_name} applied for {$leaveRequest->leaveType->name}.",
            'url' => $leaveRequest->adminUrl(),
            'row' => [
                'id' => $leaveRequest->id,
                'employee' => $leaveRequest->user->full_name,
                'email' => $leaveRequest->user->email,
                'photo' => $leaveRequest->user->photo,
                'employee_number' => $leaveRequest->user->employeeProfile?->employee_number,
                'job_title' => $leaveRequest->user->employeeProfile?->position,
                'leave_type_id' => $leaveRequest->leave_type_id,
                'leave_type' => $leaveRequest->leaveType->code === 'OTH' && $leaveRequest->other_leave_type
                    ? $leaveRequest->other_leave_type
                    : $leaveRequest->leaveType->name,
                'type_code' => $leaveRequest->leaveType->code,
                'form_type' => $leaveRequest->form_type,
                'submit_date' => $leaveRequest->created_at->toDateString(),
                'start_date' => $leaveRequest->start_date->toDateString(),
                'end_date' => $leaveRequest->end_date->toDateString(),
                'days' => $leaveRequest->days_requested,
                'reason' => $leaveRequest->reason,
                'remarks' => null,
                'status' => 'pending',
            ],
        ];
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('admin.notifications')];
    }

    public function broadcastAs(): string
    {
        return 'leave-request-submitted';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
