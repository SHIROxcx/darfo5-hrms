<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Services\HolidayService;
use App\Services\LeaveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
                    'leave_type' => $lr->leaveType->name,
                    'type_code' => $lr->leaveType->code,
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
     * Approve a leave request.
     */
    public function approve(Request $request, LeaveRequest $leaveRequest)
    {
        $request->validate(['remarks' => 'nullable|string|max:500']);

        $this->leaveService->approveRequest($leaveRequest, Auth::user(), $request->remarks);

        return back()->with('success', 'Leave request approved.');
    }

    /**
     * Deny a leave request.
     */
    public function deny(Request $request, LeaveRequest $leaveRequest)
    {
        $request->validate(['remarks' => 'nullable|string|max:500']);

        $this->leaveService->denyRequest($leaveRequest, Auth::user(), $request->remarks);

        return back()->with('success', 'Leave request denied.');
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
