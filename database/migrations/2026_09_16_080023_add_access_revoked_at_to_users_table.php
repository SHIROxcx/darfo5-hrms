<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Set when an admin revokes a previously-approved employee's access.
            // Distinguishes "revoked" from "never yet approved" — both leave
            // is_approved false, but only a genuinely new registrant (this null)
            // should count as a pending approval anywhere in the app.
            $table->timestamp('access_revoked_at')->nullable()->after('is_approved');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('access_revoked_at');
        });
    }
};
