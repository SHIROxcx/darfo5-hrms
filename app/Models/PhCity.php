<?php

namespace App\Models;

use App\Models\PhBarangay;
use Illuminate\Database\Eloquent\Model;

class PhCity extends Model
{
    protected $table = 'ph_cities';
    protected $fillable = ['code', 'province_id', 'name', 'zip_code', 'is_city'];
    protected $casts = ['is_city' => 'boolean'];
 
    public function province()
    {
        return $this->belongsTo(PhProvince::class, 'province_id');
    }
 
    public function barangays()
    {
        return $this->hasMany(PhBarangay::class, 'city_id');
    }
}