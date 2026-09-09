<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->uuid('public_token')->nullable()->after('id');
        });

        // Backfill every existing user with a unique token before the
        // unique index is added below.
        User::whereNull('public_token')->cursor()->each(
            fn (User $user) => $user->update(['public_token' => (string) Str::uuid()])
        );

        Schema::table('users', function (Blueprint $table) {
            $table->unique('public_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['public_token']);
            $table->dropColumn('public_token');
        });
    }
};
