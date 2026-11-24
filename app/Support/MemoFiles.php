<?php

namespace App\Support;

use App\Models\Memo;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;

/**
 * Where memo files live: the file HR uploads for each memo.
 *
 * They sit on the private disk, so nothing reaches them by URL. A controller serves them after an access check.
 */
final class MemoFiles
{
    public const DISK = 'local';

    public static function disk(): Filesystem
    {
        return Storage::disk(self::DISK);
    }

    /** One memo's folder on the private disk. */
    public static function memoDir(int $memoId): string
    {
        return "memos/{$memoId}";
    }

    /**
     * The stored file that belongs to this memo. Null when there is none, the file is gone, or the row points anywhere but
     * the memo's own file folder (another memo, a path with "..") - so a damaged row can never make the app serve something else.
     */
    public static function fileOf(Memo $memo): ?string
    {
        $stored = $memo->file_path;

        if (! is_string($stored) || ! preg_match('#^memos/(\d+)/file/[A-Za-z0-9_-][A-Za-z0-9._-]*$#', $stored, $found) || (int) $found[1] !== $memo->id) {
            return null;
        }

        return self::disk()->exists($stored) ? $stored : null;
    }
}
