<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveCredit extends Model
{
    protected $fillable = [
        'user_id', 'leave_type_id', 'year',
        'total_credits', 'used_credits', 'pending_credits',
    ];

    protected $casts = [
        'total_credits'   => 'float',
        'used_credits'    => 'float',
        'pending_credits' => 'float',
        'year'            => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    /** Days still available to take */
    public function getAvailableAttribute(): float
    {
        return max(0, $this->total_credits - $this->used_credits - $this->pending_credits);
    }
}