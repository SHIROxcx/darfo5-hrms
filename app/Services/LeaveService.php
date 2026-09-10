<?php

namespace App\Services;

use App\Models\LeaveCredit;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class LeaveService
{
    public function __construct(protected HolidayService $holidays) {}

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
        $days = $this->countWorkingDays($data['start_date'], $data['end_date']);
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

        if ($request->isPending()) {
            $credit->decrement('pending_credits', $request->days_requested);
        } else {
            // Was approved — restore used credits
            $credit->decrement('used_credits', $request->days_requested);
        }

        $request->update(['status' => 'cancelled']);
    }

    /**
     * Update a pending leave request (employee editing before review).
     */
    public function updateRequest(LeaveRequest $request, array $data): LeaveRequest
    {
        if (! $request->isPending()) {
            throw new \RuntimeException('Only pending requests can be edited.');
        }

        $newDays = $this->countWorkingDays($data['start_date'], $data['end_date']);
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
