<?php

namespace Database\Seeders;

use App\Models\LeaveType;
use Illuminate\Database\Seeder;

class LeaveTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'name'             => 'Vacation Leave',
                'code'             => 'VL',
                'description'      => 'Leave for personal reasons, rest, and recreation.',
                'default_credits'  => 15,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Sick Leave',
                'code'             => 'SL',
                'description'      => 'Leave due to personal illness, injury, or medical needs.',
                'default_credits'  => 15,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Privilege Leave',
                'code'             => 'PL',
                'description'      => 'Leave granted to all permanent employees.',
                'default_credits'  => 15,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Wellness Leave',
                'code'             => 'WL',
                'description'      => 'Leave granted to all employees.',
                'default_credits'  => 5,
                'requires_approval'=> true,
            ],
        ];

        foreach ($types as $type) {
            LeaveType::updateOrCreate(['code' => $type['code']], $type);
        }

        $this->command->info('✅  Leave types seeded (' . count($types) . ' CSC types).');
    }
}