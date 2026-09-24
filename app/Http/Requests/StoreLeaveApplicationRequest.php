<?php

namespace App\Http\Requests;

use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Services\LeaveService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validation for CSC Form 6 (Application for Leave), section 6. The PDF
 * preview and the final submit both use it, so a previewed form is always
 * one that would also submit. Only the attestation checkbox differs: it is
 * required on submit and not on preview.
 */
class StoreLeaveApplicationRequest extends FormRequest
{
    /**
     * Permanent employees only. Enforced here on the server whatever the UI
     * shows. JO/COS/Pakyaw file Wellness Leave through the simple modal.
     */
    public function authorize(): bool
    {
        return app(LeaveService::class)->canFileCscForm($this->user());
    }

    public function rules(): array
    {
        $leaveType = $this->selectedLeaveType();
        $allowedDetails = LeaveRequest::DETAIL_TYPES_BY_LEAVE_CODE[$leaveType?->code] ?? [];

        return [
            'leave_type_id' => [
                'required',
                Rule::exists('leave_types', 'id')
                    ->where('is_active', true)
                    ->whereNotNull('csc_form_order'),
            ],
            'other_leave_type' => [
                Rule::requiredIf($leaveType?->code === 'OTH'),
                'nullable', 'string', 'max:255',
            ],
            'detail_type' => $allowedDetails
                ? ['required', Rule::in($allowedDetails)]
                : ['nullable'],
            'detail_text' => [
                Rule::requiredIf(in_array($this->input('detail_type'), LeaveRequest::DETAIL_TYPES_REQUIRING_TEXT, true)),
                'nullable', 'string', 'max:255',
            ],
            // Local office date, not UTC (see config/leave.php).
            'start_date' => 'required|date|after_or_equal:'.now(config('leave.timezone'))->toDateString(),
            'end_date' => 'required|date|after_or_equal:start_date',
            'commutation_requested' => 'required|boolean',
            'attest' => $this->isPreview() ? ['nullable'] : ['accepted'],
            // Preview only: the pending application being edited, so the
            // preview keeps its original Date of Filing.
            'editing_id' => ['nullable', 'integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'leave_type_id.exists' => 'Please select a leave type from the form.',
            'other_leave_type.required' => 'Please specify the leave type.',
            'detail_type.required' => 'Please complete the details of leave (6.B).',
            'detail_text.required' => 'Please specify the details.',
            'attest.accepted' => 'Please certify that the information is true and correct.',
        ];
    }

    /**
     * Drop 6.B input that doesn't apply to the selected type (for example a
     * leftover illness after switching from Sick Leave to Maternity Leave),
     * so it never reaches the saved record or the PDF.
     */
    protected function prepareForValidation(): void
    {
        $code = $this->selectedLeaveType()?->code;

        if (! isset(LeaveRequest::DETAIL_TYPES_BY_LEAVE_CODE[$code])) {
            $this->merge(['detail_type' => null, 'detail_text' => null]);
        }
    }

    public function failedAuthorization(): void
    {
        abort(403, 'The Application for Leave form is available to Permanent employees only.');
    }

    public function isPreview(): bool
    {
        return $this->routeIs('leave.apply.preview');
    }

    protected ?LeaveType $selectedLeaveType = null;

    protected function selectedLeaveType(): ?LeaveType
    {
        $id = $this->input('leave_type_id');

        if (! is_numeric($id)) {
            return null;
        }

        return $this->selectedLeaveType ??= LeaveType::find((int) $id);
    }
}
