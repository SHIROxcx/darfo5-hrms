<?php

namespace App\Support;

use Spatie\Browsershot\Browsershot;

class PdfBrowsershot
{
    public static function make(string $html): Browsershot
    {
        $browsershot = Browsershot::html($html)->noSandbox();

        if ($nodeBinary = config('services.browsershot.node_binary')) {
            $browsershot->setNodeBinary($nodeBinary);
        }

        if ($npmBinary = config('services.browsershot.npm_binary')) {
            $browsershot->setNpmBinary($npmBinary);
        }

        if ($chromePath = config('services.browsershot.chrome_path')) {
            $browsershot->setChromePath($chromePath);
        }

        return $browsershot;
    }
}