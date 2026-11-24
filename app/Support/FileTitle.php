<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;

/** The title of an announcement or memo that is only a file: the file's name, without its extension, tidied for reading. */
final class FileTitle
{
    public const MAX_LENGTH = 255;

    /** @param  string  $fallback  used when the name has nothing to read (a file called just ".pdf") */
    public static function from(UploadedFile $file, string $fallback): string
    {
        $name = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $title = trim((string) preg_replace('/\s+/u', ' ', str_replace('_', ' ', $name)));

        return $title === '' ? $fallback : mb_substr($title, 0, self::MAX_LENGTH);
    }
}
