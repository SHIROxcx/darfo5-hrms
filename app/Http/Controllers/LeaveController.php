<?php

namespace App\Http\Controllers;

use App\Models\LeaveCredit;
use App\Models\LeaveRequest;
use App\Services\LeaveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LeaveController extends Controller
{
    public function __construct(protected LeaveService $leaveService) {}

    /**
     * Employee's personal leave dashboard.
     */
    public function index()
    {
        $user = Auth::user();
        $year = now()->year;

        $requests = LeaveRequest::with('leaveType')
            ->where('user_id', $user->id)
            ->whereYear('start_date', $year)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($lr) => [
                'id' => $lr->id,
                'form_type' => $lr->form_type,
                // "Others" shows what the applicant actually typed.
                'leave_type' => $lr->leaveType->code === 'OTH' && $lr->other_leave_type
                    ? $lr->other_leave_type
                    : $lr->leaveType->name,
                'type_code' => $lr->leaveType->code,
                'start_date' => $lr->start_date->toDateString(),
                'end_date' => $lr->end_date->toDateString(),
                'days' => $lr->days_requested,
                'reason' => $lr->reason,
                'status' => $lr->status,
                'remarks' => $lr->remarks,
                'created_at' => $lr->created_at->toDateString(),
            ]);

        // Credit bars: Wellness Leave only for JO/COS/Pakyaw, VL/SL/WL for
        // Permanent (LeaveService::creditLeaveTypes). The modal only files
        // Wellness Leave (LeaveService::simpleFormLeaveTypes); every CSC leave
        // type goes through the Application for Leave form.
        $creditTypes = $this->leaveService->creditLeaveTypes($user);
        $leaveTypes = $this->leaveService->simpleFormLeaveTypes($user);

        foreach ($creditTypes as $type) {
            $this->leaveService->ensureCredit($user->id, $type->id, $year);
        }

        $credits = LeaveCredit::with('leaveType')
            ->where('user_id', $user->id)
            ->where('year', $year)
            ->whereIn('leave_type_id', $creditTypes->pluck('id'))
            ->get()
            ->map(fn ($c) => [
                'leave_type' => $c->leaveType->name,
                'type_code' => $c->leaveType->code,
                'total' => $c->total_credits,
                'used' => $c->used_credits,
                'pending' => $c->pending_credits,
                'available' => $c->available,
            ]);

        $stats = [
            'pending' => $requests->where('status', 'pending')->count(),
            'approved' => $requests->where('status', 'approved')->count(),
            'denied' => $requests->where('status', 'denied')->count(),
        ];

        return Inertia::render('Employee/Leave/Index', [
            'requests' => $requests,
            'credits' => $credits,
            'leaveTypes' => $leaveTypes->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'code' => $t->code,
            ]),
            'stats' => $stats,
            'year' => $year,
            'canFileCscForm' => $this->leaveService->canFileCscForm($user),
        ]);
    }

    /**
     * Submit a new leave request.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:1000',
        ]);

        try {
            $this->leaveService->submitRequest(Auth::user(), $data);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['days' => $e->getMessage()]);
        }

        return back()->with('success', 'Leave request submitted successfully.');
    }

    /**
     * Update a pending leave request.
     */
    public function update(Request $request, LeaveRequest $leaveRequest)
    {
        if ($leaveRequest->user_id !== Auth::id()) {
            abort(403);
        }

        $data = $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:1000',
        ]);

        try {
            $this->leaveService->updateRequest($leaveRequest, $data);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['days' => $e->getMessage()]);
        }

        return back()->with('success', 'Leave request updated.');
    }

    /**
     * Cancel (soft-delete effectively marking cancelled) a leave request.
     */
    public function cancel(LeaveRequest $leaveRequest)
    {
        if ($leaveRequest->user_id !== Auth::id()) {
            abort(403);
        }

        try {
            $this->leaveService->cancelRequest($leaveRequest);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['cancel' => $e->getMessage()]);
        }

        return back()->with('success', 'Leave request cancelled.');
    }
}
