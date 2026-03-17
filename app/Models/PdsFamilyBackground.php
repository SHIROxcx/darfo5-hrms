<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PdsFamilyBackground extends Model {
    protected $table = 'pds_family_background';
    protected $fillable = [
        'user_id',
        'spouse_surname','spouse_first_name','spouse_middle_name','spouse_name_ext',
        'spouse_occupation','spouse_employer','spouse_business_address','spouse_telephone',
        'father_surname','father_first_name','father_middle_name','father_name_ext',
        'mother_surname','mother_first_name','mother_middle_name',
    ];
}