<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeaveRequest extends Model
{
    use SoftDeletes;

    public const FORM_SIMPLE = 'simple';

    public const FORM_CSC6 = 'csc6';

    /**
     * CSC Form 6 section 6.B: the detail options allowed for each leave type
     * code. A type not listed here has no 6.B detail. Monetization and
     * Terminal Leave ("Other purpose") are out of scope for v1.
     */
    public const DETAIL_TYPES_BY_LEAVE_CODE = [
        'VL' => ['within_ph', 'abroad'],
        'SPL' => ['within_ph', 'abroad'],
        'SL' => ['in_hospital', 'out_patient'],
        'SLW' => ['slbw_illness'],
        'STUDY' => ['masters_degree', 'bar_board_review'],
    ];

    /** 6.B details whose "(Specify)" blank must be filled in. */
    public const DETAIL_TYPES_REQUIRING_TEXT = ['abroad', 'in_hospital', 'out_patient', 'slbw_illness'];

    protected $fillable = [
        'user_id', 'leave_type_id', 'form_type', 'applicant_snapshot',
        'other_leave_type', 'detail_type', 'detail_text',
        'commutation_requested', 'attested_at',
        'start_date', 'end_date', 'days_requested', 'reason', 'status',
        'reviewed_by', 'reviewed_at', 'remarks', 'attachment_path',
        'credits_as_of', 'vl_total_earned', 'vl_less_this', 'vl_balance',
        'sl_total_earned', 'sl_less_this', 'sl_balance',
        'recommendation', 'recommendation_reason',
        'approved_days_with_pay', 'approved_days_without_pay',
        'approved_others', 'disapproval_reason', 'final_pdf_path',
    ];

    protected $casts = [
        'start_date'    => 'date',
        'end_date'      => 'date',
        'reviewed_at'   => 'datetime',
        'days_requested'=> 'float',
        'applicant_snapshot'        => 'array',
        'commutation_requested'     => 'boolean',
        'attested_at'               => 'datetime',
        'credits_as_of'             => 'date',
        'vl_total_earned'           => 'float',
        'vl_less_this'              => 'float',
        'vl_balance'                => 'float',
        'sl_total_earned'           => 'float',
        'sl_less_this'              => 'float',
        'sl_balance'                => 'float',
        'approved_days_with_pay'    => 'float',
        'approved_days_without_pay' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function isPending(): bool   { return $this->status === 'pending'; }
    public function isApproved(): bool  { return $this->status === 'approved'; }
    public function isDenied(): bool    { return $this->status === 'denied'; }
    public function isCancelled(): bool { return $this->status === 'cancelled'; }
    public function isCscForm(): bool   { return $this->form_type === self::FORM_CSC6; }

    /**
     * Where an admin acts on this request: the CSC Form 6 review page, or
     * the leave dashboard's quick-review modal for simple-form requests.
     */
    public function adminUrl(): string
    {
        return $this->isCscForm()
            ? "/admin/leave/{$this->id}/review"
            : "/admin/leave?highlight={$this->id}";
    }
}