<?php

namespace App\Policies;

use App\Models\User;

/**
 * Who may open the memo pages and files. Whether a particular memo is visible (published, or any for HR) is a question about
 * the memo and is answered by Memo::visibleTo; this is the question about the account.
 */
class MemoPolicy
{
    /** HR, or an account HR has approved. The approval is otherwise checked only at login, so an open session is checked here too. */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'superadmin']) || (bool) $user->is_approved;
    }
}
