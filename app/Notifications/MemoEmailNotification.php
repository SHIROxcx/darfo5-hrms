<?php

namespace App\Notifications;

use App\Models\Memo;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Email copy of a published memo. Kept apart from MemoPublishedNotification because that one writes the bell row at once,
 * while email is queued. It names the memo and links to it; the memo itself is read in the HRIS, not in the email.
 */
class MemoEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private readonly int $memoId;

    private readonly string $subject;

    private readonly string $date;

    public function __construct(Memo $memo)
    {
        $this->memoId = $memo->id;
        $this->subject = $memo->subject;
        $this->date = $memo->memo_date->format('F j, Y');
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("New memo: {$this->subject}")
            ->greeting("Hello, {$notifiable->first_name}!")
            ->line("A new memo, dated {$this->date}, was published.")
            ->line("**{$this->subject}**")
            ->action('View Memo', url("/memos/{$this->memoId}"))
            ->salutation('DA RFO 5 - HRIS');
    }
}
