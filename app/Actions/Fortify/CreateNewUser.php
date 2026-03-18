<?php

namespace App\Actions\Fortify;

use App\Models\User;
use App\Models\PdsPersonalInfo;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    public function create(array $input): User
    {
        Validator::make($input, [
            'first_name'    => ['required', 'string', 'max:255'],
            'middle_name'   => ['nullable', 'string', 'max:255'],
            'last_name'     => ['required', 'string', 'max:255'],
            'name_ext'      => ['nullable', 'string', 'max:20'],
            'email'         => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'mobile_number' => ['required', 'string', 'max:20'],
            'agency'        => ['required', 'string'],
            'division'      => ['required', 'string'],
            'section_unit'  => ['required', 'string'],
            'position'      => ['required', 'string'],
            'salary_grade'  => ['required'],
            'employment_type' => ['required', 'string'],
            'password'      => ['required', 'confirmed'],
        ])->validate();

        $user = User::create([
            'name'        => trim("{$input['first_name']} {$input['middle_name']} {$input['last_name']}"),
            'first_name'  => $input['first_name'],
            'middle_name' => $input['middle_name'] ?? null,
            'last_name'   => $input['last_name'],
            'name_ext'    => $input['name_ext'] ?? null,
            'email'       => $input['email'],
            'password'    => Hash::make($input['password']),
            'is_approved' => false,
        ]);

        $user->employeeProfile()->create([
            'employment_type' => $input['employment_type'],
            'position'        => $input['position'],
            'salary_grade'    => $input['salary_grade'],
            'division'        => $input['division'],
            'section'         => $input['section_unit'],
            'place_assign'    => $input['agency'],
        ]);

        PdsPersonalInfo::create([
            'user_id'      => $user->id,
            'mobile_number' => $input['mobile_number'],
        ]);

        $user->assignRole('employee');

        return $user;
    }
}