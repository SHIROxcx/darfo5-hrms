<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AnnouncementPosted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $announcement;

    public function __construct(array $announcement)
    {
        $this->announcement = $announcement;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('announcements'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'AnnouncementPosted';
    }

    public function broadcastWith(): array
    {
        return ['announcement' => $this->announcement];
    }
}