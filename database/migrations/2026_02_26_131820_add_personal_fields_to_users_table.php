<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('photo')->nullable()->after('email');
            $table->string('first_name')->nullable()->after('photo');
            $table->string('middle_name')->nullable()->after('first_name');
            $table->string('last_name')->nullable()->after('middle_name');
            $table->string('name_ext')->nullable()->after('last_name'); // Jr. Sr. II. III.
            $table->boolean('is_approved')->default(false)->after('name_ext');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'photo', 'first_name', 'middle_name',
                'last_name', 'name_ext', 'is_approved',
            ]);
        });
    }
};