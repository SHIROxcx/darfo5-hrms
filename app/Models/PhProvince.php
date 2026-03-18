<?php

namespace App\Models;

use App\Models\PhCity;
use Illuminate\Database\Eloquent\Model;

class PhProvince extends Model
{
    protected $table = 'ph_provinces';
    protected $fillable = ['code', 'name', 'region'];
 
    public function cities()
    {
        return $this->hasMany(PhCity::class, 'province_id');
    }
}