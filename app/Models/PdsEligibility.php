<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PdsEligibility extends Model
{
    protected $table = 'pds_eligibilities';
 
    protected $fillable = [
        'user_id', 'career_service', 'rating',
        'date_of_examination', 'place_of_examination',
        'license_number', 'license_validity', 'sort_order',
    ];
 
    protected $casts = ['date_of_examination' => 'date:Y-m-d', 'license_validity' => 'date:Y-m-d'];
 
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}