<?php

namespace App\Notifications;

use App\Models\Memo;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * The bell row for a published memo. Database only and not queued, so the row exists the moment the memo is published;
 * the email copy is MemoEmailNotification (queued), the live push is the MemoPublished event.
 */
class MemoPublishedNotification extends Notification
{
    use Queueable;

    private readonly int $memoId;

    private readonly string $subject;

    public function __construct(Memo $memo)
    {
        $this->memoId = $memo->id;
        $this->subject = $memo->subject;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** The drawer reads exactly these two keys. */
    public function toDatabase(object $notifiable): array
    {
        return [
            'message' => "New memo: {$this->subject}",
            'url' => "/memos/{$this->memoId}",
        ];
    }
}
