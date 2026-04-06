<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CS Form No. 212 – Personal Data Sheet</title>
<style>
/* ── Reset ──────────────────────────────────────────────────────────── */
* { margin: 0; padding: 0; box-sizing: border-box; }

/* ── Base ───────────────────────────────────────────────────────────── */
body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 7pt;
    color: #000;
    background: #fff;
}

/* ── Page ───────────────────────────────────────────────────────────── */
.page {
    width: 816px; /* 8.5 inches */
    min-height: 1248px; /* 13 inches */
    padding: 0.3in 0.3in 0.2in 0.3in;
    background: #fff;
    page-break-after: always;
    position: relative;
}
/* .page:last-child { page-break-after: auto; } */

/* ── Table Base ─────────────────────────────────────────────────────── */
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
td, th {
    border: 1px solid #000;
    padding: 1px 3px;
    vertical-align: top;
    font-size: 7pt;
    line-height: 1.3;
    word-wrap: break-word;
    overflow: hidden;
}

/* ── Section Header ─────────────────────────────────────────────────── */
.sec-hdr {
    background: #595959;
    color: #fff;
    font-weight: bold;
    font-style: italic;
    font-size: 8.5pt;
    padding: 3px 5px;
    text-transform: uppercase;
    border: 2px solid #000;
}

/* ── Cell Variants ──────────────────────────────────────────────────── */
.lbl {
    background: #d9d9d9;
    font-size: 6.5pt;
    text-transform: uppercase;
    vertical-align: middle;
}
.lbl-top  { vertical-align: top !important; }
.val      { vertical-align: middle; font-size: 7.5pt; }
.val-top  { vertical-align: top !important; }

/* ── Text Utilities ─────────────────────────────────────────────────── */
.text-center { text-align: center; }
.text-right  { text-align: right; }
.italic      { font-style: italic; }
.bold        { font-weight: bold; }
.text-sm     { font-size: 6.5pt; }
.text-xs     { font-size: 6pt; }
.text-xxs    { font-size: 5.5pt; }
.text-lg     { font-size: 9pt; }
.text-xl     { font-size: 17pt; font-weight: 900; letter-spacing: 1px; }
.text-red    { color: #c00; }
.indent      { padding-left: 8px; }
.indent-lg   { padding-left: 10px; }

/* ── Row Heights ────────────────────────────────────────────────────── */
.row-h8  { height: 8pt; }
.row-h12 { height: 12pt; }
.row-h13 { height: 13pt; }
.row-h14 { height: 14pt; }
.row-h15 { height: 15pt; }
.row-h18 { height: 18pt; }
.row-h21 { height: 21pt; }
.row-h22 { height: 22pt; }
.row-h24 { height: 24pt; }
.row-h27 { height: 27pt; }
.row-h28 { height: 28pt; }
.row-h32 { height: 32pt; }
.row-h33 { height: 33pt; }
.row-h39 { height: 39pt; }
.row-h41 { height: 41pt; }
.row-h53 { height: 53pt; }
.row-h7  { height: 7pt; }
.row-h10 { height: 10pt; }

/* ── Outer Border ───────────────────────────────────────────────────── */
.outer-border { border: 2px solid #000; }
.border-2     { border: 2px solid #000; }
.border-b     { border-bottom: 1px solid #000; }
.border-none  { border: none; }

/* ── Note / Warning Row ─────────────────────────────────────────────── */
.note-row {
    background: #d9d9d9;
    text-align: center;
    font-style: italic;
    font-size: 7pt;
    color: #c00;
    font-weight: bold;
    border: 2px solid #000;
}

/* ── Signature Row ──────────────────────────────────────────────────── */
.sig-cell { border: 2px solid #000; vertical-align: middle; }
.sig-center {
    border: 2px solid #000;
    text-align: center;
    vertical-align: middle;
    font-size: 6.5pt;
}
.sig-date { border: 2px solid #000; vertical-align: middle; padding: 4px; }

/* ── Checkbox ───────────────────────────────────────────────────────── */
.cb {
    display: inline-block;
    width: 8px; height: 8px;
    border: 1px solid #000;
    margin-right: 2px;
    vertical-align: middle;
    background: #fff;
    font-size: 6pt;
    text-align: center;
    line-height: 8px;
}
.cb-on  { background: #000; }
.cb-on::after { content: "✓"; color: #fff; font-size: 5pt; }

/* ── Photo / Thumbmark ──────────────────────────────────────────────── */
.photo-box {
    border: 1px solid #000;
    width: 110px; height: 140px;
    margin: 2px auto;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    font-size: 6pt;
    text-align: center;
    background: #fff;
}
.photo-box img    { width: 100%; height: 100%; object-fit: cover; }
.photo-lbl        { text-align: center; font-size: 5.5pt; margin: 2px 0; }
.thumb-box        { border: 1px solid #000; height: 55px; background: #fff; }
.thumb-box-lg     { border: 1px solid #000; height: 80px; background: #fff; }
.thumb-lbl        { background: #d9d9d9; border-top: 1px solid #000; text-align: center; padding: 1px; font-size: 6pt; }

/* ── Header table (no border) ───────────────────────────────────────── */
.hdr-table    { border: none; margin-bottom: 2px; }
.hdr-table td { border: none; padding: 0; }

/* ── Page header meta text ──────────────────────────────────────────── */
.pds-meta     { font-size: 6.5pt; padding: 1px 0; }
.pds-title    { border: none; text-align: center; padding: 4px 0; font-family: Arial; }
.pds-warning  { border: none; font-size: 6.5pt; padding: 1px 0; margin-bottom: 5px;}
.pds-guide    { border: none; font-size: 6.5pt; font-weight: bold; font-style: italic; padding: 1px 0; }
.pds-instr    { border: none; font-size: 6.5pt; padding: 1px 0; }

/* ── Footer ─────────────────────────────────────────────────────────── */
.page-footer  { text-align: right; font-style: italic; font-size: 6.5pt; margin-top: 2px; }

/* ── Address block sub-elements ─────────────────────────────────────── */
.addr-block   { padding: 2px; font-size: 6.5pt; }
.addr-row     { border-bottom: 1px solid #000; padding-bottom: 1px; margin-bottom: 1px; }
.addr-row-lbl { font-size: 6pt; }
.addr-zip     { text-align: right; font-size: 6pt; }

/* ── Checkbox option list ────────────────────────────────────────────── */
.cb-list      { vertical-align: top; padding: 3px; }
.cb-item      { margin-bottom: 1px; }
.cb-item-sm   { margin-bottom: 3px; }

/* ── Citizenship block ──────────────────────────────────────────────── */
.citizenship-block { vertical-align: top; padding: 3px; }
.citizenship-row   { margin-bottom: 3px; }
.citizenship-note  { font-size: 6pt; }

/* ── Gov't ID block ─────────────────────────────────────────────────── */
.gov-id-block      { border: 2px solid #000; padding: 3px; font-size: 6.5pt; vertical-align: top; }
.gov-id-divider    { border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 2px; }
.gov-id-row        { border-bottom: 1px solid #000; padding: 1px 0; }
.gov-id-last       { padding: 1px 0; }

/* ── Section 8 question cells ───────────────────────────────────────── */
.q-answer { vertical-align: top; padding: 3px; }
.q-detail { font-size: 6pt; }

/* ── References / Declaration ────────────────────────────────────────── */
.decl-cell { border: 2px solid #000; text-align: center; padding: 4px; font-size: 6.5pt; vertical-align: top; }
.subscribed-cell { border: 2px solid #000; text-align: center; vertical-align: bottom; padding: 2px; }
.notary-line { display: inline-block; border-top: 1px solid #000; min-width: 200px; margin-bottom: 2px; padding-top: 2px; }

/* ── Spacer row ─────────────────────────────────────────────────────── */
.spacer-row td { border: none; height: 3pt; padding: 0; }

@page { size: 8.5in 13in; margin: 0; }
</style>
</head>
<body>

@php
    $pi       = $pds['personal']       ?? null;
    $fam      = $pds['family']         ?? null;
    $children = $pds['children']       ?? collect();
    $eduList  = collect($pds['education'] ?? []);
    $govId    = $pds['government_id']  ?? null;

    $dob = $pi?->date_of_birth
        ? \Carbon\Carbon::parse($pi->date_of_birth)->format('m/d/Y') : '';

    $isFil  = !$pi || $pi->citizenship === 'Filipino' || !$pi->citizenship;
    $isDual = $pi?->citizenship === 'Dual Citizenship';
    $byBirth = $isDual && ($pi?->citizenship_type === 'by_birth');
    $byNat   = $isDual && ($pi?->citizenship_type === 'by_naturalization');

    $cs     = $pi?->civil_status ?? '';
    $csList = ['Single','Married','Widow/er','Separated'];

    function childName($children, $i) {
        $c = $children[$i] ?? null;
        return $c ? strtoupper($c->full_name ?? '') : '';
    }
    function childDob($children, $i) {
        $c = $children[$i] ?? null;
        if (!$c || !$c->date_of_birth) return '';
        return is_string($c->date_of_birth)
            ? $c->date_of_birth
            : \Carbon\Carbon::parse($c->date_of_birth)->format('m/d/Y');
    }
    function eduVal($eduList, $levelKey, $field) {
        $edu = $eduList->firstWhere('level', $levelKey);
        return $edu?->$field ?? '';
    }
    function cb($active) {
        return '<span class="cb ' . ($active ? 'cb-on' : '') . '"></span>';
    }
    function yN($val) {
        return cb($val)  . ' YES &nbsp; ' . cb(!$val) . ' NO';
    }
    function parseDate($val) {
        if (!$val) return '';
        return is_string($val) ? $val : \Carbon\Carbon::parse($val)->format('m/d/Y');
    }
@endphp

{{-- ══════════════════════════════════════════════════════════════════════ --}}
{{-- PAGE 1 – Personal Information, Family Background, Educational         --}}
{{-- ══════════════════════════════════════════════════════════════════════ --}}
<div class="page">

    {{-- PDS Header --}}
    <table class="hdr-table">
        <tr>
            <td class="pds-meta italic"><strong>CS Form No. 212</strong><br>Revised 2025</></td>
        </tr>
    </table>
    <table class="hdr-table">
        <tr><td class="pds-title text-xl">PERSONAL DATA SHEET</td></tr>
        <tr>
            <td class="pds-warning">
                <strong>WARNING:</strong> Any misrepresentation made in the Personal Data Sheet and the Work Experience Sheet shall cause the filing of administrative/criminal case/s against the person concerned.
            </td>
        </tr>
        <tr>
            <td class="pds-guide">
                READ THE ATTACHED GUIDE TO FILLING OUT THE PERSONAL DATA SHEET (PDS) BEFORE ACCOMPLISHING THE PDS FORM.
            </td>
        </tr>
        <tr>
            <td class="pds-instr">
                Print legibly if accomplished through own handwriting. Tick appropriate boxes (<span class="cb"></span>) and use separate sheet if necessary. Indicate N/A if not applicable. <strong>DO NOT ABBREVIATE.</strong>
            </td>
        </tr>
    </table>

    {{-- Main table --}}
    <table class="outer-border">
    <colgroup>
        <col style="width:2.5%">
        <col style="width:10%">
        <col style="width:5%">
        <col style="width:12%">
        <col style="width:5%">
        <col style="width:4.5%">
        <col style="width:7%">
        <col style="width:7.5%">
        <col style="width:7.5%">
        <col style="width:6%">
        <col style="width:5%">
        <col style="width:8%">
        <col style="width:7%">
        <col style="width:7%">
    </colgroup>

    {{-- ─ SECTION I ───────────────────────────────────────────────────── --}}
    <tr><td colspan="14" class="sec-hdr">I. PERSONAL INFORMATION</td></tr>

    <tr class="row-h22">
        <td colspan="2" class="lbl text-sm"><strong>1.</strong> SURNAME</td>
        <td colspan="12" class="val bold text-lg">{{ strtoupper($user->last_name ?? '') }}</td>
    </tr>
    <tr class="row-h22">
        <td colspan="2" class="lbl text-sm indent-lg">FIRST NAME</td>
        <td colspan="8" class="val bold text-lg">{{ strtoupper($user->first_name ?? '') }}</td>
        <td colspan="2" class="lbl text-center text-xxs">NAME<br>EXTENSION<br>(JR., SR)</td>
        <td colspan="2" class="val bold">{{ strtoupper($user->name_ext ?? '') }}</td>
    </tr>
    <tr class="row-h21 border-2">
        <td colspan="2" class="lbl text-sm indent-lg">MIDDLE NAME</td>
        <td colspan="12" class="val bold text-lg">{{ strtoupper($user->middle_name ?? '') }}</td>
    </tr>

    {{-- DOB / Citizenship --}}
    <tr class="row-h24">
        <td colspan="2" class="lbl"><strong>3.</strong> DATE OF BIRTH<br><span class="italic">(dd/mm/yyyy)</span></td>
        <td colspan="4" class="val">{{ $dob }}</td>
        <td colspan="3" rowspan="3" class="lbl text-center" style="vertical-align:middle;">
            16. CITIZENSHIP<br><br>
            <span class="italic text-xs">If holder of dual citizenship,<br>please indicate the details.</span>
        </td>
        <td colspan="5" rowspan="3" class="citizenship-block">
            <div class="citizenship-row">
                {!! cb($isFil) !!} Filipino &nbsp;&nbsp; {!! cb($isDual) !!} Dual Citizenship
            </div>
            <div class="citizenship-row indent">
                {!! cb($byBirth) !!} by birth &nbsp; {!! cb($byNat) !!} by naturalization
            </div>
            <div class="citizenship-note">Please indicate country:<br>
                <span class="text-sm">{{ $isDual ? ($pi?->citizenship_country ?? '') : '' }}</span>
            </div>
        </td>
    </tr>
    <tr class="row-h24">
        <td colspan="2" class="lbl"><strong>4.</strong> PLACE OF BIRTH</td>
        <td colspan="4" class="val">{{ $pi?->birth_place ?? '' }}</td>
    </tr>
    <tr class="row-h15">
        <td colspan="2" class="lbl"><strong>5.</strong> SEX AT BIRTH</td>
        <td colspan="4" class="val">
            {!! cb($pi?->sex === 'Male') !!} Male &nbsp; {!! cb($pi?->sex === 'Female') !!} Female
        </td>
    </tr>

    {{-- Civil Status / Residential Address --}}
    <tr class="row-h15">
        <td colspan="2" class="lbl lbl-top"><strong>6.</strong> CIVIL STATUS</td>
        <td colspan="4" rowspan="4" class="cb-list">
            @foreach($csList as $s)
            <div class="cb-item">{!! cb($cs === $s) !!} {{ $s }}</div>
            @endforeach
            <div>{!! cb(!in_array($cs,$csList) && $cs) !!} Others: <span class="text-sm">{{ !in_array($cs,$csList) ? $cs : '' }}</span></div>
        </td>
        <td colspan="3" rowspan="6" class="lbl text-center" style="vertical-align:middle;">17. RESIDENTIAL<br>ADDRESS<br><br><br>ZIPCODE</td>
        <td colspan="5" rowspan="6" class="addr-block val-top">
            <div class="addr-row"><span class="addr-row-lbl">House/Block/Lot No.</span><br>{{ $pi?->res_house_no ?? '' }}</div>
            <div class="addr-row"><span class="addr-row-lbl">Street</span><br>{{ $pi?->res_street ?? '' }}</div>
            <div class="addr-row"><span class="addr-row-lbl">Subdivision/Village</span><br>{{ $pi?->res_subdivision ?? '' }}</div>
            <div class="addr-row"><span class="addr-row-lbl">Barangay</span><br>{{ $pi?->res_barangay ?? '' }}</div>
            <div class="addr-row"><span class="addr-row-lbl">City/Municipality</span><br>{{ $pi?->res_city ?? '' }}</div>
            <div class="addr-row"><span class="addr-row-lbl">Province</span><br>{{ $pi?->res_province ?? '' }}</div>
            <div class="addr-zip"><span class="addr-row-lbl">ZIP CODE: </span>{{ $pi?->res_zipcode ?? '' }}</div>
        </td>
    </tr>
    <tr class="row-h15"><td colspan="2" class="lbl"><strong>7.</strong> HEIGHT (m)</td></tr>
    <tr class="row-h8"> <td colspan="2" class="lbl"></td><td colspan="4" class="val">{{ $pi?->height ?? '' }}</td></tr>
    <tr class="row-h22"><td colspan="2" class="lbl"><strong>8.</strong> WEIGHT (kg)</td></tr>
    <tr class="row-h15">
        <td colspan="2" class="lbl"><strong>9.</strong> BLOOD TYPE</td>
        <td colspan="4" class="val">{{ $pi?->weight ?? '' }}</td>
    </tr>
    <tr class="row-h15">
        <td colspan="2" class="lbl"></td>
        <td colspan="4" class="val">{{ $pi?->blood_type ?? '' }}</td>
    </tr>

    {{-- Government IDs + Permanent Address --}}
    <tr class="row-h15">
        <td colspan="2" class="lbl text-xs"><strong>10.</strong> UMID ID NO.</td>
        <td colspan="4" class="val">{{ $pi?->umid_number ?? $pi?->gsis_number ?? '' }}</td>
        <td colspan="3" rowspan="5" class="lbl text-center" style="vertical-align:middle;">18. PERMANENT<br>ADDRESS<br><br><br>ZIPCODE</td>
        <td colspan="5" rowspan="5" class="addr-block val-top">
            <div class="addr-row"><span class="addr-row-lbl">House/Block/Lot No.</span><br>{{ $pi?->perm_house_no ?? '' }}</div>
            <div class="addr-row"><span class="addr-row-lbl">Street</span><br>{{ $pi?->perm_street ?? '' }}</div>
            <div class="addr-row"><span class="addr-row-lbl">Subdivision/Village</span><br>{{ $pi?->perm_subdivision ?? '' }}</div>
            <div class="addr-row"><span class="addr-row-lbl">Barangay</span><br>{{ $pi?->perm_barangay ?? '' }}</div>
            <div class="addr-row"><span class="addr-row-lbl">City/Municipality</span><br>{{ $pi?->perm_city ?? '' }}</div>
            <div class="addr-row"><span class="addr-row-lbl">Province</span><br>{{ $pi?->perm_province ?? '' }}</div>
            <div class="addr-zip"><span class="addr-row-lbl">ZIP CODE: </span>{{ $pi?->perm_zipcode ?? '' }}</div>
        </td>
    </tr>
    <tr class="row-h15"><td colspan="2" class="lbl text-xs"><strong>11.</strong> PAG-IBIG ID NO.</td><td colspan="4" class="val">{{ $pi?->pagibig_number ?? '' }}</td></tr>
    <tr class="row-h15"><td colspan="2" class="lbl text-xs"><strong>12.</strong> PHILHEALTH NO.</td><td colspan="4" class="val">{{ $pi?->philhealth_number ?? '' }}</td></tr>
    <tr class="row-h24"><td colspan="2" class="lbl text-xs"><strong>13.</strong> PhilSys Number (PSN):</td><td colspan="4" class="val">{{ $pi?->philsys_number ?? '' }}</td></tr>
    <tr class="row-h24"><td colspan="2" class="lbl text-xs"><strong>14. TIN NO.</strong></td><td colspan="4" class="val">{{ $pi?->tin_number ?? '' }}</td></tr>

    <tr class="row-h24">
        <td colspan="6" class="lbl text-xs"><strong>15. AGENCY EMPLOYEE NO.</strong> &nbsp; {{ $pi?->agency_employee_no ?? $ep?->employee_number ?? '' }}</td>
        <td colspan="3" class="lbl text-xs">19. TELEPHONE NO.</td>
        <td colspan="5" class="val">{{ $pi?->telephone ?? '' }}</td>
    </tr>
    <tr class="row-h24">
        <td colspan="6" class="lbl text-xs">20. MOBILE NO. &nbsp; {{ $pi?->mobile_number ?? '' }}</td>
        <td colspan="3" class="lbl text-xs">21. E-MAIL ADDRESS (if any)</td>
        <td colspan="5" class="val text-xs">{{ $pi?->email ?? $user->email ?? '' }}</td>
    </tr>

    {{-- ─ SECTION II ──────────────────────────────────────────────────── --}}
    <tr><td colspan="14" class="sec-hdr">II. FAMILY BACKGROUND</td></tr>

    <tr class="row-h21">
        <td colspan="2" class="lbl text-xs"><strong>22.</strong> SPOUSE'S SURNAME</td>
        <td colspan="5" class="val">{{ strtoupper($fam?->spouse_surname ?? '') }}</td>
        <td colspan="4" class="lbl text-center text-xs"><strong>23. NAME of CHILDREN</strong><br><em>(Write full name and list all)</em></td>
        <td colspan="3" class="lbl text-center text-xs">DATE OF BIRTH<br><em>(dd/mm/yyyy)</em></td>
    </tr>
    <tr class="row-h21">
        <td colspan="2" class="lbl text-xs indent">FIRST NAME</td>
        <td colspan="3" class="val">{{ strtoupper($fam?->spouse_first_name ?? '') }}</td>
        <td colspan="2" class="lbl text-xs">NAME EXTENSION</td>
        <td colspan="4" class="val text-xs">{{ childName($children, 0) }}</td>
        <td colspan="3" class="val text-center text-xs">{{ childDob($children, 0) }}</td>
    </tr>

    @php
        $spouseChildRows = [
            ['middle', 'spouse_middle_name', 1],
            ['occupation', null, 2],
            ['employer', null, 3],
            ['business_address', null, 4],
            ['telephone', null, 5],
        ];
        $spouseLabels = [
            'middle'           => 'MIDDLE NAME',
            'occupation'       => 'OCCUPATION',
            'employer'         => 'EMPLOYER/BUSINESS NAME',
            'business_address' => 'BUSINESS ADDRESS',
            'telephone'        => 'TELEPHONE NO.',
        ];
        $spouseFields = [
            'middle'           => 'spouse_middle_name',
            'occupation'       => 'spouse_occupation',
            'employer'         => 'spouse_employer',
            'business_address' => 'spouse_business_address',
            'telephone'        => 'spouse_telephone',
        ];
    @endphp
    @foreach(['middle','occupation','employer','business_address','telephone'] as $idx => $key)
    <tr class="row-h21">
        <td colspan="2" class="lbl text-xs {{ in_array($key,['middle']) ? 'indent' : '' }}">{{ $spouseLabels[$key] }}</td>
        <td colspan="5" class="val text-xs">{{ strtoupper($fam?->{$spouseFields[$key]} ?? '') }}</td>
        <td colspan="4" class="val text-xs">{{ childName($children, $idx + 2) }}</td>
        <td colspan="3" class="val text-center text-xs">{{ childDob($children, $idx + 2) }}</td>
    </tr>
    @endforeach

    {{-- Father --}}
    <tr class="row-h21">
        <td colspan="2" class="lbl text-xs"><strong>24.</strong> FATHER'S SURNAME</td>
        <td colspan="5" class="val">{{ strtoupper($fam?->father_surname ?? '') }}</td>
        <td colspan="4" class="val text-xs">{{ childName($children, 6) }}</td>
        <td colspan="3" class="val text-center text-xs">{{ childDob($children, 6) }}</td>
    </tr>
    <tr class="row-h21">
        <td colspan="2" class="lbl text-xs indent">FIRST NAME</td>
        <td colspan="3" class="val">{{ strtoupper($fam?->father_first_name ?? '') }}</td>
        <td colspan="2" class="lbl text-xs">NAME EXTENSION</td>
        <td colspan="4" class="val text-xs">{{ childName($children, 7) }}</td>
        <td colspan="3" class="val text-center text-xs">{{ childDob($children, 7) }}</td>
    </tr>
    <tr class="row-h21">
        <td colspan="2" class="lbl text-xs indent">MIDDLE NAME</td>
        <td colspan="5" class="val">{{ strtoupper($fam?->father_middle_name ?? '') }}</td>
        <td colspan="4" class="val text-xs">{{ childName($children, 8) }}</td>
        <td colspan="3" class="val text-center text-xs">{{ childDob($children, 8) }}</td>
    </tr>

    {{-- Mother --}}
    <tr class="row-h21">
        <td colspan="2" class="lbl text-xs"><strong>25.</strong> MOTHER'S MAIDEN NAME</td>
        <td colspan="5" class="val"></td>
        <td colspan="4" class="val text-xs">{{ childName($children, 9) }}</td>
        <td colspan="3" class="val text-center text-xs">{{ childDob($children, 9) }}</td>
    </tr>
    <tr class="row-h21">
        <td colspan="2" class="lbl text-xs indent">SURNAME</td>
        <td colspan="5" class="val">{{ strtoupper($fam?->mother_surname ?? '') }}</td>
        <td colspan="4" class="val text-xs">{{ childName($children, 10) }}</td>
        <td colspan="3" class="val text-center text-xs">{{ childDob($children, 10) }}</td>
    </tr>
    <tr class="row-h21">
        <td colspan="2" class="lbl text-xs indent">FIRST NAME</td>
        <td colspan="3" class="val">{{ strtoupper($fam?->mother_first_name ?? '') }}</td>
        <td colspan="2" class="lbl text-xs">NAME EXTENSION</td>
        <td colspan="4" class="val text-xs">{{ childName($children, 11) }}</td>
        <td colspan="3" class="val text-center text-xs">{{ childDob($children, 11) }}</td>
    </tr>
    <tr class="row-h21">
        <td colspan="2" class="lbl text-xs indent">MIDDLE NAME</td>
        <td colspan="5" class="val">{{ strtoupper($fam?->mother_middle_name ?? '') }}</td>
        <td colspan="7" class="note-row text-xs">(Continue on separate sheet if necessary)</td>
    </tr>

    {{-- ─ SECTION III ─────────────────────────────────────────────────── --}}
    <tr><td colspan="14" class="sec-hdr">III. EDUCATIONAL BACKGROUND</td></tr>

    <tr class="row-h14 text-center">
        <td colspan="2" rowspan="2" class="lbl text-xxs" style="vertical-align:middle;"><strong>26. LEVEL</strong></td>
        <td colspan="3" rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">NAME OF SCHOOL<br><em>(Write in full)</em></td>
        <td colspan="3" rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">BASIC EDUCATION/<br>DEGREE/COURSE<br><em>(Write in full)</em></td>
        <td colspan="2" class="lbl text-xxs">PERIOD OF ATTENDANCE<br><em>(dd/mm/yyyy)</em></td>
        <td rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">HIGHEST<br>LEVEL/<br>UNITS<br>EARNED<br><em>(if not<br>graduated)</em></td>
        <td rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">YEAR<br>GRADUATED</td>
        <td rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">SCHOLARSHIP/<br>ACADEMIC<br>HONORS<br>RECEIVED</td>
    </tr>
    <tr class="row-h14 text-center">
        <td class="lbl text-xs">From</td>
        <td class="lbl text-xs">To</td>
    </tr>

    @php
        $eduRows = [
            ['ELEMENTARY',              'Elementary'],
            ['SECONDARY',               'Secondary'],
            ['VOCATIONAL / TRADE COURSE','Vocational'],
            ['COLLEGE',                 'College'],
            ['GRADUATE STUDIES',        'Graduate Studies'],
        ];
    @endphp
    @foreach($eduRows as [$label, $key])
    <tr class="row-h28">
        <td colspan="2" class="lbl text-xs">{{ $label }}</td>
        <td colspan="3" class="val text-xs">{{ eduVal($eduList, $key, 'school_name') }}</td>
        <td colspan="3" class="val text-xs">{{ eduVal($eduList, $key, 'course') }}</td>
        <td class="val text-center text-xs">{{ eduVal($eduList, $key, 'period_from') }}</td>
        <td class="val text-center text-xs">{{ eduVal($eduList, $key, 'period_to') }}</td>
        <td class="val text-center text-xs">{{ eduVal($eduList, $key, 'highest_level') }}</td>
        <td class="val text-center text-xs">{{ eduVal($eduList, $key, 'year_graduated') }}</td>
        <td class="val text-xxs text-center">{{ eduVal($eduList, $key, 'honors_received') }}</td>
    </tr>
    @endforeach

    <tr><td colspan="14" class="note-row">(Continue on separate sheet if necessary)</td></tr>

    {{-- Page 1 Signature --}}
    <tr class="row-h27">
        <td colspan="2" class="lbl text-center sig-cell" style="vertical-align:middle;">SIGNATURE</td>
        <td colspan="7" class="sig-center">
            <em>(wet signature/e-signature/digital certificate)</em>
            @if(!empty($govId?->signature))
                <br><img src="{{ storage_path('app/public/' . $govId->signature) }}" style="max-height:35px;max-width:90%;">
            @endif
        </td>
        <td colspan="2" class="lbl text-center sig-cell" style="vertical-align:middle;">DATE</td>
        <td colspan="3" class="sig-date">{{ $govId?->date_accomplished ?? '' }}</td>
    </tr>
    </table>
    <p class="page-footer">CS FORM 212 (Revised 2025), Page 1 of 4</p>
</div>


{{-- ══════════════════════════════════════════════════════════════════════ --}}
{{-- PAGE 2 – Civil Service Eligibility + Work Experience                  --}}
{{-- ══════════════════════════════════════════════════════════════════════ --}}
<div class="page">
<table class="outer-border">
<colgroup>
    <col style="width:3%">
    <col style="width:5.5%">
    <col style="width:8.5%">
    <col style="width:9%">
    <col style="width:7%">
    <col style="width:11.5%">
    <col style="width:6%">
    <col style="width:16%">
    <col style="width:8%">
    <col style="width:9.5%">
    <col style="width:10%">
</colgroup>

<tr><td colspan="11" class="sec-hdr">IV. CIVIL SERVICE ELIGIBILITY</td></tr>

<tr class="row-h15 text-center">
    <td colspan="4" rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">
        <strong>27.</strong> CES/CSEE/CAREER SERVICE/RA 1080 (BOARD/BAR)/<br>
        UNDER SPECIAL LAWS/BARANGAY ELIGIBILITY/DRIVER'S LICENSE
    </td>
    <td rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">RATING<br><em>(if applicable)</em></td>
    <td rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">DATE OF EXAMINATION/<br>CONFERMENT</td>
    <td colspan="2" rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">PLACE OF EXAMINATION/<br>CONFERMENT</td>
    <td colspan="3" class="lbl text-xxs">LICENSE (if applicable)</td>
</tr>
<tr class="row-h25 text-center">
    <td class="lbl text-xxs">NUMBER</td>
    <td colspan="2" class="lbl text-xxs">Valid Until</td>
</tr>

@php $eligibilities = $pds['eligibilities'] ?? []; @endphp
@for($i = 0; $i < 8; $i++)
@php $elig = $eligibilities[$i] ?? null; @endphp
<tr class="row-h27">
    <td colspan="4" class="val text-xs">{{ $elig?->career_service ?? '' }}</td>
    <td class="val text-center text-xs">{{ $elig?->rating ?? '' }}</td>
    <td class="val text-center text-xs">{{ parseDate($elig?->date_of_examination) }}</td>
    <td colspan="2" class="val text-xs">{{ $elig?->place_of_examination ?? '' }}</td>
    <td class="val text-center text-xs">{{ $elig?->license_number ?? '' }}</td>
    <td colspan="2" class="val text-center text-xs">{{ parseDate($elig?->license_validity) }}</td>
</tr>
@endfor

<tr><td colspan="11" class="note-row">(Continue on separate sheet if necessary)</td></tr>

<tr>
    <td colspan="11" class="sec-hdr">
        V. WORK EXPERIENCE<br>
        <span class="text-xs" style="font-weight:normal;">(Include private employment. Start from your recent work.)</span>
    </td>
</tr>
<tr class="row-h18 text-center">
    <td colspan="2" rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">
        <strong>28.</strong> INCLUSIVE DATES<br><em>(dd/mm/yyyy)</em>
    </td>
    <td colspan="2" rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">POSITION TITLE<br><em>(Write in full/Do not abbreviate)</em></td>
    <td colspan="3" rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">DEPARTMENT/AGENCY/OFFICE/COMPANY<br><em>(Write in full)</em></td>
    <td rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">STATUS OF APPOINTMENT</td>
    <td colspan="3" rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">GOV'T SERVICE (Y/N)</td>
</tr>
<tr class="row-h18"></tr>
<tr class="row-h18 text-center">
    <td class="lbl text-xs">From</td>
    <td class="lbl text-xs">To</td>
    <td colspan="2" class="lbl"></td>
    <td colspan="3" class="lbl"></td>
    <td class="lbl"></td>
    <td colspan="3" class="lbl"></td>
</tr>

@php $workExp = $pds['work_experience'] ?? []; @endphp
@for($i = 0; $i < 28; $i++)
@php $we = $workExp[$i] ?? null; @endphp
<tr class="row-h24 text-sm">
    <td class="val text-center text-xs">{{ parseDate($we?->date_from) }}</td>
    <td class="val text-center text-xs">
        @if($we?->is_present)<em>Present</em>@else{{ parseDate($we?->date_to) }}@endif
    </td>
    <td colspan="2" class="val text-xs">{{ $we?->position_title ?? '' }}</td>
    <td colspan="3" class="val text-xs">{{ $we?->department ?? '' }}</td>
    <td class="val text-xs">{{ $we?->status_of_appointment ?? '' }}</td>
    <td colspan="3" class="val text-center text-xs">{{ $we ? ($we->is_government_service ? 'Y' : 'N') : '' }}</td>
</tr>
@endfor

<tr><td colspan="11" class="note-row">(Continue on separate sheet if necessary)</td></tr>

<tr class="row-h27">
    <td colspan="2" class="lbl text-center sig-cell" style="vertical-align:middle;">SIGNATURE</td>
    <td colspan="5" class="sig-center">
        <em>(wet signature/e-signature/digital certificate)</em>
        @if(!empty($govId?->signature))
            <br><img src="{{ storage_path('app/public/' . $govId->signature) }}" style="max-height:35px;max-width:90%;">
        @endif
    </td>
    <td colspan="2" class="lbl text-center sig-cell" style="vertical-align:middle;">DATE</td>
    <td colspan="2" class="sig-date">{{ $govId?->date_accomplished ?? '' }}</td>
</tr>
</table>
<p class="page-footer">CS FORM 212 (Revised 2025), Page 2 of 4</p>
</div>


{{-- ══════════════════════════════════════════════════════════════════════ --}}
{{-- PAGE 3 – Voluntary Work, L&D Trainings, Other Info                    --}}
{{-- ══════════════════════════════════════════════════════════════════════ --}}
<div class="page">
<table class="outer-border">
<colgroup>
    <col style="width:3.5%">
    <col style="width:26%">
    <col style="width:3%">
    <col style="width:17.5%">
    <col style="width:9%">
    <col style="width:9%">
    <col style="width:9.5%">
    <col style="width:3%">
    <col style="width:4%">
    <col style="width:22%">
    <col style="width:3.5%">
</colgroup>

<tr><td colspan="11" class="sec-hdr">VI. VOLUNTARY WORK OR INVOLVEMENT IN CIVIC / NON-GOVERNMENT / PEOPLE / VOLUNTARY ORGANIZATIONS</td></tr>

<tr class="row-h15 text-center">
    <td colspan="4" rowspan="2" class="lbl text-xs" style="vertical-align:middle;">
        <strong>29.</strong> NAME &amp; ADDRESS OF ORGANIZATION<br><em>(Write in full)</em>
    </td>
    <td colspan="2" class="lbl text-xs">INCLUSIVE DATES<br><em>(dd/mm/yyyy)</em></td>
    <td rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">NUMBER<br>OF HOURS</td>
    <td colspan="4" rowspan="2" class="lbl text-xs" style="vertical-align:middle;">POSITION / NATURE OF WORK</td>
</tr>
<tr class="row-h13 text-center">
    <td class="lbl text-xs">From</td>
    <td class="lbl text-xs">To</td>
</tr>

@php $volWork = $pds['voluntary_work'] ?? []; @endphp
@for($i = 0; $i < 7; $i++)
@php $vw = $volWork[$i] ?? null; @endphp
<tr class="row-h27 text-sm">
    <td colspan="4" class="val text-xs">
        @if($vw){{ ($vw->organization_name ?? '') . ($vw->organization_address ? ', ' . $vw->organization_address : '') }}@endif
    </td>
    <td class="val text-center text-xs">{{ parseDate($vw?->date_from) }}</td>
    <td class="val text-center text-xs">{{ parseDate($vw?->date_to) }}</td>
    <td class="val text-center text-xs">{{ $vw?->number_of_hours ?? '' }}</td>
    <td colspan="4" class="val text-xs">{{ $vw?->position ?? '' }}</td>
</tr>
@endfor

<tr><td colspan="11" class="note-row">(Continue on separate sheet if necessary)</td></tr>

<tr>
    <td colspan="11" class="sec-hdr">VII. LEARNING AND DEVELOPMENT (L&amp;D) INTERVENTIONS/TRAINING PROGRAMS ATTENDED</td>
</tr>
<tr class="row-h18 text-center">
    <td colspan="4" rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">
        <strong>30.</strong> TITLE OF LEARNING AND DEVELOPMENT INTERVENTIONS/TRAINING PROGRAMS<br><em>(Write in full)</em>
    </td>
    <td colspan="2" class="lbl text-xxs">INCLUSIVE DATES OF ATTENDANCE<br><em>(dd/mm/yyyy)</em></td>
    <td rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">NUMBER<br>OF HOURS</td>
    <td colspan="3" rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">Type of L&amp;D<br>(Managerial/<br>Supervisory/<br>Technical/etc)</td>
    <td rowspan="2" class="lbl text-xxs" style="vertical-align:middle;">CONDUCTED/<br>SPONSORED BY<br><em>(Write in full)</em></td>
</tr>
<tr class="row-h13 text-center">
    <td class="lbl text-xxs">From</td>
    <td class="lbl text-xxs">To</td>
</tr>

@php $trainings = $pds['trainings'] ?? []; @endphp
@for($i = 0; $i < 21; $i++)
@php $tr = $trainings[$i] ?? null; @endphp
<tr class="row-h24 text-sm">
    <td colspan="4" class="val text-xs">{{ $tr?->title ?? '' }}</td>
    <td class="val text-center text-xs">{{ parseDate($tr?->date_from) }}</td>
    <td class="val text-center text-xs">{{ parseDate($tr?->date_to) }}</td>
    <td class="val text-center text-xs">{{ $tr?->number_of_hours ?? '' }}</td>
    <td colspan="3" class="val text-center text-xs">{{ $tr?->type_of_ld ?? '' }}</td>
    <td class="val text-xs">{{ $tr?->conducted_by ?? '' }}</td>
</tr>
@endfor

<tr><td colspan="11" class="note-row">(Continue on separate sheet if necessary)</td></tr>

<tr><td colspan="11" class="sec-hdr">VIII. OTHER INFORMATION</td></tr>

<tr class="row-h33 text-center">
    <td colspan="2"  class="lbl text-xs" style="vertical-align:middle;"><strong>31.</strong> SPECIAL SKILLS and HOBBIES</td>
    <td colspan="5"  class="lbl text-xs" style="vertical-align:middle;"><strong>32.</strong> NON-ACADEMIC DISTINCTIONS / RECOGNITION<br><em>(Write in full)</em></td>
    <td colspan="4"  class="lbl text-xs" style="vertical-align:middle;"><strong>33.</strong> MEMBERSHIP IN ASSOCIATION/ORGANIZATION<br><em>(Write in full)</em></td>
</tr>

@php
    $oi           = $pds['other_info'] ?? null;
    $skills       = $oi?->special_skills ?? [];
    $distinctions = $oi?->non_academic_distinctions ?? [];
    $memberships  = $oi?->organization_memberships  ?? [];
@endphp
@for($i = 0; $i < 7; $i++)
<tr class="row-h24">
    <td colspan="2" class="val text-xs">{{ $skills[$i] ?? '' }}</td>
    <td colspan="5" class="val text-xs">{{ $distinctions[$i] ?? '' }}</td>
    <td colspan="4" class="val text-xs">{{ $memberships[$i] ?? '' }}</td>
</tr>
@endfor

<tr><td colspan="11" class="note-row">(Continue on separate sheet if necessary)</td></tr>

<tr class="row-h28">
    <td colspan="2" class="lbl text-center sig-cell" style="vertical-align:middle;">SIGNATURE</td>
    <td colspan="5" class="sig-center">
        <em>(wet signature/e-signature/digital certificate)</em>
        @if(!empty($govId?->signature))
            <br><img src="{{ storage_path('app/public/' . $govId->signature) }}" style="max-height:35px;max-width:90%;">
        @endif
    </td>
    <td colspan="2" class="lbl text-center sig-cell" style="vertical-align:middle;">DATE</td>
    <td colspan="2" class="sig-date">{{ $govId?->date_accomplished ?? '' }}</td>
</tr>
</table>
<p class="page-footer">CS FORM 212 (Revised 2025), Page 3 of 4</p>
</div>


{{-- ══════════════════════════════════════════════════════════════════════ --}}
{{-- PAGE 4 – Questions, References, Gov't ID, Declaration                 --}}
{{-- ══════════════════════════════════════════════════════════════════════ --}}
@php $q = $pds['questions'] ?? null; $refs = $pds['references'] ?? []; @endphp

<div class="page">
<table class="outer-border">
<colgroup>
    <col style="width:2%">
    <col style="width:5%">
    <col style="width:12%">
    <col style="width:22%">
    <col style="width:3%">
    <col style="width:25%">
    <col style="width:4%">
    <col style="width:6%">
    <col style="width:3%">
    <col style="width:2%">
    <col style="width:7%">
    <col style="width:15%">
    <col style="width:2%">
</colgroup>

{{-- Q34 --}}
<tr class="row-h13">
    <td colspan="2" rowspan="3" class="lbl text-center" style="vertical-align:middle;font-size:8pt;"><strong>34.</strong></td>
    <td colspan="4" class="lbl text-xs lbl-top">Are you related by consanguinity or affinity to the appointing or recommending authority, or to the</td>
    <td colspan="6" rowspan="3" class="q-answer">
        <div class="cb-item-sm">{!! yN($q?->q34_a) !!}</div>
        <div class="cb-item-sm">{!! yN($q?->q34_b) !!}</div>
        <div class="q-detail">If YES, give details:<br>{{ $q?->q34_details ?? '' }}</div>
    </td>
    <td rowspan="3" class="lbl"></td>
</tr>
<tr class="row-h12"><td colspan="4" class="lbl text-xs">chief of bureau or office or to the person who has immediate supervision over you in the Office,</td></tr>
<tr class="row-h12"><td colspan="4" class="lbl text-xs">Bureau or Department where you will be appointed,</td></tr>
<tr class="row-h14">
    <td colspan="2" class="lbl"></td>
    <td colspan="4" class="lbl text-xs indent">a. within the third degree?</td>
    <td colspan="6" class="lbl"></td>
    <td class="lbl"></td>
</tr>
<tr class="spacer-row"><td colspan="13"></td></tr>
<tr class="row-h15">
    <td colspan="2" class="lbl"></td>
    <td colspan="4" class="lbl text-xs indent">b. within the fourth degree (for Local Government Unit - Career Employees)?</td>
    <td colspan="6" class="lbl"></td>
    <td class="lbl"></td>
</tr>

{{-- Q35 --}}
<tr class="row-h18">
    <td colspan="2" rowspan="2" class="lbl text-center" style="vertical-align:middle;font-size:8pt;"><strong>35.</strong></td>
    <td colspan="4" class="lbl text-xs">a. Have you ever been found guilty of any administrative offense?</td>
    <td colspan="6" rowspan="4" class="q-answer">
        <div class="cb-item-sm">{!! yN($q?->q35_a) !!}</div>
        <div class="q-detail cb-item-sm">If YES, give details: {{ $q?->q35_a_details ?? '' }}</div>
        <div class="cb-item-sm">{!! yN($q?->q35_b) !!}</div>
        <div class="q-detail">If YES, give details: {{ $q?->q35_b_details ?? '' }}<br>
            Date Filed: {{ $q?->q35_b_date ?? '' }}<br>
            Status: {{ $q?->q35_b_status ?? '' }}
        </div>
    </td>
    <td rowspan="4" class="lbl"></td>
</tr>
<tr class="row-h14"><td colspan="4" class="lbl text-xs">If YES, give details:</td></tr>
<tr class="row-h14">
    <td colspan="2" class="lbl"></td>
    <td colspan="4" class="lbl text-xs">b. Have you been criminally charged before any court?</td>
</tr>
<tr class="row-h14">
    <td colspan="2" class="lbl"></td>
    <td colspan="2" class="lbl text-xs">If YES, give details:</td>
    <td class="lbl text-xxs">Date Filed:</td>
    <td class="lbl text-xxs">Status of Case/s:</td>
</tr>

{{-- Q36 --}}
<tr class="row-h18">
    <td colspan="2" class="lbl text-center" style="font-size:8pt;"><strong>36.</strong></td>
    <td colspan="4" class="lbl text-xs">Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?</td>
    <td colspan="6" class="q-answer">
        <div class="cb-item-sm">{!! yN($q?->q36) !!}</div>
        <div class="q-detail">If YES, give details: {{ $q?->q36_details ?? '' }}</div>
    </td>
    <td class="lbl"></td>
</tr>
<tr class="row-h15">
    <td colspan="2" class="lbl"></td>
    <td colspan="4" class="lbl text-xs">If YES, give details:</td>
    <td colspan="6" class="lbl"></td>
    <td class="lbl"></td>
</tr>

{{-- Q37 --}}
<tr class="row-h14">
    <td colspan="2" rowspan="3" class="lbl text-center" style="vertical-align:middle;font-size:8pt;"><strong>37.</strong></td>
    <td colspan="4" class="lbl text-xs">Have you ever been separated from the service in any of the following modes: resignation, retirement,</td>
    <td colspan="6" rowspan="3" class="q-answer">
        <div class="cb-item-sm">{!! yN($q?->q38) !!}</div>
        <div class="q-detail">If YES, give details: {{ $q?->q38_details ?? '' }}</div>
    </td>
    <td rowspan="3" class="lbl"></td>
</tr>
<tr class="row-h12"><td colspan="4" class="lbl text-xs">dropped from the rolls, dismissal, termination, end of term, finished contract or phased out</td></tr>
<tr class="row-h12"><td colspan="4" class="lbl text-xs">(abolition) in the public or private sector?</td></tr>
<tr class="row-h12">
    <td colspan="2" class="lbl"></td>
    <td colspan="4" class="lbl text-xs">If YES, give details:</td>
    <td colspan="6" class="lbl"></td>
    <td class="lbl"></td>
</tr>

{{-- Q38 --}}
<tr class="row-h18">
    <td colspan="2" rowspan="2" class="lbl text-center" style="vertical-align:middle;font-size:8pt;"><strong>38.</strong></td>
    <td colspan="4" class="lbl text-xs">a. Have you ever been a candidate in a national or local election held within the last year (except Barangay election)?</td>
    <td colspan="6" rowspan="3" class="q-answer">
        <div class="cb-item-sm">{!! yN($q?->q37_a) !!}</div>
        <div class="q-detail cb-item-sm">If YES, give details: {{ $q?->q37_a_details ?? '' }}</div>
        <div class="cb-item-sm">{!! yN($q?->q37_b) !!}</div>
        <div class="q-detail">If YES, give details: {{ $q?->q37_b_details ?? '' }}</div>
    </td>
    <td rowspan="3" class="lbl"></td>
</tr>
<tr class="row-h12"><td colspan="4" class="lbl text-xs">If YES, give details:</td></tr>
<tr class="row-h14">
    <td colspan="2" class="lbl"></td>
    <td colspan="4" class="lbl text-xs">b. Have you resigned from the government service during the three (3)-month period before the last election to promote/actively campaign for a national or local candidate?</td>
</tr>

{{-- Q39 --}}
<tr class="row-h18">
    <td colspan="2" class="lbl text-center" style="font-size:8pt;"><strong>39.</strong></td>
    <td colspan="4" class="lbl text-xs">Have you acquired the status of an immigrant or permanent resident of another country?</td>
    <td colspan="6" class="q-answer">
        <div class="cb-item-sm">{!! yN($q?->q39) !!}</div>
        <div class="q-detail">If YES, give details (country): {{ $q?->q39_details ?? '' }}</div>
    </td>
    <td class="lbl"></td>
</tr>
<tr class="row-h12">
    <td colspan="2" class="lbl"></td>
    <td colspan="4" class="lbl text-xs">If YES, give details (country):</td>
    <td colspan="6" class="lbl"></td>
    <td class="lbl"></td>
</tr>

{{-- Q40 --}}
<tr class="row-h41">
    <td colspan="2" class="lbl text-center lbl-top" style="font-size:8pt;padding-top:4px;"><strong>40.</strong></td>
    <td colspan="4" class="lbl text-xs lbl-top">
        Pursuant to: (a) Indigenous People's Act (RA 8371); (b) Magna Carta for Disabled Persons (RA 7277); and (c) Solo Parents Welfare Act of 2000 (RA 8972), please answer the following items:
    </td>
    <td colspan="6" class="q-answer" rowspan="6">
        <div class="cb-item-sm">{!! yN($q?->q40_a) !!}</div>
        <div class="q-detail cb-item-sm">If YES, please specify: {{ $q?->q40_a_details ?? '' }}</div>
        <div class="cb-item-sm">{!! yN($q?->q40_b) !!}</div>
        <div class="q-detail cb-item-sm">If YES, please specify ID No: {{ $q?->q40_b_details ?? '' }}</div>
        <div class="cb-item-sm">{!! yN($q?->q40_c) !!}</div>
        <div class="q-detail">If YES, please specify ID No: {{ $q?->q40_c_details ?? '' }}</div>
    </td>
    <td rowspan="6" class="lbl"></td>
</tr>
<tr class="row-h13"><td colspan="2" class="lbl text-xs"><strong>a.</strong></td><td colspan="4" class="lbl text-xs">Are you a member of any indigenous group?</td></tr>
<tr class="row-h15"><td colspan="2" class="lbl text-xs"></td><td colspan="4" class="lbl text-xs">If YES, please specify:</td></tr>
<tr class="row-h13"><td colspan="2" class="lbl text-xs"><strong>b.</strong></td><td colspan="4" class="lbl text-xs">Are you a person with disability?</td></tr>
<tr class="row-h15"><td colspan="2" class="lbl text-xs"></td><td colspan="4" class="lbl text-xs">If YES, please specify ID No:</td></tr>
<tr class="row-h13"><td colspan="2" class="lbl text-xs"><strong>c.</strong></td><td colspan="4" class="lbl text-xs">Are you a solo parent?</td></tr>
<tr class="row-h12">
    <td colspan="2" class="lbl"></td>
    <td colspan="4" class="lbl text-xs">If YES, please specify ID No:</td>
    <td colspan="6" class="lbl"></td>
    <td class="lbl"></td>
</tr>

{{-- References + Photo --}}
<tr class="row-h23">
    <td colspan="5" class="lbl text-xs lbl-top">
        <strong>41.</strong> REFERENCES <span class="text-red" style="font-weight:normal;">(Person not related by consanguinity or affinity to applicant/appointee)</span>
    </td>
    <td class="lbl text-center text-xs">OFFICE / RESIDENTIAL ADDRESS</td>
    <td colspan="5" class="lbl text-center text-xs">CONTACT NO. AND/OR EMAIL</td>
    <td rowspan="5" colspan="2" class="text-center" style="vertical-align:top;padding:3px;">
        <div class="photo-box">
            @if(!empty($govId?->passport_photo))
                <img src="{{ storage_path('app/public/' . $govId->passport_photo) }}">
            @else
                <span class="text-xxs" style="color:#555;padding:4px;">ID picture taken within the last 6 months<br>4.5cm × 3.5cm (passport size)<br><br>Computer generated or photocopied picture is not acceptable</span>
            @endif
        </div>
        <div class="photo-lbl">PHOTO</div>
        <div class="thumb-box"></div>
        <div class="thumb-lbl">Right Thumbmark</div>
    </td>
</tr>
@for($i = 0; $i < 3; $i++)
@php $ref = $refs[$i] ?? null; @endphp
<tr class="row-h24">
    <td colspan="5" class="val text-xs">{{ $ref?->name ?? '' }}</td>
    <td class="val text-xs">{{ $ref?->address ?? '' }}</td>
    <td colspan="5" class="val text-xs">{{ $ref?->telephone ?? '' }}</td>
</tr>
@endfor

{{-- Declaration --}}
<tr class="row-h39">
    <td colspan="11" class="lbl text-xs lbl-top" style="text-align:justify;padding:4px;">
        <strong>42.</strong> I declare under oath that I have personally accomplished this Personal Data Sheet which is a true, correct and complete statement pursuant to the provisions of pertinent laws, rules and regulations of the Republic of the Philippines. I authorize the agency head/authorized representative to verify/validate the contents stated herein. I agree that any misrepresentation made in this document and its attachments shall cause the filing of administrative/criminal case/s against me.
    </td>
    <td colspan="2" class="lbl"></td>
</tr>

{{-- Gov't ID + Signature + Thumbmark --}}
<tr class="row-h7"><td colspan="13" class="border-none" style="padding:0;"></td></tr>
<tr class="row-h32">
    <td colspan="5" rowspan="6" class="gov-id-block">
        <div class="gov-id-divider">
            Government Issued ID <span class="text-xxs">(i.e. Passport, GSIS, SSS, PRC, Driver's License, etc.)</span><br>
            <em>PLEASE INDICATE ID Number and Date of Issuance</em>
        </div>
        <div class="gov-id-row">Government Issued ID: {{ $govId?->id_type ?? '' }}</div>
        <div class="gov-id-row">ID/License/Passport No.: {{ $govId?->id_number ?? '' }}</div>
        <div class="gov-id-last">Date/Place of Issuance: {{ ($govId?->date_of_issuance ?? '') . ($govId?->place_of_issuance ? ' / ' . $govId->place_of_issuance : '') }}</div>
    </td>
    <td colspan="5" rowspan="2" class="sig-center">
        <em class="text-xs">(wet signature/e-signature/digital certificate)</em>
        @if(!empty($govId?->signature))
            <br><img src="{{ storage_path('app/public/' . $govId->signature) }}" style="max-height:40px;">
        @endif
    </td>
    <td colspan="3" rowspan="6" class="border-2 text-center" style="vertical-align:middle;padding:4px;">
        <div class="thumb-box-lg"></div>
        <div class="thumb-lbl">Right Thumbmark</div>
    </td>
</tr>
<tr class="row-h8"></tr>
<tr class="row-h12">
    <td colspan="5" class="lbl text-center border-2 text-xs">Signature (Sign inside the box)</td>
</tr>
<tr class="row-h10">
    <td colspan="5" class="sig-center text-sm">{{ $govId?->date_accomplished ?? '' }}</td>
</tr>
<tr class="row-h8"></tr>
<tr class="row-h12">
    <td colspan="5" class="lbl text-center border-2 text-xs">Date Accomplished</td>
</tr>

{{-- Subscribed and Sworn --}}
<tr class="row-h28">
    <td colspan="13" class="decl-cell">
        <strong>SUBSCRIBED AND SWORN</strong> to before me this ______________________________, affiant exhibiting his/her validly issued government ID as indicated above.
    </td>
</tr>
<tr class="row-h53">
    <td colspan="13" class="subscribed-cell">
        <div class="notary-line">
            <span class="text-xs">(wet signature/e-signature/digital certificate except for notarization)</span>
        </div><br>
        <span class="text-xs"><strong>Person Administering Oath</strong></span>
    </td>
</tr>
<tr class="row-h18">
    <td colspan="13" class="border-2 text-center text-sm bold">
        CS FORM 212 (Revised 2025), Page 4 of 4
    </td>
</tr>
</table>
</div>

</body>
</html>