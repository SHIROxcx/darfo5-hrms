<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceRecord extends Model
{
    protected $fillable = [
        'user_id',
        'date_from', 'date_to', 'designation', 'employment_status', 'salary',
        'station_place_of_assignment', 'branch', 'leave_without_pay',
        'separation_date', 'separation_cause', 'remarks',
    ];

    protected $casts = [
        'date_from'       => 'date:Y-m-d',
        'date_to'         => 'date:Y-m-d',
        'separation_date' => 'date:Y-m-d',
        'salary'          => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
