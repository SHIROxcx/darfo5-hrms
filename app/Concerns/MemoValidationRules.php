<?php

namespace App\Concerns;

use App\Support\UploadMessages;

/** The rules for saving a memo draft, shared by the store and update requests: the file, and nothing else. */
trait MemoValidationRules
{
    protected function memoRules(): array
    {
        $file = config('memos.file');

        return [
            'file' => ['bail', 'required', 'file', 'mimes:'.implode(',', $file['mimes']), 'max:'.$file['max_kb']],
        ];
    }

    protected function memoMessages(): array
    {
        $fileMb = intdiv(config('memos.file.max_kb'), 1024);

        return [
            'file.required' => 'Attach the memo file.',
            'file.file' => 'The memo file must be a valid file.',
            'file.mimes' => 'The file must be a PDF, Word document or picture (pdf, doc, docx, jpg, png).',
            'file.max' => "The file must not be larger than {$fileMb} MB.",
            'file.uploaded' => UploadMessages::failed($fileMb),
        ];
    }
}
