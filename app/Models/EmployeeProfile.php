<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeProfile extends Model
{
    /** The employment types a person can choose when signing up (the same list as resources/js/lib/employment-type.ts). */
    public const EMPLOYMENT_TYPES = ['jo', 'cos', 'pakyaw', 'permanent'];

    protected $fillable = [
        'user_id', 'sex', 'birth_place', 'civil_status', 'mobile_number',
        'employee_number', 'employment_type', 'position', 'salary_grade',
        'place_assign', 'division', 'section', 'date_hired', 'is_active',
        'gsis_number', 'sss_number', 'pagibig_number', 'tin_number', 'philhealth_number',
    ];

    protected $casts = [
        'date_hired' => 'date',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Normalize to lowercase on write, regardless of entry point (self
     * registration, admin edit, seeders). `employment_type` is compared
     * case-sensitively in a few places (LeaveService, DashboardController),
     * and free-text input from several different forms previously drifted
     * into inconsistent casing ("JO" vs "jo", "Permanent" vs "permanent").
     * Only covers writes through an Eloquent model instance — a raw
     * `Builder::update()` mass update bypasses mutators, so normalize
     * explicitly at any such call site too.
     */
    public function setEmploymentTypeAttribute(?string $value): void
    {
        $this->attributes['employment_type'] = $value !== null ? strtolower(trim($value)) : null;
    }
}
