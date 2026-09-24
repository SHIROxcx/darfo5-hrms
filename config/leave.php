<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Form timezone
    |--------------------------------------------------------------------------
    |
    | The app stores times in UTC. Dates and times printed on the form (Date of
    | Filing, the e-filing timestamp, "As of") use local office time, so an
    | application filed at 7 AM in Pili isn't dated the previous day.
    |
    */

    'timezone' => env('LEAVE_FORM_TIMEZONE', 'Asia/Manila'),

    /*
    |--------------------------------------------------------------------------
    | CSC Form 6 signatories (section 7)
    |--------------------------------------------------------------------------
    |
    | The names and titles printed above the "(Authorized Officer)" and
    | "(Authorized Official)" lines of the Application for Leave. In v1 a
    | single admin fills all of section 7, but the printed form names the
    | officials who hold each role. A blank name leaves the line empty for a
    | wet signature.
    |
    */

    'signatories' => [
        // 7.A Certification of Leave Credits
        'certifying_officer' => [
            'name' => env('LEAVE_CERTIFYING_OFFICER_NAME'),
            'title' => env('LEAVE_CERTIFYING_OFFICER_TITLE'),
        ],
        // 7.B Recommendation
        'recommending_officer' => [
            'name' => env('LEAVE_RECOMMENDING_OFFICER_NAME'),
            'title' => env('LEAVE_RECOMMENDING_OFFICER_TITLE'),
        ],
        // 7.C / 7.D Approved for / Disapproved due to
        'approving_official' => [
            'name' => env('LEAVE_APPROVING_OFFICIAL_NAME'),
            'title' => env('LEAVE_APPROVING_OFFICIAL_TITLE'),
        ],
    ],

];
