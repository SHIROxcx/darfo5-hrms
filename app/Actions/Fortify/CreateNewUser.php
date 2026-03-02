<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    public function create(array $input): User
    {
        Validator::make($input, [
            'first_name'      => ['required', 'string', 'max:255'],
            'middle_name'     => ['nullable', 'string', 'max:255'],
            'last_name'       => ['required', 'string', 'max:255'],
            'name_ext'        => ['nullable', 'string', 'max:50'],
            'agency'          => ['required', 'string', 'max:255'],
            'division_unit'   => ['required', 'string', 'max:255'],
            'section'         => ['required', 'string', 'max:255'],
            'position'        => ['required', 'string', 'max:255'],
            'employment_type' => ['required', 'string', 'max:50'],
            'email'           => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'mobile_number'   => ['required', 'string', 'max:20'],
            'password'        => ['required', 'confirmed', Password::default()],
        ])->validate();

        // Auto-generate the name field from parts
        $fullName = trim(implode(' ', array_filter([
            $input['first_name'],
            $input['middle_name'] ?? null,
            $input['last_name'],
            $input['name_ext'] ?? null,
        ])));

        $user = User::create([
            'name'        => $fullName,
            'first_name'  => $input['first_name'],
            'middle_name' => $input['middle_name'] ?? null,
            'last_name'   => $input['last_name'],
            'name_ext'    => $input['name_ext'] ?? null,
            'email'       => $input['email'],
            'password'    => Hash::make($input['password']),
            'is_approved' => false,
        ]);

        // Create employee profile with registration data
        $user->employeeProfile()->create([
            'mobile_number'   => $input['mobile_number'],
            'employment_type' => $input['employment_type'],
            'position'        => $input['position'],
            'place_assign'    => $input['agency'],
            'division'        => $input['division_unit'],
            'section'         => $input['section'],
        ]);

        $user->assignRole('employee');

        return $user;
    }
}