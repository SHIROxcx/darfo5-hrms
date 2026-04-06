<?php

namespace App\Http\Controllers;

use App\Models\PdsPersonalInfo;
use App\Models\PdsFamilyBackground;
use App\Models\PdsChild;
use App\Models\PdsEducation;
use App\Models\PdsEligibility;
use App\Models\PdsWorkExperience;
use App\Models\PdsVoluntaryWork;
use App\Models\PdsTraining;
use App\Models\PdsOtherInfo;
use App\Models\PdsQuestion;
use App\Models\PdsReference;
use App\Models\PdsGovernmentId;
use App\Models\User;
use App\Models\EmployeeProfile;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PdsPdfController extends Controller
{
    /**
     * Download the PDS as a PDF attachment.
     */
    public function download(Request $request, ?int $userId = null)
    {
        [$user, $ep, $pds] = $this->resolveData($userId);

        $filename = 'PDS_'
            . str_replace(' ', '_', strtoupper($user->last_name ?? 'EMPLOYEE'))
            . '_' . now()->format('Ymd') . '.pdf';

        return $this->buildPdf($user, $ep, $pds)->download($filename);
    }

    /**
     * Stream the PDS PDF inline (browser preview).
     */
    public function preview(Request $request, ?int $userId = null)
    {
        [$user, $ep, $pds] = $this->resolveData($userId);

        return $this->buildPdf($user, $ep, $pds)->stream('pds-preview.pdf');
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Authorize the request and return [user, employeeProfile, pdsData].
     */
    private function resolveData(?int $userId): array
    {
        $authUser = Auth::user();
        $targetId = $userId ?? $authUser->id;

        if ($targetId !== $authUser->id
            && ! $authUser->hasAnyRole(['admin', 'superadmin', 'hr'])) {
            abort(403);
        }

        $user = User::findOrFail($targetId);
        $ep   = EmployeeProfile::where('user_id', $targetId)->first();

        $pds = [
            'personal'        => PdsPersonalInfo::where('user_id', $targetId)->first(),
            'family'          => PdsFamilyBackground::where('user_id', $targetId)->first(),
            'children'        => PdsChild::where('user_id', $targetId)->orderBy('sort_order')->get(),
            'education'       => PdsEducation::where('user_id', $targetId)->get(),
            'eligibilities'   => PdsEligibility::where('user_id', $targetId)->orderBy('sort_order')->get(),
            'work_experience' => PdsWorkExperience::where('user_id', $targetId)->orderBy('sort_order')->get(),
            'voluntary_work'  => PdsVoluntaryWork::where('user_id', $targetId)->orderBy('sort_order')->get(),
            'trainings'       => PdsTraining::where('user_id', $targetId)->orderBy('sort_order')->get(),
            'other_info'      => PdsOtherInfo::where('user_id', $targetId)->first(),
            'questions'       => PdsQuestion::where('user_id', $targetId)->first(),
            'references'      => PdsReference::where('user_id', $targetId)->orderBy('sort_order')->get(),
            'government_id'   => PdsGovernmentId::where('user_id', $targetId)->first(),
        ];

        return [$user, $ep, $pds];
    }

    /**
     * Compile the Blade view into a DomPDF instance sized for a legal (8.5 × 13 in) page.
     *
     * Points per inch = 72, so:
     *   8.5 in × 72 = 612 pt
     *   13 in  × 72 = 936 pt
     */
    private function buildPdf(User $user, ?EmployeeProfile $ep, array $pds): \Barryvdh\DomPDF\PDF
    {
        return Pdf::loadView('pds.pdf', compact('user', 'ep', 'pds'))
            ->setPaper([0, 0, 612, 936], 'portrait')
            ->setOptions([
                'isRemoteEnabled'      => true,
                'isHtml5ParserEnabled' => true,
                'defaultFont'          => 'Arial',
                'dpi'                  => 96,
                'chroot'               => storage_path('app/public'),
            ]);
    }
}