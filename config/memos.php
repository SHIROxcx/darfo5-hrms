<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Memos module
    |--------------------------------------------------------------------------
    | A memo is only an uploaded file: HR picks the file, its name becomes the subject and the date is filled in by the system.
    | The limits are mirrored in resources/js/lib/memo-limits.ts (a test fails if the two differ).
    */

    'limits' => [
        'withdraw_reason' => 255,
    ],

    // The memo file HR attaches: a PDF, Word document or picture.
    'file' => [
        'mimes' => ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
        'max_kb' => 10240,
    ],

    // Dates on a memo use the office's time zone; the app itself runs in UTC.
    'timezone' => 'Asia/Manila',

];
