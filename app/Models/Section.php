<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    protected $fillable = [
        'division_id',
        'name',
        'abbreviation'
    ];

    public function division()
    {
        return $this->belongsTo(Division::class);
    }
}
