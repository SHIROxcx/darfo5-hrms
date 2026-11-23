<?php

namespace App\Support;

use DateTimeInterface;
use Illuminate\Support\HtmlString;

/**
 * Display helpers for the CS Form 212 PDF views. Escaping stays in Blade.
 */
final class PdsFormat
{
    private const BLANK = 'N/A';

    public static function text(mixed $value): string
    {
        $text = trim((string) ($value ?? ''));

        return $text === '' ? self::BLANK : $text;
    }

    /** dd/mm/yyyy; anything that is not a date (a year such as "1996") is returned unchanged. */
    public static function date(mixed $value): string
    {
        if ($value instanceof DateTimeInterface) {
            return $value->format('d/m/Y');
        }

        $text = trim((string) ($value ?? ''));

        if ($text === '') {
            return self::BLANK;
        }

        // Only a real calendar date (optionally followed by a time) is reformatted. Free text that merely starts like
        // one ("2020-01-01 (renewed)", "2020-02-30") is returned as typed: the date-of-issuance field is free text.
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})(?:[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/', $text, $m)
            && checkdate((int) $m[2], (int) $m[3], (int) $m[1])) {
            return "{$m[3]}/{$m[2]}/{$m[1]}";
        }

        return $text;
    }

    /** "P21,877.00" as in the Guide to Filling Up the PDS. */
    public static function money(mixed $value): string
    {
        if ($value === null || $value === '' || ! is_numeric($value)) {
            return self::BLANK;
        }

        return 'P'.number_format((float) $value, 2);
    }

    public static function checkbox(bool $checked): HtmlString
    {
        $mark = $checked
            ? '<span class="text-[9pt] leading-none font-bold text-black">✓</span>'
            : '';

        return new HtmlString(
            "<div class='inline-flex items-center gap-1 align-middle'>"
            ."<div class='w-3 h-3 border bg-white border-black flex items-center justify-center'>{$mark}</div>"
            .'</div>'
        );
    }
}
