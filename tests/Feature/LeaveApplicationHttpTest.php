<?php

use App\Models\EmployeeProfile;
use App\Models\LeaveCredit;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use App\Notifications\LeaveRequestSubmittedNotification;
use App\Services\LeaveApplicationPdfService;
use Database\Seeders\LeaveTypeSeeder;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(LeaveTypeSeeder::class);
    foreach (['admin', 'superadmin', 'employee'] as $role) {
        Role::findOrCreate($role);
    }
    Notification::fake();

    // No headless Chrome in tests: the PDF service is mocked.
    $this->pdf = $this->mock(LeaveApplicationPdfService::class);
});

function staff(?string $employmentType, string $role = 'employee'): User
{
    $user = User::factory()->create(['first_name' => 'Maria', 'last_name' => 'Santos']);
    $user->assignRole($role);
    if ($employmentType !== null) {
        EmployeeProfile::create(['user_id' => $user->id, 'employment_type' => $employmentType, 'position' => 'Agriculturist I']);
    }

    return $user;
}

function formInput(string $code, array $overrides = []): array
{
    $monday = now('Asia/Manila')->next('Monday');

    return array_merge([
        'leave_type_id' => LeaveType::where('code', $code)->value('id'),
        'start_date' => $monday->toDateString(),
        'end_date' => $monday->copy()->addDays(2)->toDateString(),
        'commutation_requested' => false,
        'attest' => true,
    ], $overrides);
}

test('JO, COS and Pakyaw employees cannot open, preview or submit CSC Form 6', function (string $type) {
    $user = staff($type);

    $this->actingAs($user)->get('/my-leave/apply')->assertForbidden();
    $this->actingAs($user)->postJson('/my-leave/apply/preview', formInput('VL', ['detail_type' => 'within_ph']))->assertForbidden();
    $this->actingAs($user)->post('/my-leave/apply', formInput('VL', ['detail_type' => 'within_ph']))->assertForbidden();

    expect(LeaveRequest::count())->toBe(0);
})->with(['jo', 'cos', 'pakyaw']);

test('JO/COS still see My Leave with the Wellness Leave modal only', function () {
    $this->actingAs(staff('jo'))->get('/my-leave')->assertInertia(fn (Assert $page) => $page
        ->component('Employee/Leave/Index')
        ->where('canFileCscForm', false)
        ->has('leaveTypes', 1)
        ->where('leaveTypes.0.code', 'WL'));
});

test('a Permanent employee opens the form with the 6.A types in form order', function () {
    $this->actingAs(staff('permanent'))->get('/my-leave/apply')->assertInertia(fn (Assert $page) => $page
        ->component('Employee/Leave/Apply')
        ->where('leaveTypes.0.code', 'VL')
        ->where('leaveTypes.1.code', 'FL')
        ->where('leaveTypes.13.code', 'OTH')
        ->where('application', null));
});

test('6.B details are validated per leave type', function () {
    $user = staff('permanent');

    $this->actingAs($user)->post('/my-leave/apply', formInput('SL'))
        ->assertSessionHasErrors('detail_type');
    $this->actingAs($user)->post('/my-leave/apply', formInput('SL', ['detail_type' => 'in_hospital']))
        ->assertSessionHasErrors('detail_text');
    $this->actingAs($user)->post('/my-leave/apply', formInput('SL', ['detail_type' => 'abroad', 'detail_text' => 'x']))
        ->assertSessionHasErrors('detail_type');
    $this->actingAs($user)->post('/my-leave/apply', formInput('OTH'))
        ->assertSessionHasErrors('other_leave_type');
    $this->actingAs($user)->post('/my-leave/apply', formInput('ML', ['attest' => false]))
        ->assertSessionHasErrors('attest');

    expect(LeaveRequest::count())->toBe(0);
});

test('the preview renders the unsaved application and saves nothing', function () {
    $this->pdf->shouldReceive('buildPdf')->once()
        ->withArgs(fn (LeaveRequest $lr) => ! $lr->exists && $lr->detail_text === 'Fever')
        ->andReturn('%PDF-fake');

    $this->actingAs(staff('permanent'))
        ->postJson('/my-leave/apply/preview', formInput('SL', ['detail_type' => 'out_patient', 'detail_text' => 'Fever', 'attest' => null]))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf');

    expect(LeaveRequest::count())->toBe(0);
});

test('a submitted application notifies admins and superadmins and links to its review page', function () {
    $admin = staff(null, 'admin');
    $superadmin = staff(null, 'superadmin');

    $this->actingAs(staff('permanent'))
        ->post('/my-leave/apply', formInput('SPL', ['detail_type' => 'within_ph', 'detail_text' => 'Naga City']))
        ->assertRedirect('/my-leave');

    $request = LeaveRequest::sole();
    expect($request->form_type)->toBe('csc6')
        ->and($request->detail_text)->toBe('Naga City');

    Notification::assertSentTo([$admin, $superadmin], LeaveRequestSubmittedNotification::class,
        fn ($n) => $n->toDatabase($admin)['url'] === "/admin/leave/{$request->id}/review");
});

test('another employee cannot view, edit or preview someone else\'s application', function () {
    $owner = staff('permanent');
    $this->actingAs($owner)->post('/my-leave/apply', formInput('VL', ['detail_type' => 'within_ph']));
    $request = LeaveRequest::sole();

    $other = staff('permanent');
    $this->actingAs($other)->get("/my-leave/{$request->id}/pdf")->assertForbidden();
    $this->actingAs($other)->get("/my-leave/{$request->id}/edit")->assertForbidden();
    $this->actingAs($other)->put("/my-leave/{$request->id}/apply", formInput('VL', ['detail_type' => 'within_ph']))->assertForbidden();
    $this->actingAs($other)->postJson('/my-leave/apply/preview', formInput('VL', ['detail_type' => 'within_ph', 'editing_id' => $request->id]))->assertForbidden();
});

test('a CSC Form 6 application cannot be approved without section 7', function () {
    $this->actingAs(staff('permanent'))->post('/my-leave/apply', formInput('VL', ['detail_type' => 'within_ph']));
    $request = LeaveRequest::sole();

    $this->actingAs(staff(null, 'admin'))->post("/admin/leave/{$request->id}/approve")
        ->assertSessionHasErrors(['credits_as_of', 'recommendation', 'approved_days_with_pay']);

    expect($request->fresh()->status)->toBe('pending');
});

test('approval saves section 7, charges only the days with pay and archives the final form', function () {
    $employee = staff('permanent');
    $this->actingAs($employee)->post('/my-leave/apply', formInput('VL', ['detail_type' => 'within_ph'])); // 3 days
    $request = LeaveRequest::sole();

    $this->pdf->shouldReceive('storeFinal')->once();

    $this->actingAs(staff(null, 'superadmin'))->post("/admin/leave/{$request->id}/approve", [
        'credits_as_of' => now()->toDateString(),
        'vl_total_earned' => 15, 'vl_less_this' => 3, 'vl_balance' => 12,
        'sl_total_earned' => 15, 'sl_less_this' => 0, 'sl_balance' => 15,
        'recommendation' => 'for_approval',
        'approved_days_with_pay' => 2, 'approved_days_without_pay' => 1,
    ])->assertSessionHasNoErrors();

    $request->refresh();
    expect($request->status)->toBe('approved')
        ->and($request->vl_balance)->toBe(12.0)
        ->and($request->approved_days_without_pay)->toBe(1.0);

    $vl = LeaveCredit::where('user_id', $employee->id)->whereHas('leaveType', fn ($q) => $q->where('code', 'VL'))->sole();
    expect($vl->pending_credits)->toBe(0.0)
        ->and($vl->used_credits)->toBe(2.0);
});

test('days with and without pay cannot exceed the days applied for', function () {
    $this->actingAs(staff('permanent'))->post('/my-leave/apply', formInput('VL', ['detail_type' => 'within_ph'])); // 3 days
    $request = LeaveRequest::sole();

    $this->actingAs(staff(null, 'admin'))->post("/admin/leave/{$request->id}/approve", [
        'credits_as_of' => now()->toDateString(),
        'vl_total_earned' => 15, 'vl_less_this' => 3, 'vl_balance' => 12,
        'sl_total_earned' => 15, 'sl_less_this' => 0, 'sl_balance' => 15,
        'recommendation' => 'for_approval',
        'approved_days_with_pay' => 3, 'approved_days_without_pay' => 1,
    ])->assertSessionHasErrors('approved_days_with_pay');
});

test('superadmins can open the leave dashboard and the review page', function () {
    $this->actingAs(staff('permanent'))->post('/my-leave/apply', formInput('ML'));
    $request = LeaveRequest::sole();
    $superadmin = staff(null, 'superadmin');

    $this->actingAs($superadmin)->get('/admin/leave')->assertOk();
    $this->actingAs($superadmin)->get("/admin/leave/{$request->id}/review")->assertInertia(fn (Assert $page) => $page
        ->component('Admin/Leave/Review')
        ->where('application.status', 'pending')
        ->where('application.tracks_credits', false)
        ->has('section7.vl_total_earned'));

    $this->actingAs(staff('permanent'))->get("/admin/leave/{$request->id}/review")->assertForbidden();
});
