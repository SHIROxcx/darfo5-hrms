<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HolidayException extends Model
{
    protected $fillable = [
        'holiday_id', 'year', 'observed_date',
    ];

    protected $casts = [
        'year' => 'integer',
        'observed_date' => 'date',
    ];

    public function holiday(): BelongsTo
    {
        return $this->belongsTo(Holiday::class);
    }
}
