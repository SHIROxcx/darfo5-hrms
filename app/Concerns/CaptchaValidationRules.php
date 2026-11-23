<?php

namespace App\Concerns;

use App\Support\Captcha;
use Closure;

/** The validation of the security code, shared by the login and account creation. Empty when the captcha is switched off. */
trait CaptchaValidationRules
{
    /** @return array<int, mixed> */
    protected function captchaRules(): array
    {
        if (! Captcha::enabled()) {
            return [];
        }

        return [
            'bail',
            'required',
            'string',
            function (string $attribute, mixed $value, Closure $fail): void {
                if (! Captcha::check($value)) {
                    $fail('The security code is wrong or has expired. Type the letters and numbers in the picture, or get a new picture.');
                }
            },
        ];
    }

    /** @return array<string, string> */
    protected function captchaMessages(): array
    {
        return [
            'captcha.required' => 'Type the security code shown in the picture.',
            'captcha.string' => 'Type the security code shown in the picture.',
        ];
    }
}
