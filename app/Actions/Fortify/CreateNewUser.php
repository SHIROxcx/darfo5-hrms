<?php

namespace App\Actions\Fortify;

use App\Concerns\CaptchaValidationRules;
use App\Concerns\PasswordValidationRules;
use App\Models\EmployeeProfile;
use App\Models\PdsPersonalInfo;
use App\Models\User;
use App\Support\PdsRules;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use CaptchaValidationRules;
    use PasswordValidationRules;

    /** What each box is called in an error message. */
    private const LABELS = [
        'first_name' => 'First name', 'middle_name' => 'Middle name', 'last_name' => 'Surname', 'name_ext' => 'Name extension',
        'email' => 'Email', 'mobile_number' => 'Mobile No.', 'agency' => 'Agency', 'division' => 'Division',
        'section_unit' => 'Section / Unit', 'position' => 'Position', 'salary_grade' => 'Salary grade',
        'employment_type' => 'Employment type', 'employee_number' => 'Agency Employee No.', 'password' => 'Password',
    ];

    public function create(array $input): User
    {
        // The security code first and on its own, so the other checks (such as "this email is already registered") are
        // not run, and cannot be used to probe the user list, by someone who has not solved the picture.
        Validator::make($input, ['captcha' => $this->captchaRules()], $this->captchaMessages())->validate();

        // The names, mobile number and employee number are copied into the person's PDS, so they follow the PDS limits
        // and formats (App\Support\PdsRules): an account must never be created with a value the PDS would then refuse.
        Validator::make($input, [
            'first_name' => ['bail', 'required', 'string', 'max:100', PdsRules::personName('First name')],
            'middle_name' => ['bail', 'nullable', 'string', 'max:100', PdsRules::personName('Middle name', true)],
            'last_name' => ['bail', 'required', 'string', 'max:100', PdsRules::personName('Surname')],
            'name_ext' => ['nullable', 'string', Rule::in(['Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V'])],
            'email' => ['bail', 'required', 'string', 'max:255', 'email', PdsRules::email(), 'unique:users'],
            'mobile_number' => ['bail', 'required', 'string', 'max:20', PdsRules::mobile()],
            'agency' => ['required', 'string', 'max:255'],
            'division' => ['required', 'string', 'max:255'],
            'section_unit' => ['required', 'string', 'max:255'],
            'position' => ['required', 'string', 'max:255'],
            // 0 is what the page sends when the position was typed instead of picked from the list.
            'salary_grade' => ['required', 'integer', 'between:0,33'],
            'employment_type' => ['required', 'string', Rule::in(EmployeeProfile::EMPLOYMENT_TYPES)],
            'employee_number' => ['nullable', 'string', 'max:30', 'unique:employee_profiles,employee_number'],
            'password' => ['bail', ...$this->passwordRules()],
        ], $this->messages())->validate();

        $user = User::create([
            'name' => trim("{$input['first_name']} ".($input['middle_name'] ?? '')." {$input['last_name']}"),
            'first_name' => $input['first_name'],
            'middle_name' => $input['middle_name'] ?? null,
            'last_name' => $input['last_name'],
            'name_ext' => $input['name_ext'] ?? null,
            'email' => $input['email'],
            'password' => Hash::make($input['password']),
            'is_approved' => false,
        ]);

        $user->employeeProfile()->create([
            'employment_type' => $input['employment_type'],
            'employee_number' => $input['employee_number'] ?? null,
            'position' => $input['position'],
            'salary_grade' => $input['salary_grade'],
            'division' => $input['division'],
            'section' => $input['section_unit'],
            'place_assign' => $input['agency'],
        ]);

        PdsPersonalInfo::create([
            'user_id' => $user->id,
            'mobile_number' => $input['mobile_number'],
            // Kept in sync with employee_profiles.employee_number (see PdsController / UserProfileController)
            'agency_employee_no' => $input['employee_number'] ?? null,
        ]);

        $user->assignRole('employee');

        return $user;
    }

    /** Plain-words messages for the rules that Laravel would otherwise word with raw field names. */
    private function messages(): array
    {
        $messages = [
            'email.email' => 'Email must be a valid email address, like name@example.com.',
            'email.unique' => 'This email address is already registered.',
            'employee_number.unique' => 'This Agency Employee No. is already registered.',
            'name_ext.in' => 'Name extension must be one of the choices listed.',
            'employment_type.in' => 'Employment type must be one of the choices listed.',
            'salary_grade.integer' => 'Salary grade must be a whole number from 0 to 33.',
            'salary_grade.between' => 'Salary grade must be a whole number from 0 to 33.',
        ];

        foreach (self::LABELS as $field => $label) {
            $messages["{$field}.required"] = "{$label} is required.";
            $messages["{$field}.max"] = "{$label} is too long (maximum :max characters).";
        }

        return $messages;
    }
}
