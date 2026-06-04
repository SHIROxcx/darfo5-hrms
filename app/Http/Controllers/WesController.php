<?php

namespace App\Http\Controllers;

use App\Models\PdsWorkExperience;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\Browsershot\Browsershot;

class WesController extends Controller
{
    /**
     * Download the Work Experience Sheet as a PDF attachment.
     *
     * Route: GET /pds/wes/download/{userId?}?ids[]=1&ids[]=2
     *
     * The optional `ids` query param lets the frontend specify exactly
     * which work_experience rows (by their DB id) to include.
     * If omitted, all rows for the user are included.
     */
    public function download(Request $request, ?int $userId = null)
    {
        [$user, $workExperiences] = $this->resolveData($request, $userId);

        $html     = $this->buildHtml($user, $workExperiences);
        $pdfBytes = $this->buildBrowsershot($html)->pdf();

        $filename = 'WES_'
            . str_replace(' ', '_', strtoupper($user->last_name ?? 'EMPLOYEE'))
            . '_' . now()->format('Ymd') . '.pdf';

        return response($pdfBytes, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Stream the Work Experience Sheet PDF inline for browser preview.
     *
     * Route: GET /pds/wes/preview/{userId?}?ids[]=1&ids[]=2
     */
    public function preview(Request $request, ?int $userId = null)
    {
        [$user, $workExperiences] = $this->resolveData($request, $userId);

        $html     = $this->buildHtml($user, $workExperiences);
        $pdfBytes = $this->buildBrowsershot($html)->pdf();

        return response($pdfBytes, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="wes-preview.pdf"',
        ]);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function resolveData(Request $request, ?int $userId): array
    {
        $authUser = Auth::user();
        $targetId = $userId ?? $authUser->id;

        // Only admins / HR can view other users' WES
        if ($targetId !== $authUser->id
            && ! $authUser->hasAnyRole(['admin', 'superadmin', 'hr'])) {
            abort(403);
        }

        $user = User::findOrFail($targetId);

        $query = PdsWorkExperience::where('user_id', $targetId)
            ->orderBy('sort_order');

        // Filter to specific IDs when supplied
        $ids = $request->query('ids');
        if (!empty($ids) && is_array($ids)) {
            $ids = array_map('intval', $ids);
            $query->whereIn('id', $ids);

            // Preserve the caller's ordering (front-end passes IDs in display order)
            $orderedIds = $ids;
            $rows = $query->get()->sortBy(fn ($we) => array_search($we->id, $orderedIds))->values();
        } else {
            $rows = $query->get();
        }

        return [$user, $rows];
    }

    private function buildHtml(User $user, $workExperiences): string
    {
        return view('pds.wes', compact('user', 'workExperiences'))->render();
    }

    private function buildBrowsershot(string $html): Browsershot
    {
        return Browsershot::html($html)
            ->paperSize(8.5, 13, 'in')
            ->margins(0, 0, 0, 0, 'mm')
            ->showBackground()
            ->waitUntilNetworkIdle()
            ->deviceScaleFactor(2)
            ->timeout(60);
    }
}