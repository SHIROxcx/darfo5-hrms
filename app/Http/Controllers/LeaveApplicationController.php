<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLeaveApplicationRequest;
use App\Models\LeaveCredit;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\PdsGovernmentId;
use App\Services\HolidayService;
use App\Services\LeaveApplicationPdfService;
use App\Services\LeaveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * CSC Form 6 (Application for Leave), employee side: Permanent employees
 * only. Every action enforces that on the server whatever the UI shows:
 * StoreLeaveApplicationRequest::authorize() for writes and previews, and
 * ensureCanFile() for the pages.
 */
class LeaveApplicationController extends Controller
{
    public function __construct(
        protected LeaveService $leaveService,
        protected LeaveApplicationPdfService $pdf,
        protected HolidayService $holidays,
    ) {}

    /** The Fill → Review page for a new application. */
    public function create()
    {
        $this->ensureCanFile();

        return Inertia::render('Employee/Leave/Apply', $this->pageProps() + [
            'application' => null,
        ]);
    }

    /** The same page, pre-filled with a pending application to edit. */
    public function edit(LeaveRequest $leaveRequest)
    {
        $this->ensureCanFile();
        $this->ensureOwnPendingCscForm($leaveRequest);

        return Inertia::render('Employee/Leave/Apply', $this->pageProps() + [
            'application' => [
                'id' => $leaveRequest->id,
                'leave_type_id' => $leaveRequest->leave_type_id,
                'other_leave_type' => $leaveRequest->other_leave_type,
                'detail_type' => $leaveRequest->detail_type,
                'detail_text' => $leaveRequest->detail_text,
                'start_date' => $leaveRequest->start_date->toDateString(),
                'end_date' => $leaveRequest->end_date->toDateString(),
                'commutation_requested' => $leaveRequest->commutation_requested,
            ],
        ]);
    }

    /**
     * Render the PDF for the unsaved input, so the employee checks the real
     * document before filing. Same validation, same model builder and same
     * Blade view as the final form. Called with axios, which returns the PDF
     * as a blob, or JSON with a 422 status on a business-rule error.
     */
    public function preview(StoreLeaveApplicationRequest $request)
    {
        $original = null;
        if ($id = $request->integer('editing_id')) {
            $original = LeaveRequest::findOrFail($id);
            $this->ensureOwnPendingCscForm($original);
        }

        try {
            $draft = $this->leaveService->buildCscApplication(Auth::user(), $request->validated(), $original);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response($this->pdf->buildPdf($draft), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="application-for-leave-preview.pdf"',
        ]);
    }

    public function store(StoreLeaveApplicationRequest $request)
    {
        try {
            $this->leaveService->submitCscApplication(Auth::user(), $request->validated());
        } catch (\RuntimeException $e) {
            return back()->withErrors(['form' => $e->getMessage()]);
        }

        return redirect()->route('leave.my')->with('success', 'Application for Leave submitted.');
    }

    public function update(StoreLeaveApplicationRequest $request, LeaveRequest $leaveRequest)
    {
        $this->ensureOwnPendingCscForm($leaveRequest);

        try {
            $this->leaveService->updateCscApplication($leaveRequest, $request->validated());
        } catch (\RuntimeException $e) {
            return back()->withErrors(['form' => $e->getMessage()]);
        }

        return redirect()->route('leave.my')->with('success', 'Application for Leave updated.');
    }

    /**
     * The employee's own filed form, inline, or as an attachment with
     * ?download=1. Once decided, this is the archived final copy.
     */
    public function pdf(Request $request, LeaveRequest $leaveRequest)
    {
        if ($leaveRequest->user_id !== Auth::id() || ! $leaveRequest->isCscForm()) {
            abort(403);
        }

        $disposition = $request->boolean('download') ? 'attachment' : 'inline';

        return response($this->pdf->pdfFor($leaveRequest), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition.'; filename="'.$this->pdf->filenameFor($leaveRequest).'"',
        ]);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private function ensureCanFile(): void
    {
        if (! $this->leaveService->canFileCscForm(Auth::user())) {
            abort(403, 'The Application for Leave form is available to Permanent employees only.');
        }
    }

    private function ensureOwnPendingCscForm(LeaveRequest $leaveRequest): void
    {
        if ($leaveRequest->user_id !== Auth::id() || ! $leaveRequest->isCscForm()) {
            abort(403);
        }
        if (! $leaveRequest->isPending()) {
            abort(403, 'Only pending applications can be edited.');
        }
    }

    private function pageProps(): array
    {
        $user = Auth::user();
        $year = now(config('leave.timezone'))->year;

        // VL/SL balances (and what FL draws from), shown next to the leave
        // type choice. The server re-checks them on submit.
        $credits = LeaveCredit::with('leaveType:id,code')
            ->where('user_id', $user->id)
            ->where('year', $year)
            ->whereIn('leave_type_id', $this->leaveService->creditLeaveTypes($user)->pluck('id'))
            ->get()
            ->mapWithKeys(fn ($c) => [$c->leaveType->code => $c->available]);

        return [
            'applicant' => $this->leaveService->applicantSnapshot($user),
            'leaveTypes' => LeaveType::onCscForm()->with('chargeTo:id,code')->get()->map(fn ($t) => [
                'id' => $t->id,
                'code' => $t->code,
                'name' => $t->name,
                'tracks_credits' => $t->tracks_credits,
                'charge_to' => $t->chargeTo?->code,
            ]),
            'detailTypesByCode' => LeaveRequest::DETAIL_TYPES_BY_LEAVE_CODE,
            'detailTypesRequiringText' => LeaveRequest::DETAIL_TYPES_REQUIRING_TEXT,
            'credits' => $credits,
            // Holidays for the next 12 months, so the calendar's working-day
            // count matches the server's (LeaveService::countWorkingDays).
            'holidays' => (object) $this->holidays->holidayMapForRange(
                now(config('leave.timezone'))->startOfDay(),
                now(config('leave.timezone'))->addYear(),
            ),
            'today' => now(config('leave.timezone'))->toDateString(),
            // Whether the form's signature line shows an uploaded e-signature
            // (PDS government ID section) or only the typed name.
            'hasSignature' => PdsGovernmentId::where('user_id', $user->id)->whereNotNull('signature')->exists(),
        ];
    }
}
