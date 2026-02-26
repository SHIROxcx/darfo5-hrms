<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeGraduateStudy extends Model
{
    protected $fillable = [
        'user_id', 'program', 'start_month', 'start_year', 'end_month', 'end_year',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}