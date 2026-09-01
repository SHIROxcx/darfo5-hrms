<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'message' => 'Welcome to DA RFO 5 - HRIS!',
            'url'     => '/profile',
        ];
    }
    
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your HRIS Account Has Been Approved')
            ->greeting("Hello, {$notifiable->first_name}!")
            ->line('The HR Administrator has reviewed and approved your account.')
            ->line('You can now log in to the HR Management System using your registered email and password.')
            ->action('Log In Now', url('/login'))
            ->line('If you did not register for this account, please ignore this email.')
            ->salutation('HRIS');
    }
}