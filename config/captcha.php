<?php

/*
|--------------------------------------------------------------------------
| Security code ("captcha") on login and account creation
|--------------------------------------------------------------------------
|
| Self-hosted on purpose: no Google or other outside service. The office server may have no internet access, and a captcha
| that cannot load would lock everyone out. See App\Support\Captcha.
|
| Switch it off with CAPTCHA_ENABLED=false in .env (for example while testing the login with a script).
|
*/

return [

    'enabled' => env('CAPTCHA_ENABLED', true),

    // How many characters are drawn, and which ones. Look-alikes are left out so people can read it: 0 O 1 I L, and
    // B G S Z (they look like 8 6 5 2). 27 characters in 5 places is still about 14 million combinations.
    'length' => 5,
    'alphabet' => 'ACDEFHJKMNPQRTUVWXY23456789',

    // How long a picture stays good. Each picture can be tried once, right or wrong.
    'minutes_valid' => 5,

    // The picture is drawn this size; resources/js/components/captcha-field.tsx reserves the same space for it.
    'width' => 200,
    'height' => 56,

];
