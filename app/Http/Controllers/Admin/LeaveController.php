<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Services\HolidayService;
use App\Services\LeaveApplicationPdfService;
use App\Services\LeaveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class LeaveController extends Controller
{
    public function __construct(protected LeaveService $leaveService, protected HolidayService $holidays) {}

    /**
     * Admin leave management — overview + activity table.
     */
    public function index(Request $request)
    {
        $today = today();

        // ── Month calendar: which days have at least one approved leave ──
        //
        // This is the only prop below that ISN'T wrapped in a closure, because it's
        // the only one that changes when the admin navigates months. The frontend
        // does a partial reload with `only: ['calendar']` for that navigation, and
        // Laravel's Inertia adapter filters props down to `only` BEFORE invoking any
        // closures (see Response::resolvePartialProperties vs. resolveArrayableProperties)
        // — so every closure-wrapped prop below is skipped entirely (no query runs)
        // on a calendar-only partial request. Keep this section free of expensive
        // queries, and wrap anything new and non-trivial in a closure the same way.
        $monthDate = $request->filled('month')
            ? \Carbon\Carbon::createFromFormat('Y-m', $request->input('month'))->startOfMonth()
            : now()->startOfMonth();
        $monthStart = $monthDate->copy()->startOfMonth();
        $monthEnd = $monthDate->copy()->endOfMonth();

        $leavesByDate = [];
        LeaveRequest::with(['user:id,first_name,last_name,name_ext,photo', 'leaveType:id,name,code'])
            ->where('status', 'approved')
            ->where('start_date', '<=', $monthEnd)
            ->where('end_date', '>=', $monthStart)
            ->get()
            ->each(function (LeaveRequest $lr) use ($monthStart, $monthEnd, &$leavesByDate) {
                $start = $lr->start_date->greaterThan($monthStart) ? $lr->start_date : $monthStart;
                $end = $lr->end_date->lessThan($monthEnd) ? $lr->end_date : $monthEnd;
                $entry = [
                    'id' => $lr->id,
                    'employee' => $lr->user->full_name,
                    'photo' => $lr->user->photo,
                    'leave_type' => $lr->leaveType->name,
                    'type_code' => $lr->leaveType->code,
                ];
                for ($d = $start->copy(); $d->lte($end); $d = $d->addDay()) {
                    $leavesByDate[$d->toDateString()][] = $entry;
                }
            });

        return Inertia::render('Admin/Leave/Index', [
            'stats' => fn () => [
                'on_leave_today' => LeaveRequest::where('status', 'approved')
                    ->where('start_date', '<=', $today)
                    ->where('end_date', '>=', $today)
                    ->count(),
            ],

            // Leave requests scoreboard: pending / approved (active or upcoming) / completed (already over) / denied.
            'scoreboard' => fn () => [
                'pending' => LeaveRequest::where('status', 'pending')->count(),
                'approved' => LeaveRequest::where('status', 'approved')->where('end_date', '>=', $today)->count(),
                'completed' => LeaveRequest::where('status', 'approved')->where('end_date', '<', $today)->count(),
                'denied' => LeaveRequest::where('status', 'denied')->count(),
            ],

            'calendar' => [
                'month' => $monthDate->format('Y-m'),
                'monthLabel' => $monthDate->format('F Y'),
                // Cast to object: an empty (or gap-free-but-associative) PHP array serializes
                // as a JSON array, not {} — which would silently break the JS
                // Record<string, ...> lookup on the frontend.
                'leavesByDate' => (object) $leavesByDate,
                'holidays' => (object) $this->holidays->holidayMapForRange($monthStart, $monthEnd),
            ],

            'upcomingLeaves' => fn () => LeaveRequest::with(['user:id,first_name,last_name,name_ext,photo', 'leaveType:id,name,code'])
                ->where('status', 'approved')
                ->where('end_date', '>=', $today)
                ->orderBy('start_date')
                ->take(8)
                ->get()
                ->map(fn (LeaveRequest $lr) => [
                    'id' => $lr->id,
                    'employee' => $lr->user->full_name,
                    'photo' => $lr->user->photo,
                    'leave_type' => $lr->leaveType->name,
                    'type_code' => $lr->leaveType->code,
                    'start_date' => $lr->start_date->toDateString(),
                    'end_date' => $lr->end_date->toDateString(),
                ]),

            // Leave activity table: loaded in full and filtered/sorted client-side
            // (search, type, status, sort) — same instant, no-reload pattern as the
            // employee registry and reference-data tables. Ordered newest-first so
            // the frontend's "Newest first" sort can just use this array as-is.
            'activity' => fn () => LeaveRequest::with([
                'user:id,first_name,last_name,name_ext,photo,email',
                'user.employeeProfile:user_id,position,employee_number',
                'leaveType:id,name,code',
            ])
                ->orderByDesc('created_at')
                ->get()
                ->map(fn (LeaveRequest $lr) => [
                    'id' => $lr->id,
                    'employee' => $lr->user->full_name,
                    'email' => $lr->user->email,
                    'photo' => $lr->user->photo,
                    'employee_number' => $lr->user->employeeProfile?->employee_number,
                    'job_title' => $lr->user->employeeProfile?->position,
                    'leave_type_id' => $lr->leave_type_id,
                    'leave_type' => $lr->leaveType->code === 'OTH' && $lr->other_leave_type
                        ? $lr->other_leave_type
                        : $lr->leaveType->name,
                    'type_code' => $lr->leaveType->code,
                    // CSC Form 6 applications are reviewed on their own page
                    // (section 7 is filled there), never from the quick modal.
                    'form_type' => $lr->form_type,
                    'submit_date' => $lr->created_at->toDateString(),
                    'start_date' => $lr->start_date->toDateString(),
                    'end_date' => $lr->end_date->toDateString(),
                    'days' => $lr->days_requested,
                    'reason' => $lr->reason,
                    'remarks' => $lr->remarks,
                    'status' => $lr->status,
                ]),

            'leaveTypes' => fn () => LeaveType::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']),

            'totalEmployees' => fn () => \App\Models\User::role('employee')->count(),
        ]);
    }

    /**
     * Show full detail of a single leave request.
     */
    public function show(LeaveRequest $leaveRequest)
    {
        $leaveRequest->load(['user', 'leaveType', 'reviewer']);

        return response()->json([
            'id' => $leaveRequest->id,
            'employee' => trim("{$leaveRequest->user->first_name} {$leaveRequest->user->last_name}"),
            'email' => $leaveRequest->user->email,
            'leave_type' => $leaveRequest->leaveType->name,
            'type_code' => $leaveRequest->leaveType->code,
            'start_date' => $leaveRequest->start_date->toDateString(),
            'end_date' => $leaveRequest->end_date->toDateString(),
            'days' => $leaveRequest->days_requested,
            'reason' => $leaveRequest->reason,
            'status' => $leaveRequest->status,
            'remarks' => $leaveRequest->remarks,
            'reviewed_by' => $leaveRequest->reviewer
                ? trim("{$leaveRequest->reviewer->first_name} {$leaveRequest->reviewer->last_name}")
                : null,
            'reviewed_at' => $leaveRequest->reviewed_at?->toDateTimeString(),
            'created_at' => $leaveRequest->created_at->toDateString(),
        ]);
    }

    /**
     * Review page for a CSC Form 6 application: the live form PDF beside
     * the section 7 panel, with 7.A pre-filled from the current VL/SL balances.
     */
    public function review(LeaveRequest $leaveRequest)
    {
        abort_unless($leaveRequest->isCscForm(), 404);
        $leaveRequest->load(['user.employeeProfile', 'leaveType', 'reviewer']);

        $snapshot = $leaveRequest->applicant_snapshot ?? [];

        return Inertia::render('Admin/Leave/Review', [
            'application' => [
                'id' => $leaveRequest->id,
                'status' => $leaveRequest->status,
                'employee' => $leaveRequest->user->full_name,
                'photo' => $leaveRequest->user->photo,
                'position' => $snapshot['position'] ?? null,
                'office' => $snapshot['office'] ?? null,
                'leave_type' => $leaveRequest->leaveType->name,
                'type_code' => $leaveRequest->leaveType->code,
                'other_leave_type' => $leaveRequest->other_leave_type,
                'tracks_credits' => $leaveRequest->leaveType->tracks_credits || $leaveRequest->leaveType->charge_to_leave_type_id,
                'start_date' => $leaveRequest->start_date->toDateString(),
                'end_date' => $leaveRequest->end_date->toDateString(),
                'days' => $leaveRequest->days_requested,
                'date_of_filing' => $snapshot['date_of_filing'] ?? $leaveRequest->created_at->toDateString(),
                'remarks' => $leaveRequest->remarks,
                'reviewed_by' => $leaveRequest->reviewer?->full_name,
                'reviewed_at' => $leaveRequest->reviewed_at?->toDateTimeString(),
                'pdf_url' => route('admin.leave.pdf', $leaveRequest),
            ],
            // Pending: 7.A pre-filled from live balances. Decided: what was saved.
            'section7' => $leaveRequest->isPending()
                ? $this->leaveService->certificationFor($leaveRequest) + [
                    'approved_days_with_pay' => $leaveRequest->days_requested,
                    'approved_days_without_pay' => 0,
                ]
                : collect(LeaveService::SECTION_7_FIELDS)->mapWithKeys(fn ($f) => [
                    $f => $f === 'credits_as_of' ? $leaveRequest->credits_as_of?->toDateString() : $leaveRequest->{$f},
                ])->all(),
        ]);
    }

    /** The form PDF, inline, or as an attachment with ?download=1. */
    public function pdf(Request $request, LeaveRequest $leaveRequest, LeaveApplicationPdfService $pdf)
    {
        abort_unless($leaveRequest->isCscForm(), 404);

        $disposition = $request->boolean('download') ? 'attachment' : 'inline';

        return response($pdf->pdfFor($leaveRequest), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition.'; filename="'.$pdf->filenameFor($leaveRequest).'"',
        ]);
    }

    /**
     * Approve a leave request. A CSC Form 6 application also requires
     * section 7 (7.A certification, 7.B recommendation, 7.C approved for),
     * so it can only be approved from its review page, not in bulk.
     */
    public function approve(Request $request, LeaveRequest $leaveRequest, LeaveApplicationPdfService $pdf)
    {
        $request->validate(['remarks' => 'nullable|string|max:500']);
        $section7 = $leaveRequest->isCscForm()
            ? $request->validate($this->section7Rules($leaveRequest, approving: true))
            : [];

        if ($section7 && $section7['approved_days_with_pay'] + $section7['approved_days_without_pay'] > $leaveRequest->days_requested) {
            return back()->withErrors([
                'approved_days_with_pay' => "Days with and without pay can't exceed the {$leaveRequest->days_requested} days applied for.",
            ]);
        }

        try {
            $this->leaveService->approveRequest($leaveRequest, Auth::user(), $request->remarks, $section7);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['action' => $e->getMessage()]);
        }

        $this->archiveFinalForm($leaveRequest, $pdf);

        return back()->with('success', 'Leave request approved.');
    }

    /**
     * Deny a leave request. A CSC Form 6 application also requires 7.A,
     * 7.B and the 7.D reason.
     */
    public function deny(Request $request, LeaveRequest $leaveRequest, LeaveApplicationPdfService $pdf)
    {
        $request->validate(['remarks' => 'nullable|string|max:500']);
        $section7 = $leaveRequest->isCscForm()
            ? $request->validate($this->section7Rules($leaveRequest, approving: false))
            : [];

        try {
            $this->leaveService->denyRequest($leaveRequest, Auth::user(), $request->remarks, $section7);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['action' => $e->getMessage()]);
        }

        $this->archiveFinalForm($leaveRequest, $pdf);

        return back()->with('success', 'Leave request denied.');
    }

    private function section7Rules(LeaveRequest $leaveRequest, bool $approving): array
    {
        $credit = ['required', 'numeric', 'min:0', 'max:9999'];

        return [
            'credits_as_of' => ['required', 'date'],
            'vl_total_earned' => $credit, 'vl_less_this' => $credit, 'vl_balance' => ['required', 'numeric', 'max:9999'],
            'sl_total_earned' => $credit, 'sl_less_this' => $credit, 'sl_balance' => ['required', 'numeric', 'max:9999'],
            'recommendation' => ['required', Rule::in(['for_approval', 'for_disapproval'])],
            'recommendation_reason' => ['nullable', 'required_if:recommendation,for_disapproval', 'string', 'max:1000'],
        ] + ($approving ? [
            'approved_days_with_pay' => ['required', 'numeric', 'min:0', 'max:'.$leaveRequest->days_requested],
            'approved_days_without_pay' => ['required', 'numeric', 'min:0', 'max:'.$leaveRequest->days_requested],
            'approved_others' => ['nullable', 'string', 'max:255'],
        ] : [
            'disapproval_reason' => ['required', 'string', 'max:1000'],
        ]);
    }

    /**
     * Save the decided form as the official record. A rendering failure
     * (for example Chrome unavailable) doesn't undo the decision: the PDF
     * routes then render it live until it is archived.
     */
    private function archiveFinalForm(LeaveRequest $leaveRequest, LeaveApplicationPdfService $pdf): void
    {
        if (! $leaveRequest->isCscForm()) {
            return;
        }

        try {
            $pdf->storeFinal($leaveRequest->fresh());
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * Pending requests list (for a dedicated pending panel / badge).
     */
    public function pending()
    {
        $requests = LeaveRequest::with(['user', 'leaveType'])
            ->where('status', 'pending')
            ->orderBy('created_at')
            ->get()
            ->map(fn ($lr) => [
                'id' => $lr->id,
                'employee' => trim("{$lr->user->first_name} {$lr->user->last_name}"),
                'leave_type' => $lr->leaveType->name,
                'start_date' => $lr->start_date->toDateString(),
                'end_date' => $lr->end_date->toDateString(),
                'days' => $lr->days_requested,
                'reason' => $lr->reason,
                'created_at' => $lr->created_at->toDateString(),
            ]);

        return response()->json($requests);
    }
}
