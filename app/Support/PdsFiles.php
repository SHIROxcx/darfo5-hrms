<?php

namespace App\Support;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;

/**
 * Where PDS uploads (certificates, ID photo, e-signature) live.
 *
 * They are personal data, so they sit on the private disk: nothing reaches them by URL.
 * PdsFileController serves them after an access check; the PDF views read them from disk.
 * Stored values stay as "pds/{userId}/...", the same as before they moved.
 */
final class PdsFiles
{
    public const DISK = 'local';

    public static function disk(): Filesystem
    {
        return Storage::disk(self::DISK);
    }

    /** Absolute path, for the PDF views (headless Chrome reads the image from disk). */
    public static function path(string $stored): string
    {
        return self::disk()->path($stored);
    }

    /** The stored image as a data URI, or null when nothing is stored or the file is gone. */
    public static function dataUri(?string $stored): ?string
    {
        if ($stored === null || $stored === '' || ! self::disk()->exists($stored)) {
            return null;
        }

        $mime = self::disk()->mimeType($stored) ?: 'image/png';

        return "data:{$mime};base64,".base64_encode(self::disk()->get($stored));
    }
}
