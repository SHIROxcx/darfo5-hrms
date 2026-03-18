<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhBarangay extends Model
{
    protected $table = 'ph_barangays';
    protected $fillable = ['code', 'city_id', 'name'];
 
    public function city()
    {
        return $this->belongsTo(PhCity::class, 'city_id');
    }
}
 