<?php

namespace App\Http\Controllers;

use App\Support\Captcha;
use Illuminate\Http\Response;

/**
 * The picture of the security code for the login and sign-up pages. Public on purpose (it is needed before anyone is logged
 * in); every request issues a new answer and is limited per address in routes/web.php.
 */
class CaptchaController extends Controller
{
    public function __invoke(): Response
    {
        abort_unless(Captcha::enabled(), 404);

        $drawn = Captcha::render(Captcha::issue());

        return response($drawn['body'], 200, [
            'Content-Type' => $drawn['mime'],
            'Cache-Control' => 'no-store, no-cache, must-revalidate, private',
            'Pragma' => 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
