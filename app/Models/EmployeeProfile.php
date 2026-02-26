<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeProfile extends Model
{
    protected $fillable = [
        'user_id', 'sex', 'birth_place', 'civil_status', 'mobile_number',
        'employee_number', 'employment_type', 'position', 'salary_grade',
        'place_assign', 'division', 'date_hired', 'is_active',
        'gsis_number', 'sss_number', 'pagibig_number', 'tin_number', 'philhealth_number',
    ];

    protected $casts = [
        'date_hired' => 'date',
        'is_active'  => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}