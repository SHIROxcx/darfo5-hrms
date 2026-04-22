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
        padding: 0.2in 0.2in 0.2in 0.2in;
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
            return is_string($c->date_of_birth) ? $c->date_of_birth : \Carbon\Carbon::parse($c->date_of_birth)->format('d/m/Y');
        }
        function eduF($list, $level, $field) { $e = $list->firstWhere('level', $level); return $e?->$field ?? ''; }
        function pDate($v) {
            if (!$v) return '';
            return is_string($v) ? $v : \Carbon\Carbon::parse($v)->format('d/m/Y');
        }
        function cb($on) { return '<span class="cb ' . ($on ? 'cb-on' : '') . '"></span>'; }
        function yN($v) { return cb($v) . ' YES &nbsp; ' . cb(!$v) . ' NO'; }

        // Tailwind utilities
        $lbl  = 'bg-gray-100 text-[7pt] uppercase';                                     // label cell
        $val  = 'align-middle text-[7pt] font-semibold';                               // value cell
        $sectionHeader  = 'bg-neutral-400 text-white font-narrow font-black italic text-[10pt] uppercase tracking-wide border-2 border-black py-0';
        $note = 'bg-gray-100 text-center italic text-[7pt] text-red-500 font-bold border-2 border-black'; // continue note
        $sig  = 'border-2 border-black align-middle text-center text-[7pt] font-semibold';
    @endphp

    {{-- ══════════════════════════════════════════════════ --}}
    {{-- PAGE 1 – Personal Info / Family / Education        --}}
    {{-- ══════════════════════════════════════════════════ --}}
    <div class="page">

        {{-- Header --}}
        <table class="border-2 border-b-0 border-black">
            
            <tr>
                <td class="relative p-0.5 text-[6.5pt]">
                    <p class="absolute italic font-semibold text-[8pt]">CS Form No. 212<span class="block font-normal text-[7pt]">Revised 2025 <span/></p>
                    <p class="text-center text-[22pt] font-black tracking-wide my-2">PERSONAL DATA SHEET</p>
                    <p class="text-[7.5pt] italic font-semibold"><span class="uppercase">WARNING:</span> Any misrepresentation made in the Personal Data Sheet and the Work Experience Sheet shall cause the filing of administrative/criminal case/s against the person concerned.</p>
                    <p class="text-[7.5pt] font-semibold italic">READ THE ATTACHED GUIDE TO FILLING OUT THE PERSONAL DATA SHEET (PDS) BEFORE ACCOMPLISHING THE PDS FORM.</p>
                    <p class="text-[7.5pt] font-light tracking-tight">Print legibly if accomplished through own handwriting. Tick appropriate boxes ({!! cb(false) !!}) and use separate sheet if necessary. Indicate N/A if not applicable. <span class="font-semibold text-[8pt]">DO NOT ABBREVIATE.</span></p>
                </td>
            </tr>
        
        </table>

        <table class="border-2 border-black">

        {{-- Section I Header --}}
        <tr><td colspan="19" class="{{ $sectionHeader }}">I. PERSONAL INFORMATION</td></tr>

        {{-- Name rows --}}
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 border-b-gray-100">1. SURNAME</td>
            <td colspan="16" class="font-semibold text-[8pt] align-middle px-2">{{ strtoupper($user->last_name ?? '') }}</td>
        </tr>
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 border-b-gray-100">2. FIRST NAME</td>
            <td colspan="11" class="font-semibold text-[8pt] align-middle px-2">{{ strtoupper($user->first_name ?? '') }}</td>
            <td colspan="5" class="align-start px-1 bg-gray-100 text-[7pt]">
                <span>NAME EXTENSION (JR., SR)</span>
                <span class="font-semibold text-[8pt] align-middle text-end pl-10">{{ strtoupper($user->name_ext ?? '') }}</span>
            </td>
        </tr>
        <tr style="height:17pt;border-bottom:2px solid #000;">
            <td colspan="3" class="{{ $lbl }} pl-3 px-1">MIDDLE NAME</td>
            <td colspan="16" class="font-semibold text-[8pt] align-middle px-2">{{ strtoupper($user->middle_name ?? '') }}</td>
        </tr>

        {{-- 3, 4, 5: Birth Info + 16. Citizenship (Spans 3 Rows) --}}
        <tr style="height:24pt;">
            <td colspan="3" class="{{ $lbl }} px-1"><strong>3.</strong> DATE OF BIRTH<br><span class="italic lowercase pl-3">(dd/mm/yyyy)</span></td>
            <td colspan="4" class="{{ $val }} px-2 font-semibold">{{ $dob }}</td>
            {{-- Citizenship Starts Here --}}
            <td colspan="4" rowspan="3" class="{{ $lbl }} text-start align-top text-[8pt] uppercase pt-0">
                16. CITIZENSHIP<br><br>
                <div class="normal-case text-center mt-3 text-[7pt]">If holder of dual citizenship,<br><br>please indicate the details.</div>
            </td>
            <td colspan="8" rowspan="3" class="align-top text-[7pt]">
                <div class="flex gap-4 mb-2 pt-2 px-2">
                    <span>{!! cb($pi?->citizenship == 'Filipino') !!} Filipino</span>
                    <span>{!! cb($pi?->citizenship == 'Dual Citizenship') !!} Dual Citizenship</span>
                </div>
                <div class="pl-20 mb-2">
                    {!! cb($pi?->dual_type == 'birth') !!} by birth &nbsp; 
                    {!! cb($pi?->dual_type == 'naturalization') !!} by naturalization
                </div>
                <div class="text-[8pt] pl-20">Pls. indicate country:</div>
                <div class="w-full min-h-5">
                    <select name="dual_contry" id="dual_contry" class="w-full h-7 mt-2 bg-white border border-black">
                        <option value="" selected>{{ $pi?->dual_country ?? '' }}</option>
                    </select>
                </div>
            </td>
        </tr>
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">4. PLACE OF BIRTH</td>
            <td colspan="4" class="{{ $val }} px-2 font-semibold">{{ $pi?->birth_place ?? '' }}</td>
        </tr>
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">5. SEX AT BIRTH</td>
            <td colspan="4" class="align-middle px-2 text-[8pt]">
                <span>{!! cb($pi?->sex === 'Male') !!} Male </span>
                <span class="ml-10">{!! cb($pi?->sex === 'Female') !!} Female</span>
            </td>
        </tr>

        {{-- 6, 7, 8: Physical Info + 17. Residential Address (Spans 3 Rows) --}}
        <tr style="height:45pt;">
            <td colspan="3" class="{{ $lbl }} align-top px-1">6. CIVIL STATUS</td>
            <td colspan="4" class="align-top p-2 py-1 text-[8pt]">
                <div class="grid grid-cols-2 gap-y-1">
                    @foreach(['Single', 'Married', 'Widowed', 'Separated'] as $s)
                        <div>{!! cb($cs === $s) !!} {{ $s }}</div>
                    @endforeach
                </div>
                <div class="mt-1">{!! cb(!in_array($cs, ['Single', 'Married', 'Widowed', 'Separated'])) !!} Other/s: <span class="pl-1">{{ !in_array($cs, ['Single', 'Married', 'Widowed', 'Separated']) ? $cs : '' }}</span></div>
            </td>
            {{-- Residential Address Starts Here --}}
            <td colspan="3" rowspan="3" class="{{ $lbl }} align-top pt-0">17. RESIDENTIAL ADDRESS<br><br><br><br><p class="text-center pt-10">ZIP CODE</p></td>
            <td colspan="9" rowspan="3" class="align-top py-1 px-0 text-[6.5pt]">
                @foreach([['House/Block/Lot No.', 'Street', $pi?->res_house_no, $pi?->res_street], ['Subdivision/Village', 'Barangay', $pi?->res_subdivision, $pi?->res_barangay], ['City/Municipality', 'Province', $pi?->res_city, $pi?->res_province]] as [$l1, $l2, $v1, $v2])
                    <div class="flex border-b border-black italic">
                        <div class="w-1/2">
                            <div class="text-center h-3 uppercase align-middle font-semibold">{{ $v1 }}</div>
                            <div class="italic text-[6.5pt] text-center border-t border-black/50">{{ $l1 }}</div>
                        </div>
                        <div class="w-1/2">
                            <div class="text-center h-3 uppercase align-middle font-semibold">{{ $v2 }}</div>
                            <div class="italic text-[6.5pt] text-center border-t border-black/40">{{ $l2 }}</div>
                        </div>
                    </div>
                @endforeach
                <div class="text-center text-[8pt] font-semibold mt-2">{{ $pi?->res_zipcode ?? '' }}</div>
            </td>
        </tr>
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">7. HEIGHT (m)</td>
            <td colspan="4" class="{{ $val }}">{{ $pi?->height ?? '' }}</td>
        </tr>
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">8. WEIGHT (kg)</td>
            <td colspan="4" class="{{ $val }}">{{ $pi?->weight ?? '' }}</td>
        </tr>

        {{-- 9, 10, 11, 12: IDs + 18. Permanent Address (Spans 4 Rows) --}}
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">9. BLOOD TYPE</td>
            <td colspan="4" class="{{ $val }}">{{ $pi?->blood_type ?? '' }}</td>
            {{-- Permanent Address Starts Here --}}
            <td colspan="3" rowspan="4" class="{{ $lbl }} align-top pt-0">18. PERMANENT ADDRESS<br><br><br><br><p class="text-center pt-10">ZIP CODE</p></td>
            <td colspan="9" rowspan="4" class="align-top py-1 px-0 text-[6.5pt]">
                @foreach([['House/Block/Lot No.', 'Street', $pi?->perm_house_no, $pi?->perm_street], ['Subdivision/Village', 'Barangay', $pi?->perm_subdivision, $pi?->perm_barangay], ['City/Municipality', 'Province', $pi?->perm_city, $pi?->perm_province]] as [$l1, $l2, $v1, $v2])
                    <div class="flex border-b border-black italic">
                        <div class="w-1/2">
                            <div class="text-center h-3 uppercase align-middle font-semibold">{{ $v1 }}</div>
                            <div class="italic text-[6.5pt] text-center border-t border-black/40">{{ $l1 }}</div>
                        </div>
                        <div class="w-1/2">
                            <div class="text-center h-3 uppercase align-middle font-semibold">{{ $v2 }}</div>
                            <div class="italic text-[6.5pt] text-center border-t border-black/40">{{ $l2 }}</div>
                        </div>
                    </div>
                @endforeach
                <div class="text-center text-[8pt] font-semibold mt-2">{{ $pi?->perm_zipcode ?? '' }}</div>
            </td>
        </tr>
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">10. UMID ID NO.</td>
            <td colspan="4" class="{{ $val }} px-1">{{ $pi?->umid_number ?? 'N/A' }}</td>
        </tr>
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">11. PAG-IBIG ID NO.</td>
            <td colspan="4" class="{{ $val }} px-1">{{ $pi?->pagibig_number ?? 'N/A' }}</td>
        </tr>
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">12. PHILHEALTH NO.</td>
            <td colspan="4" class="{{ $val }} px-1">{{ $pi?->philhealth_number ?? 'N/A' }}</td>
        </tr>

        {{-- 13-15 & 19-21: Final IDs and Contact Info --}}
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">13. PhilSys Number (PSN):</td>
            <td colspan="4" class="{{ $val }} px-1">{{ $pi?->philsys_number ?? 'N/A' }}</td>
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">19. TELEPHONE NO.</td>
            <td colspan="9" class="{{ $val }} px-1 text-center">{{ $pi?->telephone ?? 'N/A' }}</td>
        </tr>
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">14. TIN NO.</td>
            <td colspan="4" class="{{ $val }} px-1">{{ $pi?->tin_number ?? 'N/A' }}</td>
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">20. MOBILE NO.</td>
            <td colspan="9" class="{{ $val }} px-1 text-center">{{ $pi?->mobile_number ?? 'N/A' }}</td>
        </tr>
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">15. AGENCY EMPLOYEE NO.</td>
            <td colspan="4" class="{{ $val }} px-1">{{ $pi?->agency_employee_no ?? 'N/A' }}</td>
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">21. E-MAIL ADDRESS <span class="lowercase">(if any)</span></td>
            <td colspan="9" class="{{ $val }} px-1 text-center">{{ $pi?->email ?? '' }}</td>
        </tr>

        {{-- Section II: Family Background --}}
        <tr><td colspan="19" class="{{ $sectionHeader }}">II. FAMILY BACKGROUND</td></tr>

        <tr style="height:18pt;">
            <td colspan="3" class="{{ $lbl }} text-[6pt] px-1 border-b-gray-100">22. SPOUSE'S SURNAME</td>
            <td colspan="7" class="{{ $val }} px-1">{{ strtoupper($fam?->spouse_surname ?? '') }}</td>
            <td colspan="5" class="{{ $lbl }} text-[6pt] align-middle">23. NAME of CHILDREN <span class="normal-case text-[6.5pt]">(Write full name and list all)</span></td>
            <td colspan="4" class="{{ $lbl }} text-[6pt] align-middle">DATE OF BIRTH<span class="normal-case text-[6.5pt]"> (dd/mm/yyyy)</span></td>
        </tr>
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} pl-2 text-[6pt]  border-b-gray-100">FIRST NAME</td>
            <td colspan="4" class="{{ $val }} px-1">{{ strtoupper($fam?->spouse_first_name ?? '') }}</td>
            <td colspan="3" class="{{ $lbl }} text-[6pt]">NAME EXTENSION (JR., SR)</td>
            <td colspan="5" class="{{ $val }} text-[6.5pt] px-1">{{ chName($children, 0) }}</td>
            <td colspan="4" class="{{ $val }} text-center text-[6.5pt]">{{ chDob($children, 0) }}</td>
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
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} text-[6pt] {{ $indent ? 'pl-2' : 'px-1' }}">{{ $rowLbl }}</td>
            <td colspan="7" class="{{ $val }} text-[6.5pt] px-1">{{ strtoupper($fam?->$field ?? '') }}</td>
            <td colspan="5" class="{{ $val }} text-[6.5pt] px-1">{{ chName($children, $chI) }}</td>
            <td colspan="4" class="{{ $val }} text-center text-[6.5pt]">{{ chDob($children, $chI) }}</td>
        </tr>
        @endforeach

        {{-- Father --}}
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} text-[6pt] px-1  border-b-gray-100">24. FATHER'S SURNAME</td>
            <td colspan="7" class="{{ $val }} px-1">{{ strtoupper($fam?->father_surname ?? '') }}</td>
            <td colspan="5" class="{{ $val }} text-[6.5pt] px-1">{{ chName($children, 6) }}</td>
            <td colspan="4" class="{{ $val }} text-center text-[6.5pt]">{{ chDob($children, 6) }}</td>
        </tr>
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} pl-2 text-[6pt]  border-b-gray-100">FIRST NAME</td>
            <td colspan="4" class="{{ $val }} px-1">{{ strtoupper($fam?->father_first_name ?? '') }}</td>
            <td colspan="3" class="{{ $lbl }} text-[6pt]">NAME EXTENSION (JR., SR)</td>
            <td colspan="5" class="{{ $val }} text-[6.5pt] px-1">{{ chName($children, 7) }}</td>
            <td colspan="4" class="{{ $val }} text-center text-[6.5pt]">{{ chDob($children, 7) }}</td>
        </tr>
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} pl-2 text-[6pt] ">MIDDLE NAME</td>
            <td colspan="7" class="{{ $val }} px-1">{{ strtoupper($fam?->father_middle_name ?? '') }}</td>
            <td colspan="5" class="{{ $val }} text-[6.5pt] px-1">{{ chName($children, 8) }}</td>
            <td colspan="4" class="{{ $val }} text-center text-[6.5pt]">{{ chDob($children, 8) }}</td>
        </tr>

        {{-- Mother --}}
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} text-[6pt] px-1 border-r-0 border-b-gray-100">25. MOTHER'S MAIDEN NAME</td>
            <td colspan="7" class="bg-gray-100 border-l-0 "></td>
            <td colspan="5" class="{{ $val }} text-[6.5pt] px-1">{{ chName($children, 9) }}</td>
            <td colspan="4" class="{{ $val }} text-center text-[6.5pt]">{{ chDob($children, 9) }}</td>
        </tr>
        @foreach([['SURNAME','mother_surname',false,10],['FIRST NAME','mother_first_name',false,11],['MIDDLE NAME','mother_middle_name',true,null]] as [$mLbl,$mField,$mLast,$mChI])
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} pl-2 text-[6pt] border-b-gray-100">{{ $mLbl }}</td>
            @if(!$mLast)
            <td colspan="7" class="{{ $val }} px-1">{{ strtoupper($fam?->$mField ?? '') }}</td>
            <td colspan="5" class="{{ $val }} text-[6.5pt] px-1">{{ chName($children, $mChI) }}</td>
            <td colspan="4" class="{{ $val }} text-center text-[6.5pt]">{{ chDob($children, $mChI) }}</td>
            @else
            {{-- Mother middle name: last child col replaced by continue note --}}
            <td colspan="7" class="{{ $val }} px-1">{{ strtoupper($fam?->$mField ?? '') }}</td>
            <td colspan="9" class="{{ $note }} border-none align-middle">(Continue on separate sheet if necessary)</td>
            @endif
        </tr>
        @endforeach

        {{-- Section III: Education --}}
        <tr><td colspan="19" class="{{ $sectionHeader }}">III. EDUCATIONAL BACKGROUND</td></tr>
        <tr style="height:14pt;">
            <td colspan="3" rowspan="2" class="{{ $lbl }} align-middle text-[6pt]"><span>26.</span> <p class="text-center">LEVEL</p></td>
            <td colspan="4" rowspan="2" class="{{ $lbl }} align-middle text-center text-[5.5pt]">NAME OF SCHOOL<br><span class="normal-case">(Write in full)</span></td>
            <td colspan="4" rowspan="2" class="{{ $lbl }} align-middle text-center text-[5.5pt]">BASIC EDUCATION/DEGREE/COURSE<br><span class="normal-case">(Write in full)</span></td>
            <td colspan="2" class="{{ $lbl }} text-center align-middle text-[5.5pt] py-1">PERIOD OF ATTENDANCE</td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle text-center text-[5.5pt]">HIGHEST LEVEL/<br>UNITS EARNED<br><span class="normal-case">(if not graduated)</span></td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt] text-center">YEAR<br>GRADUATED</td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt] text-center">SCHOLARSHIP/<br>ACADEMIC<br>HONORS<br></td>
        </tr>
        <tr style="height:14pt;" class="text-center">
            <td class="{{ $lbl }} text-[6pt] normal-case">From</td>
            <td class="{{ $lbl }} text-[6pt] normal-case">To</td>
        </tr>
        @foreach([['ELEMENTARY','Elementary'],['SECONDARY','Secondary'],['VOCATIONAL / TRADE COURSE','Vocational'],['COLLEGE','College'],['GRADUATE STUDIES','Graduate Studies']] as [$eLabel,$eKey])
        <tr style="height:16pt;">
            <td colspan="3" class="{{ $lbl }} text-[6pt] px-1 align-middle">{{ $eLabel }}</td>
            <td colspan="4" class="{{ $val }} text-[5pt] px-1">{{ eduF($eduList, $eKey, 'school_name') }}</td>
            <td colspan="4" class="{{ $val }} text-[5pt] px-1">{{ eduF($eduList, $eKey, 'course') }}</td>
            <td class="{{ $val }} text-[6pt]">{{ eduF($eduList, $eKey, 'period_from') }}</td>
            <td class="{{ $val }} text-[6pt]">{{ eduF($eduList, $eKey, 'period_to') }}</td>
            <td colspan="2" class="{{ $val }} text-[6pt]">{{ eduF($eduList, $eKey, 'highest_level') }}</td>
            <td colspan="2" class="{{ $val }} text-center text-[6pt]">{{ eduF($eduList, $eKey, 'year_graduated') }}</td>
            <td colspan=2"" class="{{ $val }} text-[5.5pt]">{{ eduF($eduList, $eKey, 'honors_received') }}</td>
        </tr>
        @endforeach
        <tr><td colspan="19" class="{{ $note }}">(Continue on separate sheet if necessary)</td></tr>

        {{-- Page 1 Signature --}}
        <tr style="height:16pt;">
            {{-- Signature Label (3 cols) --}}
            <td colspan="3" class="{{ $lbl }} text-center border-2 border-black align-middle font-bold italic text-md">SIGNATURE</td>
            
            {{-- Signature Value (8 cols to reach 11) --}}
            <td colspan="8" class="{{ $sig }} text-center align-middle">
                @if(empty($govId?->signature))
                    <span class="text-red-500 italic text-[7pt]">(wet signature/e-signature/digital certificate)</span>
                @else
                    <img src="{{ storage_path('app/public/' . $govId->signature) }}" class="max-h-8 max-w-full mx-auto block">
                @endif
            </td>

            {{-- Date Label (3 cols to reach 14) --}}
            <td colspan="2" class="{{ $lbl }} text-center border-2 border-black align-middle">DATE</td>
            
            {{-- Date Value (4 cols to reach 18) --}}
            <td colspan="6" class="border-2 border-black align-middle px-2 text-center font-bold">
                {{ $govId?->date_accomplished ?? '' }}
            </td>
        </tr>
        </table>
        <p class="text-right italic text-[6pt]">CS FORM 212 (Revised 2025), Page 1 of 4</p>
    </div>

{{-- PAGE 2 – Eligibility + Work Experience --}}

<div class="page">
    <table class="border-2 border-black">
        <!-- <colgroup>
            <col style="width:3%"><col style="width:5.5%"><col style="width:8.5%"><col style="width:9%">
            <col style="width:7%"><col style="width:11.5%"><col style="width:6%"><col style="width:16%">
            <col style="width:8%"><col style="width:9.5%"><col style="width:10%">
        </colgroup> -->

        <tr><td colspan="19" class="{{ $sectionHeader }}">IV. CIVIL SERVICE ELIGIBILITY</td></tr>
        <tr style="height:20pt;">
            <td colspan="8" rowspan="2" class="{{ $lbl }} align-middle uppercase">
                <span>27.</span> <p class="text-center">CES/CSEE/CAREER SERVICE/RA 1080 (BOARD/<br>BAR)/UNDER SPECIAL LAWS/CATEGORY II/IV<br>ELIGIBILITY <span class="normal-case">and</span>
                ELIGIBILITIES FOR UNIFORMED<br> PERSONNEL</p>
            </td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle text-[6pt] uppercase text-center">RATING<br><span class="normal-case">(if applicable)</span></td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle text-[6pt] text-center">DATE OF EXAMINATION/<br>CONFERMENT</td>
            <td colspan="3" rowspan="2" class="{{ $lbl }} align-middle text-[6pt] text-center">PLACE OF EXAMINATION /<br>CONFERMENT</td>
            <td colspan="4" class="{{ $lbl }} text-[6pt] text-center">LICENSE <span class="normal-case">(if applicable)</span></td>
        </tr>
        <tr style="height:17pt;" class="text-center">
            <td colspan="2" class="{{ $lbl }} text-[6pt] align-middle">NUMBER</td>
            <td colspan="2" class="{{ $lbl }} text-[6pt] align-middle normal-case">Valid Until</td>
        </tr>
        @php $eligibilities = $pds['eligibilities'] ?? []; @endphp
        @for($i = 0; $i < 8; $i++)
        @php $el = $eligibilities[$i] ?? null; @endphp
        <tr style="height:20pt;">
            <td colspan="8" class="{{ $val }} text-[7pt] px-1">{{ $el?->career_service ?? '' }}</td>
            <td colspan="2" class="{{ $val }} text-center text-[7pt]">{{ $el?->rating ?? '' }}</td>
            <td colspan="2" class="{{ $val }} text-center text-[7pt]">{{ pDate($el?->date_of_examination) }}</td>
            <td colspan="3" class="{{ $val }} text-[7pt] px-1">{{ $el?->place_of_examination ?? '' }}</td>
            <td colspan="2" class="{{ $val }} text-center text-[7pt]">{{ $el?->license_number ?? '' }}</td>
            <td colspan="2" class="{{ $val }} text-center text-[7pt]">{{ pDate($el?->license_validity) }}</td>
        </tr>
        @endfor
        <tr><td colspan="19" class="{{ $note }}">(Continue on separate sheet if necessary)</td></tr>

        {{-- Work Experience --}}
        <tr>
            <td colspan="19" class="{{ $sectionHeader }}">
                V. WORK EXPERIENCE<br>
                <span class="text-[9pt] normal-case font-medium">(Include private employment. Start from your recent work.) Description of duties should be indicated in the attached Work Experience Sheet</span>
            </td>
        </tr>
        <tr style="height:18pt;">
            <td colspan="4" rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt]"><span>28. </span><p class="text-center">INCLUSIVE DATES<br><span class="normal-case">(dd/mm/yyyy)</span></p></td>
            <td colspan="6" rowspan="3" class="{{ $lbl }} align-middle text-[5.5pt] text-center">POSITION TITLE<br><span class="normal-case">(Write in full/Do not abbreviate)</span></td>
            <td colspan="5" rowspan="3" class="{{ $lbl }} align-middle text-[5.5pt] text-center">DEPARTMENT / AGENCY / OFFICE / COMPANY <br><span class="normal-case">(Write in full/Do not abbreviate)</span> </td>
            <td colspan="2" rowspan="3" class="{{ $lbl }} align-middle text-[5.5pt] text-center">STATUS OF APPOINTMENT</td>
            <td colspan="2" rowspan="3" class="{{ $lbl }} align-middle text-[5.5pt] text-center">GOV'T SERVICE <br>(Y/N)</td>
        </tr>
        <tr style="height:17pt;"></tr>
        <tr style="height:15pt;" class="text-center ">
            <td colspan="2" class="{{ $lbl }} text-[7pt] normal-case">From</td>
            <td colspan="2" class="{{ $lbl }} text-[7pt] normal-case">To</td>
        </tr>
        @php $workExp = $pds['work_experience'] ?? []; @endphp
        @for($i = 0; $i < 28; $i++)
        @php $we = $workExp[$i] ?? null; @endphp
        <tr style="height:19pt;">
            <td colspan="2" class="{{ $val }} text-center text-[6.5pt]">{{ pDate($we?->date_from) }}</td>
            <td colspan="2" class="{{ $val }} text-center text-[6.5pt]">@if($we?->is_present)<em>Present</em>@else{{ pDate($we?->date_to) }}@endif</td>
            <td colspan="6" class="{{ $val }} text-[6.5pt] px-1">{{ $we?->position_title ?? '' }}</td>
            <td colspan="5" class="{{ $val }} text-[6.5pt] px-1">{{ $we?->department ?? '' }}</td>
            <td colspan="2" class="{{ $val }} text-[6.5pt] px-1">{{ $we?->status_of_appointment ?? '' }}</td>
            <td colspan="2" class="{{ $val }} text-center text-[6.5pt]">{{ $we ? ($we->is_government_service ? 'Y' : 'N') : '' }}</td>
        </tr>
        @endfor
        <tr><td colspan="19" class="{{ $note }}">(Continue on separate sheet if necessary)</td></tr>

        {{-- Page 2 Signature --}}
        <tr style="height:17pt;">
            {{-- Signature Label (3 cols) --}}
            <td colspan="4" class="{{ $lbl }} text-center border-2 border-black align-middle font-bold italic text-md">SIGNATURE</td>
            
            {{-- Signature Value (8 cols to reach 11) --}}
            <td colspan="7" class="{{ $sig }} text-center align-middle">
                @if(empty($govId?->signature))
                    <span class="text-red-500 italic text-[7pt]">(wet signature/e-signature/digital certificate)</span>
                @else
                    <img src="{{ storage_path('app/public/' . $govId->signature) }}" class="max-h-8 max-w-full mx-auto block">
                @endif
            </td>

            {{-- Date Label (3 cols to reach 14) --}}
            <td colspan="4" class="{{ $lbl }} text-center border-2 border-black align-middle">DATE</td>
            
            {{-- Date Value (4 cols to reach 18) --}}
            <td colspan="4" class="border-2 border-black align-middle px-2 text-center font-bold">
                {{ $govId?->date_accomplished ?? '' }}
            </td>
        </tr>
    </table>
    <p class="text-right italic text-[6.5pt] mt-0.5">CS FORM 212 (Revised 2025), Page 2 of 4</p>
</div>


{{-- ══════════════════════════════════════════════════ --}}
{{-- PAGE 3 – Voluntary Work / Trainings / Other Info  --}}
{{-- ══════════════════════════════════════════════════ --}}
<div class="page">
    <table class="border-2 border-black">
    <!-- <colgroup>
        <col style="width:3.5%"><col style="width:26%"><col style="width:3%"><col style="width:17.5%">
        <col style="width:9%"><col style="width:9%"><col style="width:9.5%">
        <col style="width:3%"><col style="width:4%"><col style="width:22%"><col style="width:3.5%">
    </colgroup> -->

    <tr><td colspan="20" class="{{ $sectionHeader }}">VI. VOLUNTARY WORK OR INVOLVEMENT IN CIVIC / NON-GOVERNMENT / PEOPLE / VOLUNTARY ORGANIZATIONS</td></tr>
    <tr style="height:18pt;">
        <td colspan="7" rowspan="2" class="{{ $lbl }} align-middle text-[7pt]"><span>29.</span> <p class="inline pl-10">NAME &amp; ADDRESS OF ORGANIZATION<br><span class="normal-case pl-28">(Write in full)</span></p></td>
        <td colspan="4" class="{{ $lbl }} text-[7pt] text-center py-1">INCLUSIVE DATES<br><span class="normal-case">(dd/mm/yyyy)</span></td>
        <td colspan="2" rowspan="2" class=" align-middle text-[6.5pt] text-center">NUMBER OF<br> HOURS</td>
        <td colspan="7" rowspan="2" class="{{ $lbl }} align-middle text-[6pt] text-center">POSITION / NATURE OF WORK</td>
    </tr>
    <tr style="height:13pt;" class="text-center">
        <td colspan="2" class="{{ $lbl }} text-[6pt]  normal-case">From</td>
        <td colspan="2" class="{{ $lbl }} text-[6pt]  normal-case">To</td>
    </tr>
    @php $volWork = $pds['voluntary_work'] ?? []; @endphp
    @for($i=0;$i<7;$i++)
    @php $vw=$volWork[$i]??null; @endphp
    <tr style="height:20pt;">
        <td colspan="7" class="{{ $val }} text-[7pt] px-1">@if($vw){{ ($vw->organization_name??'').(($vw->organization_address)?(', '.$vw->organization_address):'') }}@endif</td>
        <td colspan="2" class="{{ $val }} text-center text-[7pt]">{{ pDate($vw?->date_from) }}</td>
        <td colspan="2" class="{{ $val }} text-center text-[7pt]">{{ pDate($vw?->date_to) }}</td>
        <td colspan="2" class="{{ $val }} text-center text-[7pt]">{{ $vw?->number_of_hours??'' }}</td>
        <td colspan="7" class="{{ $val }} text-[7pt] px-1">{{ $vw?->position??'' }}</td>
    </tr>
    @endfor
    <tr><td colspan="20" class="{{ $note }}">(Continue on separate sheet if necessary)</td></tr>

    <tr><td colspan="20" class="{{ $sectionHeader }}">VII. LEARNING AND DEVELOPMENT (L&amp;D) INTERVENTIONS/TRAINING PROGRAMS ATTENDED</td></tr>
    <tr style="height:18pt;">
        <td colspan="7" rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt]"><span>30.</span> <p class="text-center inline pl-2">TITLE OF LEARNING AND DEVELOPMENT INTERVENTIONS/<br><span class="pl-24">TRAINING PROGRAMS<br></span></p><p class="normal-case text-center">(Write in full)</p></td>
        <td colspan="4" class="{{ $lbl }} text-[5.5pt] text-center">INCLUSIVE DATES<br><span class="normal-case">(mm/dd/yyyy)</span></td>
        <td colspan="2" rowspan="2" class=" align-middle text-[6.5pt] text-center">NUMBER<br>OF HOURS</td>
        <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt] text-center">Type of L&amp;D<br><span class="normal-case text-[6.5pt]">(Managerial/<br>Supervisory/<br>Technical/etc)</span></td>
        <td colspan="5" rowspan="2" class="{{ $lbl }} align-middle text-[5.5pt] text-center">CONDUCTED/ SPONSORED BY<br><span class="normal-case">(Write in full)</span></td>
    </tr>
    <tr style="height:13pt;" class="text-center">
        <td colspan="2" class="{{ $lbl }} text-[5.5pt] normal-case">From</td>
        <td colspan="2" class="{{ $lbl }} text-[5.5pt] normal-case">To</td>
    </tr>
    @php $trainings=$pds['trainings']??[]; @endphp
    @for($i=0;$i<21;$i++)
    @php $tr=$trainings[$i]??null; @endphp
    <tr style="height:19pt;">
        <td colspan="7" class="{{ $val }} text-[6.5pt] px-1">{{ $tr?->title??'' }}</td>
        <td colspan="2" class="{{ $val }} text-center text-[6.5pt]">{{ pDate($tr?->date_from) }}</td>
        <td colspan="2" class="{{ $val }} text-center text-[6.5pt]">{{ pDate($tr?->date_to) }}</td>
        <td colspan="2" class="{{ $val }} text-center text-[6.5pt]">{{ $tr?->number_of_hours??'' }}</td>
        <td colspan="2" class="{{ $val }} text-center text-[6.5pt]">{{ $tr?->type_of_ld??'' }}</td>
        <td colspan="5" class="{{ $val }} text-[6.5pt] px-1">{{ $tr?->conducted_by??'' }}</td>
    </tr>
    @endfor
    <tr><td colspan="20" class="{{ $note }}">(Continue on separate sheet if necessary)</td></tr>

    <tr><td colspan="20" class="{{ $sectionHeader }}">VIII. OTHER INFORMATION</td></tr>
    <tr style="height:33pt;" class="text-center">
        <td colspan="5" class="{{ $lbl }} align-middle text-[6pt]">31. SPECIAL SKILLS and HOBBIES</td>
        <td colspan="10" class="{{ $lbl }} align-middle text-[6pt]">32. NON-ACADEMIC DISTINCTIONS / RECOGNITION<br><em class="normal-case">(Write in full)</em></td>
        <td colspan="5" class="{{ $lbl }} align-middle text-[6pt]">33. MEMBERSHIP IN ASSOCIATION/ORGANIZATION<br><em class="normal-case">(Write in full)</em></td>
    </tr>
    @php $oi=$pds['other_info']??null; $skills=$oi?->special_skills??[]; $distinctions=$oi?->non_academic_distinctions??[]; $memberships=$oi?->organization_memberships??[]; @endphp
    @for($i=0;$i<7;$i++)
    <tr style="height:18pt;">
        <td colspan="5" class="{{ $val }} text-[6.5pt] px-1">{{ $skills[$i]??'' }}</td>
        <td colspan="10" class="{{ $val }} text-[6.5pt] px-1">{{ $distinctions[$i]??'' }}</td>
        <td colspan="5" class="{{ $val }} text-[6.5pt] px-1">{{ $memberships[$i]??'' }}</td>
    </tr>
    @endfor
    <tr><td colspan="20" class="{{ $note }}">(Continue on separate sheet if necessary)</td></tr>

    {{-- Page 3 Signature --}}
            <tr style="height:17pt;">
                {{-- Signature Label (3 cols) --}}
                <td colspan="5" class="{{ $lbl }} text-center border-2 border-black align-middle font-bold italic text-md">SIGNATURE</td>
                
                {{-- Signature Value (8 cols to reach 11) --}}
                <td colspan="6" class="{{ $sig }} text-center align-middle">
                    @if(empty($govId?->signature))
                        <span class="text-red-500 italic text-[7pt]">(wet signature/e-signature/digital certificate)</span>
                    @else
                        <img src="{{ storage_path('app/public/' . $govId->signature) }}" class="max-h-8 max-w-full mx-auto block">
                    @endif
                </td>

                {{-- Date Label (3 cols to reach 14) --}}
                <td colspan="4" class="{{ $lbl }} text-center border-2 border-black align-middle">DATE</td>
                
                {{-- Date Value (4 cols to reach 18) --}}
                <td colspan="5" class="border-2 border-black align-middle px-2 text-center font-bold">
                    {{ $govId?->date_accomplished ?? '' }}
                </td>
            </tr>
    </table>
    <p class="text-right italic text-[6.5pt] mt-0.5">CS FORM 212 (Revised 2025), Page 3 of 4</p>
</div>


{{-- ══════════════════════════════════════════════════ --}}
{{-- PAGE 4 – Questions / References / Declaration      --}}
{{-- ══════════════════════════════════════════════════ --}}
@php $q=$pds['questions']??null; $refs=$pds['references']??[]; @endphp
<div class="page">
    <table class="border-2 border-black">
    <!-- <colgroup>
        <col style="width:2%"><col style="width:5%"><col style="width:12%"><col style="width:22%">
        <col style="width:3%"><col style="width:25%"><col style="width:4%"><col style="width:6%">
        <col style="width:3%"><col style="width:2%"><col style="width:7%"><col style="width:15%"><col style="width:2%">
    </colgroup> -->

    {{-- Q34 --}}
    <tr style="height:13pt;">
        <td colspan="2" rowspan="3" class="{{ $lbl }} text-center align-middle" style="font-size:8pt;"><strong>34.</strong></td>
        <td colspan="4" class="{{ $lbl }} text-[6.5pt]">Are you related by consanguinity or affinity to the appointing or recommending authority, or to the</td>
        <td colspan="6" rowspan="3" class="align-top p-1 text-[7pt]">
            <div class="mb-1">{!! yN($q?->q34_a) !!}</div>
            <div class="mb-1">{!! yN($q?->q34_b) !!}</div>
            <div class="text-[6pt]">If YES, give details:<br>{{ $q?->q34_details??'' }}</div></td>
            <td rowspan="3" class="{{ $lbl }}"></td>
    </tr>
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
        <td colspan="14" class="{{ $lbl }} align-top text-[6.5pt] px-1">
            41. REFERENCES <span class="text-red-700 font-normal">(Person not related by consanguinity or affinity to applicant/appointee)</span>
        </td>
    </tr>
    <tr style="height:23pt;" class="uppercase">
        <td colspan="6" class="{{ $lbl }} text-center text-[6.5pt]">NAME</td>
        <td colspan="5" class="{{ $lbl }} text-center text-[6.5pt]">OFFICE / RESIDENTIAL ADDRESS</td>
        <td colspan="3" class="{{ $lbl }} text-center text-[6.5pt]">CONTACT NO. AND/OR EMAIL</td>
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
        </td>
    </tr>
    @for($i=0;$i<3;$i++)
    @php $ref=$refs[$i]??null; @endphp
    <tr style="height:17pt;">
        <td colspan="6" class="{{ $val }} text-[6.5pt] px-1">{{ $ref?->name??'' }}</td>
        <td colspan="5" class="{{ $val }} text-[6.5pt] px-1">{{ $ref?->address??'' }}</td>
        <td colspan="3" class="{{ $val }} text-[6.5pt] px-1">{{ $ref?->telephone??'' }}</td>
    </tr>
    @endfor

    {{-- Declaration --}}
    <tr style="height:20pt;">
        <td colspan="14" class="align-top text-[8pt] p-1 text-justify normal-case">
            <div class="flex">
                <span>42.</span><p class="px-2"> I declare under oath that I have personally accomplished this Personal Data Sheet which is a true, correct, and complete statement pursuant to the provisions of pertinent laws, rules, and regulations of the Republic of the Philippines. I authorize the agency head/authorized representative to verify/validate the contents stated herein. I agree that any misrepresentation made in this document and its attachments shall cause the filing of administrative/criminal case/s against me.</p>
            </div>
        </td>
    </tr>

    {{-- Gov't ID + Signature --}}
    <tr style="height:7pt;"><td colspan="19"></td></tr>
    <tr style="height:32pt;" class="border-b-2 border-black">
        <td colspan="7"  class=" align-top p-2 text-[7pt] border-white">
            <div class="border-2 border-black">
                <div class="border-b border-black pb-1 mb-1 bg-gray-100">Government Issued ID <span class="text-[6.5pt]">(i.e. Passport, GSIS, SSS, PRC, Driver's License, etc.)</    span><br><em>PLEASE INDICATE ID Number and Date of Issuance</em></div>
                <div class="border-b border-black py-1 px-0.5">Government Issued ID: {{ $govId?->id_type??'' }}</div>
                <div class="border-b border-black py-1 px-0.5">ID/License/Passport No.: {{ $govId?->id_number??'' }}</div>
                <div class="py-1 pl-0.5">Date/Place of Issuance: {{ ($govId?->date_of_issuance??'').($govId?->place_of_issuance ? ' / '.$govId->place_of_issuance : '') }}</div>
            </div>
        </td>
        <td colspan="7" class="text-center align-middle text-[6.5pt] p-2 border-white">
            <div class="border-2 border-black">
                <div class="max-h-14 min-h-14 flex items-center"> 
                    @if(empty($govId?->signature))
                        <span class="text-red-500 italic text-[7pt]">(wet signature/e-signature/digital certificate)</span>
                    @else
                        <img src="{{ storage_path('app/public/' . $govId->signature) }}" class="max-h-8 max-w-full mx-auto block">
                    @endif
                </div>
                <div class="text-center border-b border-t border-black text-[7pt] py-0.5 bg-gray-100">Signature (Sign inside the box)</div>
                <div class="border-b border-black text-center align-middle text-[7pt] py-1">{{ $govId?->date_accomplished??'' }}</div>
                <div class="text-center text-[7pt] py-0.5 bg-gray-100">Date Accomplished</div>
            </div>
        </td>
        <td colspan="5"  class="text-center align-middle p-1 m-2">
            <div class="border border-black h-20 bg-white"></div>
            <div class="bg-gray-300 border-t border-black text-center p-px text-[6pt]">Right Thumbmark</div>
        </td>
    </tr>

    {{-- Subscribed --}}
    <tr style="height:28pt;">
        <td colspan="19" class="border-2 border-t  border-black border-b-0 text-center align-middle text-[7pt]">
            <span class="uppercase">SUBSCRIBED AND SWORN</span> to before me this _________________________________    , affiant exhibiting his/her validly issued government ID as indicated above.
        </td>
    </tr>
    <tr style="height:53pt;">
        <td colspan="19" class="text-center align-bottom pl-72 py-2 border-t-0">
            <div class="w-full border-black border-2 max-w-72">
                <div class="inline-block  py-4 px-5 text-[7pt] text-red-500 font-bold">(wet signature/e-signature/digital certificate except for notary public)</div><br>
                <div class="text-[7pt] border-t border-black bg-gray-100 py-1">Person Administering Oath</div>
            </div>
        </td>
    </tr>
    </table>
    <p class="text-right italic text-[6.5pt] mt-0.5">CS FORM 212 (Revised 2025), Page 4 of 4</p>
</div>

</body>
</html>