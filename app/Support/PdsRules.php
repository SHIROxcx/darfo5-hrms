<?php

namespace App\Support;

use Closure;

/**
 * Format checks for PDS boxes that have a known shape: government IDs, mobile and telephone numbers, a reference's
 * contact and person names. Each factory returns a validation rule to put beside the length rule.
 *
 * resources/js/lib/pds-formats.ts holds the same table and patterns for the form's instant messages, and
 * PdsFormatsParityTest fails if the two differ. The official PDS convention is to write "N/A" when something does not
 * apply, so the boxes where that makes sense accept it.
 *
 * There is deliberately no ZIP check: the ZIP is copied from the chosen city into a read-only box, so a check could
 * only lock out an employee whose older record holds a value they cannot edit.
 */
final class PdsRules
{
    /** field => [label, accepted digit counts, example]. Dashes and spaces are allowed between the digits. */
    public const ID_FORMATS = [
        'philsys_number' => ['PhilSys Card Number (PCN)', [16], '1234-5678-9012-3456'],
        'tin_number' => ['TIN No.', [9, 12, 14], '123-456-789'],
        'philhealth_number' => ['PhilHealth No.', [12], '12-345678901-2'],
        'pagibig_number' => ['PAG-IBIG ID No.', [12], '1234-5678-9012'],
        'umid_number' => ['UMID ID No.', [12], '0845-8859385-3'],
    ];

    /** Pattern sources shared with the browser (the browser adds the `u` flag, and `i` where noted). */
    public const PATTERNS = [
        // After spaces, dashes, dots and parentheses are removed: 09xxxxxxxxx, +639xxxxxxxxx or 639xxxxxxxxx.
        'mobile' => '^(09|\+?639)\d{9}$',
        // At least 5 digits in digits, spaces and ( ) + - . / , with an optional leading "Tel." and optional endings
        // such as "loc. 101", "local 101/102", "ext 101", "x101" or "to 36". Case-insensitive.
        'telephone' => '^(?=(?:\D*\d){5})(?:tel\.?\s*)?[0-9\s()+\-./]+(?:\s*(?:loc|local|ext|to|x)\.?\s*\d+(?:\s*/\s*\d+)*)*$',
        // Deliberately simple: something@something.something with no spaces.
        'email' => '^[^\s@]+@[^\s@]+\.[^\s@]+$',
        // Starts with a letter; then letters, spaces and . - ' ’ , ( ) only.
        'name' => '^[\p{L}\p{M}][\p{L}\p{M}\s.\-\'’,()]*$',
        'not_applicable' => '^n/a$',
    ];

    /** A government ID: the right number of digits, with dashes and spaces allowed, or N/A. */
    public static function governmentId(string $field): Closure
    {
        [$label, $counts, $example] = self::ID_FORMATS[$field];

        return function (string $attribute, mixed $value, Closure $fail) use ($label, $counts, $example) {
            if (! is_string($value) || self::isNotApplicable($value)) {
                return;
            }

            // The pattern runs first (and in unicode mode, like the browser's), so the digit count only sees plain digits.
            if (! preg_match('/^[0-9\s-]+$/u', $value) || ! in_array(strlen(preg_replace('/\D/', '', $value)), $counts, true)) {
                $fail("{$label} must have ".self::countsText($counts)." digits, for example {$example}. Dashes and spaces are fine; write N/A if you have none.");
            }
        };
    }

    /** A Philippine mobile number: 09171234567, 0917 123 4567, +63 (917) 123 4567 or 639171234567. */
    public static function mobile(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) {
            if (! is_string($value)) {
                return;
            }

            $compact = preg_replace('/[\s().-]/u', '', $value); // null for text that is not valid UTF-8

            if ($compact === null || ! preg_match(self::regex('mobile'), $compact)) {
                $fail('Mobile No. must look like 09171234567 or +639171234567.');
            }
        };
    }

    /**
     * A telephone number (a mobile number passes too). `$allowNa` is for boxes that may be left as N/A. `$label` names
     * the box in the message; null is for a box inside a repeated row, where the message names the row instead.
     */
    public static function telephone(bool $allowNa = false, ?string $label = null): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) use ($allowNa, $label) {
            if (! is_string($value) || ($allowNa && self::isNotApplicable($value))) {
                return;
            }

            if (! preg_match(self::regex('telephone', 'i'), $value)) {
                $fail(($label ?? ($allowNa ? 'Telephone No.' : 'The :attribute')).' may only have numbers, spaces and ( ) + - . / for example (054) 123-4567, optionally followed by loc. 101.'.($allowNa ? ' Write N/A if none.' : ''));
            }
        };
    }

    /** An email address: something@something.something with no spaces (stricter than PHP's "name@localhost"). */
    public static function email(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) {
            if (is_string($value) && ! preg_match(self::regex('email'), $value)) {
                $fail('Email must be a valid email address, like name@example.com.');
            }
        };
    }

    /** A reference's contact: a phone number (as telephone()) or an email address. N/A is not accepted. */
    public static function contact(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) {
            if (! is_string($value) || preg_match(self::regex('telephone', 'i'), $value) || preg_match(self::regex('email'), $value)) {
                return;
            }

            $fail('The :attribute must be a phone number (for example 09171234567) or an email address.');
        };
    }

    /**
     * A person's name (or part of one): letters, spaces and . - ' , ( ) only, no numbers.
     * `$label` null is for names inside a repeated row, where the message names the row instead.
     */
    public static function personName(?string $label = null, bool $allowNa = false): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) use ($label, $allowNa) {
            if (! is_string($value) || ($allowNa && self::isNotApplicable($value))) {
                return;
            }

            if (! preg_match(self::regex('name'), $value)) {
                $fail(($label ?? 'The :attribute')." may only have letters, spaces and . - ' , ( ) (no numbers).".($allowNa ? ' Write N/A if none.' : ''));
            }
        };
    }

    /** [16] => "16", [9, 12, 14] => "9, 12 or 14". */
    private static function countsText(array $counts): string
    {
        $last = array_pop($counts);

        return $counts ? implode(', ', $counts).' or '.$last : (string) $last;
    }

    private static function isNotApplicable(string $value): bool
    {
        return (bool) preg_match(self::regex('not_applicable', 'i'), trim($value));
    }

    private static function regex(string $pattern, string $flags = ''): string
    {
        return '~'.self::PATTERNS[$pattern].'~u'.$flags;
    }
}
