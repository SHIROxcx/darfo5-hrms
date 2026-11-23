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
        // The shared history of memos and announcements: who did what to which record, and when. Append-only.
        Schema::create('record_events', function (Blueprint $table) {
            // InnoDB on purpose, whatever the server's default engine is: publishing needs real transactions and row locks,
            // and the foreign keys only work between InnoDB tables (a MyISAM default is a WAMP setting).
            $table->engine = 'InnoDB';
            $table->id();
            $table->string('subject_type');
            $table->unsignedBigInteger('subject_id');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 40);
            $table->json('details')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['subject_type', 'subject_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('record_events');
    }
};
