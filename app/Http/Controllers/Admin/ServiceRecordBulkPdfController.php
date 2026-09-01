<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ServiceRecordPdfService;
use Illuminate\Http\Request;
use ZipArchive;

class ServiceRecordBulkPdfController extends Controller
{
    private const MAX_EMPLOYEES = 50;

    public function __construct(private ServiceRecordPdfService $pdfService)
    {
    }

    /**
     * Generate a Service Record PDF for each selected employee and
     * return them bundled in a single ZIP download.
     */
    public function bulk(Request $request)
    {
        $data = $request->validate([
            'user_ids'   => 'required|array|min:1|max:' . self::MAX_EMPLOYEES,
            'user_ids.*' => 'integer|exists:users,id',
        ], [
            'user_ids.max' => 'You can generate up to ' . self::MAX_EMPLOYEES . ' Service Records at a time.',
        ]);

        // Rendering each PDF spins up headless Chrome (~3-5s apiece); a full
        // batch of MAX_EMPLOYEES can comfortably exceed the default PHP
        // execution time limit, so extend it just for this action.
        set_time_limit(300);

        $users = User::whereIn('id', $data['user_ids'])->get();

        $zipPath = tempnam(sys_get_temp_dir(), 'service-records-') . '.zip';

        $zip = new ZipArchive();
        $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        $usedNames = [];
        foreach ($users as $user) {
            $pdfBytes = $this->pdfService->buildPdf($user);

            $filename = $this->pdfService->filenameFor($user);
            if (isset($usedNames[$filename])) {
                $usedNames[$filename]++;
                $filename = pathinfo($filename, PATHINFO_FILENAME) . '_' . $usedNames[$filename] . '.pdf';
            } else {
                $usedNames[$filename] = 1;
            }

            $zip->addFromString($filename, $pdfBytes);
        }

        $zip->close();

        $zipFilename = 'Service_Records_' . now()->format('Ymd_His') . '.zip';

        return response()->download($zipPath, $zipFilename)->deleteFileAfterSend(true);
    }
}
