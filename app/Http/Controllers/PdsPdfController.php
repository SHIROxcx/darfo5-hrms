<?php

namespace App\Http\Controllers;

use App\Models\EmployeeProfile;
use App\Models\PdsChild;
use App\Models\PdsEducation;
use App\Models\PdsEligibility;
use App\Models\PdsFamilyBackground;
use App\Models\PdsGovernmentId;
use App\Models\PdsOtherInfo;
use App\Models\PdsPersonalInfo;
use App\Models\PdsQuestion;
use App\Models\PdsReference;
use App\Models\PdsTraining;
use App\Models\PdsVoluntaryWork;
use App\Models\PdsWorkExperience;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\Browsershot\Browsershot;
use App\Support\PdfBrowsershot;

class PdsPdfController extends Controller
{
    /**
     * Download the PDS as a PDF attachment.
     */
    public function download(Request $request, ?string $userToken = null)
    {
        [$user, $ep, $pds] = $this->resolveData($userToken);

        $html     = $this->buildHtml($user, $ep, $pds);
        $pdfBytes = $this->buildBrowsershot($html)->pdf();

        $filename = 'PDS_'
            . str_replace(' ', '_', strtoupper($user->last_name ?? 'EMPLOYEE'))
            . '_' . now()->format('Ymd') . '.pdf';

        return response($pdfBytes, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Stream the PDS PDF inline for browser preview.
     */
    public function preview(Request $request, ?string $userToken = null)
    {
        [$user, $ep, $pds] = $this->resolveData($userToken);

        $html     = $this->buildHtml($user, $ep, $pds);
        $pdfBytes = $this->buildBrowsershot($html)->pdf();

        return response($pdfBytes, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="pds-preview.pdf"',
        ]);
    }

    private function resolveData(?string $userToken): array
    {
        $authUser = Auth::user();
        $user     = $userToken ? User::where('public_token', $userToken)->firstOrFail() : $authUser;
        $targetId = $user->id;

        if ($targetId !== $authUser->id
            && ! $authUser->hasAnyRole(['admin', 'superadmin', 'hr'])) {
            abort(403);
        }

        $ep = EmployeeProfile::where('user_id', $targetId)->first();

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

    private function buildHtml(User $user, ?EmployeeProfile $ep, array $pds): string
    {
        return view('pds.pdf', compact('user', 'ep', 'pds'))->render();
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