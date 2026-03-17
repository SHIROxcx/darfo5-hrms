<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PdsTraining extends Model {
    protected $table = 'pds_trainings';
    protected $fillable = [
        'user_id','title','date_from','date_to','number_of_hours','type_of_ld','conducted_by','sort_order',
    ];
    protected $casts = ['date_from' => 'date','date_to' => 'date'];
}
