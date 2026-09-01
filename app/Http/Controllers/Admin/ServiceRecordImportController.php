<?php

namespace App\Http\Controllers\Admin;

use App\Actions\ServiceRecords\ImportServiceRecords;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ServiceRecordImportController extends Controller
{
    private const CACHE_PREFIX = 'service-record-import:';
    private const CACHE_TTL_MINUTES = 15;

    public function template()
    {
        $headers = ImportServiceRecords::EXPECTED_HEADERS;

        $exampleRow = [
            'EXAMPLE-001', '2020-01-15', '', 'Computer Programmer I', 'Permanent',
            '25439.00', 'D.A. RFO-5', "Nat'l", '', '', '', 'Original',
        ];

        $filename = 'service-record-import-template.csv';

        return response()->streamDownload(function () use ($headers, $exampleRow) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            fputcsv($out, $exampleRow);
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function preview(Request $request, ImportServiceRecords $importer)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        try {
            $result = $importer->preview($request->file('file'));
        } catch (\RuntimeException $e) {
            throw ValidationException::withMessages(['file' => $e->getMessage()]);
        }

        $token = (string) Str::uuid();
        Cache::put(self::CACHE_PREFIX . $token, [
            'new_rows'       => $result['new_rows'],
            'duplicate_rows' => $result['duplicate_rows'],
        ], now()->addMinutes(self::CACHE_TTL_MINUTES));

        return response()->json([
            'token'   => $token,
            'summary' => $result['summary'],
        ]);
    }

    public function commit(Request $request, ImportServiceRecords $importer)
    {
        $data = $request->validate([
            'token' => 'required|string',
        ]);

        $cacheKey = self::CACHE_PREFIX . $data['token'];
        $validated = Cache::get($cacheKey);

        if ($validated === null) {
            throw ValidationException::withMessages([
                'token' => 'This import preview has expired. Please upload the file again.',
            ]);
        }

        $result = $importer->commit($validated);

        Cache::forget($cacheKey);

        return response()->json($result);
    }
}
