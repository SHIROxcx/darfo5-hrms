<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Email copy of an announcement. Kept separate from AnnouncementNotification
 * because that one writes the drawer entry synchronously, while email is queued.
 */
class AnnouncementEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /** @param  string|null  $body  the text of an announcement written before announcements became files; null otherwise */
    public function __construct(
        private readonly string $title,
        private readonly ?string $body,
        private readonly string $date,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject("New announcement: {$this->title}")
            ->greeting("Hello, {$notifiable->first_name}!")
            ->line("A new announcement was posted on {$this->date}.")
            ->line("**{$this->title}**");

        if (filled($this->body)) {
            $mail->line($this->body);
        }

        return $mail
            ->action('View Announcement', url('/dashboard#announcements-panel'))
            ->salutation('DA RFO 5 - HRIS');
    }
}
