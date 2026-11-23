<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PdsWorkExperience extends Model {
    protected $table = 'pds_work_experience';
    protected $fillable = [
        'user_id','date_from','date_to','is_present','position_title', 'office', 'department', 'supervisor', 'location','monthly_salary','salary_grade','status_of_appointment','is_government_service', 'attachment', 'accomplishments',
        'actual_duties', 'sort_order',
    ];
     protected $casts = ['date_from' => 'date:Y-m-d','date_to' => 'date:Y-m-d','is_present' => 'boolean','is_government_service' => 'boolean','monthly_salary' => 'decimal:2'];
}