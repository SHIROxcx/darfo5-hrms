<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Prepares `leave_types` for the CSC Form 6 (Application for Leave) flow.
 *
 * - `tracks_credits`: whether this type has a LeaveCredit balance that is
 *   reserved on submit, deducted on approval, and checked before a request
 *   is accepted. Defaults to true so the existing VL / SL / WL rows keep
 *   their current behavior untouched.
 *
 *   PLACEHOLDER: every type added for CSC Form 6 (FL, ML, PAT, SPL, SOLO,
 *   STUDY, VAWC, RL, SLW, CL, AL, OTH) is seeded with tracks_credits =
 *   false. They can be selected and filed, but no balance is created,
 *   checked or deducted. The accrual, cap and reset rules for these types
 *   are pending HR policy input. This is not a finished credit model.
 *
 * - `csc_form_order`: position of the type's checkbox in section 6.A of CSC
 *   Form 6 (1 = Vacation Leave … 13 = Adoption Leave, 99 = Others). NULL means
 *   the type is not on the form (Wellness Leave, which is filed through the
 *   simple modal instead).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leave_types', function (Blueprint $table) {
            $table->boolean('tracks_credits')->default(true)->after('default_credits');
            $table->unsignedTinyInteger('csc_form_order')->nullable()->after('tracks_credits');
        });
    }

    public function down(): void
    {
        Schema::table('leave_types', function (Blueprint $table) {
            $table->dropColumn(['tracks_credits', 'csc_form_order']);
        });
    }
};
