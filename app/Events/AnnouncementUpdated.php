<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AnnouncementUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(public array $payload) {}

    public function broadcastOn(): Channel
    {
        return new Channel('announcements');
    }

    public function broadcastAs(): string
    {
        return 'announcement.updated';
    }
}