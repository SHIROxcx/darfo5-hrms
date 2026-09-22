<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // reset cached  roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // create roles
        $superadmin = Role::create(['name' => 'superadmin']);
        $admin = Role::create(['name' => 'admin']);
        $employee = Role::create(['name' => 'employee']);

        // create permissions
        Permission::create(['name' => 'manage users']);
        Permission::create(['name' => 'manage roles']);
        Permission::create(['name' => 'manage employees']);
        Permission::create(['name' => 'view own profile']);
        Permission::create(['name' => 'view payroll']);

        // assign permission to roles
        $superadmin->givePermissionTo(Permission::all());
        $admin->givePermissionTo(['manage employees', 'view payroll', 'view own profile']);
        $employee->givePermissionTo(['view own profile']);

        // create default users
        $user = User::create([
            'name'              => 'Super Admin User',
            'first_name'        => 'Super Admin',
            'last_name'         => 'User',
            'email'             => 'superadmin@darfo5.hris.com',
            'password'          => Hash::make('password'),
            'email_verified_at' => now(),
            'is_approved'       => true,
        ]);
        $user->assignRole('superadmin');

        $user = User::create([
            'name'              => 'HR Admin User',
            'first_name'        => 'HR Admin',
            'last_name'         => 'User',
            'email'             => 'admin@darfo5.hris.com',
            'password'          => Hash::make('password'),
            'email_verified_at' => now(),
            'is_approved'       => true,
        ]);
        $user->assignRole('admin');
    }
}
