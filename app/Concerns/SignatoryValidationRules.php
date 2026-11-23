<?php

namespace App\Concerns;

use App\Support\PdsRules;
use App\Support\UploadMessages;

/** The rules for a saved signatory, shared by the store and update requests. Limits come from config/memos.php. */
trait SignatoryValidationRules
{
    protected function signatoryRules(): array
    {
        $limits = config('memos.limits');
        $picture = config('memos.signature');

        return [
            'name' => ['bail', 'required', 'string', 'max:'.$limits['name'], PdsRules::personName('Name')],
            'position' => ['bail', 'required', 'string', 'max:'.$limits['position']],
            'signature' => ['nullable', 'file', 'mimes:'.implode(',', $picture['mimes']), 'max:'.$picture['max_kb']],
        ];
    }

    protected function signatoryMessages(): array
    {
        $limits = config('memos.limits');
        $pictureMb = intdiv(config('memos.signature.max_kb'), 1024);

        return [
            'name.required' => 'Name is required.',
            'name.max' => "Name is too long (maximum {$limits['name']} characters).",
            'position.required' => 'Position is required.',
            'position.max' => "Position is too long (maximum {$limits['position']} characters).",
            'signature.file' => 'The signature must be a valid picture.',
            'signature.mimes' => 'The signature must be a PNG or JPG picture.',
            'signature.max' => "The signature picture must not be larger than {$pictureMb} MB.",
            'signature.uploaded' => UploadMessages::failed($pictureMb),
        ];
    }
}
