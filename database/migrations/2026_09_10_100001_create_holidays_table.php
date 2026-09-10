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
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['regular', 'special'])->default('regular');
            $table->boolean('is_recurring')->default(false);
            // Set when is_recurring = false: the exact one-off date (carries its own year).
            $table->date('date')->nullable();
            // Set when is_recurring = true: applies every year on this month/day, no year attached.
            $table->unsignedTinyInteger('month')->nullable();
            $table->unsignedTinyInteger('day')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('holidays');
    }
};
