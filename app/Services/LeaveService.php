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
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * Credit tracking is per leave type (`leave_types.tracks_credits`). Only VL,
 * SL and WL track credits. FL is charged against VL
 * (`charge_to_leave_type_id`). Every other CSC Form 6 type is a PLACEHOLDER:
 * it can be filed, but no LeaveCredit row is created, checked or deducted,
 * pending HR policy on accrual (see LeaveTypeSeeder). Every credit operation
 * below goes through creditFor(), which returns null for those types.
 */
class LeaveService
{
    /**
     * Employment types limited to Wellness Leave (code `WL`) only — no
     * access to Vacation/Sick/Privilege Leave. Matched case-insensitively
     * since `employee_profiles.employment_type` is free text (`JO`, `COS`,
     * `Pakyaw`, `Permanent`, inconsistently cased across entry points).
     */
    protected const WELLNESS_ONLY_EMPLOYMENT_TYPES = ['jo', 'cos', 'pakyaw'];

    /** The only employment type that may file CSC Form 6. */
    protected const CSC_FORM_EMPLOYMENT_TYPE = 'permanent';

    protected const WELLNESS_LEAVE_CODE = 'WL';

    protected const WELLNESS_LEAVE_MAX_CONSECUTIVE_DAYS = 3;

    public function __construct(protected HolidayService $holidays) {}

    /**
     * Whether this user may only file Wellness Leave (JO / COS / Pakyaw),
     * as opposed to having access to every active leave type (Permanent).
     */
    public function restrictedToWellnessOnly(User $user): bool
    {
        return in_array($this->employmentType($user), self::WELLNESS_ONLY_EMPLOYMENT_TYPES, true);
    }

    /**
     * Whether this user may file CSC Form 6. Permanent only. A missing or
     * unrecognised employment type is denied by default.
     */
    public function canFileCscForm(User $user): bool
    {
        return $this->employmentType($user) === self::CSC_FORM_EMPLOYMENT_TYPE;
    }

    protected function employmentType(User $user): string
    {
        $user->loadMissing('employeeProfile');

        return strtolower(trim($user->employeeProfile?->employment_type ?? ''));
    }

    /**
     * Credit-tracked types whose balances this user holds and sees as credit
     * bars: Wellness Leave only for JO/COS/Pakyaw, and VL, SL and WL for
     * everyone else.
     */
    public function creditLeaveTypes(User $user): Collection
    {
        $query = LeaveType::creditTracked()->orderBy('name');

        if ($this->restrictedToWellnessOnly($user)) {
            $query->where('code', self::WELLNESS_LEAVE_CODE);
        }

        return $query->get();
    }

    /**
     * Leave types that can be filed through the simple modal (the `simple`
     * form): Wellness Leave only, for every employment type. Every CSC leave
     * type (VL and SL included) is filed on CSC Form 6 (/my-leave/apply),
     * which is Permanent only.
     */
    public function simpleFormLeaveTypes(User $user): Collection
    {
        return LeaveType::creditTracked()->where('code', self::WELLNESS_LEAVE_CODE)->get();
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

        if (! $this->simpleFormLeaveTypes($user)->contains('id', $leaveType->id)) {
            throw new \RuntimeException("{$leaveType->name} must be filed using the Application for Leave form.");
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
     * Callers must only pass credit-tracked types; use creditFor() when the
     * type may be a placeholder.
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
     * The LeaveCredit row a request of this type reserves and deducts from,
     * for a user / year:
     *  - the type's own balance when it tracks credits (VL, SL, WL);
     *  - the charged type's balance when it has one (FL → VL, CSC rule);
     *  - null for placeholder CSC types, with nothing to reserve, check or deduct.
     */
    public function creditFor(int $userId, LeaveType $leaveType, int $year): ?LeaveCredit
    {
        $source = $leaveType->charge_to_leave_type_id ? $leaveType->chargeTo : $leaveType;

        return $source?->tracks_credits
            ? $this->ensureCredit($userId, $source->id, $year)
            : null;
    }

    /**
     * Seed leave credits for every credit-tracked leave type for a given
     * user + year. Call this when a new employee is approved or at the
     * start of a new year.
     */
    public function seedCreditsForUser(User $user, int $year): void
    {
        foreach (LeaveType::creditTracked()->get() as $type) {
            $this->ensureCredit($user->id, $type->id, $year);
        }
    }

    /**
     * Throw if a tracked credit can't cover the requested days. A null
     * credit (placeholder type) never blocks.
     */
    protected function assertSufficientCredit(?LeaveCredit $credit, float $days): void
    {
        if ($credit && $credit->available < $days) {
            throw new \RuntimeException(
                "Insufficient leave credits. Available: {$credit->available}, Requested: {$days}."
            );
        }
    }

    /**
     * Submit a new leave request through the simple modal.
     * Validates sufficient credits and reserves them as pending.
     */
    public function submitRequest(User $user, array $data): LeaveRequest
    {
        $leaveType = LeaveType::findOrFail($data['leave_type_id']);
        $days = $this->countWorkingDays($data['start_date'], $data['end_date']);
        $this->assertLeaveIsAllowed($user, $leaveType, $data['start_date'], $data['end_date'], $days);

        $year = Carbon::parse($data['start_date'])->year;
        $credit = $this->creditFor($user->id, $leaveType, $year);
        $this->assertSufficientCredit($credit, $days);

        $request = LeaveRequest::create([
            'user_id' => $user->id,
            'leave_type_id' => $data['leave_type_id'],
            'form_type' => LeaveRequest::FORM_SIMPLE,
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'days_requested' => $days,
            'reason' => $data['reason'] ?? null,
            'status' => 'pending',
        ]);

        $credit?->increment('pending_credits', $days);

        $this->notifyAdminsOfSubmission($request);

        return $request;
    }

    /**
     * Build an unsaved CSC Form 6 application from validated input
     * (StoreLeaveApplicationRequest). The PDF preview and the final submit
     * both use this, so what the employee previews is exactly what gets saved.
     *
     * When editing, pass the original application so the form keeps its
     * original Date of Filing.
     */
    public function buildCscApplication(User $user, array $data, ?LeaveRequest $original = null): LeaveRequest
    {
        if (! $this->canFileCscForm($user)) {
            throw new \RuntimeException('The Application for Leave form is available to Permanent employees only.');
        }

        $leaveType = LeaveType::onCscForm()->findOrFail($data['leave_type_id']);
        $days = $this->countWorkingDays($data['start_date'], $data['end_date']);

        if ($days < 1) {
            throw new \RuntimeException('The selected dates contain no working days.');
        }

        $isOthers = $leaveType->code === 'OTH';

        $snapshot = $this->applicantSnapshot($user);
        if ($original?->applicant_snapshot['date_of_filing'] ?? null) {
            $snapshot['date_of_filing'] = $original->applicant_snapshot['date_of_filing'];
        }

        $request = new LeaveRequest([
            'user_id' => $user->id,
            'leave_type_id' => $leaveType->id,
            'form_type' => LeaveRequest::FORM_CSC6,
            'applicant_snapshot' => $snapshot,
            'other_leave_type' => $isOthers ? $data['other_leave_type'] : null,
            'detail_type' => $data['detail_type'] ?? null,
            'detail_text' => $data['detail_text'] ?? null,
            'commutation_requested' => (bool) $data['commutation_requested'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'days_requested' => $days,
            'status' => 'pending',
        ]);
        $request->setRelation('leaveType', $leaveType);
        $request->setRelation('user', $user);

        return $request;
    }

    /**
     * Submit a CSC Form 6 application. Credit-tracked types (VL, SL) are
     * checked and reserved as pending. Placeholder types are not.
     */
    public function submitCscApplication(User $user, array $data): LeaveRequest
    {
        $request = $this->buildCscApplication($user, $data);
        $credit = $this->creditFor($user->id, $request->leaveType, $request->start_date->year);
        $this->assertSufficientCredit($credit, $request->days_requested);

        DB::transaction(function () use ($request, $credit) {
            $request->attested_at = now();
            $request->save();
            $credit?->increment('pending_credits', $request->days_requested);
        });

        $this->notifyAdminsOfSubmission($request);

        return $request;
    }

    /**
     * Update a pending CSC Form 6 application (the employee editing before
     * review). Moves the pending credit hold from the old type/days to the
     * new ones, and restores it if the new request can't be covered.
     */
    public function updateCscApplication(LeaveRequest $existing, array $data): LeaveRequest
    {
        if (! $existing->isPending()) {
            throw new \RuntimeException('Only pending requests can be edited.');
        }
        if (! $existing->isCscForm()) {
            throw new \RuntimeException('This request was not filed on the Application for Leave form.');
        }

        $existing->loadMissing(['leaveType', 'user']);
        $updated = $this->buildCscApplication($existing->user, $data, $existing);

        $oldCredit = $this->creditFor($existing->user_id, $existing->leaveType, $existing->start_date->year);
        $newCredit = $this->creditFor($existing->user_id, $updated->leaveType, $updated->start_date->year);

        DB::transaction(function () use ($existing, $updated, $oldCredit, $newCredit) {
            $oldCredit?->decrement('pending_credits', $existing->days_requested);
            $this->assertSufficientCredit($newCredit?->fresh(), $updated->days_requested);

            $existing->fill($updated->only([
                'leave_type_id', 'applicant_snapshot', 'other_leave_type', 'detail_type',
                'detail_text', 'commutation_requested', 'start_date', 'end_date', 'days_requested',
            ]));
            $existing->attested_at = now();
            $existing->save();

            $newCredit?->increment('pending_credits', $existing->days_requested);
        });

        return $existing->fresh(['leaveType']);
    }

    /**
     * Pre-fills 7.A (Certification of Leave Credits) from the live VL and SL
     * balances, for the admin to confirm or correct. "Total Earned" is the
     * balance before this application: this request's own pending hold is
     * added back.
     *
     * @return array<string, float|string>
     */
    public function certificationFor(LeaveRequest $request): array
    {
        $request->loadMissing('leaveType.chargeTo');
        $charged = $request->leaveType->chargeTo ?? $request->leaveType;
        $year = $request->start_date->year;
        $result = ['credits_as_of' => now(config('leave.timezone'))->toDateString()];

        foreach (['VL' => 'vl', 'SL' => 'sl'] as $code => $prefix) {
            $type = LeaveType::where('code', $code)->first();
            $credit = $type ? $this->ensureCredit($request->user_id, $type->id, $year) : null;
            $appliesHere = $charged->code === $code;
            $thisHold = $appliesHere && $request->isPending() ? $request->days_requested : 0;

            $earned = $credit ? $credit->available + $thisHold : 0;
            $less = $appliesHere ? $request->days_requested : 0;

            $result["{$prefix}_total_earned"] = round($earned, 2);
            $result["{$prefix}_less_this"] = round($less, 2);
            $result["{$prefix}_balance"] = round($earned - $less, 2);
        }

        return $result;
    }

    /**
     * Items 1–5 of CSC Form 6, frozen when the employee files.
     * Salary is the latest service record's salary. When the employee has
     * no service record, it is null and the PDF shows the salary grade instead.
     */
    public function applicantSnapshot(User $user): array
    {
        $user->loadMissing('employeeProfile');
        $profile = $user->employeeProfile;
        $latestRecord = $user->serviceRecords()->reorder('date_from', 'desc')->first();

        return [
            'office' => $profile?->division ?: $profile?->place_assign,
            'last_name' => $user->last_name,
            'first_name' => trim($user->first_name.' '.($user->name_ext ?? '')),
            'middle_name' => $user->middle_name,
            'position' => $profile?->position,
            'salary' => $latestRecord ? (float) $latestRecord->salary : null,
            'salary_grade' => $profile?->salary_grade,
            'date_of_filing' => now(config('leave.timezone'))->toDateString(),
        ];
    }

    /**
     * Notify admins and superadmins of a new request: database
     * notification plus the real-time push on `admin.notifications`.
     */
    protected function notifyAdminsOfSubmission(LeaveRequest $request): void
    {
        $request->loadMissing(['user:id,first_name,last_name,name_ext,photo,email', 'user.employeeProfile:user_id,position,employee_number', 'leaveType:id,name,code']);
        Notification::send(User::role(['admin', 'superadmin'])->get(), new LeaveRequestSubmittedNotification($request));
        LeaveRequestSubmitted::dispatch($request);
    }

    /** Section 7 (7.A–7.D) fields an admin may fill when acting on a CSC Form 6. */
    public const SECTION_7_FIELDS = [
        'credits_as_of', 'vl_total_earned', 'vl_less_this', 'vl_balance',
        'sl_total_earned', 'sl_less_this', 'sl_balance',
        'recommendation', 'recommendation_reason',
        'approved_days_with_pay', 'approved_days_without_pay', 'approved_others',
        'disapproval_reason',
    ];

    /**
     * Days actually charged to credits when a request is approved. On CSC
     * Form 6, 7.C "days with pay" is what gets deducted, capped at the days
     * applied for. Days without pay are not charged.
     */
    public function chargedDays(LeaveRequest $request): float
    {
        if ($request->isCscForm() && $request->approved_days_with_pay !== null) {
            return min($request->approved_days_with_pay, $request->days_requested);
        }

        return $request->days_requested;
    }

    /**
     * Approve a leave request. $section7 carries the admin's 7.A–7.C entries
     * for a CSC Form 6 application and is ignored for simple-form requests.
     */
    public function approveRequest(LeaveRequest $request, User $reviewer, ?string $remarks = null, array $section7 = []): void
    {
        if (! $request->isPending()) {
            throw new \RuntimeException('Only pending requests can be approved.');
        }

        $request->loadMissing('leaveType');
        $credit = $this->creditFor($request->user_id, $request->leaveType, $request->start_date->year);

        $request->update([
            'status' => 'approved',
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'remarks' => $remarks,
        ] + ($request->isCscForm() ? array_intersect_key($section7, array_flip(self::SECTION_7_FIELDS)) : []));

        // Release the whole pending hold; charge only the days with pay.
        $credit?->decrement('pending_credits', $request->days_requested);
        $credit?->increment('used_credits', $this->chargedDays($request));

        LeaveCalendarUpdated::dispatch($request, 'added');

        $request->loadMissing('user');
        $request->user->notify(new LeaveRequestReviewedNotification($request));
        LeaveRequestReviewed::dispatch($request, $credit?->fresh());
    }

    /**
     * Deny a leave request. $section7 carries the admin's 7.A, 7.B and 7.D
     * entries for a CSC Form 6 application.
     */
    public function denyRequest(LeaveRequest $request, User $reviewer, ?string $remarks = null, array $section7 = []): void
    {
        if (! $request->isPending()) {
            throw new \RuntimeException('Only pending requests can be denied.');
        }

        $request->loadMissing('leaveType');
        $credit = $this->creditFor($request->user_id, $request->leaveType, $request->start_date->year);

        // 7.C "Approved for" doesn't apply to a denial.
        $section7 = array_intersect_key($section7, array_flip(self::SECTION_7_FIELDS));
        unset($section7['approved_days_with_pay'], $section7['approved_days_without_pay'], $section7['approved_others']);

        $request->update([
            'status' => 'denied',
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'remarks' => $remarks,
        ] + ($request->isCscForm() ? $section7 : []));

        // Release pending hold
        $credit?->decrement('pending_credits', $request->days_requested);

        $request->loadMissing('user');
        $request->user->notify(new LeaveRequestReviewedNotification($request));
        LeaveRequestReviewed::dispatch($request, $credit?->fresh());
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

        $request->loadMissing('leaveType');
        $credit = $this->creditFor($request->user_id, $request->leaveType, $request->start_date->year);

        $wasApproved = $request->isApproved();
        $previousStatus = $request->status;

        if ($request->isPending()) {
            $credit?->decrement('pending_credits', $request->days_requested);
        } else {
            // Was approved — restore exactly what approval charged
            $credit?->decrement('used_credits', $this->chargedDays($request));
        }

        $request->update(['status' => 'cancelled']);

        if ($wasApproved) {
            LeaveCalendarUpdated::dispatch($request, 'removed');
        }

        LeaveRequestCancelled::dispatch($request, $previousStatus);
    }

    /**
     * Update a pending simple-form leave request (employee editing before
     * review). CSC Form 6 applications are edited through their own form.
     */
    public function updateRequest(LeaveRequest $request, array $data): LeaveRequest
    {
        if (! $request->isPending()) {
            throw new \RuntimeException('Only pending requests can be edited.');
        }

        if ($request->isCscForm()) {
            throw new \RuntimeException('Edit this request from its Application for Leave form.');
        }

        $request->loadMissing('leaveType');
        $leaveType = LeaveType::findOrFail($data['leave_type_id']);
        $newDays = $this->countWorkingDays($data['start_date'], $data['end_date']);
        $this->assertLeaveIsAllowed($request->user, $leaveType, $data['start_date'], $data['end_date'], $newDays);

        $oldCredit = $this->creditFor($request->user_id, $request->leaveType, $request->start_date->year);
        $newCredit = $this->creditFor($request->user_id, $leaveType, Carbon::parse($data['start_date'])->year);

        // Release old pending
        $oldCredit?->decrement('pending_credits', $request->days_requested);

        // Check credits minus old hold
        try {
            $this->assertSufficientCredit($newCredit?->fresh(), $newDays);
        } catch (\RuntimeException $e) {
            // Restore old pending and rethrow
            $oldCredit?->increment('pending_credits', $request->days_requested);
            throw $e;
        }

        $request->update([
            'leave_type_id' => $data['leave_type_id'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'days_requested' => $newDays,
            'reason' => $data['reason'] ?? $request->reason,
        ]);

        $newCredit?->increment('pending_credits', $newDays);

        return $request->fresh();
    }
}
