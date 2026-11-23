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
        // The signatories of one memo. The name, position and picture are COPIES taken from the saved list when the memo is
        // published, so changing a saved signatory later never changes an issued memo.
        Schema::create('memo_signatories', function (Blueprint $table) {
            // InnoDB on purpose, whatever the server's default engine is: publishing needs real transactions and row locks,
            // and the foreign keys only work between InnoDB tables (a MyISAM default is a WAMP setting).
            $table->engine = 'InnoDB';
            $table->id();
            $table->foreignId('memo_id')->constrained()->cascadeOnDelete();
            $table->foreignId('signatory_id')->constrained('signatories')->restrictOnDelete();
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->string('label', 40)->nullable();
            $table->string('name', 100);
            $table->string('position', 100);
            $table->string('signature_path')->nullable();
            $table->timestamps();

            $table->index(['memo_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memo_signatories');
    }
};
