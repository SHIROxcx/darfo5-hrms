<?php

namespace App\Support;

use App\Models\Memo;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;

/**
 * Where memo files live: uploaded memos, final PDFs and signature pictures.
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

    /** One memo's folder: its uploaded file, its final PDF and the frozen copies of its signature pictures. */
    public static function memoDir(int $memoId): string
    {
        return "memos/{$memoId}";
    }

    /** The saved-list picture of one signatory. */
    public static function signatoryDir(int $signatoryId): string
    {
        return "memos/signatories/{$signatoryId}";
    }

    /** Absolute path, for the PDF view (headless Chrome reads the image from disk). */
    public static function path(string $stored): string
    {
        return self::disk()->path($stored);
    }

    /**
     * The one stored file that belongs to this memo: its final PDF (written) or its uploaded file (uploaded). Null when there
     * is none, the file is gone, or the row points anywhere but the memo's own folder (a signature picture, another memo, a
     * path with "..") - so a damaged row can never make the app serve something else.
     */
    public static function fileOf(Memo $memo): ?string
    {
        $stored = $memo->mode === Memo::MODE_WRITTEN ? $memo->final_pdf_path : $memo->file_path;
        $shape = $memo->mode === Memo::MODE_WRITTEN ? 'final\.pdf' : 'file/[A-Za-z0-9_-][A-Za-z0-9._-]*';

        if (! is_string($stored) || ! preg_match('#^memos/(\d+)/'.$shape.'$#', $stored, $found) || (int) $found[1] !== $memo->id) {
            return null;
        }

        return self::disk()->exists($stored) ? $stored : null;
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
