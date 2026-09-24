<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaveType extends Model
{
    protected $fillable = [
        'name', 'code', 'description',
        'default_credits', 'tracks_credits', 'charge_to_leave_type_id', 'csc_form_order',
        'requires_approval', 'is_active',
    ];

    protected $casts = [
        'requires_approval' => 'boolean',
        'is_active'         => 'boolean',
        'default_credits'   => 'integer',
        // false = no LeaveCredit balance is created, checked or deducted.
        // Placeholder for every CSC Form 6 type other than VL/SL, pending
        // HR policy on accrual (see LeaveTypeSeeder).
        'tracks_credits'    => 'boolean',
        'csc_form_order'    => 'integer',
    ];

    /** Active types with a LeaveCredit balance (VL, SL, WL). */
    public function scopeCreditTracked(Builder $query): Builder
    {
        return $query->where('is_active', true)->where('tracks_credits', true);
    }

    /** Active types shown as 6.A checkboxes on CSC Form 6, in form order. */
    public function scopeOnCscForm(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->whereNotNull('csc_form_order')
            ->orderBy('csc_form_order');
    }

    /**
     * The type whose credit balance this type draws from, if any (FL → VL).
     */
    public function chargeTo(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class, 'charge_to_leave_type_id');
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function leaveCredits(): HasMany
    {
        return $this->hasMany(LeaveCredit::class);
    }
}