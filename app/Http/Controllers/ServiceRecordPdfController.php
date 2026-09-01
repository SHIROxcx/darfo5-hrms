<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ServiceRecordPdfService;
use Illuminate\Support\Facades\Auth;

class ServiceRecordPdfController extends Controller
{
    public function __construct(private ServiceRecordPdfService $pdfService)
    {
    }

    /**
     * Download one employee's Service Record as a PDF attachment.
     */
    public function download(?int $userId = null)
    {
        $user = $this->resolveUser($userId);

        return response($this->pdfService->buildPdf($user), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $this->pdfService->filenameFor($user) . '"',
        ]);
    }

    /**
     * Stream one employee's Service Record PDF inline for browser preview.
     */
    public function preview(?int $userId = null)
    {
        $user = $this->resolveUser($userId);

        return response($this->pdfService->buildPdf($user), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="service-record-preview.pdf"',
        ]);
    }

    private function resolveUser(?int $userId): User
    {
        $authUser = Auth::user();
        $targetId = $userId ?? $authUser->id;

        if ($targetId !== $authUser->id && ! $authUser->hasAnyRole(['admin', 'superadmin'])) {
            abort(403);
        }

        return User::findOrFail($targetId);
    }
}
