{{--
    CSC Form No. 6, Revised 2020 — Application for Leave.
    Rendered by App\Services\LeaveApplicationPdfService for every use: the
    employee's pre-submit preview, the saved form, the admin review and the
    archived final copy. Local layout iteration: /leave/html-preview/{id}.
--}}
@php
    $d = $lr->detail_type;
    $num = fn ($v) => $v === null ? '' : rtrim(rtrim(number_format((float) $v, 2), '0'), '.');
    $cb = fn (bool $on) => '<span class="cb">'.($on
        ? '<svg viewBox="0 0 10 10"><path d="M1.6 5.3 4.1 7.7 8.6 2.3" fill="none" stroke="#000" stroke-width="1.7"/></svg>'
        : '').'</span>';
    $certifying = $signatories['certifying_officer'] ?? [];
    $recommending = $signatories['recommending_officer'] ?? [];
    $approving = $signatories['approving_official'] ?? [];
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Application for Leave</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 8.5pt;
        color: #000;
        background: #fff;
    }

    /* Browser-preview only (html-preview route): shows the long-bond page
       boundary on a neutral canvas. Never applied to the PDF. */
    body.screen { background: #e5e5e5; padding: 24px 0; }
    body.screen .page {
        width: 8.5in; min-height: 13in; margin: 0 auto; padding: 10mm 11mm 8mm;
        background: #fff; outline: 1px solid #999; box-shadow: 0 2px 12px rgba(0,0,0,.15);
    }

    .draft-mark {
        position: fixed; top: 42%; left: 0; right: 0; text-align: center;
        transform: rotate(-28deg); font-size: 54pt; font-weight: 700;
        color: rgba(200, 0, 0, .12); letter-spacing: 4px; pointer-events: none; z-index: 10;
    }

    /* ── Header ─────────────────────────────────────────────────────── */
    .form-no { font-size: 7.5pt; font-weight: 700; font-style: italic; line-height: 1.25; }
    .masthead { position: relative; display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 2px; }
    .masthead img { width: 62px; height: 62px; object-fit: contain; }
    .masthead .agency { font-family: "Times New Roman", Times, serif; text-align: center; line-height: 1.25; }
    .masthead .agency .republic { font-size: 9pt; }
    .masthead .agency .dept, .masthead .agency .office { font-size: 10pt; font-weight: 700; }
    .masthead .agency .address { font-size: 9pt; }
    .stamp {
        position: absolute; right: 12mm; top: 10px; width: 31mm; height: 11mm;
        border: 1px dashed #666; font-size: 5.5pt; display: flex; align-items: center; justify-content: center;
    }
    h1.title { text-align: center; font-size: 15pt; font-weight: 700; margin: 12px 0 8px; letter-spacing: .3px; }

    /* ── Form grid ──────────────────────────────────────────────────── */
    table.form { width: 100%; border-collapse: collapse; border: 1.5px solid #000; table-layout: fixed; page-break-inside: avoid; }
    table.form > tbody > tr > td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
    td.bar {
        text-align: center; font-weight: 700; font-size: 10.5pt; padding: 2px 0 !important;
        border-top: 3px double #000 !important; border-bottom: 3px double #000 !important;
    }
    .sec { font-size: 8.5pt; margin-bottom: 4px; }
    .caps { text-transform: uppercase; }
    .val { font-weight: 700; font-size: 9pt; }
    .fill { display: inline-block; border-bottom: 1px solid #000; min-height: 12px; vertical-align: bottom; padding: 0 3px; }
    .muted-label { font-size: 8pt; }

    .name-cols { display: grid; grid-template-columns: 1fr 1fr 1fr; margin-top: 2px; }
    .name-cols span { text-align: center; }

    .item { display: flex; align-items: baseline; gap: 5px; line-height: 1.55; white-space: nowrap; }
    .item .cite { font-size: 5.3pt; }
    .cb {
        display: inline-block; flex: none; width: 9px; height: 9px; border: 1px solid #000;
        position: relative; top: 1px;
    }
    .cb svg { position: absolute; inset: -1px; width: 10px; height: 10px; }
    .case { font-style: italic; line-height: 1.6; margin-top: 1px; }
    .grow { flex: 1; border-bottom: 1px solid #000; min-height: 11px; padding-left: 3px; font-weight: 700; white-space: normal; }
    .line { border-bottom: 1px solid #000; min-height: 13px; margin: 2px 0; font-weight: 700; padding-left: 3px; }

    /* Ruled free-text area: the text sits on the form's printed lines. */
    .ruled {
        line-height: 16px; min-height: calc(16px * var(--lines, 3));
        background: repeating-linear-gradient(to bottom, transparent 0 15px, #000 15px 16px);
        font-weight: 700; padding-left: 3px; white-space: pre-wrap; word-break: break-word;
    }

    .sig { margin: 0 auto; text-align: center; }
    .sig .over { min-height: 30px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
    .sig .over img { max-height: 30px; max-width: 150px; }
    .sig .name { font-weight: 700; text-transform: uppercase; font-size: 8.5pt; }
    .sig .rule { border-top: 1px solid #000; padding-top: 1px; }
    .sig .efiled { font-size: 5.5pt; color: #333; margin-top: 1px; }
    .sig .title { font-size: 7pt; }

    table.credits { width: 88%; margin: 4px auto 0; border-collapse: collapse; }
    table.credits td, table.credits th { border: 1px solid #000; height: 17px; text-align: center; font-weight: 400; padding: 0 4px; }
    table.credits td.lbl { font-style: italic; text-align: center; }
    table.credits td.v { font-weight: 700; }

    .approved-row { display: flex; align-items: baseline; gap: 6px; line-height: 1.7; margin-left: 12px; }
    .approved-row .fill { width: 44px; text-align: center; font-weight: 700; }
</style>
</head>
<body class="{{ $screen ? 'screen' : '' }}">
@if ($isDraft)
    <div class="draft-mark">DRAFT — NOT YET FILED</div>
@endif
<div class="page">

    {{-- ── Header ─────────────────────────────────────────────────────── --}}
    <div class="form-no">Civil Service Form No. 6<br>Revised 2020</div>
    <div class="masthead">
        @if ($daLogo)<img src="{{ $daLogo }}" alt="DA Logo">@endif
        <div class="agency">
            <div class="republic">Republic of the Philippines</div>
            <div class="dept">DEPARTMENT OF AGRICULTURE</div>
            <div class="office">REGIONAL FIELD OFFICE 5</div>
            <div class="address">San Agustin, Pili, Camarines Sur</div>
        </div>
        <div class="stamp">Stamp of Date of Receipt</div>
    </div>
    <h1 class="title">APPLICATION FOR LEAVE</h1>

    <table class="form">
        <colgroup><col style="width:55%"><col style="width:45%"></colgroup>
        <tbody>

        {{-- ── 1–2 ────────────────────────────────────────────────────── --}}
        <tr>
            <td colspan="2" style="padding:0">
                <table style="width:100%; border-collapse:collapse; table-layout:fixed">
                    <colgroup><col style="width:36%"><col style="width:64%"></colgroup>
                    <tr>
                        <td style="padding:4px 6px; vertical-align:top">
                            <div>1.&nbsp; OFFICE/DEPARTMENT</div>
                            <div class="val caps" style="margin-top:4px">{{ $snapshot['office'] ?? '' }}</div>
                        </td>
                        <td style="padding:4px 6px; vertical-align:top">
                            <div style="display:grid; grid-template-columns:62px 1fr 1fr 1fr">
                                <span>2.&nbsp; NAME :</span><span style="text-align:center">(Last)</span><span style="text-align:center">(First)</span><span style="text-align:center">(Middle)</span>
                            </div>
                            <div class="val caps" style="display:grid; grid-template-columns:62px 1fr 1fr 1fr; margin-top:4px">
                                <span></span>
                                <span style="text-align:center">{{ $snapshot['last_name'] ?? '' }}</span>
                                <span style="text-align:center">{{ $snapshot['first_name'] ?? '' }}</span>
                                <span style="text-align:center">{{ $snapshot['middle_name'] ?? '' }}</span>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        {{-- ── 3–5 ────────────────────────────────────────────────────── --}}
        <tr>
            <td colspan="2" style="padding:6px 6px 5px">
                <div style="display:grid; grid-template-columns:34% 44% 22%; align-items:baseline; white-space:nowrap">
                    <span style="display:flex; gap:4px">3.&nbsp; DATE OF FILING <span class="fill val" style="flex:1; margin-right:10px">{{ $dateOfFiling }}</span></span>
                    <span style="display:flex; gap:4px">4.&nbsp; POSITION <span class="fill val" style="flex:1; margin-right:10px; overflow:hidden">{{ $snapshot['position'] ?? '' }}</span></span>
                    <span style="display:flex; gap:4px">5.&nbsp; SALARY <span class="fill val" style="flex:1">{{ $salary }}</span></span>
                </div>
            </td>
        </tr>

        <tr><td colspan="2" class="bar">6. DETAILS OF APPLICATION</td></tr>

        {{-- ── 6.A / 6.B ──────────────────────────────────────────────── --}}
        <tr>
            <td>
                <div class="sec">6.A&nbsp; TYPE OF LEAVE TO BE AVAILED OF</div>
                @foreach ($formLeaveTypes as $typeCode => [$label, $cite])
                    <div class="item">{!! $cb($code === $typeCode) !!}<span>{{ $label }} <span class="cite">({{ $cite }})</span></span></div>
                @endforeach
                <div class="case" style="margin-top:8px">Others:</div>
                <div class="line" style="width:80%">{{ $code === 'OTH' ? $lr->other_leave_type : '' }}</div>
            </td>
            <td>
                <div class="sec">6.B&nbsp; DETAILS OF LEAVE</div>

                <div class="case">In case of Vacation/Special Privilege Leave:</div>
                <div class="item">{!! $cb($d === 'within_ph') !!}<span>Within the Philippines</span><span class="grow">{{ $d === 'within_ph' ? $lr->detail_text : '' }}</span></div>
                <div class="item">{!! $cb($d === 'abroad') !!}<span>Abroad (Specify)</span><span class="grow">{{ $d === 'abroad' ? $lr->detail_text : '' }}</span></div>

                <div class="case">In case of Sick Leave:</div>
                <div class="item">{!! $cb($d === 'in_hospital') !!}<span>In Hospital (Specify Illness)</span><span class="grow">{{ $d === 'in_hospital' ? $lr->detail_text : '' }}</span></div>
                <div class="item">{!! $cb($d === 'out_patient') !!}<span>Out Patient (Specify Illness)</span><span class="grow">{{ $d === 'out_patient' ? $lr->detail_text : '' }}</span></div>
                <div class="line"></div>

                <div class="case">In case of Special Leave Benefits for Women:</div>
                <div class="item"><span>(Specify Illness)</span><span class="grow">{{ $d === 'slbw_illness' ? $lr->detail_text : '' }}</span></div>
                <div class="line"></div>

                <div class="case">In case of Study Leave:</div>
                <div class="item">{!! $cb($d === 'masters_degree') !!}<span>Completion of Master's Degree</span></div>
                <div class="item">{!! $cb($d === 'bar_board_review') !!}<span>BAR/Board Examination Review</span></div>

                {{-- Monetization and Terminal Leave are out of scope for v1, so
                     these always print unchecked. --}}
                <div class="case">Other purpose:</div>
                <div class="item">{!! $cb(false) !!}<span>Monetization of Leave Credits</span></div>
                <div class="item">{!! $cb(false) !!}<span>Terminal Leave</span></div>
            </td>
        </tr>

        {{-- ── 6.C / 6.D ──────────────────────────────────────────────── --}}
        <tr>
            <td>
                <div class="sec">6.C&nbsp; NUMBER OF WORKING DAYS APPLIED FOR</div>
                <div class="line" style="width:78%; margin-left:18px">{{ $daysApplied }}</div>
                <div style="margin:6px 0 0 18px">INCLUSIVE DATES</div>
                <div class="line" style="width:78%; margin-left:18px">{{ $inclusiveDates }}</div>
            </td>
            <td>
                <div class="sec">6.D&nbsp; COMMUTATION</div>
                <div class="item">{!! $cb(! $lr->commutation_requested) !!}<span>Not Requested</span></div>
                <div class="item">{!! $cb((bool) $lr->commutation_requested) !!}<span>Requested</span></div>

                {{-- Applicant attestation: the uploaded e-signature when there
                     is one (same image as the PDS/WES), over the typed name. --}}
                <div class="sig" style="width:82%; margin-top:2px">
                    <div class="over">
                        @if ($signature)<img src="{{ $signature }}" alt="Signature">@endif
                        <div class="name">{{ $applicantName }}</div>
                    </div>
                    <div class="rule">(Signature of Applicant)</div>
                    @if ($lr->attested_at)
                        <div class="efiled">Electronically filed via DARFO5 HRMS · {{ $lr->attested_at->copy()->setTimezone(config('leave.timezone'))->format('M j, Y g:i A') }}</div>
                    @endif
                </div>
            </td>
        </tr>

        <tr><td colspan="2" class="bar">7. DETAILS OF ACTION ON APPLICATION</td></tr>

        {{-- ── 7.A / 7.B ──────────────────────────────────────────────── --}}
        <tr>
            <td>
                <div class="sec">7.A&nbsp; CERTIFICATION OF LEAVE CREDITS</div>
                <div style="margin-left:60px">As of <span class="fill val" style="width:150px">{{ $lr->credits_as_of?->format('F j, Y') }}</span></div>
                <table class="credits">
                    <tr><th style="width:34%"></th><th>Vacation Leave</th><th>Sick Leave</th></tr>
                    <tr><td class="lbl">Total Earned</td><td class="v">{{ $num($lr->vl_total_earned) }}</td><td class="v">{{ $num($lr->sl_total_earned) }}</td></tr>
                    <tr><td class="lbl">Less this application</td><td class="v">{{ $num($lr->vl_less_this) }}</td><td class="v">{{ $num($lr->sl_less_this) }}</td></tr>
                    <tr><td class="lbl">Balance</td><td class="v">{{ $num($lr->vl_balance) }}</td><td class="v">{{ $num($lr->sl_balance) }}</td></tr>
                </table>
                <div class="sig" style="width:82%; margin-top:14px">
                    <div class="over"><div class="name">{{ $certifying['name'] ?? '' }}</div></div>
                    <div class="rule">(Authorized Officer)</div>
                    @if (! empty($certifying['title']))<div class="title">{{ $certifying['title'] }}</div>@endif
                </div>
            </td>
            <td>
                <div class="sec">7.B&nbsp; RECOMMENDATION</div>
                <div class="item" style="margin-left:12px">{!! $cb($lr->recommendation === 'for_approval') !!}<span>For approval</span></div>
                <div class="item" style="margin-left:12px">{!! $cb($lr->recommendation === 'for_disapproval') !!}<span>For disapproval due to</span></div>
                <div class="ruled" style="--lines:4; margin-left:30px">{{ $lr->recommendation === 'for_disapproval' ? $lr->recommendation_reason : '' }}</div>
                <div class="sig" style="width:82%; margin-top:6px">
                    <div class="over"><div class="name">{{ $recommending['name'] ?? '' }}</div></div>
                    <div class="rule">(Authorized Officer)</div>
                    @if (! empty($recommending['title']))<div class="title">{{ $recommending['title'] }}</div>@endif
                </div>
            </td>
        </tr>

        {{-- ── 7.C / 7.D ──────────────────────────────────────────────── --}}
        <tr>
            <td colspan="2" style="padding:0">
                <table style="width:100%; border-collapse:collapse; table-layout:fixed">
                    <colgroup><col style="width:55%"><col style="width:45%"></colgroup>
                    <tr>
                        <td style="padding:4px 6px; vertical-align:top">
                            <div class="sec">7.C&nbsp; APPROVED FOR:</div>
                            <div class="approved-row"><span class="fill">{{ $num($lr->approved_days_with_pay) }}</span><span>days with pay</span></div>
                            <div class="approved-row"><span class="fill">{{ $num($lr->approved_days_without_pay) }}</span><span>days without pay</span></div>
                            <div class="approved-row"><span class="fill">{{ $lr->approved_others ? '✓' : '' }}</span><span>others (Specify)</span><span class="val">{{ $lr->approved_others }}</span></div>
                        </td>
                        <td style="padding:4px 6px; vertical-align:top">
                            <div class="sec">7.D&nbsp; DISAPPROVED DUE TO:</div>
                            <div class="ruled" style="--lines:3">{{ $lr->disapproval_reason }}</div>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding:18px 0 8px">
                            <div class="sig" style="width:48%">
                                <div class="over"><div class="name">{{ $approving['name'] ?? '' }}</div></div>
                                <div class="rule" style="font-weight:700">(Authorized Official)</div>
                                @if (! empty($approving['title']))<div class="title">{{ $approving['title'] }}</div>@endif
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        </tbody>
    </table>
</div>
</body>
</html>
