<?php

use Database\Seeders\LeaveTypeSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 1. Adds `leave_types.charge_to_leave_type_id`: the credit-tracked type
 *    whose balance this type draws from. Mandatory/Forced Leave (FL) is
 *    charged against Vacation Leave (VL) under CSC rules, so FL has no
 *    balance of its own and reserves and deducts from VL.
 *
 * 2. Syncs the leave type rows by running LeaveTypeSeeder, so a deployment
 *    that only runs `php artisan migrate` gets the CSC Form 6 types too.
 *    The seeder upserts by `code` and is idempotent, so running it again
 *    here is harmless where it has already run.
 *
 * Existing data: nothing is deleted. The retired Privilege Leave (PL) row is
 * only set to is_active = false. It must never be deleted, because
 * leave_requests and leave_credits reference leave_types with
 * cascadeOnDelete, which would silently delete every request and credit
 * tied to PL. Existing PL requests keep their type, and can still be
 * approved, denied or cancelled with their PL credits moving as before.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leave_types', function (Blueprint $table) {
            $table->foreignId('charge_to_leave_type_id')
                ->nullable()
                ->after('tracks_credits')
                ->constrained('leave_types')
                ->nullOnDelete();
        });

        (new LeaveTypeSeeder)->run();
    }

    public function down(): void
    {
        // Only the column is reversed. The leave type rows are reference
        // data, and removing them would cascade-delete requests filed
        // against them.
        Schema::table('leave_types', function (Blueprint $table) {
            $table->dropConstrainedForeignId('charge_to_leave_type_id');
        });
    }
};
