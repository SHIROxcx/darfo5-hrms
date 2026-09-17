<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Data migration: `employee_profiles.employment_type` was written with
 * inconsistent casing across entry points ("JO"/"COS"/"Pakyaw"/"Permanent"
 * from the register/profile forms vs. lowercase comparisons already used in
 * DashboardController and LeaveService). Normalizes existing rows to
 * lowercase so every read site's comparisons — case-sensitive or not —
 * agree with what's actually stored, now that all write sites store
 * lowercase too (see EmployeeProfile::setEmploymentTypeAttribute()).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('employee_profiles')
            ->whereNotNull('employment_type')
            ->update(['employment_type' => DB::raw('LOWER(employment_type)')]);
    }

    public function down(): void
    {
        // Original casing isn't recoverable — intentionally not reversed.
    }
};
