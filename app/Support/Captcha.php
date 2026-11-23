<?php

namespace App\Support;

use GdImage;
use Illuminate\Support\Facades\Log;

/**
 * The security code on the login and sign-up pages: a few letters and numbers drawn into a picture that a person types back.
 *
 * The session keeps only a HASH of the answer and the time it stops being good, never the letters. Every picture can be tried
 * once (a wrong try uses it up), so guessing costs one picture request each, and those are limited per address.
 * Drawn with PHP's GD library; if the server's PHP has no GD it falls back to an SVG, a weaker picture (the letters are
 * readable in the file) that still keeps the page working.
 */
final class Captcha
{
    public const SESSION_KEY = 'captcha';

    public static function enabled(): bool
    {
        return (bool) config('captcha.enabled');
    }

    /** What the session stores for an answer: a keyed hash, so the letters themselves are never written anywhere. */
    public static function hash(string $code): string
    {
        return hash_hmac('sha256', self::normalize($code), (string) config('app.key'));
    }

    /** Make a new code, remember its hash and when it stops being good, and return the code so it can be drawn. */
    public static function issue(): string
    {
        $alphabet = (string) config('captcha.alphabet');
        $code = '';
        for ($i = 0; $i < (int) config('captcha.length'); $i++) {
            $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }

        session()->put(self::SESSION_KEY, [
            'hash' => self::hash($code),
            'expires_at' => now()->addMinutes((int) config('captcha.minutes_valid'))->timestamp,
        ]);

        return $code;
    }

    /** True only for the right answer to the picture last issued in this session. Every call uses that picture up. */
    public static function check(mixed $answer): bool
    {
        $stored = session()->pull(self::SESSION_KEY);

        if (! is_array($stored) || ! is_string($answer) || trim($answer) === '' || mb_strlen($answer) > 20) {
            return false;
        }

        if (($stored['expires_at'] ?? 0) < now()->timestamp) {
            return false;
        }

        return hash_equals((string) ($stored['hash'] ?? ''), self::hash($answer));
    }

    /**
     * The picture for a code.
     *
     * @return array{body: string, mime: string}
     */
    public static function render(string $code, bool $forceSvg = false): array
    {
        if (! $forceSvg && function_exists('imagecreatetruecolor') && function_exists('imagepng')) {
            return ['body' => self::png($code), 'mime' => 'image/png'];
        }

        if (! $forceSvg) {
            Log::warning('Captcha: the PHP "gd" extension is not enabled, so the security code is drawn as a weaker SVG. Turn on extension=gd in php.ini.');
        }

        return ['body' => self::svg($code), 'mime' => 'image/svg+xml'];
    }

    private static function normalize(string $text): string
    {
        return strtoupper((string) preg_replace('/\s+/', '', $text));
    }

    private static function png(string $code): string
    {
        $width = (int) config('captcha.width');
        $height = (int) config('captcha.height');
        $image = imagecreatetruecolor($width, $height);

        imagefilledrectangle($image, 0, 0, $width, $height, imagecolorallocate($image, 238, 244, 238));

        // Letters: GD's built-in font, enlarged, each tilted a little and nudged up or down. Transparent background, so
        // a tilted letter never cuts a corner off its neighbour.
        $length = strlen($code);
        $slot = (int) floor(($width - 24) / $length);
        for ($i = 0; $i < $length; $i++) {
            self::glyph(
                $image,
                $code[$i],
                12 + $i * $slot + random_int(-2, 3),
                random_int(3, 9),
                random_int(-15, 15),
                [random_int(10, 70), random_int(10, 70), random_int(10, 70)],
            );
        }

        // Noise drawn over the letters: lines and dots.
        imagealphablending($image, true);
        imagesetthickness($image, 1);
        for ($i = 0; $i < 5; $i++) {
            $color = imagecolorallocate($image, random_int(125, 195), random_int(125, 195), random_int(125, 195));
            imageline($image, random_int(0, $width), random_int(0, $height), random_int(0, $width), random_int(0, $height), $color);
        }
        for ($i = 0; $i < 70; $i++) {
            imagesetpixel($image, random_int(0, $width - 1), random_int(0, $height - 1), imagecolorallocate($image, random_int(110, 190), random_int(110, 190), random_int(110, 190)));
        }

        ob_start();
        imagepng($image);

        return (string) ob_get_clean();
    }

    /** One enlarged, tilted letter drawn onto the picture at x, y. */
    private static function glyph(GdImage $target, string $char, int $x, int $y, int $angle, array $rgb): void
    {
        $font = 5;
        $scale = 3;
        $glyphWidth = imagefontwidth($font);
        $glyphHeight = imagefontheight($font);

        $small = self::transparentImage($glyphWidth, $glyphHeight);
        imagechar($small, $font, 0, 0, $char, imagecolorallocate($small, ...$rgb));

        $big = self::transparentImage($glyphWidth * $scale, $glyphHeight * $scale);
        imagecopyresized($big, $small, 0, 0, 0, 0, $glyphWidth * $scale, $glyphHeight * $scale, $glyphWidth, $glyphHeight);

        $tilted = imagerotate($big, $angle, imagecolorallocatealpha($big, 0, 0, 0, 127));
        imagealphablending($target, true);
        imagecopy($target, $tilted, $x, $y, 0, 0, imagesx($tilted), imagesy($tilted));
    }

    private static function transparentImage(int $width, int $height): GdImage
    {
        $image = imagecreatetruecolor($width, $height);
        imagealphablending($image, false);
        imagesavealpha($image, true);
        imagefill($image, 0, 0, imagecolorallocatealpha($image, 0, 0, 0, 127));

        return $image;
    }

    private static function svg(string $code): string
    {
        $width = (int) config('captcha.width');
        $height = (int) config('captcha.height');
        $length = strlen($code);
        $slot = ($width - 24) / $length;

        $parts = ["<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{$width}\" height=\"{$height}\" viewBox=\"0 0 {$width} {$height}\">", '<rect width="100%" height="100%" fill="#eef4ee"/>'];

        for ($i = 0; $i < 6; $i++) {
            $parts[] = sprintf('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="rgb(%d,%d,%d)" stroke-width="1.5"/>',
                random_int(0, $width), random_int(0, $height), random_int(0, $width), random_int(0, $height),
                random_int(90, 175), random_int(90, 175), random_int(90, 175));
        }

        for ($i = 0; $i < $length; $i++) {
            $x = (int) (12 + $slot * $i + $slot / 2);
            $y = 38 + random_int(-5, 5);
            $parts[] = sprintf('<text x="%d" y="%d" transform="rotate(%d %d %d)" font-family="monospace" font-size="34" font-weight="bold" text-anchor="middle" fill="rgb(%d,%d,%d)">%s</text>',
                $x, $y, random_int(-18, 18), $x, $y, random_int(15, 95), random_int(15, 95), random_int(15, 95), htmlspecialchars($code[$i], ENT_XML1));
        }

        $parts[] = '</svg>';

        return implode('', $parts);
    }
}
