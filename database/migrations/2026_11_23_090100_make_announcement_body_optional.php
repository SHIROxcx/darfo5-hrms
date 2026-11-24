<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // An announcement is now only a file, so it has no text. Announcements written earlier keep theirs.
        Schema::table('announcements', function (Blueprint $table) {
            $table->text('body')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('announcements')->whereNull('body')->update(['body' => '']);

        Schema::table('announcements', function (Blueprint $table) {
            $table->text('body')->nullable(false)->change();
        });
    }
};
