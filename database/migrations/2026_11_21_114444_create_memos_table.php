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
        // An official memo: written in the system (and printed as a PDF) or uploaded as a ready-made file.
        // Published memos are frozen; drafts are the only rows that are ever (soft) deleted.
        Schema::create('memos', function (Blueprint $table) {
            // InnoDB on purpose, whatever the server's default engine is: publishing needs real transactions and row locks,
            // and the foreign keys only work between InnoDB tables (a MyISAM default is a WAMP setting).
            $table->engine = 'InnoDB';
            $table->id();
            $table->string('type', 40);
            $table->unsignedSmallInteger('series_year')->nullable();
            $table->unsignedInteger('number')->nullable();
            $table->string('reference', 50)->nullable();
            $table->string('subject', 255);
            $table->string('addressed_to', 150);
            $table->date('memo_date');
            $table->time('memo_time')->nullable();
            $table->string('mode', 10);
            $table->mediumText('body')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->string('final_pdf_path')->nullable();
            $table->string('status', 12)->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('withdrawn_reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // No two memos of one type share a number in one series year (a number stays empty until published).
            $table->unique(['type', 'series_year', 'number']);
            $table->index('status');
            $table->index('memo_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memos');
    }
};
