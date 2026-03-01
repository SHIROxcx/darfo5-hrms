<?php

namespace App\Http\Controllers;

use App\Models\EmployeeProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request) {
        $user = $request->user()->load('roles');

        if ($user->hasRole('superadmin')) {
            return Inertia::render('Dashboards/SuperAdminDashboard', [
                'user' => $user,
            ]);
        }
 
        if ($user->hasRole('admin')) {
            $stats = [
                'total'       => \App\Models\User::role('employee')->count(),
                'permanent'   => EmployeeProfile::where('employment_type', 'Permanent')->count(),
                'job_order'   => EmployeeProfile::where('employment_type', 'Job Order')->count(),
                'cos'         => EmployeeProfile::where('employment_type', 'Contractual')->count(),
            ];

            return Inertia::render('Dashboards/AdminDashboard', [
                'user'  => $user,
                'stats' => $stats,
            ]);
        }
 
        return Inertia::render('Dashboards/EmployeeDashboard', [
            'user' => $user,
        ]);

    }
}
