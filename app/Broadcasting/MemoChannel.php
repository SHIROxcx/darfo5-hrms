<?php

namespace App\Broadcasting;

use App\Models\User;

/**
 * Who may listen for "a memo was published" on the private `memos` channel: HR (admin, superadmin), and any employee whose
 * account is fully onboarded (approved by an admin and email verified). The payload is only a message and a link, never the memo.
 */
class MemoChannel
{
    public function join(User $user): bool
    {
        if ($user->hasAnyRole(['admin', 'superadmin'])) {
            return true;
        }

        return (bool) $user->is_approved && $user->email_verified_at !== null;
    }
}
