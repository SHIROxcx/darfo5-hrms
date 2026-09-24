<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the fields of CSC Form 6 (Application for Leave, Revised 2020) to
 * `leave_requests`. Only rows with form_type = 'csc6' use them. Wellness
 * Leave and older requests stay 'simple' and leave them all NULL.
 *
 * Section 6 (employee) is filled at filing. Section 7 (admin) is filled in
 * one step when the admin approves or denies. The 7.A figures are frozen at
 * review time, because live LeaveCredit balances keep changing after the
 * form is issued.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->string('form_type', 10)->default('simple')->after('leave_type_id');

            // ── 1–5: applicant header, frozen at filing ──────────────────────
            // { office, last_name, first_name, middle_name, position, salary,
            //   date_of_filing }. Profile edits made later must not change a
            //   form that has already been filed.
            $table->json('applicant_snapshot')->nullable()->after('form_type');

            // ── 6.A / 6.B / 6.D: employee-filled ─────────────────────────────
            $table->string('other_leave_type')->nullable()->after('applicant_snapshot');
            // One of: within_ph, abroad, in_hospital, out_patient,
            // slbw_illness, masters_degree, bar_board_review. Allowed values
            // depend on the leave type and are validated in the FormRequest.
            // Monetization and Terminal Leave are out of scope for v1.
            $table->string('detail_type', 30)->nullable()->after('other_leave_type');
            $table->string('detail_text')->nullable()->after('detail_type');
            $table->boolean('commutation_requested')->default(false)->after('detail_text');
            $table->timestamp('attested_at')->nullable()->after('commutation_requested');

            // ── 7.A: certification of leave credits (VL / SL only) ───────────
            $table->date('credits_as_of')->nullable()->after('remarks');
            $table->decimal('vl_total_earned', 6, 2)->nullable()->after('credits_as_of');
            $table->decimal('vl_less_this', 6, 2)->nullable()->after('vl_total_earned');
            $table->decimal('vl_balance', 6, 2)->nullable()->after('vl_less_this');
            $table->decimal('sl_total_earned', 6, 2)->nullable()->after('vl_balance');
            $table->decimal('sl_less_this', 6, 2)->nullable()->after('sl_total_earned');
            $table->decimal('sl_balance', 6, 2)->nullable()->after('sl_less_this');

            // ── 7.B: recommendation ──────────────────────────────────────────
            $table->string('recommendation', 20)->nullable()->after('sl_balance'); // for_approval | for_disapproval
            $table->text('recommendation_reason')->nullable()->after('recommendation');

            // ── 7.C / 7.D: final action ──────────────────────────────────────
            $table->decimal('approved_days_with_pay', 6, 2)->nullable()->after('recommendation_reason');
            $table->decimal('approved_days_without_pay', 6, 2)->nullable()->after('approved_days_with_pay');
            $table->string('approved_others')->nullable()->after('approved_days_without_pay');
            $table->text('disapproval_reason')->nullable()->after('approved_others');

            // Final PDF saved when the admin approves or denies. It is the
            // official record, so later signature or profile changes don't
            // alter it.
            $table->string('final_pdf_path')->nullable()->after('disapproval_reason');
        });
    }

    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn([
                'form_type', 'applicant_snapshot', 'other_leave_type',
                'detail_type', 'detail_text', 'commutation_requested', 'attested_at',
                'credits_as_of', 'vl_total_earned', 'vl_less_this', 'vl_balance',
                'sl_total_earned', 'sl_less_this', 'sl_balance',
                'recommendation', 'recommendation_reason',
                'approved_days_with_pay', 'approved_days_without_pay',
                'approved_others', 'disapproval_reason', 'final_pdf_path',
            ]);
        });
    }
};
