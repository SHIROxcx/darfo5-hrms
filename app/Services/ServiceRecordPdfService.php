<?php

namespace App\Services;

use App\Models\User;
use Spatie\Browsershot\Browsershot;
use App\Support\PdfBrowsershot;

class ServiceRecordPdfService
{
    /**
     * Render the Service Record Blade view for one employee.
     *
     * $preview adds an on-screen page outline for the browser-based
     * html-preview route only — it never applies to the actual PDF.
     */
    public function buildHtml(User $user, bool $preview = false): string
    {
        $user->loadMissing(['pdsPersonalInfo', 'serviceRecords' => fn ($q) => $q->orderBy('date_from')]);

        return view('service-records.pdf', [
            'user'           => $user,
            'pds'            => $user->pdsPersonalInfo,
            'serviceRecords' => $user->serviceRecords,
            'daLogo'         => $this->fileToDataUri(public_path('images/da-rfo5-logo.png')),
            'preview'        => $preview,
        ])->render();
    }

    /**
     * Render the PDF bytes for one employee.
     */
    public function buildPdf(User $user): string
    {
        return $this->buildBrowsershot($this->buildHtml($user))->pdf();
    }

    public function filenameFor(User $user): string
    {
        return 'Service_Record_'
            . str_replace(' ', '_', strtoupper($user->last_name ?? 'EMPLOYEE'))
            . '_' . $user->id . '.pdf';
    }

    private function buildBrowsershot(string $html): Browsershot
    {
        return PdfBrowsershot::make($html)
            ->paperSize(8.5, 13, 'in')
            ->margins(11, 11, 8, 11, 'mm')
            ->showBackground()
            ->waitUntilNetworkIdle()
            ->deviceScaleFactor(2)
            ->timeout(60);
    }

    private function fileToDataUri(string $absolutePath): ?string
    {
        if (!is_file($absolutePath)) {
            return null;
        }

        $mime = mime_content_type($absolutePath) ?: 'image/png';
        $data = base64_encode(file_get_contents($absolutePath));

        return "data:{$mime};base64,{$data}";
    }
}
