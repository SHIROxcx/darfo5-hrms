<?php

namespace App\Events;

use App\Models\LeaveRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast to every admin when an employee cancels their own leave request.
 * Pure data-sync signal (no badge/drawer entry, same idea as
 * LeaveCalendarUpdated) — its whole purpose is to patch the row to
 * "cancelled" in every open Admin Leave Management tab (including closing
 * out a review modal that happens to be open on it) so nobody approves or
 * denies a request the employee just pulled back.
 */
class LeaveRequestCancelled implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $payload;

    public function __construct(LeaveRequest $leaveRequest, string $previousStatus)
    {
        $leaveRequest->loadMissing(['user:id,first_name,last_name,name_ext']);

        $this->payload = [
            'id' => $leaveRequest->id,
            'previous_status' => $previousStatus,
            'employee' => $leaveRequest->user->full_name,
        ];
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('admin.notifications')];
    }

    public function broadcastAs(): string
    {
        return 'leave-request-cancelled';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
