<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PdsReference extends Model {
    protected $table = 'pds_references';
    protected $fillable = ['user_id','name','address','telephone','sort_order'];
}
