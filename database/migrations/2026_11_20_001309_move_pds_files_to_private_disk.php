<?php

use App\Support\PdsFiles;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Storage;

/**
 * PDS uploads used to sit on the public disk, readable by URL without logging in. They now live on the private
 * disk (see PdsFiles). The stored paths ("pds/{userId}/...") do not change, only the disk does.
 *
 * Safe to run twice: a file leaves its old place only after the copy has been checked.
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->move(Storage::disk('public'), PdsFiles::disk());
    }

    public function down(): void
    {
        $this->move(PdsFiles::disk(), Storage::disk('public'));
    }

    private function move(Filesystem $from, Filesystem $to): void
    {
        foreach ($from->allFiles('pds') as $path) {
            // A copy already at the destination is newer (the app writes there): keep it and drop the stale source.
            if (! $to->exists($path)) {
                $stream = $from->readStream($path);
                $to->writeStream($path, $stream);

                if (is_resource($stream)) {
                    fclose($stream);
                }

                if ($to->size($path) !== $from->size($path)) {
                    $to->delete($path);

                    throw new RuntimeException("Could not copy {$path} intact; nothing was removed from the old location.");
                }
            }

            $from->delete($path);
        }

        $from->deleteDirectory('pds');
    }
};
