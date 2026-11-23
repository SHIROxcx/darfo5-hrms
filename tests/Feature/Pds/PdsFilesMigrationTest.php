<?php

use Illuminate\Support\Facades\Storage;

// Files uploaded before PDS uploads became private sit on the public disk, readable by URL. The migration moves them.

function pdsFilesMigration(): object
{
    static $migration = null;

    $file = glob(base_path('database/migrations/*_move_pds_files_to_private_disk.php'))[0] ?? null;
    expect($file)->not->toBeNull('the move_pds_files_to_private_disk migration does not exist');

    return $migration ??= require $file;
}

beforeEach(function () {
    Storage::fake('local');
    Storage::fake('public');
});

test('moves existing PDS files to the private disk and leaves other public files alone', function () {
    Storage::disk('public')->put('pds/5/work_experience/a.pdf', 'A');
    Storage::disk('public')->put('pds/5/sig.png', 'S');
    Storage::disk('public')->put('photos/avatar.jpg', 'P');

    pdsFilesMigration()->up();

    expect(Storage::disk('local')->get('pds/5/work_experience/a.pdf'))->toBe('A');
    expect(Storage::disk('local')->get('pds/5/sig.png'))->toBe('S');
    Storage::disk('public')->assertMissing('pds/5/work_experience/a.pdf');
    Storage::disk('public')->assertMissing('pds/5/sig.png');
    Storage::disk('public')->assertExists('photos/avatar.jpg');
    Storage::disk('local')->assertMissing('photos/avatar.jpg');
});

test('running it again changes nothing and loses nothing', function () {
    Storage::disk('public')->put('pds/5/sig.png', 'S');

    pdsFilesMigration()->up();
    pdsFilesMigration()->up();

    expect(Storage::disk('local')->get('pds/5/sig.png'))->toBe('S');
});

test('a file already on the private disk is not overwritten by a stale public copy', function () {
    Storage::disk('local')->put('pds/5/sig.png', 'NEW');
    Storage::disk('public')->put('pds/5/sig.png', 'OLD');

    pdsFilesMigration()->up();

    expect(Storage::disk('local')->get('pds/5/sig.png'))->toBe('NEW');
    Storage::disk('public')->assertMissing('pds/5/sig.png');
});

test('does nothing when there are no PDS files', function () {
    pdsFilesMigration()->up();

    expect(Storage::disk('local')->allFiles())->toBe([]);
});

test('rolling back puts the files back on the public disk', function () {
    Storage::disk('local')->put('pds/5/sig.png', 'S');

    pdsFilesMigration()->down();

    expect(Storage::disk('public')->get('pds/5/sig.png'))->toBe('S');
    Storage::disk('local')->assertMissing('pds/5/sig.png');
});
