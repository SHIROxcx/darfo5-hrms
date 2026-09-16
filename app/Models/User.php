<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasRoles, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name', 'email', 'password', 'public_token',
        'photo', 'first_name', 'middle_name',
        'last_name', 'name_ext', 'is_approved', 'access_revoked_at',
    ];

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            $user->public_token ??= (string) Str::uuid();
        });
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_approved' => 'boolean',
            'access_revoked_at' => 'datetime',
        ];
    }

    /**
     * True only for a genuinely new registrant awaiting their first review —
     * false for an employee whose access was later revoked, even though both
     * share is_approved === false. Anything that surfaces "pending approval"
     * counts/lists/notifications should use this (or scopePendingApproval)
     * rather than checking is_approved directly, so a revoke never re-flags
     * someone as a new pending approval.
     */
    public function isPendingApproval(): bool
    {
        return ! $this->is_approved && $this->access_revoked_at === null;
    }

    public function isRevoked(): bool
    {
        return ! $this->is_approved && $this->access_revoked_at !== null;
    }

    public function scopePendingApproval($query)
    {
        return $query->where('is_approved', false)->whereNull('access_revoked_at');
    }

    // Computed full name
    public function getFullNameAttribute(): string
    {
        return trim(
            implode(' ', array_filter([
                $this->first_name,
                $this->middle_name,
                $this->last_name,
                $this->name_ext,
            ]))
        );
    }

    public function sendEmailVerificationNotification(): void
    {
        // Intentionally empty — use OTP verification instead
    }

    public function employeeProfile(): HasOne
    {
        return $this->hasOne(EmployeeProfile::class);
    }

    public function pdsPersonalInfo()
    {
        return $this->hasOne(\App\Models\PdsPersonalInfo::class, 'user_id');
    }

    public function pdsEducation()
    {
        return $this->hasMany(\App\Models\PdsEducation::class, 'user_id');
    }

    public function pdsEligibilities()
    {
        return $this->hasMany(\App\Models\PdsEligibility::class, 'user_id');
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function leaveCredits(): HasMany
    {
        return $this->hasMany(LeaveCredit::class);
    }

    public function serviceRecords(): HasMany
    {
        return $this->hasMany(ServiceRecord::class)->orderBy('date_from');
    }
}
