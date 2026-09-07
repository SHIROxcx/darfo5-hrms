<?php

namespace App\Support;

use Spatie\Browsershot\Browsershot;

class PdfBrowsershot
{
    public static function make(string $html): Browsershot
    {
        $browsershot = Browsershot::html($html)
            ->setNodeBinary(config('services.browsershot.node_binary'))
            ->setNpmBinary(config('services.browsershot.npm_binary'))
            ->noSandbox();

        if ($chromePath = config('services.browsershot.chrome_path')) {
            $browsershot->setChromePath($chromePath);
        }

        return $browsershot;
    }
}