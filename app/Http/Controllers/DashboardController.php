<?php

namespace App\Http\Controllers;

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
            return Inertia::render('Dashboards/AdminDashboard', [
                'user' => $user,
            ]);
        }
 
        return Inertia::render('Dashboards/EmployeeDashboard', [
            'user' => $user,
        ]);

    }
}
