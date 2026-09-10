<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Holiday extends Model
{
    protected $fillable = [
        'name', 'type', 'is_recurring', 'date', 'month', 'day',
    ];

    protected $casts = [
        'is_recurring' => 'boolean',
        'date' => 'date',
        'month' => 'integer',
        'day' => 'integer',
    ];

    public function exceptions(): HasMany
    {
        return $this->hasMany(HolidayException::class);
    }
}
