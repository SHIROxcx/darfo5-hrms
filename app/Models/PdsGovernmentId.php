<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PdsGovernmentId extends Model {
    protected $table = 'pds_government_id';
    protected $fillable = [
        'user_id','id_type',
        'id_number',
        'date_of_issuance',
        'place_of_issuance', 
        'passport_photo', 
        'signature',
        'date_accomplished'
    ];
    protected $casts = ['date_of_issuance' => 'date:Y-m-d', 'date_accomplished' => 'date:Y-m-d'];
}