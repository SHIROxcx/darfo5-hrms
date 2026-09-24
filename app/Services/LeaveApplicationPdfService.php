<?php

namespace App\Services;

use App\Models\LeaveRequest;
use App\Models\PdsGovernmentId;
use App\Support\PdfBrowsershot;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Storage;
use Spatie\Browsershot\Browsershot;

/**
 * Renders CSC Form 6 (Application for Leave, Revised 2020) for a leave
 * request. One Blade view serves every use: the employee's preview of an
 * unsaved application, the saved form, the admin review, and the final copy
 * archived on decision. So what the employee previews is the document that
 * gets filed.
 */
class LeaveApplicationPdfService
{
    /**
     * Section 6.A exactly as printed on the form, in form order. It is fixed
     * here rather than read from leave_types, so the printed form stays
     * faithful even if a type is later deactivated. "Others" is rendered
     * separately.
     */
    public const FORM_LEAVE_TYPES = [
        'VL' => ['Vacation Leave', 'Sec. 51, Rule XVI, Omnibus Rules Implementing E.O. No. 292'],
        'FL' => ['Mandatory/Forced Leave', 'Sec. 25, Rule XVI, Omnibus Rules Implementing E.O. No. 292'],
        'SL' => ['Sick Leave', 'Sec. 43, Rule XVI, Omnibus Rules Implementing E.O. No. 292'],
        'ML' => ['Maternity Leave', 'R.A. No. 11210 / IRR issued by CSC, DOLE and SSS'],
        'PAT' => ['Paternity Leave', 'R.A. No. 8187 / CSC MC No. 71, s. 1998, as amended'],
        'SPL' => ['Special Privilege Leave', 'Sec. 21, Rule XVI, Omnibus Rules Implementing E.O. No. 292'],
        'SOLO' => ['Solo Parent Leave', 'RA No. 8972 / CSC MC No. 8, s. 2004'],
        'STUDY' => ['Study Leave', 'Sec. 68, Rule XVI, Omnibus Rules Implementing E.O. No. 292'],
        'VAWC' => ['10-Day VAWC Leave', 'RA No. 9262 / CSC MC No. 15, s. 2005'],
        'RL' => ['Rehabilitation Privilege', 'Sec. 55, Rule XVI, Omnibus Rules Implementing E.O. No. 292'],
        'SLW' => ['Special Leave Benefits for Women', 'RA No. 9710 / CSC MC No. 25, s. 2010'],
        'CL' => ['Special Emergency (Calamity) Leave', 'CSC MC No. 2, s. 2012, as amended'],
        'AL' => ['Adoption Leave', 'R.A. No. 8552'],
    ];

    /**
     * $screen adds an on-screen page outline for the local html-preview
     * route only. It never applies to the actual PDF.
     */
    public function buildHtml(LeaveRequest $leaveRequest, bool $screen = false): string
    {
        $leaveRequest->loadMissing(['leaveType', 'user']);

        $snapshot = $leaveRequest->applicant_snapshot ?? [];
        $applicantName = trim(implode(' ', array_filter([
            $snapshot['first_name'] ?? null,
            $snapshot['middle_name'] ?? null,
            $snapshot['last_name'] ?? null,
        ])));

        return view('leave.csc-form-6', [
            'lr' => $leaveRequest,
            'code' => $leaveRequest->leaveType?->code,
            'snapshot' => $snapshot,
            'applicantName' => $applicantName,
            'formLeaveTypes' => self::FORM_LEAVE_TYPES,
            'dateOfFiling' => $this->longDate($snapshot['date_of_filing'] ?? null),
            'salary' => $this->salaryText($snapshot),
            'inclusiveDates' => $this->inclusiveDates($leaveRequest->start_date, $leaveRequest->end_date),
            'daysApplied' => $this->days($leaveRequest->days_requested),
            'signature' => $this->signatureDataUri($leaveRequest->user_id),
            'signatories' => config('leave.signatories'),
            'daLogo' => $this->fileToDataUri(public_path('images/da-rfo5-logo.png')),
            // An unsaved application (the employee's pre-submit preview) is
            // watermarked, so a printed preview can't pass as a filed form.
            'isDraft' => ! $leaveRequest->exists,
            'screen' => $screen,
        ])->render();
    }

    public function buildPdf(LeaveRequest $leaveRequest): string
    {
        return $this->buildBrowsershot($this->buildHtml($leaveRequest))->pdf();
    }

    /**
     * The archived final copy if the request has been decided, else a
     * freshly rendered PDF.
     */
    public function pdfFor(LeaveRequest $leaveRequest): string
    {
        if ($leaveRequest->final_pdf_path && Storage::disk('local')->exists($leaveRequest->final_pdf_path)) {
            return Storage::disk('local')->get($leaveRequest->final_pdf_path);
        }

        return $this->buildPdf($leaveRequest);
    }

    /**
     * Render and archive the final form once an admin approves or denies it.
     * This is the official record: later edits to the employee's profile or
     * signature don't change it.
     */
    public function storeFinal(LeaveRequest $leaveRequest): string
    {
        $path = "leave-forms/{$leaveRequest->id}.pdf";
        Storage::disk('local')->put($path, $this->buildPdf($leaveRequest));
        $leaveRequest->forceFill(['final_pdf_path' => $path])->save();

        return $path;
    }

    public function filenameFor(LeaveRequest $leaveRequest): string
    {
        $lastName = $leaveRequest->applicant_snapshot['last_name'] ?? 'EMPLOYEE';

        return 'Application_for_Leave_'
            .str_replace(' ', '_', strtoupper($lastName))
            .'_'.($leaveRequest->id ?? 'draft').'.pdf';
    }

    private function buildBrowsershot(string $html): Browsershot
    {
        // Long bond (8.5 × 13 in), the same paper as the WES.
        return PdfBrowsershot::make($html)
            ->paperSize(8.5, 13, 'in')
            ->margins(10, 11, 8, 11, 'mm')
            ->showBackground()
            ->waitUntilNetworkIdle()
            ->deviceScaleFactor(2)
            ->timeout(60);
    }

    private function salaryText(array $snapshot): string
    {
        if (isset($snapshot['salary'])) {
            return '₱'.number_format((float) $snapshot['salary'], 2);
        }

        return filled($snapshot['salary_grade'] ?? null) ? 'SG '.$snapshot['salary_grade'] : '';
    }

    private function days(?float $days): string
    {
        if ($days === null) {
            return '';
        }

        $formatted = rtrim(rtrim(number_format($days, 2), '0'), '.');

        return $formatted.' working day'.($days == 1 ? '' : 's');
    }

    private function longDate(?string $date): string
    {
        return $date ? Carbon::parse($date)->format('F j, Y') : '';
    }

    /** "October 6–10, 2026", "September 29 – October 3, 2026", … */
    private function inclusiveDates(?CarbonInterface $start, ?CarbonInterface $end): string
    {
        if (! $start || ! $end) {
            return '';
        }
        if ($start->isSameDay($end)) {
            return $start->format('F j, Y');
        }
        if ($start->isSameMonth($end)) {
            return $start->format('F j').'–'.$end->format('j, Y');
        }
        if ($start->isSameYear($end)) {
            return $start->format('F j').' – '.$end->format('F j, Y');
        }

        return $start->format('F j, Y').' – '.$end->format('F j, Y');
    }

    /**
     * The applicant's uploaded e-signature (PDS government ID section), the
     * same image the PDS and WES embed. Null when none is uploaded.
     */
    private function signatureDataUri(?int $userId): ?string
    {
        $path = $userId ? PdsGovernmentId::where('user_id', $userId)->value('signature') : null;

        return $path ? $this->fileToDataUri(storage_path('app/public/'.$path)) : null;
    }

    private function fileToDataUri(string $absolutePath): ?string
    {
        if (! is_file($absolutePath)) {
            return null;
        }

        $mime = mime_content_type($absolutePath) ?: 'image/png';

        return "data:{$mime};base64,".base64_encode(file_get_contents($absolutePath));
    }
}
