<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use App\Services\LeaveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LeaveController extends Controller
{
    public function __construct(protected LeaveService $leaveService) {}

    /**
     * Admin leave management — Gantt calendar view.
     */
    public function index(Request $request)
    {
        $leaveTypes = LeaveType::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']);

        // Date range: default current week (Mon–Sun), allow navigation
        $weekStart = $request->input('week_start')
            ? \Carbon\Carbon::parse($request->input('week_start'))->startOfWeek()
            : \Carbon\Carbon::now()->startOfWeek();
        $weekEnd = $weekStart->copy()->addDays(10); // show 11 days for a wider view

        // Build employees with their leave requests in range
        $query = User::with([
            'leaveRequests' => function ($q) use ($weekStart, $weekEnd) {
                $q->with('leaveType')
                  ->where('status', '!=', 'cancelled')
                  ->where(function ($q) use ($weekStart, $weekEnd) {
                      $q->whereBetween('start_date', [$weekStart, $weekEnd])
                        ->orWhereBetween('end_date', [$weekStart, $weekEnd])
                        ->orWhere(function ($q) use ($weekStart, $weekEnd) {
                            $q->where('start_date', '<=', $weekStart)
                              ->where('end_date', '>=', $weekEnd);
                        });
                  });
            },
            'employeeProfile',
        ])
        ->whereHas('roles', fn ($q) => $q->where('name', 'employee'))
        ->whereHas('leaveRequests', function ($q) use ($weekStart, $weekEnd) {
            $q->where('status', '!=', 'cancelled')
              ->where(function ($q) use ($weekStart, $weekEnd) {
                  $q->whereBetween('start_date', [$weekStart, $weekEnd])
                    ->orWhereBetween('end_date', [$weekStart, $weekEnd])
                    ->orWhere(function ($q) use ($weekStart, $weekEnd) {
                        $q->where('start_date', '<=', $weekStart)
                          ->where('end_date', '>=', $weekEnd);
                    });
              });
        });

        // Filters
        if ($request->filled('leave_type_id')) {
            $query->whereHas('leaveRequests', fn ($q) =>
                $q->where('leave_type_id', $request->input('leave_type_id'))
            );
        }
        if ($request->filled('status')) {
            $query->whereHas('leaveRequests', fn ($q) =>
                $q->where('status', $request->input('status'))
            );
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(fn ($q) =>
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name',  'like', "%{$search}%")
                  ->orWhere('email',      'like', "%{$search}%")
            );
        }

        $employees = $query->orderBy('last_name')->get()->map(function (User $user) {
            return [
                'id'     => $user->id,
                'name'   => trim("{$user->first_name} {$user->last_name}"),
                'email'  => $user->email,
                'avatar' => $user->employeeProfile?->photo_url ?? null,
                'leaves' => $user->leaveRequests->map(fn ($lr) => [
                    'id'         => $lr->id,
                    'type'       => $lr->leaveType->name,
                    'type_code'  => $lr->leaveType->code,
                    'start_date' => $lr->start_date->toDateString(),
                    'end_date'   => $lr->end_date->toDateString(),
                    'days'       => $lr->days_requested,
                    'reason'     => $lr->reason,
                    'status'     => $lr->status,
                    'remarks'    => $lr->remarks,
                    'created_at' => $lr->created_at->toDateString(),
                ]),
            ];
        });

        // Stats
        $stats = [
            'pending'  => LeaveRequest::where('status', 'pending')->count(),
            'approved' => LeaveRequest::where('status', 'approved')
                ->whereYear('start_date', now()->year)->count(),
            'denied'   => LeaveRequest::where('status', 'denied')
                ->whereYear('start_date', now()->year)->count(),
            'on_leave_today' => LeaveRequest::where('status', 'approved')
                ->where('start_date', '<=', today())
                ->where('end_date', '>=', today())
                ->count(),
        ];

        return Inertia::render('Admin/Leave/Index', [
            'employees'  => $employees,
            'leaveTypes' => $leaveTypes,
            'weekStart'  => $weekStart->toDateString(),
            'weekEnd'    => $weekEnd->toDateString(),
            'filters'    => $request->only(['leave_type_id', 'status', 'search', 'week_start']),
            'stats'      => $stats,
        ]);
    }

    /**
     * Show full detail of a single leave request.
     */
    public function show(LeaveRequest $leaveRequest)
    {
        $leaveRequest->load(['user', 'leaveType', 'reviewer']);

        return response()->json([
            'id'          => $leaveRequest->id,
            'employee'    => trim("{$leaveRequest->user->first_name} {$leaveRequest->user->last_name}"),
            'email'       => $leaveRequest->user->email,
            'leave_type'  => $leaveRequest->leaveType->name,
            'type_code'   => $leaveRequest->leaveType->code,
            'start_date'  => $leaveRequest->start_date->toDateString(),
            'end_date'    => $leaveRequest->end_date->toDateString(),
            'days'        => $leaveRequest->days_requested,
            'reason'      => $leaveRequest->reason,
            'status'      => $leaveRequest->status,
            'remarks'     => $leaveRequest->remarks,
            'reviewed_by' => $leaveRequest->reviewer
                ? trim("{$leaveRequest->reviewer->first_name} {$leaveRequest->reviewer->last_name}")
                : null,
            'reviewed_at' => $leaveRequest->reviewed_at?->toDateTimeString(),
            'created_at'  => $leaveRequest->created_at->toDateString(),
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
                'id'         => $lr->id,
                'employee'   => trim("{$lr->user->first_name} {$lr->user->last_name}"),
                'leave_type' => $lr->leaveType->name,
                'start_date' => $lr->start_date->toDateString(),
                'end_date'   => $lr->end_date->toDateString(),
                'days'       => $lr->days_requested,
                'reason'     => $lr->reason,
                'created_at' => $lr->created_at->toDateString(),
            ]);

        return response()->json($requests);
    }
}