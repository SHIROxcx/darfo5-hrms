<?php

use App\Http\Controllers\Admin\EmployeeController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SuperAdmin\UserController as SuperAdminUserController;
use App\Models\Division;
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
Route::middleware(['auth', 'verified', 'role:superadmin'])
    ->prefix('superadmin')
    ->name('superadmin.')
    ->group(function () {
        Route::get('/users', [SuperAdminUserController::class, 'index'])->name('users.index');
        Route::post('/users/{user}/role', [SuperAdminUserController::class, 'assignRole'])->name('users.role');
        Route::post('/users/{user}/toggle-approval', [SuperAdminUserController::class, 'toggleApproval'])->name('users.toggle-approval');
        Route::delete('/users/{user}', [SuperAdminUserController::class, 'destroy'])->name('users.destroy');
});

// Only HR staff can access
Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
        Route::get('/employees/{user}', [EmployeeController::class, 'show'])->name('employees.show');
        Route::post('/employees/{user}/approve', [EmployeeController::class, 'approve'])->name('employees.approve');
        Route::post('/employees/{user}/toggle-approval', [EmployeeController::class, 'toggleApproval'])->name('employees.toggle-approval');
        Route::delete('/employees/{user}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
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


Route::get('/divisions', fn() => Division::with('sections')->get());
Route::get('/positions', fn() => \App\Models\Position::orderBy('salary_grade')->orderBy('title')->get());


require __DIR__.'/settings.php';
