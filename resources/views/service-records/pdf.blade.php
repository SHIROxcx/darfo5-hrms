<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Service Record</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 9pt;
        color: #000;
        background: #fff;
    }

    .page {
        width: 210mm;
        min-height: 297mm;
        padding: 10mm 12mm;
        background: #fff;
    }

    .header {
        display: flex;
        align-items: center;
        justify-content: start;
        gap: 12px;
        position: relative;
        min-height: 70px;
        border-bottom: 2px solid black;
        font-family: Arial;
    }
    .header img {
        position: absolute;
        left: 0;
        height: 64px;
        width: 64px;
        object-fit: contain;
    }
    .header-text { text-align: left; margin-left: 70px; }
    .header-text .dept { font-size: 9pt; font-weight: 550; }
    .header-text .office { font-size: 10pt; font-weight: 700;}
    .header-text .address { font-size: 8pt; }

    .title { text-align: center; margin-top: 30px; font-family: "Times New Roman"; }
    .title h1 { font-size: 14pt; font-weight: 700; }
    .title p { font-size: 9pt; margin-top: 2px; }

    .identity { margin-top: 24px; font-size: 10pt; }
    .identity .row { display: flex; align-items: flex-end; gap: 6px; }
    .identity .label { font-weight: 500; white-space: nowrap; }
    .identity .value {
        width: 360px;
        border-bottom: 1px solid #000;
        min-height: 16px;
        padding: 0 4px;
        text-align: center;
    }
    .identity .note { font-size: 8pt; white-space: nowrap; margin-left: 2px; }
    .identity .captions { 
        display: flex; 
        margin-top: 2px; 
        font-size: 8pt; 
        text-align: start; 
        margin-left: 50px;
        gap: 80px;
    }
    .captions {
        display: flex; 
        gap: 90px;
    }

    .certification {
        margin-top: 16px;
        font-size: 9pt;
        text-align: center;
        line-height: 1.5;
    }

    table.service-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 16px;
        table-layout: fixed;
    }
    table.service-table th,
    table.service-table td {
        border: 1px solid #000;
        padding: 3px 4px;
        font-size: 7.5pt;
        text-align: center;
        vertical-align: middle;
        word-wrap: break-word;
    }
    table.service-table thead th { font-weight: 700; background: #f2f2f2; }
    table.service-table .group-caption { font-size: 6.5pt; font-weight: 400; display: block; }
    table.service-table td.remarks-col { text-align: left; }
    table.service-table .nothing-follows td {
        text-align: center;
        font-style: italic;
        font-weight: 700;
        letter-spacing: 1px;
    }

    .legal {
        margin-top: 10px;
        font-size: 7.5pt;
        line-height: 1.4;
    }

    .signoff {
        display: flex;
        justify-content: space-between;
        margin-top: 28px;
        font-size: 9pt;
    }
    .signoff .date-line,
    .signoff .cert-line {
        border-top: 1px solid #000;
        padding-top: 2px;
        width: 220px;
        text-align: center;
    }

    .form-code {
        margin-top: 40px;
        font-size: 7.5pt;
        color: #333;
    }
</style>
</head>
<body>
<div class="page">

    <div class="header">
        @if($daLogo)
            <img src="{{ $daLogo }}" alt="DA Logo">
        @endif
        <div class="header-text">
            <p class="dept">Department of Agriculture</p>
            <p class="office">Regional Field Office No. 5</p>
            <p class="address">San Agustin, Pili, Camarines Sur</p>
        </div>
    </div>

    <div class="title">
        <h1>SERVICE RECORD</h1>
        <p>(To Be Accomplished By Employer)</p>
    </div>

    <div class="identity">
        <div class="row">
            <span class="label">NAME:</span>
            <div class="value">
                <span>{{ $user->last_name }},</span>
                <span>{{ $user->first_name }}</span>
                <span>{{ $user->middle_name }}</span> 
            </div>
            <span class="note">(If married women give also full maiden name)</span>
        </div>
        <div class="captions">
            <span>(Surname)</span><span>(Given Name)</span><span>(Middle Name)</span>
        </div>

        <div class="row" style="margin-top: 10px;">
            <span class="label">BIRTH:</span>
            <span class="value">{{ optional($pds?->date_of_birth)->format('F d, Y') }} {{ $pds?->birth_place }}</span>
            <span class="note">(Data herein should be checked from birth or baptismal<br>certificate or some other reliable documents)</span>
        </div>
        <div class="captions">
            <span">DATE</span>
            <span>PLACE</span>
        </div>
    </div>

    <p class="certification">
        This is to certify that the employee named hereinabove actually rendered <br>
        services in this Office as shown by the service record below, each line of which <br>
        is supported by appointment and other papers actually issued by this Office <br>
        and approved by the authorities concerned.
    </p>

    <table class="service-table">
        <thead>
            <tr>
                <th colspan="2">SERVICE<span class="group-caption">(Inclusive dates)</span></th>
                <th colspan="3">RECORD OF APPOINTMENT</th>
                <th colspan="2">OFFICE ENTITY/DIVISION</th>
                <th rowspan="2">LEAVE<br>WITHOUT PAY</th>
                <th colspan="2">SEPARATION</th>
                <th rowspan="2">REMARKS</th>
            </tr>
            <tr>
                <th>From</th>
                <th>To</th>
                <th>Designation</th>
                <th>Employment<br>Status</th>
                <th>Salary</th>
                <th>Station/Place<br>of assignment</th>
                <th>Branch</th>
                <th>Date</th>
                <th>Cause</th>
            </tr>
        </thead>
        <tbody>
            @php
                $prevDesignation = null;
                $prevStatus      = null;
                $prevStation     = null;
                $prevBranch      = null;
            @endphp
            @forelse($serviceRecords as $sr)
                @php
                    $showDesignation = ($sr->designation === $prevDesignation && $sr->designation) ? '-do-' : ($sr->designation ?: '—');
                    $showStatus      = ($sr->employment_status === $prevStatus && $sr->employment_status) ? '-do-' : ($sr->employment_status ?: '—');
                    $showStation     = ($sr->station_place_of_assignment === $prevStation && $sr->station_place_of_assignment) ? '-do-' : ($sr->station_place_of_assignment ?: '—');
                    $showBranch      = ($sr->branch === $prevBranch && $sr->branch) ? '-do-' : ($sr->branch ?: '—');

                    $prevDesignation = $sr->designation;
                    $prevStatus      = $sr->employment_status;
                    $prevStation     = $sr->station_place_of_assignment;
                    $prevBranch      = $sr->branch;
                @endphp
                <tr>
                    <td>{{ optional($sr->date_from)->format('m-d-Y') }}</td>
                    <td>{{ $sr->date_to ? $sr->date_to->format('m-d-Y') : 'To Date' }}</td>
                    <td>{{ $showDesignation }}</td>
                    <td>{{ $showStatus }}</td>
                    <td>{{ number_format((float) $sr->salary, 2) }} /a</td>
                    <td>{{ $showStation }}</td>
                    <td>{{ $showBranch }}</td>
                    <td>{{ $sr->leave_without_pay }}</td>
                    <td>{{ optional($sr->separation_date)->format('m-d-Y') }}</td>
                    <td>{{ $sr->separation_cause }}</td>
                    <td class="remarks-col">{{ $sr->remarks }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="11" style="font-style: italic;">No service record entries on file.</td>
                </tr>
            @endforelse
            <tr class="nothing-follows">
                <td colspan="11">*** Nothing Follows ***</td>
            </tr>
        </tbody>
    </table>

    <p class="legal">
        Issued in compliance with Executive Order No. 54 dated August 10, 1954 and in accordance with,
        Circular No. 58 dated August 10, 1954 of the System.
    </p>

    <div class="signoff">
        <div class="date-line">Date: {{ now()->format('F d, Y') }}</div>
        <div class="cert-line">CERTIFIED CORRECT</div>
    </div>

    <div class="form-code">
        AFD-HRMS-012-0<br>
        Effectivity Date: February 02, 2022
    </div>

</div>
</body>
</html>
