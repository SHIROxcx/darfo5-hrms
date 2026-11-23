<?php

namespace Tests\Concerns;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

/**
 * RefreshDatabase that never touches real uploaded files.
 *
 * RefreshDatabase runs every migration for each test, including the one that moves PDS uploads from the public
 * disk to the private one. Faking both disks first means a test run cannot move or read real files.
 * (This lives in a trait because a trait method beats one inherited from Tests\TestCase.)
 */
trait RefreshesDatabaseWithFakeDisks
{
    use RefreshDatabase;

    protected function beforeRefreshingDatabase()
    {
        Storage::fake('local');
        Storage::fake('public');
    }
}
