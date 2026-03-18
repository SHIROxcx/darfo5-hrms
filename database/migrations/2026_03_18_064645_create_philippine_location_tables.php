<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('ph_provinces', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique(); // PSA province code
            $table->string('name');
            $table->string('region')->nullable();
            $table->timestamps();
        });

        Schema::create('ph_cities', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique(); // PSA city/municipality code
            $table->foreignId('province_id')->constrained('ph_provinces')->cascadeOnDelete();
            $table->string('name');
            $table->string('zip_code', 10)->nullable();
            $table->boolean('is_city')->default(false); // true = city, false = municipality
            $table->timestamps();
        });

        Schema::create('ph_barangays', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique(); // PSA barangay code
            $table->foreignId('city_id')->constrained('ph_cities')->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ph_barangays');
        Schema::dropIfExists('ph_cities');
        Schema::dropIfExists('ph_provinces');
    }
};