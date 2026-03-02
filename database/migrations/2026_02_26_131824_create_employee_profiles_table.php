<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('employee_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Personal Info
            $table->enum('sex', ['Male', 'Female'])->nullable();
            $table->string('birth_place')->nullable();
            $table->enum('civil_status', ['Single', 'Married', 'Widowed', 'Separated', 'Other'])->nullable();
            $table->string('mobile_number', 20)->nullable();

            // Company Info
            $table->string('employee_number')->unique()->nullable();
            $table->string('employment_type')->nullable();
            $table->string('position')->nullable();
            $table->string('salary_grade')->nullable();
            $table->string('place_assign')->nullable();
            $table->string('division')->nullable();
            $table->string('section')->nullable();
            $table->date('date_hired')->nullable();
            $table->boolean('is_active')->default(true);

            // Government IDs
            $table->string('gsis_number')->nullable();
            $table->string('sss_number')->nullable();
            $table->string('pagibig_number')->nullable();
            $table->string('tin_number')->nullable();
            $table->string('philhealth_number')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_profiles');
    }
};