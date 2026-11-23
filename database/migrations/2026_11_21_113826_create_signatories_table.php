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
        // The saved list HR picks memo signatories from. Never deleted, only deactivated, because issued memos refer to them.
        Schema::create('signatories', function (Blueprint $table) {
            // InnoDB on purpose, whatever the server's default engine is: publishing needs real transactions and row locks,
            // and the foreign keys only work between InnoDB tables (a MyISAM default is a WAMP setting).
            $table->engine = 'InnoDB';
            $table->id();
            $table->string('name', 100);
            $table->string('position', 100);
            $table->string('signature_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('signatories');
    }
};
