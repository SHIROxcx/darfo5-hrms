<?php

use App\Http\Controllers\Admin\EmployeeController;
use App\Http\Controllers\Admin\LeaveController as AdminLeaveController;
use App\Http\Controllers\Admin\ReferenceData\BachelorsDegreeController;
use App\Http\Controllers\Admin\ReferenceData\DivisionController;
use App\Http\Controllers\Admin\ReferenceData\EligibilityController;
use App\Http\Controllers\Admin\ReferenceData\GraduateProgramController;
use App\Http\Controllers\Admin\ReferenceData\HolidayController;
use App\Http\Controllers\Admin\ReferenceData\PositionController;
use App\Http\Controllers\Admin\ReferenceData\SectionController;
use App\Http\Controllers\Admin\ServiceRecordBulkPdfController;
use App\Http\Controllers\Admin\ServiceRecordController;
use App\Http\Controllers\Admin\ServiceRecordImportController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\ArtaIdController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LeaveApplicationController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OtpController;
use App\Http\Controllers\PdsController;
use App\Http\Controllers\PdsPdfController;
use App\Http\Controllers\PublicEmployeeController;
use App\Http\Controllers\ServiceRecordPdfController;
use App\Http\Controllers\SuperAdmin\UserController as SuperAdminUserController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\WesController;
use App\Models\Division;
use App\Models\User;
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

// Employee QR details display
Route::get('/employee/{employeeNumber}', [PublicEmployeeController::class, 'show'])
    ->middleware('throttle:30,1')
    ->name('public.employee.show');

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
        Route::get('/employees/{user}/view', [EmployeeController::class, 'show'])->name('employees.show');
        Route::post('/employees/{user}/approve', [EmployeeController::class, 'approve'])->name('employees.approve');
        Route::post('/employees/{user}/toggle-approval', [EmployeeController::class, 'toggleApproval'])->name('employees.toggle-approval');
        Route::post('/employees/{user}/toggle-active', [EmployeeController::class, 'toggleActive'])->name('employees.toggle-active');
        Route::delete('/employees/{user}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
        Route::get('/employees/{user}/profile', [EmployeeController::class, 'show'])->name('employees.profile');

        // ARTA ID Routes
        Route::get('/arta-id/preview/{userToken}',  [ArtaIdController::class, 'preview'])->name('arta-id.preview');
        Route::get('/arta-id/download/{userToken}', [ArtaIdController::class, 'download'])->name('arta-id.download');
    });

// Leave management — HR admin and superadmin (both receive leave
// submission notifications, so both must be able to open what they link to).
Route::middleware(['auth', 'verified', 'role:admin|superadmin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/leave', [AdminLeaveController::class, 'index'])->name('leave.index');
        Route::get('/leave/pending', [AdminLeaveController::class, 'pending'])->name('leave.pending');
        Route::get('/leave/{leaveRequest}', [AdminLeaveController::class, 'show'])->name('leave.show');
        Route::get('/leave/{leaveRequest}/review', [AdminLeaveController::class, 'review'])->name('leave.review');
        Route::get('/leave/{leaveRequest}/pdf', [AdminLeaveController::class, 'pdf'])->name('leave.pdf');
        Route::post('/leave/{leaveRequest}/approve', [AdminLeaveController::class, 'approve'])->name('leave.approve');
        Route::post('/leave/{leaveRequest}/deny', [AdminLeaveController::class, 'deny'])->name('leave.deny');
    });

// Reference Data management — HR admin and superadmin
Route::middleware(['auth', 'verified', 'role:admin|superadmin'])
    ->prefix('admin/reference-data')
    ->name('admin.reference-data.')
    ->group(function () {
        Route::get('/divisions', [DivisionController::class, 'index'])->name('divisions.index');
        Route::post('/divisions', [DivisionController::class, 'store'])->name('divisions.store');
        Route::put('/divisions/{division}', [DivisionController::class, 'update'])->name('divisions.update');
        Route::delete('/divisions/{division}', [DivisionController::class, 'destroy'])->name('divisions.destroy');

        Route::post('/divisions/{division}/sections', [SectionController::class, 'store'])->name('sections.store');
        Route::put('/sections/{section}', [SectionController::class, 'update'])->name('sections.update');
        Route::patch('/sections/{section}/move', [SectionController::class, 'move'])->name('sections.move');
        Route::delete('/sections/{section}', [SectionController::class, 'destroy'])->name('sections.destroy');

        Route::get('/positions', [PositionController::class, 'index'])->name('positions.index');
        Route::post('/positions', [PositionController::class, 'store'])->name('positions.store');
        Route::put('/positions/{position}', [PositionController::class, 'update'])->name('positions.update');
        Route::delete('/positions/{position}', [PositionController::class, 'destroy'])->name('positions.destroy');

        Route::get('/eligibilities', [EligibilityController::class, 'index'])->name('eligibilities.index');
        Route::post('/eligibilities', [EligibilityController::class, 'store'])->name('eligibilities.store');
        Route::put('/eligibilities/{eligibility}', [EligibilityController::class, 'update'])->name('eligibilities.update');
        Route::delete('/eligibilities/{eligibility}', [EligibilityController::class, 'destroy'])->name('eligibilities.destroy');

        Route::get('/graduate-programs', [GraduateProgramController::class, 'index'])->name('graduate-programs.index');
        Route::post('/graduate-programs', [GraduateProgramController::class, 'store'])->name('graduate-programs.store');
        Route::put('/graduate-programs/{graduateProgram}', [GraduateProgramController::class, 'update'])->name('graduate-programs.update');
        Route::delete('/graduate-programs/{graduateProgram}', [GraduateProgramController::class, 'destroy'])->name('graduate-programs.destroy');

        Route::get('/bachelors-degrees', [BachelorsDegreeController::class, 'index'])->name('bachelors-degrees.index');
        Route::post('/bachelors-degrees', [BachelorsDegreeController::class, 'store'])->name('bachelors-degrees.store');
        Route::put('/bachelors-degrees/{bachelorsDegree}', [BachelorsDegreeController::class, 'update'])->name('bachelors-degrees.update');
        Route::delete('/bachelors-degrees/{bachelorsDegree}', [BachelorsDegreeController::class, 'destroy'])->name('bachelors-degrees.destroy');

        Route::get('/holidays', [HolidayController::class, 'index'])->name('holidays.index');
        Route::post('/holidays', [HolidayController::class, 'store'])->name('holidays.store');
        Route::put('/holidays/{holiday}', [HolidayController::class, 'update'])->name('holidays.update');
        Route::delete('/holidays/{holiday}', [HolidayController::class, 'destroy'])->name('holidays.destroy');
        Route::post('/holidays/{holiday}/exceptions', [HolidayController::class, 'storeException'])->name('holidays.exceptions.store');
        Route::delete('/holidays/{holiday}/exceptions/{year}', [HolidayController::class, 'destroyException'])->name('holidays.exceptions.destroy');
        Route::post('/holidays/prefill', [HolidayController::class, 'prefill'])->name('holidays.prefill');
    });

// Service Records — HR admin and superadmin
Route::middleware(['auth', 'verified', 'role:admin|superadmin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::post('/employees/{user}/service-records', [ServiceRecordController::class, 'store'])->name('service-records.store');
        Route::put('/service-records/{serviceRecord}', [ServiceRecordController::class, 'update'])->name('service-records.update');
        Route::delete('/service-records/{serviceRecord}', [ServiceRecordController::class, 'destroy'])->name('service-records.destroy');

        Route::get('/service-records/import/template', [ServiceRecordImportController::class, 'template'])->name('service-records.import.template');
        Route::post('/service-records/import/preview', [ServiceRecordImportController::class, 'preview'])->name('service-records.import.preview');
        Route::post('/service-records/import/commit', [ServiceRecordImportController::class, 'commit'])->name('service-records.import.commit');

        Route::post('/service-records/pdf/bulk', [ServiceRecordBulkPdfController::class, 'bulk'])->name('service-records.pdf.bulk');
    });

// Authenticated Routes for verified users
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Profile page
    Route::get('/profile',                       [UserProfileController::class, 'show'])->name('profile.show');
    Route::get('/profile/{id}',                  [UserProfileController::class, 'show'])->name('profile.show.user');
    Route::post('/profile/photo',                [UserProfileController::class, 'uploadPhoto'])->name('profile.photo');
    Route::post('/profile/personal',             [UserProfileController::class, 'updatePersonal'])->name('profile.personal');
    Route::post('/profile/{id}/personal',        [UserProfileController::class, 'updatePersonalFor'])->name('profile.personal.for');
    Route::post('/profile/{id}/company',         [UserProfileController::class, 'updateCompany'])->name('profile.company');
    Route::post('/profile/{userId}/degree',      [UserProfileController::class, 'storeDegree'])->name('profile.degree.store');
    Route::post('/profile/degree/{id}',          [UserProfileController::class, 'updateDegree'])->name('profile.degree.update');
    Route::post('/profile/{userId}/program',     [UserProfileController::class, 'storeGraduateStudy'])->name('profile.program.store');
    Route::post('/profile/program/{id}',         [UserProfileController::class, 'updateGraduateStudy'])->name('profile.program.update');
    Route::post('/profile/{userId}/eligibility', [UserProfileController::class, 'storeEligibility'])->name('profile.eligibility.store');
    Route::post('/profile/eligibility/{id}',     [UserProfileController::class, 'updateEligibility'])->name('profile.eligibility.update');
    
    // Notification Routes
    Route::get('/notifications',                 [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/read-all',       [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::post('/notifications/{id}/read',      [NotificationController::class, 'markAsRead'])->name('notifications.read');

    // Announcement Routes
    Route::post('/announcements',                   [AnnouncementController::class, 'store'])->name('announcements.store');
    Route::put('/announcements/{announcement}',     [AnnouncementController::class, 'update'])->name('announcements.update');
    Route::delete('/announcements/{announcement}',  [AnnouncementController::class, 'destroy'])->name('announcements.destroy');

    if (app()->environment('local')) {
        Route::get('/pds/html-preview/{userId?}', function (?int $userId = null) {
    
            $authUser = Auth::user();
            $targetId = $userId ?? $authUser->id;
    
            $user = \App\Models\User::findOrFail($targetId);
            $ep   = \App\Models\EmployeeProfile::where('user_id', $targetId)->first();
    
            $pds = [
                'personal'        => \App\Models\PdsPersonalInfo::where('user_id', $targetId)->first(),
                'family'          => \App\Models\PdsFamilyBackground::where('user_id', $targetId)->first(),
                'children'        => \App\Models\PdsChild::where('user_id', $targetId)->orderBy('sort_order')->get(),
                'education'       => \App\Models\PdsEducation::where('user_id', $targetId)->get(),
                'eligibilities'   => \App\Models\PdsEligibility::where('user_id', $targetId)->orderBy('sort_order')->get(),
                'work_experience' => \App\Models\PdsWorkExperience::where('user_id', $targetId)->orderBy('sort_order')->get(),
                'voluntary_work'  => \App\Models\PdsVoluntaryWork::where('user_id', $targetId)->orderBy('sort_order')->get(),
                'trainings'       => \App\Models\PdsTraining::where('user_id', $targetId)->orderBy('sort_order')->get(),
                'other_info'      => \App\Models\PdsOtherInfo::where('user_id', $targetId)->first(),
                'questions'       => \App\Models\PdsQuestion::where('user_id', $targetId)->first(),
                'references'      => \App\Models\PdsReference::where('user_id', $targetId)->orderBy('sort_order')->get(),
                'government_id'   => \App\Models\PdsGovernmentId::where('user_id', $targetId)->first(),
            ];
    
            // Render the exact same Blade view the PDF uses — but returned as HTML
            // so the browser displays it directly. Reload the tab to see any change.
            return view('pds.pdf', compact('user', 'ep', 'pds'));
    
        })->middleware(['auth'])->name('pds.html-preview');

        Route::get('/service-records/html-preview/{userId?}', function (?int $userId = null) {
            $authUser = Auth::user();
            $targetId = $userId ?? $authUser->id;

            $user = \App\Models\User::findOrFail($targetId);

            // Reuses the exact same HTML the PDF generator renders — so the
            // browser displays it directly. Reload the tab to see any change.
            return app(\App\Services\ServiceRecordPdfService::class)->buildHtml($user, preview: true);
        })->middleware(['auth'])->name('service-records.html-preview');

        Route::get('/leave/html-preview/{leaveRequest}', function (\App\Models\LeaveRequest $leaveRequest) {
            abort_unless(
                $leaveRequest->user_id === Auth::id() || Auth::user()->hasAnyRole(['admin', 'superadmin']),
                403
            );

            // The exact HTML the CSC Form 6 PDF renders. Reload the tab to see any change.
            return app(\App\Services\LeaveApplicationPdfService::class)->buildHtml($leaveRequest, screen: true);
        })->middleware(['auth'])->name('leave.html-preview');
    }

    // PDS Routes
    Route::get('/pds/preview/{userToken?}',  [PdsPdfController::class, 'preview'])->name('pds.preview');
    Route::get('/pds/download/{userToken?}', [PdsPdfController::class, 'download'])->name('pds.download');
    Route::get('/pds', [PdsController::class, 'index'])->name('pds.index');
    Route::get('/pds/{userId}', [PdsController::class, 'show'])->name('pds.show');
    Route::post('/pds/save/{section}', [PdsController::class, 'saveSection'])->name('pds.save');

    // PDS Work Experience Sheet Section
    Route::get('/pds/wes/preview/{userToken?}',  [WesController::class, 'preview'])->name('pds.wes.preview');
    Route::get('/pds/wes/download/{userToken?}', [WesController::class, 'download'])->name('pds.wes.download');

    // Service Record PDF (AFD-HRMS-012-0)
    Route::get('/service-records/pdf/preview/{userToken?}',  [ServiceRecordPdfController::class, 'preview'])->name('service-records.pdf.preview');
    Route::get('/service-records/pdf/download/{userToken?}', [ServiceRecordPdfController::class, 'download'])->name('service-records.pdf.download');

    // Location Routes
    Route::prefix('api/locations')->group(function () {
        Route::get('/provinces',           [LocationController::class, 'provinces']);
        Route::get('/cities/{provinceId}', [LocationController::class, 'cities']);
        Route::get('/barangays/{cityId}',  [LocationController::class, 'barangays']);
    });

    Route::get('/api/eligibilities', function () {
    return response()->json(
        \DB::table('eligibilities')->orderBy('title')->get(['id', 'title', 'abbreviation'])
    );

    });
    // Leave Routes
    Route::get('/my-leave', [LeaveController::class, 'index'])->name('leave.my');
    Route::post('/my-leave', [LeaveController::class, 'store'])->name('leave.store');
    Route::put('/my-leave/{leaveRequest}', [LeaveController::class, 'update'])->name('leave.update');
    Route::post('/my-leave/{leaveRequest}/cancel', [LeaveController::class, 'cancel'])->name('leave.cancel');

    // CSC Form 6 (Application for Leave) — Permanent employees only,
    // enforced in LeaveApplicationController / StoreLeaveApplicationRequest.
    Route::get('/my-leave/apply', [LeaveApplicationController::class, 'create'])->name('leave.apply');
    Route::post('/my-leave/apply/preview', [LeaveApplicationController::class, 'preview'])->middleware('throttle:20,1')->name('leave.apply.preview');
    Route::post('/my-leave/apply', [LeaveApplicationController::class, 'store'])->name('leave.apply.store');
    Route::get('/my-leave/{leaveRequest}/edit', [LeaveApplicationController::class, 'edit'])->name('leave.apply.edit');
    Route::put('/my-leave/{leaveRequest}/apply', [LeaveApplicationController::class, 'update'])->name('leave.apply.update');
    Route::get('/my-leave/{leaveRequest}/pdf', [LeaveApplicationController::class, 'pdf'])->name('leave.pdf');

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
         \App\Events\NewUserRegistered::dispatch($user);
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
