<?php

// The memo tables must be InnoDB whatever the MySQL server's default engine is. Publishing relies on real transactions
// and row locks, and the foreign keys to `users` only work between InnoDB tables. A server whose default is MyISAM
// (a WAMP setting) would otherwise build them as MyISAM, which cannot undo a half-finished publish and ignores foreign keys.
// The tests run on SQLite, which has no engines, so the rule is pinned by reading the migration files.

test('every migration that creates a memo table asks for InnoDB', function () {
    $files = collect(glob(database_path('migrations/2026_11_21_*_create_*_table.php')));

    expect($files)->toHaveCount(4); // record_events, signatories, memos, memo_signatories

    $without = $files
        ->reject(fn (string $file) => str_contains(file_get_contents($file), "\$table->engine = 'InnoDB';"))
        ->map(fn (string $file) => basename($file))
        ->values()
        ->all();

    expect($without)->toBe([]);
});
