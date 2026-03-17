<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PdsChild extends Model {
    protected $table = 'pds_children';
    protected $fillable = ['user_id','full_name','date_of_birth','sort_order'];
    protected $casts = ['date_of_birth' => 'date'];
}
