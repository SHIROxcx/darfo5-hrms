<?php

use App\Models\EmployeeProfile;
use App\Models\LeaveCredit;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\ServiceRecord;
use App\Models\User;
use App\Notifications\LeaveRequestSubmittedNotification;
use App\Services\LeaveService;
use Database\Seeders\LeaveTypeSeeder;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(LeaveTypeSeeder::class);
    foreach (['admin', 'superadmin', 'employee'] as $role) {
        Role::findOrCreate($role);
    }
    $this->service = app(LeaveService::class);
});

function employee(?string $employmentType): User
{
    $user = User::factory()->create([
        'first_name' => 'Juan', 'middle_name' => 'Santos', 'last_name' => 'Dela Cruz',
    ]);
    $user->assignRole('employee');

    if ($employmentType !== null) {
        EmployeeProfile::create([
            'user_id' => $user->id,
            'employment_type' => $employmentType,
            'position' => 'Agriculturist II',
            'salary_grade' => '15',
            'division' => 'Field Operations Division',
        ]);
    }

    return $user;
}

/** Mon–Fri of next week: five working days. */
function cscInput(string $code, array $overrides = []): array
{
    $monday = now()->next('Monday');

    return array_merge([
        'leave_type_id' => LeaveType::where('code', $code)->value('id'),
        'start_date' => $monday->toDateString(),
        'end_date' => $monday->copy()->addDays(4)->toDateString(),
        'commutation_requested' => false,
    ], $overrides);
}

test('the modal files only Wellness Leave; Permanent staff also hold VL and SL credits', function () {
    $permanent = employee('permanent');
    expect($this->service->simpleFormLeaveTypes($permanent)->pluck('code')->all())->toBe(['WL'])
        ->and($this->service->creditLeaveTypes($permanent)->pluck('code')->sort()->values()->all())->toBe(['SL', 'VL', 'WL']);

    foreach (['jo', 'cos', 'pakyaw'] as $type) {
        $user = employee($type);
        expect($this->service->simpleFormLeaveTypes($user)->pluck('code')->all())->toBe(['WL'])
            ->and($this->service->creditLeaveTypes($user)->pluck('code')->all())->toBe(['WL']);
    }
});

test('only Permanent employees may file CSC Form 6', function () {
    expect($this->service->canFileCscForm(employee('permanent')))->toBeTrue()
        ->and($this->service->canFileCscForm(employee('jo')))->toBeFalse()
        ->and($this->service->canFileCscForm(employee('cos')))->toBeFalse()
        ->and($this->service->canFileCscForm(employee(null)))->toBeFalse();

    $this->service->buildCscApplication(employee('cos'), cscInput('VL'));
})->throws(RuntimeException::class, 'Permanent employees only');

test('a placeholder type is filed with no credit row, check or reservation', function () {
    Notification::fake();
    $admin = User::factory()->create()->assignRole('admin');
    $superadmin = User::factory()->create()->assignRole('superadmin');
    $user = employee('permanent');

    $request = $this->service->submitCscApplication($user, cscInput('ML'));

    expect($request->form_type)->toBe(LeaveRequest::FORM_CSC6)
        ->and($request->days_requested)->toBe(5.0)
        ->and($request->attested_at)->not->toBeNull()
        ->and(LeaveCredit::where('user_id', $user->id)->count())->toBe(0);

    Notification::assertSentTo([$admin, $superadmin], LeaveRequestSubmittedNotification::class);
    Notification::assertNotSentTo($user, LeaveRequestSubmittedNotification::class);

    // Approving it touches no credits either.
    $this->service->approveRequest($request, $admin);
    expect(LeaveCredit::where('user_id', $user->id)->count())->toBe(0);
});

test('Vacation Leave on CSC Form 6 keeps its credit check and pending reservation', function () {
    Notification::fake();
    $user = employee('permanent');

    $this->service->submitCscApplication($user, cscInput('VL', ['detail_type' => 'within_ph']));

    $credit = LeaveCredit::where('user_id', $user->id)->sole();
    expect($credit->leaveType->code)->toBe('VL')
        ->and($credit->pending_credits)->toBe(5.0);

    $credit->update(['used_credits' => 12]); // 15 - 12 - 5 pending = 0 available
    $this->service->submitCscApplication($user, cscInput('VL', ['detail_type' => 'within_ph']));
})->throws(RuntimeException::class, 'Insufficient leave credits');

test('Forced Leave has no balance of its own and is charged against VL', function () {
    Notification::fake();
    $admin = User::factory()->create()->assignRole('admin');
    $user = employee('permanent');

    $request = $this->service->submitCscApplication($user, cscInput('FL'));

    $credit = LeaveCredit::where('user_id', $user->id)->sole();
    expect($credit->leaveType->code)->toBe('VL')
        ->and($credit->pending_credits)->toBe(5.0);

    $this->service->approveRequest($request, $admin);

    expect($credit->fresh())
        ->pending_credits->toBe(0.0)
        ->used_credits->toBe(5.0);
});

test('an existing Privilege Leave request still resolves and can be reviewed after PL is retired', function () {
    $pl = LeaveType::where('code', 'PL')->sole();
    expect($pl->is_active)->toBeFalse();

    $user = employee('permanent');
    $credit = $this->service->ensureCredit($user->id, $pl->id, now()->year);
    $credit->update(['pending_credits' => 3]);
    $request = LeaveRequest::create([
        'user_id' => $user->id, 'leave_type_id' => $pl->id,
        'start_date' => now()->next('Monday'), 'end_date' => now()->next('Monday')->addDays(2),
        'days_requested' => 3, 'status' => 'pending',
    ]);

    $this->service->approveRequest($request, User::factory()->create());

    expect($request->fresh()->leaveType->code)->toBe('PL')
        ->and($credit->fresh())
        ->pending_credits->toBe(0.0)
        ->used_credits->toBe(3.0);
});

test('placeholder types cannot be filed through the simple modal', function () {
    $user = employee('permanent');
    $input = cscInput('ML');

    $this->service->submitRequest($user, $input);
})->throws(RuntimeException::class, 'must be filed using the Application for Leave form');

test('the applicant snapshot uses the latest service record salary, else leaves salary null', function () {
    $user = employee('permanent');

    expect($this->service->applicantSnapshot($user))->toMatchArray([
        'office' => 'Field Operations Division',
        'last_name' => 'Dela Cruz',
        'first_name' => 'Juan',
        'middle_name' => 'Santos',
        'position' => 'Agriculturist II',
        'salary' => null,
        'salary_grade' => '15',
    ]);

    foreach ([['2020-01-01', 30000], ['2024-01-01', 45000]] as [$from, $salary]) {
        ServiceRecord::create([
            'user_id' => $user->id, 'date_from' => $from, 'designation' => 'Agriculturist II',
            'employment_status' => 'Permanent', 'salary' => $salary,
            'station_place_of_assignment' => 'Pili',
        ]);
    }

    expect($this->service->applicantSnapshot($user)['salary'])->toBe(45000.0);
});
