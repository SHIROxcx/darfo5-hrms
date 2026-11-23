<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\PdsPdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PdsPdfController extends Controller
{
    public function __construct(private PdsPdfService $pdf) {}

    /**
     * Download the PDS as a PDF attachment.
     */
    public function download(Request $request, ?string $userToken = null)
    {
        $user = $this->resolveTarget($userToken);

        return response($this->pdf->buildPdf($user), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$this->pdf->filenameFor($user).'"',
        ]);
    }

    /**
     * Stream the PDS PDF inline for browser preview.
     */
    public function preview(Request $request, ?string $userToken = null)
    {
        $user = $this->resolveTarget($userToken);

        return response($this->pdf->buildPdf($user), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="pds-preview.pdf"',
        ]);
    }

    /**
     * The exact HTML the PDF renders, for fast layout work (local environment only).
     * Reload the tab to see any change.
     */
    public function htmlPreview(?int $userId = null)
    {
        $target = $userId ? User::findOrFail($userId) : Auth::user();

        return response($this->pdf->buildHtml($this->authorized($target), preview: true));
    }

    private function resolveTarget(?string $userToken): User
    {
        $target = $userToken
            ? User::where('public_token', $userToken)->firstOrFail()
            : Auth::user();

        return $this->authorized($target);
    }

    /**
     * Only the owner, or HR / superadmin staff, may see an employee's PDS.
     */
    private function authorized(User $target): User
    {
        $viewer = Auth::user();

        abort_unless(
            $target->id === $viewer->id || $viewer->hasAnyRole(['admin', 'superadmin', 'hr']),
            403
        );

        return $target;
    }
}
