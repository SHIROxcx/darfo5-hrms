<?php

use App\Models\Memo;
use Illuminate\Support\Facades\Schema;

// The memo tables must be InnoDB whatever the MySQL server's default engine is. Publishing relies on real transactions
// and row locks, and the foreign keys to `users` only work between InnoDB tables. A server whose default is MyISAM
// (a WAMP setting) would otherwise build them as MyISAM, which cannot undo a half-finished publish and ignores foreign keys.
// The tests run on SQLite, which has no engines, so the rule is pinned by reading the migration files.

test('every migration that creates a memo table asks for InnoDB', function () {
    $files = collect(glob(database_path('migrations/2026_11_21_*_create_*_table.php')));

    expect($files)->toHaveCount(4); // record_events, signatories, memos, memo_signatories (the last two are dropped again later)

    $without = $files
        ->reject(fn (string $file) => str_contains(file_get_contents($file), "\$table->engine = 'InnoDB';"))
        ->map(fn (string $file) => basename($file))
        ->values()
        ->all();

    expect($without)->toBe([]);
});

test('a memo is only a file: the written-memo and detail columns and the signatory tables are gone', function () {
    expect(Schema::hasTable('memos'))->toBeTrue()
        ->and(Schema::hasTable('signatories'))->toBeFalse()
        ->and(Schema::hasTable('memo_signatories'))->toBeFalse();

    foreach (['type', 'reference', 'addressed_to', 'memo_time', 'mode', 'body', 'series_year', 'number', 'final_pdf_path'] as $column) {
        expect(Schema::hasColumn('memos', $column))->toBeFalse("memos.{$column} should be gone");
    }

    foreach (['subject', 'memo_date', 'file_path', 'file_name', 'status', 'published_at', 'published_by', 'withdrawn_reason', 'created_by', 'updated_by', 'deleted_at'] as $column) {
        expect(Schema::hasColumn('memos', $column))->toBeTrue("memos.{$column} should stay");
    }
});

test('memos are no longer numbered, so any number of them can be saved', function () {
    Memo::factory()->published()->count(2)->create();
    Memo::factory()->count(2)->create();

    expect(Memo::count())->toBe(4);
});
