<?php

namespace App\Services;

use App\Events\MemoPublished;
use App\Models\Memo;
use App\Models\User;
use App\Notifications\MemoEmailNotification;
use App\Notifications\MemoPublishedNotification;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Tells people a memo was published: the bell row and the email to every fully onboarded account except the publisher,
 * then the live push. The live push is last and wrapped, because Reverb being down must never fail a publish.
 */
class MemoNotifier
{
    public function publishedMemo(Memo $memo): void
    {
        $bell = new MemoPublishedNotification($memo);
        $email = new MemoEmailNotification($memo);

        User::where('is_approved', true)
            ->whereNotNull('email_verified_at')
            ->when($memo->published_by, fn ($query, $publisherId) => $query->where('id', '!=', $publisherId))
            ->select(['id', 'first_name', 'email'])
            ->chunkById(100, fn ($users) => $users->each(function (User $recipient) use ($bell, $email) {
                $recipient->notify($bell);
                $recipient->notify($email);
            }));

        try {
            event(new MemoPublished($memo));
        } catch (Throwable $e) {
            Log::warning('Memo broadcast failed: '.$e->getMessage());
        }
    }
}
