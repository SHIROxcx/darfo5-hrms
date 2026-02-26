<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// Pending approval page — accessible without auth
Route::get('/pending-approval', function () {
    return inertia('auth/pending-approval');
})->name('pending.approval');

// Only superadmin can access
Route::middleware(['auth', 'verified', 'role:superadmin'])->group(function () {
    Route::get('/admin/roles', [RoleController::class, 'index'])->name('admin.roles');
    Route::get('/admin/users', [UserController::class, 'index'])->name('admin.users');
});

// HR staff can access
Route::middleware(['auth', 'verified', 'role:superadmin|admin'])->group(function () {
    Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::get('/employees/{user}', [EmployeeController::class, 'show'])->name('employees.show');
    Route::post('/employees/{user}/approve', [EmployeeController::class, 'approve'])->name('employees.approve');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

// Email Verification Routes
Route::get('/email/verify', function () {
    return inertia('auth/verify-email');
})->middleware('auth')->name('verification.notice');

Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();
    
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect('/pending-approval');
})->middleware(['auth', 'signed'])->name('verification.verify');

Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();
    return back()->with('status', 'verification-link-sent');
})->middleware(['auth', 'throttle:6,1'])->name('verification.send');


require __DIR__.'/settings.php';
