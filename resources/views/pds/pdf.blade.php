<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CS Form No. 212 – Personal Data Sheet</title>
{{-- Tailwind CDN — Browsershot (Chromium) loads this before rendering --}}
<script src="https://cdn.tailwindcss.com"></script>
<script>
    tailwind.config = {
        theme: {
            extend: {
                fontFamily: {
                    'narrow': ['"Arial Narrow"', 'Arial', 'sans-serif'],
                },
            }
        }
    }
</script>
<style>
    /* Base resets for pixel-perfect PDF layout */
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @font-face {
        font-family: 'Arial Narrow';
        src: local('Arial Narrow'), local('Arial-Narrow');
        font-stretch: condensed;
    }

    body { font-family: Arial, Helvetica, sans-serif; font-size: 7pt; color: #000; background: #fff; }

    /* Page dimensions: 8.5in × 13in with padding */
    .page {
        width: 8.5in;
        min-height: 13in;
        padding: 0.3in 0.3in 0.2in 0.3in;
        page-break-after: always;
        background: #fff;
        position: relative;
    }

    /* Table cells need specific sizing for PDF accuracy */
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

    /* Checkbox simulation */
    .cb { display: inline-block; width: 8px; height: 8px; border: 1px solid #000; margin-right: 2px; vertical-align: middle; background: #fff; }
    .cb-on { background: #000; }
    .cb-on::after { content: "✓"; color: #fff; font-size: 5pt; display: block; text-align: center; line-height: 8px; }

    /* Photo box */
    .photo-box { border: 1px solid #000; width: 110px; height: 140px; margin: 2px auto; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .photo-box img { width: 100%; height: 100%; object-fit: cover; }

    @page { size: 8.5in 13in; margin: 0; }
</style>
</head>
<body class="font-sans text-black bg-white">

@php
    $pi       = $pds['personal']      ?? null;
    $fam      = $pds['family']        ?? null;
    $children = $pds['children']      ?? collect();
    $eduList  = collect($pds['education'] ?? []);
    $govId    = $pds['government_id'] ?? null;

    $dob = $pi?->date_of_birth
        ? \Carbon\Carbon::parse($pi->date_of_birth)->format('d/m/Y') : '';

    $isFil   = !$pi || $pi->citizenship === 'Filipino' || !$pi->citizenship;
    $isDual  = $pi?->citizenship === 'Dual Citizenship';
    $byBirth = $isDual && ($pi?->citizenship_type === 'by_birth');
    $byNat   = $isDual && ($pi?->citizenship_type === 'by_naturalization');

    $cs     = $pi?->civil_status ?? '';
    $csList = ['Single','Married','Widow/er','Separated'];

    function chName($ch, $i)  { $c = $ch[$i] ?? null; return $c ? strtoupper($c->full_name ?? '') : ''; }
    function chDob($ch, $i)   {
        $c = $ch[$i] ?? null;
        if (!$c || !$c->date_of_birth) return '';
        return is_string($c->date_of_birth) ? $c->date_of_birth : \Carbon\Carbon::parse($c->date_of_birth)->format('m/d/Y');
    }
    function eduF($list, $level, $field) { $e = $list->firstWhere('level', $level); return $e?->$field ?? ''; }
    function pDate($v) {
        if (!$v) return '';
        return is_string($v) ? $v : \Carbon\Carbon::parse($v)->format('m/d/Y');
    }
    function cb($on) { return '<span class="cb ' . ($on ? 'cb-on' : '') . '"></span>'; }
    function yN($v) { return cb($v) . ' YES &nbsp; ' . cb(!$v) . ' NO'; }

    // Tailwind utilities
    $lbl  = 'bg-gray-100 text-[7pt] uppercase align-middle';         // label cell
    $val  = 'align-middle text-[7.5pt]';                               // value cell
    $sectionHeader  = 'bg-neutral-400 text-white font-narrow font-black italic text-[10.5pt] uppercase tracking-wide border-2 border-black';
    $note = 'bg-gray-300 text-center italic text-[7pt] text-red-700 font-bold border-2 border-black'; // continue note
    $sig  = 'border-2 border-black align-middle text-center text-[6.5pt] italic';
@endphp

{{-- ══════════════════════════════════════════════════ --}}
{{-- PAGE 1 – Personal Info / Family / Education        --}}
{{-- ══════════════════════════════════════════════════ --}}
<div class="page">

    {{-- Header --}}
    <table class="border-2 border-b-0 border-black font-">
        
        <tr>
            <td class="relative p-0.5 text-[6.5pt]">
                <p class="absolute italic font-semibold text-[9pt]">CS Form No. 212<span class="block font-normal text-[8pt]">Revised 2025 <span/></p>
                <p class="text-center text-[22pt] font-black tracking-wide my-3">PERSONAL DATA SHEET</p>
                <p class="text-[7.5pt] italic font-semibold"><span class="uppercase">WARNING:</span> Any misrepresentation made in the Personal Data Sheet and the Work Experience Sheet shall cause the filing of administrative/criminal case/s against the person concerned.</p>
                <p class="text-[7.5pt] font-semibold italic">READ THE ATTACHED GUIDE TO FILLING OUT THE PERSONAL DATA SHEET (PDS) BEFORE ACCOMPLISHING THE PDS FORM.</p>
                <p class="text-[7.5pt] font-light tracking-tight">Print legibly if accomplished through own handwriting. Tick appropriate boxes ({!! cb(false) !!}) and use separate sheet if necessary. Indicate N/A if not applicable. <span class="font-semibold text-[8pt]">DO NOT ABBREVIATE.</span></p>
            </td>
        </tr>
       
    </table>

    <table class="border-2 border-black">
    <colgroup>
        <col style="width:2.5%"><col style="width:10%"><col style="width:5%"><col style="width:12%">
        <col style="width:5%"><col style="width:4.5%"><col style="width:7%"><col style="width:7.5%">
        <col style="width:7.5%"><col style="width:6%"><col style="width:5%"><col style="width:8%">
        <col style="width:7%"><col style="width:7%">
    </colgroup>

    {{-- Section I Header --}}
    <tr><td colspan="18" class="{{ $sectionHeader }}">I. PERSONAL INFORMATION</td></tr>

    {{-- Name rows --}}
    <tr style="height:22pt;">
        <td colspan="3" class="{{ $lbl }} px-1"><strong>1.</strong> SURNAME</td>
        <td colspan="15" class="font-bold text-[9pt] align-middle px-1">{{ strtoupper($user->last_name ?? '') }}</td>
    </tr>
    <tr style="height:22pt;">
        <td colspan="3" class="{{ $lbl }} pl-3 px-1">FIRST NAME</td>
        <td colspan="8" class="font-bold text-[9pt] align-middle px-1">{{ strtoupper($user->first_name ?? '') }}</td>
        <td colspan="7" class="font-bold align-middle px-1">
            <span>NAME EXTENSION (JR., SR)</span>
            <span>{{ strtoupper($user->name_ext ?? '') }}</span>
        </td>
    </tr>
    <tr style="height:21pt;border-bottom:2px solid #000;">
        <td colspan="3" class="{{ $lbl }} pl-3 px-1">MIDDLE NAME</td>
        <td colspan="15" class="font-bold text-[9pt] align-middle px-1">{{ strtoupper($user->middle_name ?? '') }}</td>
    </tr>

    {{-- DOB + Citizenship --}}
    <tr style="height:24pt;">
        <td colspan="2" class="{{ $lbl }} px-1"><strong>3.</strong> DATE OF BIRTH<br><span class="italic">(dd/mm/yyyy)</span></td>
        <td colspan="4" class="{{ $val }} px-1">{{ $dob }}</td>
        <td colspan="3" rowspan="3" class="{{ $lbl }} text-center align-middle text-[6pt]">
            16. CITIZENSHIP<br><br><span class="italic normal-case">If holder of dual citizenship,<br>please indicate the details.</span>
        </td>
        <td colspan="5" rowspan="3" class="align-top p-1 text-[7pt]">
            <div class="mb-1">{!! cb($isFil) !!} Filipino &nbsp;&nbsp; {!! cb($isDual) !!} Dual Citizenship</div>
            <div class="mb-1 pl-4">{!! cb($byBirth) !!} by birth &nbsp; {!! cb($byNat) !!} by naturalization</div>
            <div class="text-[6pt]">Please indicate country:<br><span class="text-[7pt]">{{ $isDual ? ($pi?->citizenship_country ?? '') : '' }}</span></div>
        </td>
    </tr>
    <tr style="height:24pt;">
        <td colspan="2" class="{{ $lbl }} px-1"><strong>4.</strong> PLACE OF BIRTH</td>
        <td colspan="4" class="{{ $val }} px-1">{{ $pi?->birth_place ?? '' }}</td>
    </tr>
    <tr style="height:15pt;">
        <td colspan="2" class="{{ $lbl }} px-1"><strong>5.</strong> SEX AT BIRTH</td>
        <td colspan="4" class="align-middle px-1 text-[7pt]">
            {!! cb($pi?->sex === 'Male') !!} Male &nbsp; {!! cb($pi?->sex === 'Female') !!} Female
        </td>
    </tr>

    {{-- Civil Status + Residential Address --}}
    <tr style="height:15pt;">
        <td colspan="2" class="{{ $lbl }} align-top px-1"><strong>6.</strong> CIVIL STATUS</td>
        <td colspan="4" rowspan="4" class="align-top p-1 text-[7pt]">
            @foreach($csList as $s)
            <div class="mb-0.5">{!! cb($cs === $s) !!} {{ $s }}</div>
            @endforeach
            <div>{!! cb(!in_array($cs,$csList) && $cs) !!} Others: <span class="text-[6.5pt]">{{ !in_array($cs,$csList) ? $cs : '' }}</span></div>
        </td>
        <td colspan="3" rowspan="6" class="{{ $lbl }} text-center align-middle">17. RESIDENTIAL<br>ADDRESS<br><br><br>ZIPCODE</td>
        <td colspan="5" rowspan="6" class="align-top p-1 text-[6.5pt]">
            @foreach([['House/Block/Lot No.',$pi?->res_house_no],['Street',$pi?->res_street],['Subdivision/Village',$pi?->res_subdivision],['Barangay',$pi?->res_barangay],['City/Municipality',$pi?->res_city],['Province',$pi?->res_province]] as [$lbl2,$val2])
            <div class="border-b border-black pb-px mb-px"><span class="text-[6pt]">{{ $lbl2 }}</span><br>{{ $val2 ?? '' }}</div>
            @endforeach
            <div class="text-right text-[6pt]">ZIP CODE: {{ $pi?->res_zipcode ?? '' }}</div>
        </td>
    </tr>
    <tr style="height:15pt;"><td colspan="2" class="{{ $lbl }} px-1"><strong>7.</strong> HEIGHT (m)</td></tr>
    <tr style="height:8pt;"><td colspan="2" class="{{ $lbl }}"></td><td colspan="4" class="{{ $val }} px-1">{{ $pi?->height ?? '' }}</td></tr>
    <tr style="height:22pt;"><td colspan="2" class="{{ $lbl }} px-1"><strong>8.</strong> WEIGHT (kg)</td></tr>
    <tr style="height:15pt;">
        <td colspan="2" class="{{ $lbl }} px-1"><strong>9.</strong> BLOOD TYPE</td>
        <td colspan="4" class="{{ $val }} px-1">{{ $pi?->weight ?? '' }}</td>
    </tr>
    <tr style="height:15pt;">
        <td colspan="2" class="{{ $lbl }}"></td>
        <td colspan="4" class="{{ $val }} px-1">{{ $pi?->blood_type ?? '' }}</td>
    </tr>

    {{-- Gov't IDs + Permanent Address --}}
    @php
        $ids = [
            ['10. UMID ID NO.',        $pi?->umid_number ?? $pi?->gsis_number],
            ['11. PAG-IBIG ID NO.',    $pi?->pagibig_number],
            ['12. PHILHEALTH NO.',     $pi?->philhealth_number],
            ['13. PhilSys Number (PSN):', $pi?->philsys_number],
            ['14. TIN NO.',            $pi?->tin_number],
        ];
    @endphp
    @foreach($ids as $idx => [$idlbl, $idval])
    <tr style="height:{{ $idx >= 3 ? '24' : '15' }}pt;">
        <td colspan="2" class="{{ $lbl }} text-[6pt] px-1"><strong>{{ $idlbl }}</strong></td>
        <td colspan="4" class="{{ $val }} px-1">{{ $idval ?? '' }}</td>
        @if($loop->first)
        <td colspan="3" rowspan="5" class="{{ $lbl }} text-center align-middle">18. PERMANENT<br>ADDRESS<br><br><br>ZIPCODE</td>
        <td colspan="5" rowspan="5" class="align-top p-1 text-[6.5pt]">
            @foreach([['House/Block/Lot No.',$pi?->perm_house_no],['Street',$pi?->perm_street],['Subdivision/Village',$pi?->perm_subdivision],['Barangay',$pi?->perm_barangay],['City/Municipality',$pi?->perm_city],['Province',$pi?->perm_province]] as [$lbl3,$val3])
            <div class="border-b border-black pb-px mb-px"><span class="text-[6pt]">{{ $lbl3 }}</span><br>{{ $val3 ?? '' }}</div>
            @endforeach
            <div class="text-right text-[6pt]">ZIP CODE: {{ $pi?->perm_zipcode ?? '' }}</div>
        </td>
        @endif
    </tr>
    @endforeach

    <tr style="height:24pt;">
        <td colspan="6" class="{{ $lbl }} text-[6pt] px-1"><strong>15. AGENCY EMPLOYEE NO.</strong> &nbsp; {{ $pi?->agency_employee_no ?? $ep?->employee_number ?? '' }}</td>
        <td colspan="3" class="{{ $lbl }} text-[6pt] px-1">19. TELEPHONE NO.</td>
        <td colspan="5" class="{{ $val }} px-1">{{ $pi?->telephone ?? '' }}</td>
    </tr>
    <tr style="height:24pt;">
        <td colspan="6" class="{{ $lbl }} text-[6pt] px-1">20. MOBILE NO. &nbsp; {{ $pi?->mobile_number ?? '' }}</td>
        <td colspan="3" class="{{ $lbl }} text-[6pt] px-1">21. E-MAIL ADDRESS</td>
        <td colspan="5" class="align-middle text-[6.5pt] px-1">{{ $pi?->email ?? $user->email ?? '' }}</td>
    </tr>

    {{-- Section II: Family Background --}}
    <tr><td colspan="14" class="{{ $sectionHeader }}">II. FAMILY BACKGROUND</td></tr>

    <tr style="height:21pt;">
        <td colspan="2" class="{{ $lbl }} text-[6pt] px-1"><strong>22.</strong> SPOUSE'S SURNAME</td>
        <td colspan="5" class="{{ $val }} px-1">{{ strtoupper($fam?->spouse_surname ?? '') }}</td>
        <td colspan="4" class="{{ $lbl }} text-center text-[6pt]"><strong>23. NAME of CHILDREN</strong><br><em class="normal-case">(Write full name and list all)</em></td>
        <td colspan="3" class="{{ $lbl }} text-center text-[6pt]">DATE OF BIRTH<br><em class="normal-case">(mm/dd/yyyy)</em></td>
    </tr>
    <tr style="height:21pt;">
        <td colspan="2" class="{{ $lbl }} pl-2 text-[6pt]">FIRST NAME</td>
        <td colspan="3" class="{{ $val }} px-1">{{ strtoupper($fam?->spouse_first_name ?? '') }}</td>
        <td colspan="2" class="{{ $lbl }} text-[6pt]">NAME EXTENSION</td>
        <td colspan="4" class="{{ $val }} text-[6.5pt] px-1">{{ chName($children, 0) }}</td>
        <td colspan="3" class="{{ $val }} text-center text-[6.5pt]">{{ chDob($children, 0) }}</td>
    </tr>

    @php
        $spouseRows = [
            ['MIDDLE NAME',          'spouse_middle_name', true, 1],
            ['OCCUPATION',           'spouse_occupation',  false, 2],
            ['EMPLOYER/BUSINESS NAME','spouse_employer',   false, 3],
            ['BUSINESS ADDRESS',     'spouse_business_address', false, 4],
            ['TELEPHONE NO.',        'spouse_telephone',   false, 5],
        ];
    @endphp
    @foreach($spouseRows as [$rowLbl, $field, $indent, $chI])
    <tr style="height:21pt;">
        <td colspan="2" class="{{ $lbl }} text-[6pt] {{ $indent ? 'pl-2' : 'px-1' }}">{{ $rowLbl }}</td>
        <td colspan="5" class="{{ $val }} text-[6.5pt] px-1">{{ strtoupper($fam?->$field ?? '') }}</td>
        <td colspan="4" class="{{ $val }} text-[6.5pt] px-1">{{ chName($children, $chI) }}</td>
        <td colspan="3" class="{{ $val }} text-center text-[6.5pt]">{{ chDob($children, $chI) }}</td>
    </tr>
    @endforeach

    {{-- Father --}}
    <tr style="height:21pt;">
        <td colspan="2" class="{{ $lbl }} text-[6pt] px-1"><strong>24.</strong> FATHER'S SURNAME</td>
        <td colspan="5" class="{{ $val }} px-1">{{ strtoupper($fam?->father_surname ?? '') }}</td>
        <td colspan="4" class="{{ $val }} text-[6.5pt] px-1">{{ chName($children, 6) }}</td>
        <td colspan="3" class="{{ $val }} text-center text-[6.5pt]">{{ chDob($children, 6) }}</td>
    </tr>
    <tr style="height:21pt;">
        <td colspan="2" class="{{ $lbl }} pl-2 text-[6pt]">FIRST NAME</td>
        <td colspan="3" class="{{ $val }} px-1">{{ strtoupper($fam?->father_first_name ?? '') }}</td>
        <td colspan="2" class="{{ $lbl }} text-[6pt]">NAME EXTENSION</td>
        <td colspan="4" class="{{ $val }} text-[6.5pt] px-1">{{ chName($children, 7) }}</td>
        <td colspan="3" class="{{ $val }} text-center text-[6.5pt]">{{ chDob($children, 7) }}</td>
    </tr>
    <tr style="height:21pt;">
        <td colspan="2" class="{{ $lbl }} pl-2 text-[6pt]">MIDDLE NAME</td>
        <td colspan="5" class="{{ $val }} px-1">{{ strtoupper($fam?->father_middle_name ?? '') }}</td>
        <td colspan="4" class="{{ $val }} text-[6.5pt] px-1">{{ chName($children, 8) }}</td>
        <td colspan="3" class="{{ $val }} text-center text-[6.5pt]">{{ chDob($children, 8) }}</td>
    </tr>

    {{-- Mother --}}
    <tr style="height:21pt;">
        <td colspan="2" class="{{ $lbl }} text-[6pt] px-1"><strong>25.</strong> MOTHER'S MAIDEN NAME</td>
        <td colspan="5"></td>
        <td colspan="4" class="{{ $val }} text-[6.5pt] px-1">{{ chName($children, 9) }}</td>
        <td colspan="3" class="{{ $val }} text-center text-[6.5pt]">{{ chDob($children, 9) }}</td>
    </tr>
    @foreach([['SURNAME','mother_surname',false,10],['FIRST NAME','mother_first_name',false,11],['MIDDLE NAME','mother_middle_name',true,null]] as [$mLbl,$mField,$mLast,$mChI])
    <tr style="height:21pt;">
        <td colspan="2" class="{{ $lbl }} pl-2 text-[6pt]">{{ $mLbl }}</td>
        @if(!$mLast)
        <td colspan="5" class="{{ $val }} px-1">{{ strtoupper($fam?->$mField ?? '') }}</td>
        <td colspan="4" class="{{ $val }} text-[6.5pt] px-1">{{ chName($children, $mChI) }}</td>
        <td colspan="3" class="{{ $val }} text-center text-[6.5pt]">{{ chDob($children, $mChI) }}</td>
        @else
        {{-- Mother middle name: last child col replaced by continue note --}}
        <td colspan="5" class="{{ $val }} px-1">{{ strtoupper($fam?->$mField ?? '') }}</td>
        <td colspan="7" class="{{ $note }}">(Continue on separate sheet if necessary)</td>
        @endif
    </tr>
    @endforeach

    {{-- Section III: Education --}}
    <tr><td colspan="14" class="{{ $sectionHeader }}">III. EDUCATIONAL BACKGROUND</td></tr>
    <tr style="height:14pt;" class="text-center">
        <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt]"><strong>26. LEVEL</strong></td>
        <td colspan="3" rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt]">NAME OF SCHOOL<br><em class="normal-case">(Write in full)</em></td>
        <td colspan="3" rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt]">BASIC EDUCATION/<br>DEGREE/COURSE<br><em class="normal-case">(Write in full)</em></td>
        <td colspan="2" class="{{ $lbl }} text-[5.5pt]">PERIOD OF ATTENDANCE<br><em class="normal-case">(mm/dd/yyyy)</em></td>
        <td rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt]">HIGHEST<br>LEVEL/<br>UNITS<br>EARNED</td>
        <td rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt]">YEAR<br>GRADUATED</td>
        <td rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt]">SCHOLARSHIP/<br>ACADEMIC<br>HONORS</td>
    </tr>
    <tr style="height:14pt;" class="text-center">
        <td class="{{ $lbl }} text-[6pt]">From</td>
        <td class="{{ $lbl }} text-[6pt]">To</td>
    </tr>
    @foreach([['ELEMENTARY','Elementary'],['SECONDARY','Secondary'],['VOCATIONAL / TRADE COURSE','Vocational'],['COLLEGE','College'],['GRADUATE STUDIES','Graduate Studies']] as [$eLabel,$eKey])
    <tr style="height:28pt;">
        <td colspan="2" class="{{ $lbl }} text-[6pt] px-1">{{ $eLabel }}</td>
        <td colspan="3" class="{{ $val }} text-[6.5pt] px-1">{{ eduF($eduList, $eKey, 'school_name') }}</td>
        <td colspan="3" class="{{ $val }} text-[6.5pt] px-1">{{ eduF($eduList, $eKey, 'course') }}</td>
        <td class="{{ $val }} text-center text-[6.5pt]">{{ eduF($eduList, $eKey, 'period_from') }}</td>
        <td class="{{ $val }} text-center text-[6.5pt]">{{ eduF($eduList, $eKey, 'period_to') }}</td>
        <td class="{{ $val }} text-center text-[6.5pt]">{{ eduF($eduList, $eKey, 'highest_level') }}</td>
        <td class="{{ $val }} text-center text-[6.5pt]">{{ eduF($eduList, $eKey, 'year_graduated') }}</td>
        <td class="{{ $val }} text-center text-[5.5pt]">{{ eduF($eduList, $eKey, 'honors_received') }}</td>
    </tr>
    @endforeach
    <tr><td colspan="14" class="{{ $note }}">(Continue on separate sheet if necessary)</td></tr>

    {{-- Page 1 Signature --}}
    <tr style="height:27pt;">
        <td colspan="2" class="{{ $lbl }} text-center border-2 border-black align-middle">SIGNATURE</td>
        <td colspan="7" class="{{ $sig }}">
            <em>(wet signature/e-signature/digital certificate)</em>
            @if(!empty($govId?->signature))
                <br><img src="{{ storage_path('app/public/' . $govId->signature) }}" class="max-h-9 max-w-full mx-auto">
            @endif
        </td>
        <td colspan="2" class="{{ $lbl }} text-center border-2 border-black align-middle">DATE</td>
        <td colspan="3" class="border-2 border-black align-middle px-1">{{ $govId?->date_accomplished ?? '' }}</td>
    </tr>
    </table>
    <p class="text-right italic text-[6.5pt] mt-0.5">CS FORM 212 (Revised 2025), Page 1 of 4</p>
</div>

{{-- PAGE 2 – Eligibility + Work Experience --}}

<div class="page">
    <table class="border-2 border-black">
        <colgroup>
            <col style="width:3%"><col style="width:5.5%"><col style="width:8.5%"><col style="width:9%">
            <col style="width:7%"><col style="width:11.5%"><col style="width:6%"><col style="width:16%">
            <col style="width:8%"><col style="width:9.5%"><col style="width:10%">
        </colgroup>

        <tr><td colspan="11" class="{{ $sectionHeader }}">IV. CIVIL SERVICE ELIGIBILITY</td></tr>
        <tr style="height:15pt;" class="text-center">
            <td colspan="4" rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt]">
                <strong>27.</strong> CES/CSEE/CAREER SERVICE/RA 1080 (BOARD/BAR)/<br>UNDER SPECIAL LAWS/BARANGAY ELIGIBILITY/DRIVER'S LICENSE
            </td>
            <td rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt]">RATING<br><em class="normal-case">(if applicable)</em></td>
            <td rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt]">DATE OF EXAM/<br>CONFERMENT</td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt]">PLACE OF EXAM/<br>CONFERMENT</td>
            <td colspan="3" class="{{ $lbl }} text-[5.5pt]">LICENSE (if applicable)</td>
        </tr>
        <tr style="height:25pt;" class="text-center">
            <td class="{{ $lbl }} text-[5.5pt]">NUMBER</td>
            <td colspan="2" class="{{ $lbl }} text-[5.5pt]">Valid Until</td>
        </tr>
        @php $eligibilities = $pds['eligibilities'] ?? []; @endphp
        @for($i = 0; $i < 8; $i++)
        @php $el = $eligibilities[$i] ?? null; @endphp
        <tr style="height:27pt;">
            <td colspan="4" class="{{ $val }} text-[6.5pt] px-1">{{ $el?->career_service ?? '' }}</td>
            <td class="{{ $val }} text-center text-[6.5pt]">{{ $el?->rating ?? '' }}</td>
            <td class="{{ $val }} text-center text-[6.5pt]">{{ pDate($el?->date_of_examination) }}</td>
            <td colspan="2" class="{{ $val }} text-[6.5pt] px-1">{{ $el?->place_of_examination ?? '' }}</td>
            <td class="{{ $val }} text-center text-[6.5pt]">{{ $el?->license_number ?? '' }}</td>
            <td colspan="2" class="{{ $val }} text-center text-[6.5pt]">{{ pDate($el?->license_validity) }}</td>
        </tr>
        @endfor
        <tr><td colspan="11" class="{{ $note }}">(Continue on separate sheet if necessary)</td></tr>

        {{-- Work Experience --}}
        <tr>
            <td colspan="11" class="{{ $sectionHeader }}">
                V. WORK EXPERIENCE<br>
                <span class="text-[6pt] font-normal">(Include private employment. Start from your recent work.)</span>
            </td>
        </tr>
        <tr style="height:18pt;" class="text-center">
            <td colspan="2" rowspan="3" class="{{ $lbl }} align-middle text-[5.5pt]"><strong>28.</strong> INCLUSIVE DATES<br><em class="normal-case">(mm/dd/yyyy)</em></td>
            <td colspan="2" rowspan="3" class="{{ $lbl }} align-middle text-[5.5pt]">POSITION TITLE<br><em class="normal-case">(Write in full)</em></td>
            <td colspan="3" rowspan="3" class="{{ $lbl }} align-middle text-[5.5pt]">DEPARTMENT/AGENCY/OFFICE/COMPANY</td>
            <td rowspan="3" class="{{ $lbl }} align-middle text-[5.5pt]">STATUS OF APPOINTMENT</td>
            <td colspan="3" rowspan="3" class="{{ $lbl }} align-middle text-[5.5pt]">GOV'T SERVICE (Y/N)</td>
        </tr>
        <tr style="height:18pt;"></tr>
        <tr style="height:18pt;" class="text-center"></tr>
        <tr style="height:15pt;" class="text-center">
            <td class="{{ $lbl }} text-[6pt]">From</td>
            <td class="{{ $lbl }} text-[6pt]">To</td>
            <td colspan="9" class="{{ $lbl }}"></td>
        </tr>
        @php $workExp = $pds['work_experience'] ?? []; @endphp
        @for($i = 0; $i < 28; $i++)
        @php $we = $workExp[$i] ?? null; @endphp
        <tr style="height:24pt;">
            <td class="{{ $val }} text-center text-[6.5pt]">{{ pDate($we?->date_from) }}</td>
            <td class="{{ $val }} text-center text-[6.5pt]">@if($we?->is_present)<em>Present</em>@else{{ pDate($we?->date_to) }}@endif</td>
            <td colspan="2" class="{{ $val }} text-[6.5pt] px-1">{{ $we?->position_title ?? '' }}</td>
            <td colspan="3" class="{{ $val }} text-[6.5pt] px-1">{{ $we?->department ?? '' }}</td>
            <td class="{{ $val }} text-[6.5pt] px-1">{{ $we?->status_of_appointment ?? '' }}</td>
            <td colspan="3" class="{{ $val }} text-center text-[6.5pt]">{{ $we ? ($we->is_government_service ? 'Y' : 'N') : '' }}</td>
        </tr>
        @endfor
        <tr><td colspan="11" class="{{ $note }}">(Continue on separate sheet if necessary)</td></tr>

        <tr style="height:27pt;">
            <td colspan="2" class="{{ $lbl }} text-center border-2 border-black align-middle">SIGNATURE</td>
            <td colspan="5" class="{{ $sig }}"><em>(wet signature/e-signature/digital certificate)</em>
                @if(!empty($govId?->signature))<br><img src="{{ storage_path('app/public/' . $govId->signature) }}" class="max-h-9 max-w-full mx-auto">@endif
            </td>
            <td colspan="2" class="{{ $lbl }} text-center border-2 border-black align-middle">DATE</td>
            <td colspan="2" class="border-2 border-black align-middle px-1">{{ $govId?->date_accomplished ?? '' }}</td>
        </tr>
    </table>
    <p class="text-right italic text-[6.5pt] mt-0.5">CS FORM 212 (Revised 2025), Page 2 of 4</p>
</div>


{{-- ══════════════════════════════════════════════════ --}}
{{-- PAGE 3 – Voluntary Work / Trainings / Other Info  --}}
{{-- ══════════════════════════════════════════════════ --}}
<div class="page">
<table class="border-2 border-black">
<colgroup>
    <col style="width:3.5%"><col style="width:26%"><col style="width:3%"><col style="width:17.5%">
    <col style="width:9%"><col style="width:9%"><col style="width:9.5%">
    <col style="width:3%"><col style="width:4%"><col style="width:22%"><col style="width:3.5%">
</colgroup>

<tr><td colspan="11" class="{{ $sectionHeader }}">VI. VOLUNTARY WORK OR INVOLVEMENT IN CIVIC / NON-GOVERNMENT / PEOPLE / VOLUNTARY ORGANIZATIONS</td></tr>
<tr style="height:15pt;" class="text-center">
    <td colspan="4" rowspan="2" class="{{ $lbl }} align-middle text-[6pt]"><strong>29.</strong> NAME &amp; ADDRESS OF ORGANIZATION<br><em class="normal-case">(Write in full)</em></td>
    <td colspan="2" class="{{ $lbl }} text-[6pt]">INCLUSIVE DATES<br><em class="normal-case">(mm/dd/yyyy)</em></td>
    <td rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt]">NUMBER<br>OF HOURS</td>
    <td colspan="4" rowspan="2" class="{{ $lbl }} align-middle text-[6pt]">POSITION / NATURE OF WORK</td>
</tr>
<tr style="height:13pt;" class="text-center"><td class="{{ $lbl }} text-[6pt]">From</td><td class="{{ $lbl }} text-[6pt]">To</td></tr>
@php $volWork = $pds['voluntary_work'] ?? []; @endphp
@for($i=0;$i<7;$i++)
@php $vw=$volWork[$i]??null; @endphp
<tr style="height:27pt;">
    <td colspan="4" class="{{ $val }} text-[6.5pt] px-1">@if($vw){{ ($vw->organization_name??'').(($vw->organization_address)?(', '.$vw->organization_address):'') }}@endif</td>
    <td class="{{ $val }} text-center text-[6.5pt]">{{ pDate($vw?->date_from) }}</td>
    <td class="{{ $val }} text-center text-[6.5pt]">{{ pDate($vw?->date_to) }}</td>
    <td class="{{ $val }} text-center text-[6.5pt]">{{ $vw?->number_of_hours??'' }}</td>
    <td colspan="4" class="{{ $val }} text-[6.5pt] px-1">{{ $vw?->position??'' }}</td>
</tr>
@endfor
<tr><td colspan="11" class="{{ $note }}">(Continue on separate sheet if necessary)</td></tr>

<tr><td colspan="11" class="{{ $sectionHeader }}">VII. LEARNING AND DEVELOPMENT (L&amp;D) INTERVENTIONS/TRAINING PROGRAMS ATTENDED</td></tr>
<tr style="height:18pt;" class="text-center">
    <td colspan="4" rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt]"><strong>30.</strong> TITLE OF LEARNING AND DEVELOPMENT INTERVENTIONS/TRAINING PROGRAMS<br><em class="normal-case">(Write in full)</em></td>
    <td colspan="2" class="{{ $lbl }} text-[5.5pt]">INCLUSIVE DATES<br><em class="normal-case">(mm/dd/yyyy)</em></td>
    <td rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt]">NUMBER<br>OF HOURS</td>
    <td colspan="3" rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt]">Type of L&amp;D<br>(Managerial/<br>Supervisory/<br>Technical/etc)</td>
    <td rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt]">CONDUCTED/<br>SPONSORED BY</td>
</tr>
<tr style="height:13pt;" class="text-center"><td class="{{ $lbl }} text-[5.5pt]">From</td><td class="{{ $lbl }} text-[5.5pt]">To</td></tr>
@php $trainings=$pds['trainings']??[]; @endphp
@for($i=0;$i<21;$i++)
@php $tr=$trainings[$i]??null; @endphp
<tr style="height:24pt;">
    <td colspan="4" class="{{ $val }} text-[6.5pt] px-1">{{ $tr?->title??'' }}</td>
    <td class="{{ $val }} text-center text-[6.5pt]">{{ pDate($tr?->date_from) }}</td>
    <td class="{{ $val }} text-center text-[6.5pt]">{{ pDate($tr?->date_to) }}</td>
    <td class="{{ $val }} text-center text-[6.5pt]">{{ $tr?->number_of_hours??'' }}</td>
    <td colspan="3" class="{{ $val }} text-center text-[6.5pt]">{{ $tr?->type_of_ld??'' }}</td>
    <td class="{{ $val }} text-[6.5pt] px-1">{{ $tr?->conducted_by??'' }}</td>
</tr>
@endfor
<tr><td colspan="11" class="{{ $note }}">(Continue on separate sheet if necessary)</td></tr>

<tr><td colspan="11" class="{{ $sectionHeader }}">VIII. OTHER INFORMATION</td></tr>
<tr style="height:33pt;" class="text-center">
    <td colspan="2" class="{{ $lbl }} align-middle text-[6pt]"><strong>31.</strong> SPECIAL SKILLS and HOBBIES</td>
    <td colspan="5" class="{{ $lbl }} align-middle text-[6pt]"><strong>32.</strong> NON-ACADEMIC DISTINCTIONS / RECOGNITION<br><em class="normal-case">(Write in full)</em></td>
    <td colspan="4" class="{{ $lbl }} align-middle text-[6pt]"><strong>33.</strong> MEMBERSHIP IN ASSOCIATION/ORGANIZATION<br><em class="normal-case">(Write in full)</em></td>
</tr>
@php $oi=$pds['other_info']??null; $skills=$oi?->special_skills??[]; $distinctions=$oi?->non_academic_distinctions??[]; $memberships=$oi?->organization_memberships??[]; @endphp
@for($i=0;$i<7;$i++)
<tr style="height:24pt;">
    <td colspan="2" class="{{ $val }} text-[6.5pt] px-1">{{ $skills[$i]??'' }}</td>
    <td colspan="5" class="{{ $val }} text-[6.5pt] px-1">{{ $distinctions[$i]??'' }}</td>
    <td colspan="4" class="{{ $val }} text-[6.5pt] px-1">{{ $memberships[$i]??'' }}</td>
</tr>
@endfor
<tr><td colspan="11" class="{{ $note }}">(Continue on separate sheet if necessary)</td></tr>

<tr style="height:28pt;">
    <td colspan="2" class="{{ $lbl }} text-center border-2 border-black align-middle">SIGNATURE</td>
    <td colspan="5" class="{{ $sig }}"><em>(wet signature/e-signature/digital certificate)</em>
        @if(!empty($govId?->signature))<br><img src="{{ storage_path('app/public/' . $govId->signature) }}" class="max-h-9 max-w-full mx-auto">@endif
    </td>
    <td colspan="2" class="{{ $lbl }} text-center border-2 border-black align-middle">DATE</td>
    <td colspan="2" class="border-2 border-black align-middle px-1">{{ $govId?->date_accomplished??'' }}</td>
</tr>
</table>
<p class="text-right italic text-[6.5pt] mt-0.5">CS FORM 212 (Revised 2025), Page 3 of 4</p>
</div>


{{-- ══════════════════════════════════════════════════ --}}
{{-- PAGE 4 – Questions / References / Declaration     --}}
{{-- ══════════════════════════════════════════════════ --}}
@php $q=$pds['questions']??null; $refs=$pds['references']??[]; @endphp
<div class="page">
<table class="border-2 border-black">
<colgroup>
    <col style="width:2%"><col style="width:5%"><col style="width:12%"><col style="width:22%">
    <col style="width:3%"><col style="width:25%"><col style="width:4%"><col style="width:6%">
    <col style="width:3%"><col style="width:2%"><col style="width:7%"><col style="width:15%"><col style="width:2%">
</colgroup>

{{-- Q34 --}}
<tr style="height:13pt;"><td colspan="2" rowspan="3" class="{{ $lbl }} text-center align-middle" style="font-size:8pt;"><strong>34.</strong></td><td colspan="4" class="{{ $lbl }} text-[6.5pt]">Are you related by consanguinity or affinity to the appointing or recommending authority, or to the</td><td colspan="6" rowspan="3" class="align-top p-1 text-[7pt]"><div class="mb-1">{!! yN($q?->q34_a) !!}</div><div class="mb-1">{!! yN($q?->q34_b) !!}</div><div class="text-[6pt]">If YES, give details:<br>{{ $q?->q34_details??'' }}</div></td><td rowspan="3" class="{{ $lbl }}"></td></tr>
<tr style="height:12pt;"><td colspan="4" class="{{ $lbl }} text-[6.5pt]">chief of bureau or office or to the person who has immediate supervision over you in the Office,</td></tr>
<tr style="height:12pt;"><td colspan="4" class="{{ $lbl }} text-[6.5pt]">Bureau or Department where you will be appointed,</td></tr>
<tr style="height:14pt;"><td colspan="2" class="{{ $lbl }}"></td><td colspan="4" class="{{ $lbl }} text-[6.5pt] pl-2">a. within the third degree?</td><td colspan="6" class="{{ $lbl }}"></td><td class="{{ $lbl }}"></td></tr>
<tr style="height:3pt;"><td colspan="13" class="border-0 p-0"></td></tr>
<tr style="height:15pt;"><td colspan="2" class="{{ $lbl }}"></td><td colspan="4" class="{{ $lbl }} text-[6.5pt] pl-2">b. within the fourth degree (for Local Government Unit - Career Employees)?</td><td colspan="6" class="{{ $lbl }}"></td><td class="{{ $lbl }}"></td></tr>

{{-- Q35 --}}
<tr style="height:18pt;"><td colspan="2" rowspan="2" class="{{ $lbl }} text-center align-middle" style="font-size:8pt;"><strong>35.</strong></td><td colspan="4" class="{{ $lbl }} text-[6.5pt]">a. Have you ever been found guilty of any administrative offense?</td><td colspan="6" rowspan="4" class="align-top p-1 text-[7pt]"><div class="mb-0.5">{!! yN($q?->q35_a) !!}</div><div class="text-[6pt] mb-1">If YES, give details: {{ $q?->q35_a_details??'' }}</div><div class="mb-0.5">{!! yN($q?->q35_b) !!}</div><div class="text-[6pt]">If YES, give details: {{ $q?->q35_b_details??'' }}<br>Date Filed: {{ $q?->q35_b_date??'' }}<br>Status: {{ $q?->q35_b_status??'' }}</div></td><td rowspan="4" class="{{ $lbl }}"></td></tr>
<tr style="height:14pt;"><td colspan="4" class="{{ $lbl }} text-[6.5pt]">If YES, give details:</td></tr>
<tr style="height:14pt;"><td colspan="2" class="{{ $lbl }}"></td><td colspan="4" class="{{ $lbl }} text-[6.5pt]">b. Have you been criminally charged before any court?</td></tr>
<tr style="height:14pt;"><td colspan="2" class="{{ $lbl }}"></td><td colspan="2" class="{{ $lbl }} text-[6.5pt]">If YES, give details:</td><td class="{{ $lbl }} text-[5.5pt]">Date Filed:</td><td class="{{ $lbl }} text-[5.5pt]">Status:</td></tr>

{{-- Q36 --}}
<tr style="height:18pt;"><td colspan="2" class="{{ $lbl }} text-center" style="font-size:8pt;"><strong>36.</strong></td><td colspan="4" class="{{ $lbl }} text-[6.5pt]">Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?</td><td colspan="6" class="align-top p-1 text-[7pt]"><div class="mb-0.5">{!! yN($q?->q36) !!}</div><div class="text-[6pt]">If YES, give details: {{ $q?->q36_details??'' }}</div></td><td class="{{ $lbl }}"></td></tr>
<tr style="height:15pt;"><td colspan="2" class="{{ $lbl }}"></td><td colspan="4" class="{{ $lbl }} text-[6.5pt]">If YES, give details:</td><td colspan="6" class="{{ $lbl }}"></td><td class="{{ $lbl }}"></td></tr>

{{-- Q37 (separation) --}}
<tr style="height:14pt;"><td colspan="2" rowspan="3" class="{{ $lbl }} text-center align-middle" style="font-size:8pt;"><strong>37.</strong></td><td colspan="4" class="{{ $lbl }} text-[6.5pt]">Have you ever been separated from the service in any of the following modes: resignation, retirement,</td><td colspan="6" rowspan="3" class="align-top p-1 text-[7pt]"><div class="mb-0.5">{!! yN($q?->q38) !!}</div><div class="text-[6pt]">If YES, give details: {{ $q?->q38_details??'' }}</div></td><td rowspan="3" class="{{ $lbl }}"></td></tr>
<tr style="height:12pt;"><td colspan="4" class="{{ $lbl }} text-[6.5pt]">dropped from the rolls, dismissal, termination, end of term, finished contract or phased out</td></tr>
<tr style="height:12pt;"><td colspan="4" class="{{ $lbl }} text-[6.5pt]">(abolition) in the public or private sector?</td></tr>
<tr style="height:12pt;"><td colspan="2" class="{{ $lbl }}"></td><td colspan="4" class="{{ $lbl }} text-[6.5pt]">If YES, give details:</td><td colspan="6" class="{{ $lbl }}"></td><td class="{{ $lbl }}"></td></tr>

{{-- Q38 (candidacy) --}}
<tr style="height:18pt;"><td colspan="2" rowspan="2" class="{{ $lbl }} text-center align-middle" style="font-size:8pt;"><strong>38.</strong></td><td colspan="4" class="{{ $lbl }} text-[6.5pt]">a. Have you ever been a candidate in a national or local election held within the last year (except Barangay election)?</td><td colspan="6" rowspan="3" class="align-top p-1 text-[7pt]"><div class="mb-0.5">{!! yN($q?->q37_a) !!}</div><div class="text-[6pt] mb-1">If YES, give details: {{ $q?->q37_a_details??'' }}</div><div class="mb-0.5">{!! yN($q?->q37_b) !!}</div><div class="text-[6pt]">If YES, give details: {{ $q?->q37_b_details??'' }}</div></td><td rowspan="3" class="{{ $lbl }}"></td></tr>
<tr style="height:12pt;"><td colspan="4" class="{{ $lbl }} text-[6.5pt]">If YES, give details:</td></tr>
<tr style="height:14pt;"><td colspan="2" class="{{ $lbl }}"></td><td colspan="4" class="{{ $lbl }} text-[6.5pt]">b. Have you resigned from the government service during the three (3)-month period before the last election to promote/actively campaign for a national or local candidate?</td></tr>

{{-- Q39 --}}
<tr style="height:18pt;"><td colspan="2" class="{{ $lbl }} text-center" style="font-size:8pt;"><strong>39.</strong></td><td colspan="4" class="{{ $lbl }} text-[6.5pt]">Have you acquired the status of an immigrant or permanent resident of another country?</td><td colspan="6" class="align-top p-1 text-[7pt]"><div class="mb-0.5">{!! yN($q?->q39) !!}</div><div class="text-[6pt]">If YES, give details: {{ $q?->q39_details??'' }}</div></td><td class="{{ $lbl }}"></td></tr>
<tr style="height:12pt;"><td colspan="2" class="{{ $lbl }}"></td><td colspan="4" class="{{ $lbl }} text-[6.5pt]">If YES, give details (country):</td><td colspan="6" class="{{ $lbl }}"></td><td class="{{ $lbl }}"></td></tr>

{{-- Q40 --}}
<tr style="height:41pt;"><td colspan="2" class="{{ $lbl }} align-top text-center pt-1" style="font-size:8pt;"><strong>40.</strong></td><td colspan="4" class="{{ $lbl }} text-[6.5pt] align-top">Pursuant to: (a) Indigenous People's Act (RA 8371); (b) Magna Carta for Disabled Persons (RA 7277); and (c) Solo Parents Welfare Act of 2000 (RA 8972), please answer the following items:</td><td colspan="6" class="align-top p-1 text-[7pt]" rowspan="6"><div class="mb-0.5">{!! yN($q?->q40_a) !!}</div><div class="text-[6pt] mb-1">If YES, specify: {{ $q?->q40_a_details??'' }}</div><div class="mb-0.5">{!! yN($q?->q40_b) !!}</div><div class="text-[6pt] mb-1">If YES, specify ID No: {{ $q?->q40_b_details??'' }}</div><div class="mb-0.5">{!! yN($q?->q40_c) !!}</div><div class="text-[6pt]">If YES, specify ID No: {{ $q?->q40_c_details??'' }}</div></td><td rowspan="6" class="{{ $lbl }}"></td></tr>
<tr style="height:13pt;"><td colspan="2" class="{{ $lbl }} text-[6.5pt]"><strong>a.</strong></td><td colspan="4" class="{{ $lbl }} text-[6.5pt]">Are you a member of any indigenous group?</td></tr>
<tr style="height:15pt;"><td colspan="2" class="{{ $lbl }}"></td><td colspan="4" class="{{ $lbl }} text-[6.5pt]">If YES, please specify:</td></tr>
<tr style="height:13pt;"><td colspan="2" class="{{ $lbl }} text-[6.5pt]"><strong>b.</strong></td><td colspan="4" class="{{ $lbl }} text-[6.5pt]">Are you a person with disability?</td></tr>
<tr style="height:15pt;"><td colspan="2" class="{{ $lbl }}"></td><td colspan="4" class="{{ $lbl }} text-[6.5pt]">If YES, please specify ID No:</td></tr>
<tr style="height:13pt;"><td colspan="2" class="{{ $lbl }} text-[6.5pt]"><strong>c.</strong></td><td colspan="4" class="{{ $lbl }} text-[6.5pt]">Are you a solo parent?</td></tr>
<tr style="height:12pt;"><td colspan="2" class="{{ $lbl }}"></td><td colspan="4" class="{{ $lbl }} text-[6.5pt]">If YES, please specify ID No:</td><td colspan="6" class="{{ $lbl }}"></td><td class="{{ $lbl }}"></td></tr>

{{-- References + Photo --}}
<tr style="height:23pt;">
    <td colspan="5" class="{{ $lbl }} align-top text-[6.5pt] px-1">
        <strong>41.</strong> REFERENCES <span class="text-red-700 font-normal">(Person not related by consanguinity or affinity to applicant/appointee)</span>
    </td>
    <td class="{{ $lbl }} text-center text-[6.5pt]">OFFICE / RESIDENTIAL ADDRESS</td>
    <td colspan="5" class="{{ $lbl }} text-center text-[6.5pt]">CONTACT NO. AND/OR EMAIL</td>
    <td rowspan="5" colspan="2" class="text-center align-top p-1">
        <div class="photo-box">
            @if(!empty($govId?->passport_photo))
                <img src="{{ storage_path('app/public/' . $govId->passport_photo) }}">
            @else
                <span class="text-[5.5pt] text-gray-600 p-1">ID picture taken within the last 6 months<br>4.5cm × 3.5cm (passport size)<br><br>Computer generated or photocopied picture is not acceptable</span>
            @endif
        </div>
        <p class="text-[5.5pt] text-center my-0.5">PHOTO</p>
        <div class="border border-black h-14 bg-white"></div>
        <div class="bg-gray-300 border-t border-black text-center p-px text-[6pt]">Right Thumbmark</div>
    </td>
</tr>
@for($i=0;$i<3;$i++)
@php $ref=$refs[$i]??null; @endphp
<tr style="height:24pt;">
    <td colspan="5" class="{{ $val }} text-[6.5pt] px-1">{{ $ref?->name??'' }}</td>
    <td class="{{ $val }} text-[6.5pt] px-1">{{ $ref?->address??'' }}</td>
    <td colspan="5" class="{{ $val }} text-[6.5pt] px-1">{{ $ref?->telephone??'' }}</td>
</tr>
@endfor

{{-- Declaration --}}
<tr style="height:39pt;">
    <td colspan="11" class="{{ $lbl }} align-top text-[6.5pt] p-1 text-justify">
        <strong>42.</strong> I declare under oath that I have personally accomplished this Personal Data Sheet which is a true, correct and complete statement pursuant to the provisions of pertinent laws, rules and regulations of the Republic of the Philippines. I authorize the agency head/authorized representative to verify/validate the contents stated herein. I agree that any misrepresentation made in this document and its attachments shall cause the filing of administrative/criminal case/s against me.
    </td>
    <td colspan="2" class="{{ $lbl }}"></td>
</tr>

{{-- Gov't ID + Signature --}}
<tr style="height:7pt;"><td colspan="13" class="border-0 p-0"></td></tr>
<tr style="height:32pt;">
    <td colspan="5" rowspan="6" class="border-2 border-black align-top p-1 text-[6.5pt]">
        <div class="border-b border-black pb-1 mb-1">Government Issued ID <span class="text-[6pt]">(i.e. Passport, GSIS, SSS, PRC, Driver's License, etc.)</span><br><em>PLEASE INDICATE ID Number and Date of Issuance</em></div>
        <div class="border-b border-black py-px">Government Issued ID: {{ $govId?->id_type??'' }}</div>
        <div class="border-b border-black py-px">ID/License/Passport No.: {{ $govId?->id_number??'' }}</div>
        <div class="py-px">Date/Place of Issuance: {{ ($govId?->date_of_issuance??'').($govId?->place_of_issuance ? ' / '.$govId->place_of_issuance : '') }}</div>
    </td>
    <td colspan="5" rowspan="2" class="border-2 border-black text-center align-middle text-[6.5pt] italic">
        (wet signature/e-signature/digital certificate)
        @if(!empty($govId?->signature))<br><img src="{{ storage_path('app/public/' . $govId->signature) }}" class="max-h-10 max-w-full mx-auto mt-0.5">@endif
    </td>
    <td colspan="3" rowspan="6" class="border-2 border-black text-center align-middle p-1">
        <div class="border border-black h-20 bg-white"></div>
        <div class="bg-gray-300 border-t border-black text-center p-px text-[6pt]">Right Thumbmark</div>
    </td>
</tr>
<tr style="height:8pt;"></tr>
<tr style="height:12pt;"><td colspan="5" class="{{ $lbl }} text-center border-2 border-black text-[6pt]">Signature (Sign inside the box)</td></tr>
<tr style="height:10pt;"><td colspan="5" class="border-2 border-black text-center align-middle text-[6.5pt]">{{ $govId?->date_accomplished??'' }}</td></tr>
<tr style="height:8pt;"></tr>
<tr style="height:12pt;"><td colspan="5" class="{{ $lbl }} text-center border-2 border-black text-[6pt]">Date Accomplished</td></tr>

{{-- Subscribed --}}
<tr style="height:28pt;">
    <td colspan="13" class="border-2 border-black text-center align-top p-1 text-[6.5pt]">
        <strong>SUBSCRIBED AND SWORN</strong> to before me this ______________________________, affiant exhibiting his/her validly issued government ID as indicated above.
    </td>
</tr>
<tr style="height:53pt;">
    <td colspan="13" class="border-2 border-black text-center align-bottom p-1">
        <div class="inline-block border-t border-black min-w-52 mb-0.5 pt-0.5 text-[6.5pt]">(wet signature/e-signature/digital certificate except for notarization)</div><br>
        <span class="text-[6.5pt] font-bold">Person Administering Oath</span>
    </td>
</tr>
<tr style="height:18pt;">
    <td colspan="13" class="border-2 border-black text-center align-middle text-[7pt] font-bold">
        CS FORM 212 (Revised 2025), Page 4 of 4
    </td>
</tr>
</table>
</div>

</body>
</html>