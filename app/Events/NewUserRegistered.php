<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewUserRegistered implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $payload;

    public function __construct(User $user)
    {
        $user->loadMissing('employeeProfile');

        $this->payload = [
            'id'               => $user->id,
            'first_name'       => $user->first_name,
            'last_name'        => $user->last_name,
            'name_ext'         => $user->name_ext ?? null,
            'email'            => $user->email,
            'photo'            => $user->photo,
            'is_approved'      => $user->is_approved,
            'email_verified_at'=> $user->email_verified_at,
            'created_at'       => $user->created_at->toISOString(),
            'employee_profile' => $user->employeeProfile,
        ];
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('admin.notifications')];
    }

    public function broadcastAs(): string
    {
        return 'new-user-registered';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}