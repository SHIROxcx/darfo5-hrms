<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PdsPersonalInfo extends Model {
    protected $table = 'pds_personal_info';
    protected $fillable = [
        'user_id','date_of_birth','citizenship','citizenship_type','citizenship_country',
        'height','weight','blood_type','agency_employee_no',
        'res_house_no','res_street','res_subdivision','res_barangay','res_city','res_province','res_zipcode',
        'perm_house_no','perm_street','perm_subdivision','perm_barangay','perm_city','perm_province','perm_zipcode',
        'telephone','email',
    ];
    protected $casts = ['date_of_birth' => 'date'];
}
