<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;

/** Plain-language messages for uploads, shared by the PDS and the memos. */
final class UploadMessages
{
    /**
     * What a person reads when PHP itself refused a file. PHP stops a file bigger than its own upload_max_filesize before
     * Laravel sees it, even when the form allows more, and Laravel's default ("The Attachment #1 failed to upload.") does
     * not say what to do. The number is the real limit, capped at the form's own.
     */
    public static function failed(int $limitMb): string
    {
        $acceptedMb = min($limitMb, max(1, (int) floor(UploadedFile::getMaxFilesize() / 1048576)));

        return "The :attribute could not be uploaded. This server accepts files up to {$acceptedMb} MB each. Attach a smaller file.";
    }
}
