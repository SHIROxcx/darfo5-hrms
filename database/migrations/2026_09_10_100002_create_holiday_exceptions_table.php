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
        // A per-year exception to a recurring holiday: either it's skipped that
        // year (observed_date null) or moved to a different date that year
        // (observed_date set) — without altering the recurring holiday's
        // master month/day definition used by every other year.
        Schema::create('holiday_exceptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('holiday_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('year');
            $table->date('observed_date')->nullable();
            $table->timestamps();

            $table->unique(['holiday_id', 'year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('holiday_exceptions');
    }
};
