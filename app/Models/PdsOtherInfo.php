<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PdsOtherInfo extends Model {
    protected $table = 'pds_other_info';
    protected $fillable = ['user_id','special_skills','non_academic_distinctions','organization_memberships'];
    protected $casts = ['special_skills' => 'array','non_academic_distinctions' => 'array','organization_memberships' => 'array'];
}