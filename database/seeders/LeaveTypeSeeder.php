<?php

namespace Database\Seeders;

use App\Models\LeaveType;
use Illuminate\Database\Seeder;

class LeaveTypeSeeder extends Seeder
{
    /**
     * Leave types, keyed by `code`. This seeder is idempotent (updateOrCreate),
     * so it can be re-run on an existing database to apply changes.
     *
     * `csc_form_order` is the checkbox position in section 6.A of CSC Form 6.
     * NULL means the type is not on the form.
     *
     * PLACEHOLDER — credit tracking: only VL, SL and WL track credits (the
     * behavior that already existed). Forced Leave (FL) has no balance of its
     * own and is charged against VL (`charge_to`), per CSC rules. Every other
     * type added for CSC Form 6 has tracks_credits = false and
     * default_credits = 0. It can be filed, but no balance is created,
     * checked or deducted, and the statutory entitlement in its description
     * is informational only. The accrual, cap and reset
     * rules for these types are pending HR policy input. Do not treat this as
     * a finished credit model.
     */
    public function run(): void
    {
        $types = [
            // ── Credit-tracked (existing behavior, unchanged) ───────────────
            [
                'name'             => 'Vacation Leave',
                'code'             => 'VL',
                'description'      => 'Leave for personal reasons, rest, and recreation.',
                'default_credits'  => 15,
                'tracks_credits'   => true,
                'csc_form_order'   => 1,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Sick Leave',
                'code'             => 'SL',
                'description'      => 'Leave due to personal illness, injury, or medical needs.',
                'default_credits'  => 15,
                'tracks_credits'   => true,
                'csc_form_order'   => 3,
                'requires_approval'=> true,
            ],
            [
                // Not on CSC Form 6. Filed through the simple modal by every
                // employment type (JO/COS/Pakyaw are limited to this type).
                'name'             => 'Wellness Leave',
                'code'             => 'WL',
                'description'      => 'Leave granted to all employees.',
                'default_credits'  => 5,
                'tracks_credits'   => true,
                'csc_form_order'   => null,
                'requires_approval'=> true,
            ],

            // ── Retired ─────────────────────────────────────────────────────
            [
                // Superseded by ML (Maternity) and PAT (Paternity). It is kept
                // inactive rather than deleted so that existing requests and
                // credits that reference it still resolve.
                'name'             => 'Privilege Leave',
                'code'             => 'PL',
                'description'      => 'Retired. Replaced by Maternity Leave (ML) and Paternity Leave (PAT).',
                'default_credits'  => 105,
                'tracks_credits'   => true,
                'csc_form_order'   => null,
                'requires_approval'=> true,
                'is_active'        => false,
            ],

            // ── CSC Form 6 types: PLACEHOLDER, no credit tracking yet ───────
            [
                // No balance of its own. Under CSC rules it is charged
                // against VL: filing reserves, and approval deducts, VL credits.
                'name'             => 'Mandatory/Forced Leave',
                'code'             => 'FL',
                'description'      => 'Mandatory five working days annual leave (Sec. 25, Rule XVI, Omnibus Rules Implementing E.O. No. 292). Charged against Vacation Leave credits.',
                'default_credits'  => 0,
                'tracks_credits'   => false,
                'charge_to'        => 'VL',
                'csc_form_order'   => 2,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Maternity Leave',
                'code'             => 'ML',
                'description'      => '105 days (R.A. No. 11210 / IRR issued by CSC, DOLE and SSS).',
                'default_credits'  => 0,
                'tracks_credits'   => false,
                'csc_form_order'   => 4,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Paternity Leave',
                'code'             => 'PAT',
                'description'      => '7 days (R.A. No. 8187 / CSC MC No. 71, s. 1998, as amended).',
                'default_credits'  => 0,
                'tracks_credits'   => false,
                'csc_form_order'   => 5,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Special Privilege Leave',
                'code'             => 'SPL',
                'description'      => 'Personal milestones and emergencies (Sec. 21, Rule XVI, Omnibus Rules Implementing E.O. No. 292).',
                'default_credits'  => 0,
                'tracks_credits'   => false,
                'csc_form_order'   => 6,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Solo Parent Leave',
                'code'             => 'SOLO',
                'description'      => '7 days (RA No. 8972 / CSC MC No. 8, s. 2004).',
                'default_credits'  => 0,
                'tracks_credits'   => false,
                'csc_form_order'   => 7,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Study Leave',
                'code'             => 'STUDY',
                'description'      => "Up to 6 months for completion of a Master's degree or BAR/Board review (Sec. 68, Rule XVI, Omnibus Rules Implementing E.O. No. 292).",
                'default_credits'  => 0,
                'tracks_credits'   => false,
                'csc_form_order'   => 8,
                'requires_approval'=> true,
            ],
            [
                'name'             => '10-Day VAWC Leave',
                'code'             => 'VAWC',
                'description'      => '10 days (RA No. 9262 / CSC MC No. 15, s. 2005).',
                'default_credits'  => 0,
                'tracks_credits'   => false,
                'csc_form_order'   => 9,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Rehabilitation Privilege',
                'code'             => 'RL',
                'description'      => 'Up to 6 months for injuries sustained in the performance of duty (Sec. 55, Rule XVI, Omnibus Rules Implementing E.O. No. 292).',
                'default_credits'  => 0,
                'tracks_credits'   => false,
                'csc_form_order'   => 10,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Special Leave Benefits for Women',
                'code'             => 'SLW',
                'description'      => 'Up to 2 months for gynecological surgery (RA No. 9710 / CSC MC No. 25, s. 2010).',
                'default_credits'  => 0,
                'tracks_credits'   => false,
                'csc_form_order'   => 11,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Special Emergency (Calamity) Leave',
                'code'             => 'CL',
                'description'      => '5 days (CSC MC No. 2, s. 2012, as amended).',
                'default_credits'  => 0,
                'tracks_credits'   => false,
                'csc_form_order'   => 12,
                'requires_approval'=> true,
            ],
            [
                'name'             => 'Adoption Leave',
                'code'             => 'AL',
                'description'      => 'R.A. No. 8552.',
                'default_credits'  => 0,
                'tracks_credits'   => false,
                'csc_form_order'   => 13,
                'requires_approval'=> true,
            ],
            [
                // 6.A "Others:". The actual leave named is stored per request
                // in leave_requests.other_leave_type.
                'name'             => 'Others',
                'code'             => 'OTH',
                'description'      => 'Other leave type specified by the applicant.',
                'default_credits'  => 0,
                'tracks_credits'   => false,
                'csc_form_order'   => 99,
                'requires_approval'=> true,
            ],
        ];

        // `charge_to` is a code, resolved to an id here. VL comes before FL in
        // the list, so it already exists by the time FL is saved.
        foreach ($types as $type) {
            $chargeTo = $type['charge_to'] ?? null;
            unset($type['charge_to']);

            LeaveType::updateOrCreate(['code' => $type['code']], $type + [
                'is_active' => true,
                'charge_to_leave_type_id' => $chargeTo
                    ? LeaveType::where('code', $chargeTo)->value('id')
                    : null,
            ]);
        }

        // Also called from a migration, where there is no console command.
        $this->command?->info('✅  Leave types seeded (' . count($types) . ' types).');
    }
}
