<?php

namespace App\Http\Controllers;

use App\Http\Controllers\AnnouncementController;
use App\Models\EmployeeProfile;
use App\Models\LeaveCredit;
use App\Models\LeaveType;
use App\Models\PdsPersonalInfo;
use App\Services\LeaveService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user()->load('roles');

        if ($user->hasRole('superadmin')) {
            return Inertia::render('Dashboards/SuperAdminDashboard', [
                'user' => $user,
            ]);
        }

        if ($user->hasRole('admin')) {
            $stats = [
                'total'     => \App\Models\User::role('employee')->count(),
                'permanent' => EmployeeProfile::where('employment_type', 'permanent')->count(),
                'job_order' => EmployeeProfile::where('employment_type', 'jo')->count(),
                'cos'       => EmployeeProfile::where('employment_type', 'cos')->count(),
                'male'      => PdsPersonalInfo::where('sex', 'male')->count(),
                'female'    => PdsPersonalInfo::where('sex', 'female')->count(),
                'age_18_30' => PdsPersonalInfo::whereRaw('TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 18 AND 30')->count(),
                'age_31_60' => PdsPersonalInfo::whereRaw('TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 31 AND 60')->count(),
            ];

            return Inertia::render('Dashboards/AdminDashboard', [
                'user'          => $user,
                'stats'         => $stats,
                'announcements' => AnnouncementController::latest(30),
            ]);
        }

        // Employee dashboard — seed and load leave credits
        $year         = now()->year;
        $leaveService = app(LeaveService::class);
        $leaveTypes   = LeaveType::where('is_active', true)->orderBy('name')->get();

        foreach ($leaveTypes as $type) {
            $leaveService->ensureCredit($user->id, $type->id, $year);
        }

        $leaveCredits = LeaveCredit::with('leaveType')
            ->where('user_id', $user->id)
            ->where('year', $year)
            ->get()
            ->map(fn ($c) => [
                'leave_type' => $c->leaveType->name,
                'code'       => $c->leaveType->code,
                'available'  => $c->available,
                'total'      => $c->total_credits,
                'used'       => $c->used_credits,
                'pending'    => $c->pending_credits,
            ]);

        return Inertia::render('Dashboards/EmployeeDashboard', [
            'user'          => $user,
            'announcements' => AnnouncementController::latest(30),
            'leaveCredits'  => $leaveCredits,
        ]);
    }
}