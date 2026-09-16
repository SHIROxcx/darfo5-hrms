<?php

namespace App\Events;

use App\Models\LeaveRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast to every admin viewing the leave calendar whenever an approved
 * leave request starts or stops occupying its date range — i.e. on approval
 * ('added') and on cancellation of a previously-approved request ('removed').
 * Denials never touch the calendar since only approved requests appear on it.
 */
class LeaveCalendarUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $payload;

    public function __construct(LeaveRequest $leaveRequest, string $action)
    {
        $leaveRequest->loadMissing(['user:id,first_name,last_name,name_ext,photo', 'leaveType:id,name,code']);

        $dates = [];
        for ($d = $leaveRequest->start_date->copy(); $d->lte($leaveRequest->end_date); $d = $d->addDay()) {
            $dates[] = $d->toDateString();
        }

        $this->payload = [
            'action' => $action,
            'dates' => $dates,
            'entry' => [
                'id' => $leaveRequest->id,
                'employee' => $leaveRequest->user->full_name,
                'photo' => $leaveRequest->user->photo,
                'leave_type' => $leaveRequest->leaveType->name,
                'type_code' => $leaveRequest->leaveType->code,
            ],
        ];
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('admin.notifications')];
    }

    public function broadcastAs(): string
    {
        return 'leave-calendar-updated';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
