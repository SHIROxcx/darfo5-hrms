<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AnnouncementNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly int    $announcementId,
        private readonly string $title,
        private readonly ?string $body,
        private readonly string $date,
        private readonly string $tag,
        private readonly string $tagColor,
    ) {}

    /**
     * Only the database channel — no email, no broadcast.
     * The real-time push is handled separately by AnnouncementPosted event.
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'             => 'announcement',
            'announcement_id'  => $this->announcementId,
            'title'            => $this->title,
            'body'             => $this->body,
            'date'             => $this->date,
            'tag'              => $this->tag,
            'tagColor'         => $this->tagColor,
        ];
    }
}