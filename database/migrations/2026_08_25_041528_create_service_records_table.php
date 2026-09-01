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
        Schema::create('service_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date_from');
            $table->date('date_to')->nullable();
            $table->string('designation');
            $table->string('employment_status');
            $table->decimal('salary', 10, 2);
            $table->string('station_place_of_assignment');
            $table->string('branch')->nullable();
            $table->text('leave_without_pay')->nullable();
            $table->date('separation_date')->nullable();
            $table->string('separation_cause')->nullable();
            $table->string('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_records');
    }
};
