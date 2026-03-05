<?php

use App\Http\Controllers\Admin\EmployeeController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OtpController;
use App\Http\Controllers\SuperAdmin\UserController as SuperAdminUserController;
use App\Models\Division;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
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

// Email Verification (OTP-based)
Route::get('/email/verify', function () {
    $user = auth()->user();
    return inertia('auth/verify-email', [
        'email'      => $user?->email,
        'first_name' => $user?->first_name,
    ]);
})->middleware('auth')->name('verification.notice');

Route::get('/email/verify/{id}/{hash}', function (Request $request, string $id, string $hash) {
    $user = User::findOrFail($id);

    if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
        abort(403, 'Invalid verification link.');
    }
    if (! $request->hasValidSignature()) {
        abort(403, 'Verification link has expired or is invalid.');
    }
    if (! $user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
        event(new \Illuminate\Auth\Events\Verified($user));
    }

    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/pending-approval');
})->middleware(['signed'])->name('verification.verify');

// OTP Routes
Route::post('/otp/send',   [OtpController::class, 'send'])->middleware('auth');
Route::post('/otp/verify', [OtpController::class, 'verify'])->middleware('auth');

// Data Routes
Route::get('/divisions', fn() => Division::with('sections')->get());
Route::get('/positions', fn() => \App\Models\Position::orderBy('title')->get());



require __DIR__.'/settings.php';
