<?php

namespace App\Http\Controllers;

use App\Models\PdsGovernmentId;
use App\Models\PdsWorkExperience;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\Browsershot\Browsershot;
use App\Support\PdfBrowsershot;

class WesController extends Controller
{
    /**
     * Download the Work Experience Sheet as a PDF attachment.
     */
    public function download(Request $request, ?string $userToken = null)
    {
        [$user, $workExperiences, $govId] = $this->resolveData($request, $userToken);

        $html     = $this->buildHtml($user, $workExperiences, $govId);
        $pdfBytes = $this->buildBrowsershot($html)->pdf();

        $filename = 'Work_Experience_Sheet_'
            . str_replace(' ', '_', strtoupper($user->last_name ?? 'EMPLOYEE'))
            . '_' . now()->format('Ymd') . '.pdf';

        return response($pdfBytes, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Stream the Work Experience Sheet PDF inline for browser preview.
     */
    public function preview(Request $request, ?string $userToken = null)
    {
        [$user, $workExperiences, $govId] = $this->resolveData($request, $userToken);

        $html     = $this->buildHtml($user, $workExperiences, $govId);
        $pdfBytes = $this->buildBrowsershot($html)->pdf();

        return response($pdfBytes, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="wes-preview.pdf"',
        ]);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function resolveData(Request $request, ?string $userToken): array
    {
        $authUser = Auth::user();
        $user     = $userToken ? User::where('public_token', $userToken)->firstOrFail() : $authUser;
        $targetId = $user->id;

        // Only admins / HR can view other users' WES
        if ($targetId !== $authUser->id
            && ! $authUser->hasAnyRole(['admin', 'superadmin'])) {
            abort(403);
        }

        $query = PdsWorkExperience::where('user_id', $targetId)
            ->orderBy('sort_order');

        // Filter to specific IDs when supplied
        $ids = $request->query('ids');
        if (!empty($ids) && is_array($ids)) {
            $ids = array_map('intval', $ids);
            $query->whereIn('id', $ids);

            $orderedIds = $ids;
            $rows = $query->get()->sortBy(fn ($we) => array_search($we->id, $orderedIds))->values();
        } else {
            $rows = $query->get();
        }

        $govId = PdsGovernmentId::where('user_id', $targetId)->first();

        return [$user, $rows, $govId];
    }

    private function buildHtml(User $user, $workExperiences, $govId): string
    {
        return view('pds.wes', compact('user', 'workExperiences', 'govId'))->render();
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
}