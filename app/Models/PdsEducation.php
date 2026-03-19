<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PdsEducation extends Model
{
    protected $table = 'pds_education';
 
    protected $fillable = [
        'user_id', 'level', 'school_name', 'course',
        'period_from', 'period_to', 'highest_level',
        'year_graduated', 'honors_received',
    ];
 
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}