<?php

namespace App\Events;

use App\Models\Memo;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Tells every open browser that a memo was published, so the bell updates without a refresh.
 *
 * The payload is the same {message, url} the notification drawer already reads. It never carries the memo itself:
 * the channel only proves "an employee", and the memo is read through the page, where its own checks apply.
 */
class MemoPublished implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    /** @var array{message: string, url: string} */
    public array $payload;

    public function __construct(Memo $memo)
    {
        $this->payload = [
            'message' => "New memo: {$memo->subject}",
            'url' => "/memos/{$memo->id}",
        ];
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('memos')];
    }

    public function broadcastAs(): string
    {
        return 'memo-published';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
