<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeEligibility extends Model
{
    protected $fillable = [
        'user_id', 'eligibility', 'issue_month', 'issue_year', 'date_issued', 'place_issued',
    ];

    protected $casts = [
        'date_issued' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}