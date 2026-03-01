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
            'first_name'  => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name'   => ['required', 'string', 'max:255'],
            'name_ext'    => ['nullable', 'string', 'max:50'],
            'email'       => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password'    => ['required', 'confirmed', Password::default()],
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

        $user->assignRole('employee');

        return $user;
    }
}