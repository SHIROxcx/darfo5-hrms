<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Pure data-sync signal (no badge/drawer entry, unlike AccountApproved which
 * notifies the employee themselves) — lets the Employee Management table's
 * Approval column and action icons update live across every admin tab the
 * moment anyone approves or revokes access, from any entry point (the table
 * itself, its detail modal, or the notification drawer).
 */
class EmployeeApprovalUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $payload;

    public function __construct(User $user)
    {
        $this->payload = [
            'id' => $user->id,
            'is_approved' => $user->is_approved,
            'access_revoked_at' => $user->access_revoked_at,
        ];
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('admin.notifications')];
    }

    public function broadcastAs(): string
    {
        return 'employee-approval-updated';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
