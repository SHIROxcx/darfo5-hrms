<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $superadmin = Role::create(['name' => 'superadmin']);
        $admin = Role::create(['name' => 'admin']);
        $employee = Role::create(['name' => 'employee']);

        $editEmployeeProfile = Permission::create(['name' => 'edit employee records']);
        $viewPayroll = Permission::create(['name' => 'view payroll']);
        
        $admin->givePermissionTo($editEmployeeProfile);
        $employee->givePermissionTo($viewPayroll);
    }
}
