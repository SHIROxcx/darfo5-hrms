<?php

namespace App\Services;

use App\Events\LeaveCalendarUpdated;
use App\Events\LeaveRequestCancelled;
use App\Events\LeaveRequestReviewed;
use App\Events\LeaveRequestSubmitted;
use App\Models\LeaveCredit;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use App\Notifications\LeaveRequestReviewedNotification;
use App\Notifications\LeaveRequestSubmittedNotification;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\Notification;

class LeaveService
{
    /**
     * Employment types limited to Wellness Leave (code `WL`) only — no
     * access to Vacation/Sick/Privilege Leave. Matched case-insensitively
     * since `employee_profiles.employment_type` is free text (`JO`, `COS`,
     * `Pakyaw`, `Permanent`, inconsistently cased across entry points).
     */
    protected const WELLNESS_ONLY_EMPLOYMENT_TYPES = ['jo', 'cos', 'pakyaw'];

    protected const WELLNESS_LEAVE_CODE = 'WL';

    protected const WELLNESS_LEAVE_MAX_CONSECUTIVE_DAYS = 3;

    public function __construct(protected HolidayService $holidays) {}

    /**
     * Whether this user may only file Wellness Leave (JO / COS / Pakyaw),
     * as opposed to having access to every active leave type (Permanent).
     */
    public function restrictedToWellnessOnly(User $user): bool
    {
        $user->loadMissing('employeeProfile');
        $type = strtolower(trim($user->employeeProfile?->employment_type ?? ''));

        return in_array($type, self::WELLNESS_ONLY_EMPLOYMENT_TYPES, true);
    }

    /**
     * Enforce the employment-type gate and the Wellness-Leave-specific
     * rules (max 3 consecutive days, can't abut a holiday) shared by
     * submitRequest() and updateRequest(). Throws RuntimeException — same
     * "business rule violation" convention as the credit-availability
     * checks around it — on any failure.
     */
    protected function assertLeaveIsAllowed(User $user, LeaveType $leaveType, string $startDate, string $endDate, float $days): void
    {
        if ($this->restrictedToWellnessOnly($user) && $leaveType->code !== self::WELLNESS_LEAVE_CODE) {
            throw new \RuntimeException('Only Wellness Leave is available for your employment type.');
        }

        if ($leaveType->code !== self::WELLNESS_LEAVE_CODE) {
            return;
        }

        if ($days > self::WELLNESS_LEAVE_MAX_CONSECUTIVE_DAYS) {
            throw new \RuntimeException('Wellness Leave is limited to a maximum of '.self::WELLNESS_LEAVE_MAX_CONSECUTIVE_DAYS.' consecutive days.');
        }

        $dayBefore = Carbon::parse($startDate)->subDay();
        $dayAfter = Carbon::parse($endDate)->addDay();

        if ($this->holidays->isHoliday($dayBefore) || $this->holidays->isHoliday($dayAfter)) {
            throw new \RuntimeException('Wellness Leave cannot be filed immediately before or after a holiday.');
        }
    }

    /**
     * Count working days between two dates (Mon–Fri, excluding admin-managed holidays).
     */
    public function countWorkingDays(string $startDate, string $endDate): float
    {
        $period = CarbonPeriod::create($startDate, $endDate);
        $count = 0;

        foreach ($period as $day) {
            if ($day->isWeekday() && ! $this->holidays->isHoliday($day)) {
                $count++;
            }
        }

        return (float) $count;
    }

    /**
     * Ensure a LeaveCredit row exists for the given user / type / year.
     * Seeds it with the leave type's default_credits if creating.
     */
    public function ensureCredit(int $userId, int $leaveTypeId, int $year): LeaveCredit
    {
        return LeaveCredit::firstOrCreate(
            ['user_id' => $userId, 'leave_type_id' => $leaveTypeId, 'year' => $year],
            [
                'total_credits' => LeaveType::findOrFail($leaveTypeId)->default_credits,
                'used_credits' => 0,
                'pending_credits' => 0,
            ]
        );
    }

    /**
     * Seed leave credits for ALL active leave types for a given user + year.
     * Call this when a new employee is approved or at the start of a new year.
     */
    public function seedCreditsForUser(User $user, int $year): void
    {
        foreach (LeaveType::where('is_active', true)->get() as $type) {
            LeaveCredit::firstOrCreate(
                ['user_id' => $user->id, 'leave_type_id' => $type->id, 'year' => $year],
                [
                    'total_credits' => $type->default_credits,
                    'used_credits' => 0,
                    'pending_credits' => 0,
                ]
            );
        }
    }

    /**
     * Submit a new leave request.
     * Validates sufficient credits and reserves them as pending.
     */
    public function submitRequest(User $user, array $data): LeaveRequest
    {
        $leaveType = LeaveType::findOrFail($data['leave_type_id']);
        $days = $this->countWorkingDays($data['start_date'], $data['end_date']);
        $this->assertLeaveIsAllowed($user, $leaveType, $data['start_date'], $data['end_date'], $days);

        $year = Carbon::parse($data['start_date'])->year;
        $credit = $this->ensureCredit($user->id, $data['leave_type_id'], $year);

        if ($credit->available < $days) {
            throw new \RuntimeException(
                "Insufficient leave credits. Available: {$credit->available}, Requested: {$days}."
            );
        }

        $request = LeaveRequest::create([
            'user_id' => $user->id,
            'leave_type_id' => $data['leave_type_id'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'days_requested' => $days,
            'reason' => $data['reason'] ?? null,
            'status' => 'pending',
        ]);

        $credit->increment('pending_credits', $days);

        $request->loadMissing(['user:id,first_name,last_name,name_ext,photo,email', 'user.employeeProfile:user_id,position,employee_number', 'leaveType:id,name,code']);
        Notification::send(User::role('admin')->get(), new LeaveRequestSubmittedNotification($request));
        LeaveRequestSubmitted::dispatch($request);

        return $request;
    }

    /**
     * Approve a leave request.
     */
    public function approveRequest(LeaveRequest $request, User $reviewer, ?string $remarks = null): void
    {
        if (! $request->isPending()) {
            throw new \RuntimeException('Only pending requests can be approved.');
        }

        $year = $request->start_date->year;
        $credit = $this->ensureCredit($request->user_id, $request->leave_type_id, $year);

        $request->update([
            'status' => 'approved',
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'remarks' => $remarks,
        ]);

        // Move days from pending → used
        $credit->decrement('pending_credits', $request->days_requested);
        $credit->increment('used_credits', $request->days_requested);

        LeaveCalendarUpdated::dispatch($request, 'added');

        $request->loadMissing(['user', 'leaveType']);
        $request->user->notify(new LeaveRequestReviewedNotification($request));
        LeaveRequestReviewed::dispatch($request, $credit->fresh());
    }

    /**
     * Deny a leave request.
     */
    public function denyRequest(LeaveRequest $request, User $reviewer, ?string $remarks = null): void
    {
        if (! $request->isPending()) {
            throw new \RuntimeException('Only pending requests can be denied.');
        }

        $year = $request->start_date->year;
        $credit = $this->ensureCredit($request->user_id, $request->leave_type_id, $year);

        $request->update([
            'status' => 'denied',
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'remarks' => $remarks,
        ]);

        // Release pending hold
        $credit->decrement('pending_credits', $request->days_requested);

        $request->loadMissing(['user', 'leaveType']);
        $request->user->notify(new LeaveRequestReviewedNotification($request));
        LeaveRequestReviewed::dispatch($request, $credit->fresh());
    }

    /**
     * Cancel a leave request (by the employee themselves).
     * Only pending or approved (future) requests can be cancelled.
     */
    public function cancelRequest(LeaveRequest $request): void
    {
        if (! in_array($request->status, ['pending', 'approved'])) {
            throw new \RuntimeException('Only pending or approved requests can be cancelled.');
        }

        $year = $request->start_date->year;
        $credit = $this->ensureCredit($request->user_id, $request->leave_type_id, $year);

        $wasApproved = $request->isApproved();
        $previousStatus = $request->status;

        if ($request->isPending()) {
            $credit->decrement('pending_credits', $request->days_requested);
        } else {
            // Was approved — restore used credits
            $credit->decrement('used_credits', $request->days_requested);
        }

        $request->update(['status' => 'cancelled']);

        if ($wasApproved) {
            LeaveCalendarUpdated::dispatch($request, 'removed');
        }

        LeaveRequestCancelled::dispatch($request, $previousStatus);
    }

    /**
     * Update a pending leave request (employee editing before review).
     */
    public function updateRequest(LeaveRequest $request, array $data): LeaveRequest
    {
        if (! $request->isPending()) {
            throw new \RuntimeException('Only pending requests can be edited.');
        }

        $leaveType = LeaveType::findOrFail($data['leave_type_id']);
        $newDays = $this->countWorkingDays($data['start_date'], $data['end_date']);
        $this->assertLeaveIsAllowed($request->user, $leaveType, $data['start_date'], $data['end_date'], $newDays);

        $year = Carbon::parse($data['start_date'])->year;
        $credit = $this->ensureCredit($request->user_id, $data['leave_type_id'], $year);

        // Release old pending
        $credit->decrement('pending_credits', $request->days_requested);

        // Check credits minus old hold
        $available = $credit->fresh()->available;
        if ($available < $newDays) {
            // Restore old pending and throw
            $credit->increment('pending_credits', $request->days_requested);
            throw new \RuntimeException(
                "Insufficient leave credits. Available: {$available}, Requested: {$newDays}."
            );
        }

        $request->update([
            'leave_type_id' => $data['leave_type_id'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'days_requested' => $newDays,
            'reason' => $data['reason'] ?? $request->reason,
        ]);

        $credit->increment('pending_credits', $newDays);

        return $request->fresh();
    }
}
