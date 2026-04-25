<?php

namespace Database\Seeders;

use App\Models\LeaveType;
use Illuminate\Database\Seeder;

class LeaveTypeSeeder extends Seeder
{
    /**
     * All leave types prescribed by the Philippine Civil Service Commission (CSC).
     * Credits are the standard annual entitlement under existing civil service rules.
     */
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
                'name'             => 'Maternity Leave',
                'code'             => 'ML',
                'description'      => 'Leave granted to female employees for childbirth or miscarriage (105 days under RA 11210).',
                'default_credits'  => 105,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Paternity Leave',
                'code'             => 'PL',
                'description'      => 'Leave granted to married male employees for the first four deliveries of their lawful wife.',
                'default_credits'  => 7,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Special Privilege Leave',
                'code'             => 'SPL',
                'description'      => 'Leave for personal milestones: graduation, wedding, death anniversary of parents, birthday, etc.',
                'default_credits'  => 3,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Solo Parent Leave',
                'code'             => 'SOLO',
                'description'      => 'Leave for solo parents under RA 8972 (Solo Parents Welfare Act).',
                'default_credits'  => 7,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Study Leave',
                'code'             => 'STUDY',
                'description'      => 'Leave for bar/board exam review or completion of masteral/doctoral degree.',
                'default_credits'  => 6,  // months, treated as 6 * 22 working days; store 6 for display
                'requires_approval'=> true,
            ],
            [
                'name'             => 'VAWC Leave',
                'code'             => 'VAWC',
                'description'      => 'Leave for victims of violence against women and their children under RA 9262.',
                'default_credits'  => 10,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Rehabilitation Leave',
                'code'             => 'RL',
                'description'      => 'Leave for employees injured while in the performance of their official duties.',
                'default_credits'  => 6,   // months
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Special Leave for Women',
                'code'             => 'SLW',
                'description'      => 'Leave for female employees undergoing surgery for gynecological disorder (RA 9710).',
                'default_credits'  => 60,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Calamity Leave',
                'code'             => 'CL',
                'description'      => 'Leave for employees in areas declared under state of calamity.',
                'default_credits'  => 5,
                'requires_approval'=> false,
            ],
            [
                'name'             => 'Adoption Leave',
                'code'             => 'AL',
                'description'      => 'Leave for adoptive parents under RA 8552 (Domestic Adoption Act).',
                'default_credits'  => 60,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Forced Leave',
                'code'             => 'FL',
                'description'      => 'Mandatory five working days annual leave consumption (from VL credits).',
                'default_credits'  => 5,
                'requires_approval'=> false,
            ],
        ];

        foreach ($types as $type) {
            LeaveType::updateOrCreate(['code' => $type['code']], $type);
        }

        $this->command->info('✅  Leave types seeded (' . count($types) . ' CSC types).');
    }
}