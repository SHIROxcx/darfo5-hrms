<?php

namespace App\Concerns;

use App\Models\Memo;
use App\Support\UploadMessages;
use Illuminate\Validation\Rule;

/** The rules for saving a memo draft, shared by the store and update requests. Limits come from config/memos.php. */
trait MemoValidationRules
{
    /** @param  Memo|null  $memo  the draft being edited, so an existing file counts as "attached" */
    protected function memoRules(?Memo $memo = null): array
    {
        $limits = config('memos.limits');
        $file = config('memos.file');
        $uploaded = fn () => $this->input('mode') === Memo::MODE_UPLOADED && ! $memo?->file_path;

        return [
            'type' => ['required', Rule::in(config('memos.types'))],
            'subject' => ['bail', 'required', 'string', 'max:'.$limits['subject']],
            'addressed_to' => ['nullable', 'string', 'max:'.$limits['addressed_to']],
            'memo_date' => ['required', 'date_format:Y-m-d'],
            'memo_time' => ['nullable', 'date_format:H:i'],
            'mode' => ['required', Rule::in([Memo::MODE_WRITTEN, Memo::MODE_UPLOADED])],
            'body' => ['bail', 'nullable', 'string', 'max:'.$limits['body'], Rule::requiredIf(fn () => $this->input('mode') === Memo::MODE_WRITTEN)],
            'reference' => ['nullable', 'string', 'max:'.$limits['reference']],
            'file' => ['bail', Rule::requiredIf($uploaded), 'nullable', 'file', 'mimes:'.implode(',', $file['mimes']), 'max:'.$file['max_kb']],
            'signatories' => ['nullable', 'array', 'max:'.config('memos.max_signatories')],
            'signatories.*.signatory_id' => ['bail', 'required', 'integer', 'distinct', Rule::exists('signatories', 'id')->where('is_active', true)],
            'signatories.*.label' => ['nullable', 'string', 'max:'.$limits['label']],
        ];
    }

    protected function memoMessages(): array
    {
        $limits = config('memos.limits');
        $fileMb = intdiv(config('memos.file.max_kb'), 1024);
        $maxSignatories = config('memos.max_signatories');

        return [
            'type.required' => 'Choose a memo type from the list.',
            'type.in' => 'Choose a memo type from the list.',
            'subject.required' => 'Subject is required.',
            'subject.max' => "Subject is too long (maximum {$limits['subject']} characters).",
            'addressed_to.max' => "The \"addressed to\" line is too long (maximum {$limits['addressed_to']} characters).",
            'memo_date.required' => 'Date is required.',
            'memo_date.date_format' => 'Date must be a valid date.',
            'memo_time.date_format' => 'Time must look like 14:30.',
            'mode.required' => 'Choose whether to write the memo or upload a file.',
            'mode.in' => 'Choose whether to write the memo or upload a file.',
            'body.required' => 'Write the memo, or switch to uploading a file.',
            'body.max' => 'The memo text is too long (maximum '.number_format($limits['body']).' characters).',
            'reference.max' => "The reference is too long (maximum {$limits['reference']} characters).",
            'file.required' => 'Attach the memo file.',
            'file.file' => 'The memo file must be a valid file.',
            'file.mimes' => 'The file must be a PDF, Word document or picture (pdf, doc, docx, jpg, png).',
            'file.max' => "The file must not be larger than {$fileMb} MB.",
            'file.uploaded' => UploadMessages::failed($fileMb),
            'signatories.max' => "A memo can have at most {$maxSignatories} signatories.",
            'signatories.*.signatory_id.required' => 'Pick a signatory from the list.',
            'signatories.*.signatory_id.distinct' => 'The same signatory is listed twice.',
            'signatories.*.signatory_id.exists' => 'That signatory is not in the active list.',
            'signatories.*.label.max' => "A label can have at most {$limits['label']} characters.",
        ];
    }
}
