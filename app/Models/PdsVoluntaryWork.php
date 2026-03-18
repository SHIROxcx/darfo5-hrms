<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PdsVoluntaryWork extends Model {
    protected $table = 'pds_voluntary_work';
    protected $fillable = [
        'user_id','organization_name','organization_address','date_from','date_to',
        'number_of_hours','position','sort_order',
    ];
     protected $casts = ['date_from' => 'date:Y-m-d','date_to' => 'date:Y-m-d'];
}