<?php

use App\Models\EmployeeProfile;
use App\Models\PdsPersonalInfo;
use App\Models\User;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

// What account creation accepts. The names, mobile number and employee number are copied into the person's PDS, so
// they follow the same limits and formats as the PDS (an account must never be created with a value the PDS would then
// refuse). The password follows the project's shared password rule, which the page used to check alone.

beforeEach(fn () => Role::findOrCreate('employee'));

function registrationInput(array $overrides = []): array
{
    return array_merge([
        'first_name' => 'Maria', 'middle_name' => 'Reyes', 'last_name' => 'Dela Cruz', 'name_ext' => '',
        'email' => 'maria.new@example.com', 'mobile_number' => '09171234567',
        'agency' => 'DA RFO 5', 'division' => 'Operations Division', 'section_unit' => 'Agribusiness Section',
        'position' => 'Agriculturist I', 'salary_grade' => 11, 'employment_type' => 'permanent', 'employee_number' => '',
        'password' => 'Str0ng!Passw0rd#2026', 'password_confirmation' => 'Str0ng!Passw0rd#2026',
    ], $overrides);
}

function register($test, array $overrides = [])
{
    return $test->post(route('register.store'), registrationInput($overrides));
}

test('a complete, correct sign-up creates the account, profile and PDS record', function () {
    register($this)->assertSessionHasNoErrors();

    $user = User::where('email', 'maria.new@example.com')->firstOrFail();
    expect(EmployeeProfile::where('user_id', $user->id)->value('employment_type'))->toBe('permanent')
        ->and(PdsPersonalInfo::where('user_id', $user->id)->value('mobile_number'))->toBe('09171234567')
        ->and($user->is_approved)->toBeFalsy();
});

// Same limits as the PDS boxes they end up in (pdsTextLimits() is the PDS table).
test('sign-up boxes stop at the same length as the matching PDS boxes', function (string $field, string $pdsField) {
    $max = pdsTextLimits()['personal'][$pdsField];

    register($this, [$field => pdsFiller($pdsField, $max)])->assertSessionHasNoErrors();
})->with([
    'first name' => ['first_name', 'first_name'],
    'middle name' => ['middle_name', 'middle_name'],
    'surname' => ['last_name', 'last_name'],
    'mobile' => ['mobile_number', 'mobile_number'],
    'employee number' => ['employee_number', 'agency_employee_no'],
]);

test('sign-up boxes refuse one character more than the matching PDS box', function (string $field, string $pdsField) {
    $max = pdsTextLimits()['personal'][$pdsField];

    register($this, [$field => pdsFiller($pdsField, $max + 1)])->assertSessionHasErrors($field);
    expect(User::count())->toBe(0);
})->with([
    'first name' => ['first_name', 'first_name'],
    'middle name' => ['middle_name', 'middle_name'],
    'surname' => ['last_name', 'last_name'],
    'mobile' => ['mobile_number', 'mobile_number'],
    'employee number' => ['employee_number', 'agency_employee_no'],
]);

test('the work boxes stop at 255 characters', function (string $field) {
    register($this, [$field => str_repeat('a', 255)])->assertSessionHasNoErrors();
})->with(['agency', 'division', 'section_unit', 'position']);

test('the work boxes refuse more than 255 characters', function (string $field) {
    register($this, [$field => str_repeat('a', 256)])->assertSessionHasErrors($field);
})->with(['agency', 'division', 'section_unit', 'position']);

test('the email stops at 255 characters', function () {
    register($this, ['email' => str_repeat('a', 251).'@b.ph'])
        ->assertSessionHasErrors(['email' => 'Email is too long (maximum 255 characters).']);
});

// Formats: the same examples as the PDS (tests/Fixtures/pds-formats.json).
function registrationFormatExamples(string $kind): array
{
    $fixture = json_decode(file_get_contents(dirname(__DIR__, 2).'/Fixtures/pds-formats.json'), true);

    $cases = [];
    foreach (['first_name', 'last_name', 'middle_name', 'mobile_number', 'email'] as $field) {
        foreach ($fixture[$field][$kind] as $value) {
            $cases["{$field}: {$value}"] = [$field, $value];
        }
    }

    return $cases;
}

dataset('registration valid formats', fn () => registrationFormatExamples('valid'));
dataset('registration invalid formats', fn () => registrationFormatExamples('invalid'));

test('a name, mobile number or email in the right format is accepted', function (string $field, string $value) {
    register($this, [$field => $value])->assertSessionHasNoErrors();
})->with('registration valid formats');

test('a name, mobile number or email in the wrong format is refused', function (string $field, string $value) {
    register($this, [$field => $value])->assertSessionHasErrors($field);
    expect(User::count())->toBe(0);
})->with('registration invalid formats');

test('the format messages are the PDS ones', function (string $field) {
    $sample = json_decode(file_get_contents(base_path('tests/Fixtures/pds-formats.json')), true)['messages'][$field];

    register($this, [$field => $sample['value']])->assertSessionHasErrors([$field => $sample['message']]);
})->with(['first_name', 'last_name', 'mobile_number', 'email']);

// One sign-up per test: signing up logs the person in, and a logged-in visitor is bounced before validation.
test('every name extension on the page is accepted', function (string $ext) {
    register($this, ['name_ext' => $ext])->assertSessionHasNoErrors();
})->with(['Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V']);

test('a name extension that is not on the page is refused', function () {
    register($this, ['name_ext' => 'Esq.'])->assertSessionHasErrors('name_ext');
});

test('the employment type must be one of the choices on the page', function (string $type) {
    register($this, ['employment_type' => $type])->assertSessionHasNoErrors();
})->with(['jo', 'cos', 'pakyaw', 'permanent']);

test('an unknown employment type is refused', function () {
    register($this, ['employment_type' => 'volunteer'])->assertSessionHasErrors('employment_type');
});

// 0 is what the page sends when the position was typed instead of picked from the list (HR sets the grade later).
test('the salary grade must be a whole number from 0 to 33', function (mixed $grade, bool $valid) {
    $response = register($this, ['salary_grade' => $grade]);

    $valid ? $response->assertSessionHasNoErrors() : $response->assertSessionHasErrors('salary_grade');
})->with([
    'lowest' => [1, true], 'highest' => [33, true], 'typical' => [11, true],
    'zero (position not in the list)' => [0, true], 'below zero' => [-1, false], 'above 33' => [34, false], 'text' => ['abc', false], 'a fraction' => [11.5, false], 'blank' => ['', false],
]);

test('every required box says it is required, in plain words', function (string $field, string $label) {
    register($this, [$field => ''])->assertSessionHasErrors([$field => "{$label} is required."]);
})->with([
    ['first_name', 'First name'], ['last_name', 'Surname'], ['email', 'Email'], ['mobile_number', 'Mobile No.'],
    ['agency', 'Agency'], ['division', 'Division'], ['section_unit', 'Section / Unit'], ['position', 'Position'],
    ['salary_grade', 'Salary grade'], ['employment_type', 'Employment type'], ['password', 'Password'],
]);

test('an email that is already registered is refused', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    register($this, ['email' => 'taken@example.com'])->assertSessionHasErrors('email');
});

test('an employee number that is already registered is refused', function () {
    EmployeeProfile::create(['user_id' => User::factory()->create()->id, 'employee_number' => 'EMP-0001']);

    register($this, ['employee_number' => 'EMP-0001'])
        ->assertSessionHasErrors(['employee_number' => 'This Agency Employee No. is already registered.']);
    expect(User::where('email', 'maria.new@example.com')->exists())->toBeFalse();
});

// Password.
test('a password that is too short is refused', function () {
    register($this, ['password' => 'Ab1!xyz', 'password_confirmation' => 'Ab1!xyz'])->assertSessionHasErrors('password');
    expect(User::count())->toBe(0);
});

test('a password that does not match its confirmation is refused', function () {
    register($this, ['password_confirmation' => 'Different!Passw0rd#2026'])->assertSessionHasErrors('password');
});

test('a password longer than 64 characters is refused', function () {
    $long = str_repeat('Aa1!', 17); // 68 characters

    register($this, ['password' => $long, 'password_confirmation' => $long])
        ->assertSessionHasErrors(['password' => 'Password is too long (maximum 64 characters).']);
});

test('a password of exactly 64 characters is accepted', function () {
    $edge = str_repeat('Aa1!', 16);

    register($this, ['password' => $edge, 'password_confirmation' => $edge])->assertSessionHasNoErrors();
});

test('sign-up uses the same password rule as password reset and settings', function () {
    // Tighten the shared default, as the real site does; an 8-character password that passed before must now be refused.
    Password::defaults(fn () => Password::min(12)->mixedCase()->numbers()->symbols());

    register($this, ['password' => 'Abcd1234!', 'password_confirmation' => 'Abcd1234!'])->assertSessionHasErrors('password');
    register($this, ['password' => 'Abcdefgh1234!', 'password_confirmation' => 'Abcdefgh1234!'])->assertSessionHasNoErrors();
});

// The employment-type list exists twice (page and server): they must be the same.
test('the sign-up employment types match the ones on the page', function () {
    preg_match_all("/value: '([a-z]+)'/", file_get_contents(base_path('resources/js/lib/employment-type.ts')), $found);

    expect($found[1])->toBe(EmployeeProfile::EMPLOYMENT_TYPES);
});
