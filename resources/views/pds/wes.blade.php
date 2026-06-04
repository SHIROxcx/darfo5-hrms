<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Work Experience Sheet – CS Form 212 Attachment</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>
    tailwind.config = {
        theme: {
            extend: {
                fontFamily: {
                    sans: ['"Arial Narrow"', 'Arial', 'sans-serif'],
                    'narrow': ['"Arial Narrow"', 'Arial', 'sans-serif'],
                },
            }
        }
    }
</script>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
        font-family: "Arial", Helvetica, sans-serif; 
        font-size: 10pt;
        color: #000;
        background: #fff;
    }

    .page {
        width: 8.5in;
        min-height: 13in;
        padding: 0.3in 0.15in 0.3in 0.15in;
        background: #fff;
        position: relative;
    }

    .label, .title {
        font-family: "Arial Narrow", Arial, sans-serif;
    }

    .instruction-box {
        border: 1.5px solid #000;
        border-top: none;
        padding: 6px 10px 8px 10px;
        font-size: 9pt;
        line-height: 1.5;
    }

    .entry-box {
        border: 1.5px solid #000;
        border-top: none;
        padding: 10px 14px 5px 14px;
        font-size: 11pt;
        /* line-height: 1.8; */
    }

    .entry-box:first-of-type {
        border-top: 1.5px solid #000;
    }

    ul.main-list {
        list-style-type: disc;
        padding-left: 32px;
        margin: 0;
    }

    ul.main-list > li {
        margin-bottom: 0;
    }

    ul.sub-list {
        list-style-type: circle;
        padding-left: 22px;
        margin-top: 2px;
        margin-bottom: 4px;
    }

    ul.sub-list > li {
        margin-bottom: 1px;
    }

    .sig-block {
        margin-top: 36px;
        text-align: right;
        padding-right: 50px;
    }

    .sig-line {
        display: inline-block;
        min-width: 280px;
        text-align: center;
    }

    .sig-name {
        border-bottom: 1.5px solid #000;
        min-height: 36px;
        padding-bottom: 2px;
        font-weight: bold;
        font-size: 11pt;
        display: flex;
        align-items: flex-end;
        justify-content: center;
    }

    .sig-label {
        font-size: 11pt;
        margin-top: 2px;
        text-align: center;
    }

    .date-line {
        margin-top: 16px;
        text-align: center;
        font-size: 11pt;
    }

    .date-value {
        border-bottom: 1.5px solid #000;
        display: inline-block;
        text-align: left;
        padding-bottom: 1px;
    }

    @page { size: 8.5in 13in; margin: 0; }
</style>
</head>
<body>

@php
    $fullName = trim(
        strtoupper($user->first_name ?? '') .
        ($user->middle_name ? ' ' . strtoupper($user->middle_name[0]) . '.' : '') . ' ' .
        strtoupper($user->last_name ?? '')
    );
    if (ltrim($fullName, ', ') === '') $fullName = strtoupper($user->name ?? 'N/A');

    $today = now()->format('d F Y');

    function wesDate(?string $val): string {
        if (!$val) return '';
        try {
            return \Carbon\Carbon::parse($val)->format('F Y');
        } catch (\Exception $e) {
            return $val;
        }
    }
@endphp

<div class="page">

    {{-- Attachment label --}}
    <p class="label text-[10pt] italic mb-1.5 pl-3 font-bold">Attachment to CS Form No. 212</p>

    {{-- Title bar --}}
    <div class="title border border-black bg-neutral-400 text-center text-lg italic font-bold text-white py-0.5">WORK EXPERIENCE SHEET</div>

    {{-- Instructions --}}
    <!-- <div class="instruction-box">
        <table class="w-full border-0 border-collapse">
            <tr>
                <td class="w-23.75 align-top font-bold text-[9pt] border-0 p-0">
                    <em>Instructions:</em>
                </td>
                <td class="align-top border-0 p-0">
                    <p class="mb-1">
                        <strong>1.</strong>&nbsp; Include only the work experiences relevant to the position being applied to.
                    </p>
                    <p class="italic">
                        <strong>2.</strong>&nbsp; The duration should include start and finish dates, if known, month in abbreviated
                        form, if known, and year in full. For the current position, use the word
                        Present, e.g., 1998-Present. Work experience should be listed from most recent first.
                    </p>
                </td>
            </tr>
        </table>
    </div> -->

    {{-- Work Experience Entries --}}
    @foreach ($workExperiences as $index => $we)
    @php
        $dateFrom = \Carbon\Carbon::parse(wesDate($we->date_from))->format('d F Y');
        $dateTo   = $we->is_present ? 'Present' :  \Carbon\Carbon::parse(wesDate($we->date_to))->format('d F Y');
        $dateRange = $dateFrom . ' – ' . $dateTo;
        $agencyLocation = $we->department . ', ' . $we->location;

        $accomplishments = $we->accomplishments
            ? array_filter(array_map('trim', explode("\n", $we->accomplishments)))
            : [];

        $duties = $we->actual_duties
            ? array_filter(array_map('trim', explode("\n", $we->actual_duties)))
            : [];
    @endphp

    <div class="entry-box {{ $index === 0 ? 'entry-box-first' : '' }}">

        <ul class="main-list">
            <li>Duration: {{ $dateRange }}</li>
            <li>Position: {{ ($we->position_title ?? 'N/A') }}</li>
            <li>Name of Office/Unit: {{ ($we->office ?? 'N/A') }}</li>
            @if($we->status_of_appointment)
            <li>Immediate Supervisor: {{ $we->supervisor ?? '' }}</li>
            @endif
            <li>Name of Agency/Organization and Location:  {{ ($agencyLocation ?? 'N/A') }}</li>
        </ul>

        {{-- Accomplishments --}}
        <div class="pl-8 mt-2">
            <ul class="main-list">
                <li>
                    List of Accomplishments and Contributions{{ count($accomplishments) === 0 ? ' (if any)' : ':' }}
                    @if(count($accomplishments) > 0)
                    <ul class="sub-list">
                        @foreach($accomplishments as $acc)
                        <li>{{ $acc }}</li>
                        @endforeach
                    </ul>
                    @endif
                </li>
            </ul>
        </div>

        {{-- Summary of Actual Duties --}}
        <div class="pl-8 mt-2">
            <ul class="main-list">
                <li>
                    Summary of Actual Duties:
                    @if(count($duties) > 0)
                    <ul class="sub-list">
                        @foreach($duties as $duty)
                        <li>{{ $duty }}</li>
                        @endforeach
                    </ul>
                    @else
                    <span class="italic text-[#555]"> (not specified)</span>
                    @endif
                </li>
            </ul>
        </div>

    </div>

    @endforeach

    {{-- Signature block --}}
    <div class="sig-block">
        <div class="sig-line">
            <div class="sig-name">{{ $fullName }}</div>
            <div class="sig-label">(Signature over Printed Name</div>
            <div class="sig-label">of Employee/Applicant)</div>
            <div class="date-line">
                Date: <span class="date-value">{{ $today }}</span>
            </div>
        </div>
    </div>

</div>

</body>
</html>