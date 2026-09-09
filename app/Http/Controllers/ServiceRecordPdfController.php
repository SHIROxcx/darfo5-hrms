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
    public function download(?string $userToken = null)
    {
        $user = $this->resolveUser($userToken);

        return response($this->pdfService->buildPdf($user), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $this->pdfService->filenameFor($user) . '"',
        ]);
    }

    /**
     * Stream one employee's Service Record PDF inline for browser preview.
     */
    public function preview(?string $userToken = null)
    {
        $user = $this->resolveUser($userToken);

        return response($this->pdfService->buildPdf($user), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="service-record-preview.pdf"',
        ]);
    }

    private function resolveUser(?string $userToken): User
    {
        $authUser = Auth::user();
        $user     = $userToken ? User::where('public_token', $userToken)->firstOrFail() : $authUser;

        if ($user->id !== $authUser->id && ! $authUser->hasAnyRole(['admin', 'superadmin'])) {
            abort(403);
        }

        return $user;
    }
}
