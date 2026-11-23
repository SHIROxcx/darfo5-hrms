<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Memos module
    |--------------------------------------------------------------------------
    | The kinds of memo, the limits the form and the server share, and the letterhead printed on every written memo.
    | The limits are mirrored in resources/js/lib/memo-limits.ts (a test fails if the two differ).
    */

    'types' => ['Memorandum', 'Memorandum Circular'],

    'limits' => [
        'subject' => 255,
        'addressed_to' => 150,
        'body' => 20000,
        'name' => 100,
        'position' => 100,
        'label' => 40,
        'reference' => 50,
        'withdraw_reason' => 255,
    ],

    'max_signatories' => 6,

    // An uploaded memo: the ready-made file HR attaches instead of writing the memo here.
    'file' => [
        'mimes' => ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
        'max_kb' => 10240,
    ],

    // A signatory's signature picture.
    'signature' => [
        'mimes' => ['png', 'jpg', 'jpeg'],
        'max_kb' => 2048,
    ],

    // Printed at the top of every page of a written memo. The address and contact lines stay off until they are set in .env.
    'letterhead' => [
        'republic' => 'Republic of the Philippines',
        'department' => 'DEPARTMENT OF AGRICULTURE',
        'office' => 'REGIONAL FIELD OFFICE 5',
        'address' => env('MEMO_LETTERHEAD_ADDRESS'),
        'contact' => env('MEMO_LETTERHEAD_CONTACT'),
    ],

    // Dates printed on a memo use the office's time zone; the app itself runs in UTC.
    'timezone' => 'Asia/Manila',

];
