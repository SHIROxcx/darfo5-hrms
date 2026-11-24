<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // A memo is now only an uploaded file. A memo that was written in the system has no file to fall back on, so
        // refuse to run rather than throw its text away without anyone noticing.
        if (DB::table('memos')->where('mode', 'written')->exists()) {
            throw new RuntimeException('Some memos were written in the system, and their text would be lost. Export or delete them first, then run this migration again.');
        }

        // The signatories only existed to be printed on a written memo.
        Schema::dropIfExists('memo_signatories');
        Schema::dropIfExists('signatories');

        // The index goes first: dropping a column out of a composite index would leave an index on the other columns.
        Schema::table('memos', function (Blueprint $table) {
            $table->dropUnique(['type', 'series_year', 'number']);
        });

        // What is left is the subject (the file's name), the date, the file and the status. The type, the "addressed to" line,
        // the time and the typed reference are no longer asked for.
        Schema::table('memos', function (Blueprint $table) {
            $table->dropColumn(['type', 'reference', 'addressed_to', 'memo_time', 'mode', 'body', 'series_year', 'number', 'final_pdf_path']);
        });
    }

    /**
     * Reverse the migrations. The structure comes back; the data that was dropped does not.
     */
    public function down(): void
    {
        Schema::table('memos', function (Blueprint $table) {
            $table->string('type', 40)->default('Memorandum')->after('id');
            $table->unsignedSmallInteger('series_year')->nullable()->after('type');
            $table->unsignedInteger('number')->nullable()->after('series_year');
            $table->string('reference', 50)->nullable()->after('number');
            $table->string('addressed_to', 150)->default('All DA RFO 5 Employees')->after('subject');
            $table->time('memo_time')->nullable()->after('memo_date');
            $table->string('mode', 10)->default('uploaded')->after('memo_time');
            $table->mediumText('body')->nullable()->after('mode');
            $table->string('final_pdf_path')->nullable()->after('file_name');
        });

        Schema::table('memos', function (Blueprint $table) {
            $table->unique(['type', 'series_year', 'number']);
        });

        Schema::create('signatories', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();
            $table->string('name', 100);
            $table->string('position', 100);
            $table->string('signature_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('is_active');
        });

        Schema::create('memo_signatories', function (Blueprint $table) {
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
};
