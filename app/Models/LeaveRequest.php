<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeaveRequest extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'leave_type_id', 'start_date', 'end_date',
        'days_requested', 'reason', 'status',
        'reviewed_by', 'reviewed_at', 'remarks', 'attachment_path',
    ];

    protected $casts = [
        'start_date'    => 'date',
        'end_date'      => 'date',
        'reviewed_at'   => 'datetime',
        'days_requested'=> 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function isPending(): bool   { return $this->status === 'pending'; }
    public function isApproved(): bool  { return $this->status === 'approved'; }
    public function isDenied(): bool    { return $this->status === 'denied'; }
    public function isCancelled(): bool { return $this->status === 'cancelled'; }
}