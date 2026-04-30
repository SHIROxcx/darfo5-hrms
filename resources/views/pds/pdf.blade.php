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
                    sans: ['"Arial Narrow"', 'Arial', 'sans-serif'],
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

    body { 
        font-family: "Arial Narrow", Arial, Helvetica, sans-serif; 
        font-size: 7pt; 
        color: #000; 
        background: #fff; 
    }

    .pds_header {
        font-family: Arial !important;
    }

    /* Page dimensions: 8.5in × 13in with padding */
    .page {
        width: 8.5in;
        min-height: 13in;
        padding: 0.2in 0.2in 0.2in 0.2in;
        page-break-after: always;
        background: #fff;
        position: relative;
    }

    .photo-box {
        width: 3.5cm;
        height: 4.5cm;
        border: 2px solid black;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background-color: white;
    }
    .thumb-box {
        width: 4.5cm;
        height: 3.6cm;
        border: 2px solid black;
        margin: 0 auto;
        background-color: white;
    }
    .pds-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        border: 2px solid black;
        border-top: 0px;
    }

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

    /* Custom Checkbox Container */
    .checkbox-container {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    .box {
        width: 12px;
        height: 12px;
        border: 1px solid #000;
        background-color: #fff;
        display: flex;
        align-items: center;
        justify-center: center;
        position: relative;
        transition: all 0.2s;
    }

    /* Checkmark */
    .box.checked::after {
        content: "✓";
        font-size: 9pt;
        font-weight: bold;
        color: #000;
        line-height: 1;
    }

    .photo-box img { width: 100%; height: 100%; object-fit: cover; }

    @page { size: 8.5in 13in; margin: 0; }
</style>
</head>
<body class="font-sans text-black bg-white">

    @php
        $pi       = $pds['personal']            ?? null;
        $fam      = $pds['family']              ?? null;
        $children = $pds['children']            ?? collect();
        $eduList  = collect($pds['education']   ?? []);
        $govId    = $pds['government_id']       ?? null;

        $dob = $pi?->date_of_birth
            ? \Carbon\Carbon::parse($pi->date_of_birth)->format('d/m/Y') : 'N/A';

        $isFil   = !$pi || $pi->citizenship === 'Filipino' || !$pi->citizenship;
        $isDual  = $pi?->citizenship === 'Dual Citizenship';
        $byBirth = $isDual && ($pi?->citizenship_type === 'by_birth');
        $byNat   = $isDual && ($pi?->citizenship_type === 'by_naturalization');

        $cs     = $pi?->civil_status ?? '';
        $csList = ['Single','Married','Widow/er','Separated'];

        // children name
        function chName($ch, $i) { 
            $c = $ch[$i] ?? null; 
            $name = $c ? strtoupper($c->full_name ?? '') : '';
            return $name ?: 'N/A';
        }

        // children date of birth
        function chDob($ch, $i) {
            $c = $ch[$i] ?? null;
            if (!$c || !$c->date_of_birth) return 'N/A';
            return is_string($c->date_of_birth) 
                ? $c->date_of_birth 
                : \Carbon\Carbon::parse($c->date_of_birth)->format('d/m/Y');
        }
        function eduF($list, $level, $field) { $e = $list->firstWhere('level', $level); return $e?->$field ?? 'N/A'; }
        function pDate($v) {
            if (!$v) return 'N/A';
            return is_string($v) ? $v : \Carbon\Carbon::parse($v)->format('d/m/Y');
        }
        function cb($on) { return '<span class="cb ' . ($on ? 'cb-on' : '') . '"></span>'; }

        // Tailwind utilities
        $lbl  = 'bg-gray-100 text-[7pt] uppercase';                                     // label cell
        $val  = 'align-middle text-[7pt] font-semibold';                               // value cell
        $sectionHeader  = 'bg-neutral-400 text-white font-narrow font-black italic text-[10pt] uppercase tracking-wide border-2 border-black py-0';
        $note = 'bg-gray-100 text-center italic text-[7pt] text-red-500 font-bold border-2 border-black'; // continue note
        $sig  = 'border-2 border-black align-middle text-center text-[7pt] font-semibold';

        // Custom checkbox
        function checkbox($checked = false) {
            $checkClass = $checked 
                ? 'bg-white border-black flex items-center justify-center' 
                : 'bg-white border-black flex items-center justify-center';
            
            $mark = $checked 
                ? '<span class="text-[9pt] leading-none font-bold text-black">✓</span>' 
                : '';

            return "
                <div class='inline-flex items-center gap-1 align-middle'>
                    <div class='w-3 h-3 border $checkClass'>
                        $mark
                    </div>
                </div>
            ";
        }
    @endphp

    {{-- ══════════════════════════════════════════════════ --}}
    {{-- PAGE 1 – Personal Info / Family / Education        --}}
    {{-- ══════════════════════════════════════════════════ --}}
    <div class="page">
        {{-- Header --}}
        <table class="border-2 border-b-0 border-black">
            
            <tr>
                <td class="relative p-0.5 text-[6.5pt]">
                    <p class="absolute italic font-bold text-[8pt]">CS Form No. 212<span class="block font-normal text-[7pt]">Revised 2025 <span/></p>
                    <p class="pds_header text-center text-[22pt] font-black tracking-wide my-2">PERSONAL DATA SHEET</p>
                    <p class="text-[8pt] italic font-semibold mb-2"><span class="uppercase">WARNING:</span> Any misrepresentation made in the Personal Data Sheet and the Work Experience Sheet shall cause the filing of administrative/criminal case/s against the person concerned.</p>
                    <p class="text-[8pt] font-semibold italic">READ THE ATTACHED GUIDE TO FILLING OUT THE PERSONAL DATA SHEET (PDS) BEFORE ACCOMPLISHING THE PDS FORM.</p>
                    <p class="text-[8pt] font-light tracking-tight">Print legibly if accomplished through own handwriting. Tick appropriate boxes ({!! cb(false) !!}) and use separate sheet if necessary. Indicate N/A if not applicable. <span class="font-semibold text-[8pt]">DO NOT ABBREVIATE.</span></p>
                </td>
            </tr>
        
        </table>

        <table class="border-2 border-black">

        {{-- Section I Header --}}
        <tr><td colspan="19" class="{{ $sectionHeader }}">I. PERSONAL INFORMATION</td></tr>

        {{-- Name rows --}}
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 border-b-gray-100">1. SURNAME</td>
            <td colspan="16" class="font-semibold text-[8pt] align-middle px-1">{{ strtoupper($user->last_name ?? 'N/A') }}</td>
        </tr>
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 border-b-gray-100">2. FIRST NAME</td>
            <td colspan="11" class="font-semibold text-[8pt] align-middle px-1">{{ strtoupper($user->first_name ?? 'N/A') }}</td>
            <td colspan="5" class="align-start px-1 bg-gray-100 text-[7pt]">
                <span>NAME EXTENSION (JR., SR)</span>
                <span class="font-semibold text-[8pt] align-middle text-end pl-10">{{ strtoupper($user->name_ext ?? 'N/A') }}</span>
            </td>
        </tr>
        <tr style="height:17pt;border-bottom:2px solid #000;">
            <td colspan="3" class="{{ $lbl }} pl-3 px-1">MIDDLE NAME</td>
            <td colspan="16" class="font-semibold text-[8pt] align-middle px-1">{{ strtoupper($user->middle_name ?? 'N/A') }}</td>
        </tr>

        {{-- 3, 4, 5: Birth Info + 16. Citizenship --}}
        <tr style="height:24pt;">
            <td colspan="3" class="{{ $lbl }} px-1">3. DATE OF BIRTH<br><span class="italic lowercase pl-3">(dd/mm/yyyy)</span></td>
            <td colspan="4" class="{{ $val }} px-1 font-semibold">{{ $dob }}</td>
            {{-- Citizenship --}}
            <td colspan="4" rowspan="3" class="{{ $lbl }} text-start align-top text-[8pt] uppercase pt-0">
                16. CITIZENSHIP<br><br>
                <div class="normal-case text-center mt-3 text-[7pt]">If holder of dual citizenship,<br><br>please indicate the details.</div>
            </td>
            <td colspan="8" rowspan="3" class="align-top text-[7pt]">
                <div class="flex gap-2 mb-2 pt-2">
                    <p>{!! checkbox($pi?->citizenship == 'Filipino') !!} <span>Filipino</span></p>
                    <p>{!! checkbox($pi?->citizenship == 'Dual Citizenship') !!} <span>Dual Citizenship</span></p>
                </div>
                <div class="flex gap-2 pl-20 mb-2">
                    <p>{!! checkbox($pi?->citizenship_type == 'by_birth') !!} <span>by birth</span></p>
                    <p>{!! checkbox($pi?->citizenship_type == 'by_naturalization') !!} <span>by naturalization</span></p>
                </div>
                <div class="text-[8pt] pl-24">Pls. indicate country:</div>
                <div class="w-full min-h-5">
                    <select name="dual_contry" id="dual_contry" class="w-full h-7 mt-2 bg-white border border-black px-2 font-semibold uppercase">
                        <option value="" selected>{{ $pi?->citizenship_country ?? 'N/A' }}</option>
                    </select>
                </div>
            </td>
        </tr>
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">4. PLACE OF BIRTH</td>
            <td colspan="4" class="{{ $val }} px-1 font-semibold uppercase">{{ $pi?->birth_place ?? 'N/A' }}</td>
        </tr>
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">5. SEX AT BIRTH</td>
            <td colspan="4" class="align-middle px-1 text-[8pt]">
                <span>{!! checkbox($pi?->sex === 'Male') !!} Male </span>
                <span class="ml-12">{!! checkbox($pi?->sex === 'Female') !!} Female</span>
            </td>
        </tr>

        {{-- 6, 7, 8: Physical Info + 17. Residential Address (Spans 3 Rows) --}}
        <tr style="height:45pt;">
            <td colspan="3" class="{{ $lbl }} align-top px-1">6. CIVIL STATUS</td>
            <td colspan="4" class="align-top p-1 py-1 text-[8pt]">
                <div class="grid grid-cols-2 gap-y-1 gap-x-3">
                    @foreach(['Single', 'Married', 'Widowed', 'Separated'] as $s)
                        <div>{!! checkbox($cs === $s) !!} {{ $s }}</div>
                    @endforeach
                </div>
                <div class="mt-1">{!! checkbox(!in_array($cs, ['Single', 'Married', 'Widowed', 'Separated'])) !!} Other/s: <span class="pl-1">{{ !in_array($cs, ['Single', 'Married', 'Widowed', 'Separated']) ? $cs : '' }}</span></div>
            </td>
            {{-- Residential Address Starts Here --}}
            <td colspan="3" rowspan="3" class="{{ $lbl }} align-top pt-0">17. RESIDENTIAL ADDRESS<br><br><br><br><p class="text-center pt-10">ZIP CODE</p></td>
            <td colspan="9" rowspan="3" class="align-top py-1 px-0 text-[7pt]">
                @foreach([['House/Block/Lot No.', 'Street', $pi?->res_house_no, $pi?->res_street], ['Subdivision/Village', 'Barangay', $pi?->res_subdivision, $pi?->res_barangay], ['City/Municipality', 'Province', $pi?->res_city, $pi?->res_province]] as [$l1, $l2, $v1, $v2])
                    <div class="flex border-b border-black italic">
                        <div class="w-1/2">
                            <div class="text-center h-3 uppercase align-middle font-semibold">{{ $v1 ?? 'N/A' }}</div>
                            <div class="italic text-[7pt] text-center border-t border-black/50">{{ $l1 }}</div>
                        </div>
                        <div class="w-1/2">
                            <div class="text-center h-3 uppercase align-middle font-semibold">{{ $v2 ?? 'N/A' }}</div>
                            <div class="italic text-[7pt] text-center border-t border-black/40">{{ $l2 }}</div>
                        </div>
                    </div>
                @endforeach
                <div class="text-center text-[8pt] font-semibold mt-2">{{ $pi?->res_zipcode ?? 'N/A' }}</div>
            </td>
        </tr>
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">7. HEIGHT (m)</td>
            <td colspan="4" class="{{ $val }}">{{ $pi?->height ?? 'N/A' }}</td>
        </tr>
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">8. WEIGHT (kg)</td>
            <td colspan="4" class="{{ $val }}">{{ $pi?->weight ?? 'N/A' }}</td>
        </tr>

        {{-- 9, 10, 11, 12: IDs + 18. Permanent Address (Spans 4 Rows) --}}
        <tr style="height:17pt;">
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">9. BLOOD TYPE</td>
            <td colspan="4" class="{{ $val }}">{{ $pi?->blood_type ?? 'N/A' }}</td>
            {{-- Permanent Address Starts Here --}}
            <td colspan="3" rowspan="4" class="{{ $lbl }} align-top pt-0">18. PERMANENT ADDRESS<br><br><br><br><p class="text-center pt-10">ZIP CODE</p></td>
            <td colspan="9" rowspan="4" class="align-top py-1 px-0 text-[7pt]">
                @foreach([['House/Block/Lot No.', 'Street', $pi?->perm_house_no, $pi?->perm_street], ['Subdivision/Village', 'Barangay', $pi?->perm_subdivision, $pi?->perm_barangay], ['City/Municipality', 'Province', $pi?->perm_city, $pi?->perm_province]] as [$l1, $l2, $v1, $v2])
                    <div class="flex border-b border-black italic">
                        <div class="w-1/2">
                            <div class="text-center h-3 uppercase align-middle font-semibold">{{ $v1 ?? 'N/A' }}</div>
                            <div class="italic text-[7pt] text-center border-t border-black/40">{{ $l1 }}</div>
                        </div>
                        <div class="w-1/2">
                            <div class="text-center h-3 uppercase align-middle font-semibold">{{ $v2 ?? 'N/A' }}</div>
                            <div class="italic text-[7pt] text-center border-t border-black/40">{{ $l2 }}</div>
                        </div>
                    </div>
                @endforeach
                <div class="text-center text-[8pt] font-semibold mt-2">{{ $pi?->perm_zipcode ?? 'N/A' }}</div>
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
            <td colspan="9" class="{{ $val }} px-1 text-center">{{ $user?->email ?? 'N/A' }}</td>
        </tr>

        {{-- Section II: Family Background --}}
        <tr><td colspan="19" class="{{ $sectionHeader }}">II. FAMILY BACKGROUND</td></tr>

        <tr style="height:16pt;" class="uppercase">
            <td colspan="3" class="{{ $lbl }} px-1 border-b-gray-100">22. SPOUSE'S SURNAME</td>
            <td colspan="7" class="{{ $val }} px-1">{{ strtoupper($fam?->spouse_surname ?? 'N/A') }}</td>
            <td colspan="5" class="{{ $lbl }} align-middle">23. NAME of CHILDREN <span class="normal-case text-[6.5pt]">(Write full name and list all)</span></td>
            <td colspan="4" class="{{ $lbl }} align-middle text-center">DATE OF BIRTH<span class="normal-case text-[6.5pt]"> (dd/mm/yyyy)</span></td>
        </tr>
        <tr style="height:16pt;" class="uppercase">
            <td colspan="3" class="{{ $lbl }} pl-4  border-b-gray-100">FIRST NAME</td>
            <td colspan="4" class="{{ $val }} px-1">{{ strtoupper($fam?->spouse_first_name ?? 'N/A') }}</td>
            <td colspan="3" class="{{ $lbl }}">
                <div>
                    <p>NAME EXTENSION (JR., SR)</p>
                    <p class="text-center font-semibold">{{ strtoupper($fam?->spouse_name_ext ?? 'N/A') }}</p>
                </div>
            </td>
            <td colspan="5" class="{{ $val }} px-1">{{ chName($children, 0) }}</td>
            <td colspan="4" class="{{ $val }} text-center">{{ chDob($children, 0) }}</td>
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
        <tr style="height:16pt;" class="uppercase">
            <td colspan="3" class="{{ $lbl }}  {{ $indent ? 'pl-4' : 'px-4' }}">{{ $rowLbl }}</td>
            <td colspan="7" class="{{ $val }}  px-1">{{ strtoupper($fam?->$field ?? 'N/A') }}</td>
            <td colspan="5" class="{{ $val }}  px-1">{{ chName($children, $chI) }}</td>
            <td colspan="4" class="{{ $val }} text-center">{{ chDob($children, $chI) }}</td>
        </tr>
        @endforeach

        {{-- Father --}}
        <tr style="height:16pt;" class="uppercase">
            <td colspan="3" class="{{ $lbl }} px-1  border-b-gray-100">24. FATHER'S SURNAME</td>
            <td colspan="7" class="{{ $val }} px-1">{{ strtoupper($fam?->father_surname ?? 'N/A') }}</td>
            <td colspan="5" class="{{ $val }}  px-1">{{ chName($children, 6) }}</td>
            <td colspan="4" class="{{ $val }} text-center ">{{ chDob($children, 6) }}</td>
        </tr>
        <tr style="height:16pt;" class="uppercase">
            <td colspan="3" class="{{ $lbl }} pl-4 border-b-gray-100 pt-1">FIRST NAME</td>
            <td colspan="4" class="{{ $val }} px-1">{{ strtoupper($fam?->father_first_name ?? 'N/A') }}</td>
            <td colspan="3" class="{{ $lbl }}">
                <div>
                    <p>NAME EXTENSION (JR., SR)</p>
                    <p class="text-center font-semibold">{{ strtoupper($fam?->father_name_ext ?? 'N/A') }}</p>
                </div>
            </td>
            <td colspan="5" class="{{ $val }} px-1">{{ chName($children, 7) }}</td>
            <td colspan="4" class="{{ $val }} text-center">{{ chDob($children, 7) }}</td>
        </tr>
        <tr style="height:16pt;" class="uppercase">
            <td colspan="3" class="{{ $lbl }} pl-4 ">MIDDLE NAME</td>
            <td colspan="7" class="{{ $val }} px-1">{{ strtoupper($fam?->father_middle_name ?? 'N/A') }}</td>
            <td colspan="5" class="{{ $val }} px-1">{{ chName($children, 8) }}</td>
            <td colspan="4" class="{{ $val }} text-center">{{ chDob($children, 8) }}</td>
        </tr>

        {{-- Mother --}}
        <tr style="height:16pt;" class="uppercase">
            <td colspan="3" class="{{ $lbl }} px-1 border-r-0 border-b-gray-100">25. MOTHER'S MAIDEN NAME</td>
            <td colspan="7" class="bg-gray-100 border-l-0 "></td>
            <td colspan="5" class="{{ $val }} px-1">{{ chName($children, 9) }}</td>
            <td colspan="4" class="{{ $val }} text-center">{{ chDob($children, 9) }}</td>
        </tr>
        @foreach([['SURNAME','mother_surname',false,10],['FIRST NAME','mother_first_name',false,11],['MIDDLE NAME','mother_middle_name',true,null]] as [$mLbl,$mField,$mLast,$mChI])
        <tr style="height:16pt;" class="uppercase">
            <td colspan="3" class="{{ $lbl }} pl-4 border-b-gray-100">{{ $mLbl }}</td>
            @if(!$mLast)
            <td colspan="7" class="{{ $val }} px-1">{{ strtoupper($fam?->$mField ?? 'N/A') }}</td>
            <td colspan="5" class="{{ $val }} px-1">{{ chName($children, $mChI) }}</td>
            <td colspan="4" class="{{ $val }} text-center">{{ chDob($children, $mChI) }}</td>
            @else
            {{-- Mother middle name: last child col replaced by continue note --}}
            <td colspan="7" class="{{ $val }} px-1">{{ strtoupper($fam?->$mField ?? 'N/A') }}</td>
            <td colspan="9" class="{{ $note }} border-none align-middle normal-case">(Continue on separate sheet if necessary)</td>
            @endif
        </tr>
        @endforeach

        {{-- Section III: Education --}}
        <tr><td colspan="19" class="{{ $sectionHeader }}">III. EDUCATIONAL BACKGROUND</td></tr>
        <tr style="height:14pt;" class="uppercase">
            <td colspan="3" rowspan="2" class="{{ $lbl }} align-middle"><span>26.</span> <p class="text-center">LEVEL</p></td>
            <td colspan="4" rowspan="2" class="{{ $lbl }} align-middle text-center">NAME OF SCHOOL<br><span class="normal-case">(Write in full)</span></td>
            <td colspan="4" rowspan="2" class="{{ $lbl }} align-middle text-center">BASIC EDUCATION/DEGREE/COURSE<br><span class="normal-case">(Write in full)</span></td>
            <td colspan="2" class="{{ $lbl }} text-center align-middle py-1 border-x-2 border-black">PERIOD OF ATTENDANCE</td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle text-center">HIGHEST LEVEL/<br>UNITS EARNED<br><span class="normal-case">(if not graduated)</span></td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle text-center">YEAR<br>GRADUATED</td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle text-center">SCHOLARSHIP/<br>ACADEMIC<br>HONORS<br>RECEIVED</td>
        </tr>
        <tr style="height:14pt;" class="text-center">
            <td class="{{ $lbl }} text-[6pt] normal-case border-l-2 border-black">From</td>
            <td class="{{ $lbl }} text-[6pt] normal-case border-r-2 border-black">To</td>
        </tr>
        @foreach([['ELEMENTARY','Elementary'],['SECONDARY','Secondary'],['VOCATIONAL / TRADE COURSE','Vocational'],['COLLEGE','College'],['GRADUATE STUDIES','Graduate Studies']] as [$eLabel,$eKey])
        <tr style="height:22pt;" class="uppercase">
            <td colspan="3" class="{{ $lbl }} px-2 pl-4 align-middle">{{ $eLabel }}</td>
            <td colspan="4" class="{{ $val }} px-1">{{ eduF($eduList, $eKey, 'school_name') }}</td>
            <td colspan="4" class="{{ $val }} px-1">{{ eduF($eduList, $eKey, 'course') }}</td>
            <td class="{{ $val }} border-l-2 border-black text-center">{{ eduF($eduList, $eKey, 'period_from') }}</td>
            <td class="{{ $val }} border-r-2 border-black text-center">{{ eduF($eduList, $eKey, 'period_to') }}</td>
            <td colspan="2" class="{{ $val }} text-center">{{ eduF($eduList, $eKey, 'highest_level') }}</td>
            <td colspan="2" class="{{ $val }} text-center">{{ eduF($eduList, $eKey, 'year_graduated') }}</td>
            <td colspan=2"" class="{{ $val }} text-center">{{ eduF($eduList, $eKey, 'honors_received') }}</td>
        </tr>
        @endforeach
        <tr><td colspan="19" class="{{ $note }}">(Continue on separate sheet if necessary)</td></tr>

        {{-- Page 1 Signature --}}
        <tr style="height:18pt;">
            {{-- Signature Label (3 cols) --}}
            <td colspan="3" class="text-center border-2 border-black align-middle font-black italic text-[10pt] bg-gray-100">SIGNATURE</td>
            
            {{-- Signature Value (8 cols to reach 11) --}}
            <td colspan="8" class="{{ $sig }} text-center align-middle">
                @if(empty($govId?->signature))
                    <span class="text-red-500 italic text-[7pt]">(wet signature/e-signature/digital certificate)</span>
                @else
                    <img src="{{ storage_path('app/public/' . $govId->signature) }}" class="max-h-8 max-w-full mx-auto block">
                @endif
            </td>

            {{-- Date Label --}}
            <td colspan="2" class="text-center border-2 border-black align-middle font-black italic text-[10pt] bg-gray-100">DATE</td>
            
            {{-- Date Value --}}
            <td colspan="6" class="border-2 border-black align-middle px-2 text-center font-bold uppercase">
                {{ $govId?->date_accomplished ? \Carbon\Carbon::parse($govId->date_accomplished)->format('F j, Y') : 'N/A' }}
            </td>
        </tr>
        </table>
        <p class="text-right italic text-[6pt]">CS FORM 212 (Revised 2025), Page 1 of 4</p>
    </div>

{{-- PAGE 2 – Eligibility + Work Experience --}}

<div class="page">
    <table class="border-2 border-black">

        <tr><td colspan="19" class="{{ $sectionHeader }}">IV. CIVIL SERVICE ELIGIBILITY</td></tr>
        <tr style="height:20pt;" >
            <td colspan="8" rowspan="2" class="{{ $lbl }} align-middle uppercase">
                <div class="flex justify-center text-center">
                    <p>27.</p> 
                    <p class="grow">CES/CSEE/CAREER SERVICE/RA 1080 (BOARD/<br>BAR)/UNDER SPECIAL LAWS/CATEGORY II/IV<br>ELIGIBILITY <span class="normal-case">and</span>
                    ELIGIBILITIES FOR UNIFORMED<br> PERSONNEL
                    </p>
                </div>
            </td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle uppercase text-center">RATING<br><span class="normal-case">(If Applicable)</span></td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle text-center">DATE OF EXAMINATION/<br>CONFERMENT</td>
            <td colspan="3" rowspan="2" class="{{ $lbl }} align-middle text-center">PLACE OF EXAMINATION /<br>CONFERMENT</td>
            <td colspan="4" class="{{ $lbl }} align-middle text-center">LICENSE <span class="normal-case">(If Applicable)</span></td>
        </tr>
        <tr style="height:17pt;" class="text-center">
            <td colspan="2" class="{{ $lbl }} align-middle uppercase">NUMBER</td>
            <td colspan="2" class="{{ $lbl }} align-middle normal-case">Valid Until</td>
        </tr>
        @php $eligibilities = $pds['eligibilities'] ?? []; @endphp
        @for($i = 0; $i < 8; $i++)
        @php $el = $eligibilities[$i] ?? null; @endphp
        <tr style="height:22pt;" class="text-center">
            <td colspan="8" class="{{ $val }} px-1">{{ $el?->career_service ?? 'N/A' }}</td>
            <td colspan="2" class="{{ $val }}">{{ $el?->rating ?? 'N/A' }}</td>
            <td colspan="2" class="{{ $val }}">{{ pDate($el?->date_of_examination) }}</td>
            <td colspan="3" class="{{ $val }} px-1">{{ $el?->place_of_examination ?? 'N/A' }}</td>
            <td colspan="2" class="{{ $val }}">{{ $el?->license_number ?? 'N/A' }}</td>
            <td colspan="2" class="{{ $val }}">{{ pDate($el?->license_validity) }}</td>
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
            <td colspan="4" rowspan="2" class="{{ $lbl }} align-middle">
                <div class="flex justify-center text-center">
                    <p>28. </p>
                    <p class="grow">INCLUSIVE DATES<br><span class="normal-case">(dd/mm/yyyy)</span></p></td>
                </div>
            <td colspan="6" rowspan="3" class="{{ $lbl }} align-middle text-center">POSITION TITLE<br><span class="normal-case">(Write in full/Do not abbreviate)</span></td>
            <td colspan="5" rowspan="3" class="{{ $lbl }} align-middle text-center">DEPARTMENT / AGENCY / OFFICE / COMPANY <br><span class="normal-case">(Write in full/Do not abbreviate)</span> </td>
            <td colspan="2" rowspan="3" class="{{ $lbl }} align-middle text-center">STATUS OF APPOINTMENT</td>
            <td colspan="2" rowspan="3" class="{{ $lbl }} align-middle text-center">GOV'T SERVICE <br>(Y/N)</td>
        </tr>
        <tr style="height:17pt;"></tr>
        <tr style="height:15pt;" class="text-center ">
            <td colspan="2" class="{{ $lbl }} normal-case">From</td>
            <td colspan="2" class="{{ $lbl }} normal-case">To</td>
        </tr>
        @php $workExp = $pds['work_experience'] ?? []; @endphp
        @for($i = 0; $i < 28; $i++)
        @php $we = $workExp[$i] ?? null; @endphp
        <tr style="height:19pt;" class="uppercase text-center">
            <td colspan="2" class="{{ $val }}">{{ pDate($we?->date_from) }}</td>
            <td colspan="2" class="{{ $val }}">@if($we?->is_present)<em>Present</em>@else{{ pDate($we?->date_to) }}@endif</td>
            <td colspan="6" class="{{ $val }} px-1">{{ $we?->position_title ?? 'N/A' }}</td>
            <td colspan="5" class="{{ $val }} px-1">{{ $we?->department ?? 'N/A' }}</td>
            <td colspan="2" class="{{ $val }} px-1">{{ $we?->status_of_appointment ?? 'N/A' }}</td>
            <td colspan="2" class="{{ $val }}">{{ $we ? ($we->is_government_service ? 'Y' : 'N') : 'N/A' }}</td>
        </tr>
        @endfor
        <tr><td colspan="19" class="{{ $note }}">(Continue on separate sheet if necessary)</td></tr>

        {{-- Page 2 Signature --}}
        <tr style="height:20pt;" class="text-center">
            {{-- Signature Label (3 cols) --}}
            <td colspan="4" class="border-2 border-black align-middle font-black italic text-[10pt] bg-gray-100">SIGNATURE</td>
            
            {{-- Signature Value (8 cols to reach 11) --}}
            <td colspan="7" class="{{ $sig }} align-middle">
                @if(empty($govId?->signature))
                    <span class="text-red-500 italic text-[7pt]">(wet signature/e-signature/digital certificate)</span>
                @else
                    <img src="{{ storage_path('app/public/' . $govId->signature) }}" class="max-h-8 max-w-full mx-auto block">
                @endif
            </td>

            {{-- Date Label --}}
            <td colspan="4" class="border-2 border-black align-middle font-black italic text-[10pt] bg-gray-100">DATE</td>
            
            {{-- Date Value --}}
            <td colspan="4" class="border-2 border-black align-middle px-2 font-bold uppercase">
                {{ $govId?->date_accomplished ? \Carbon\Carbon::parse($govId->date_accomplished)->format('F j, Y') : 'N/A' }}
            </td>
        </tr>
    </table>
    <p class="text-right italic text-[6pt]">CS FORM 212 (Revised 2025), Page 2 of 4</p>
</div>


{{-- ══════════════════════════════════════════════════ --}}
{{-- PAGE 3 – Voluntary Work / Trainings / Other Info  --}}
{{-- ══════════════════════════════════════════════════ --}}
<div class="page">
    <table class="border-2 border-black">

    <tr><td colspan="20" class="{{ $sectionHeader }}">VI. VOLUNTARY WORK OR INVOLVEMENT IN CIVIC / NON-GOVERNMENT / PEOPLE / VOLUNTARY ORGANIZATIONS</td></tr>
    <tr style="height:18pt;" class="text-center">
        <td colspan="7" rowspan="2" class="{{ $lbl }} align-middle">
            <div class="flex justify-center">
                <p>29.</p> 
                <p class="grow">NAME &amp; ADDRESS OF ORGANIZATION<br><span class="normal-case">(Write in full)</span></p></td>
            </div>
        <td colspan="4" class="{{ $lbl }} py-1">INCLUSIVE DATES<br><span class="normal-case">(dd/mm/yyyy)</span></td>
        <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle">NUMBER OF<br> HOURS</td>
        <td colspan="7" rowspan="2" class="{{ $lbl }} align-middle">POSITION / NATURE OF WORK</td>
    </tr>
    <tr style="height:13pt;" class="{{ $lbl }} text-center normal-case">
        <td colspan="2">From</td>
        <td colspan="2">To</td>
    </tr>
    @php $volWork = $pds['voluntary_work'] ?? []; @endphp
    @for($i=0;$i<7;$i++)
    @php $vw=$volWork[$i]??null; @endphp
    <tr style="height:20pt;" class="text-center">
        <td colspan="7" class="{{ $val }} px-1">
            @if($vw && ($vw->organization_name || $vw->organization_address))
                {{ $vw->organization_name }}
                {{ ($vw->organization_name && $vw->organization_address) ? ', ' : '' }}
                {{ $vw->organization_address }}
            @else
                N/A
            @endif
        </td>
        <td colspan="2" class="{{ $val }}">{{ pDate($vw?->date_from) }}</td>
        <td colspan="2" class="{{ $val }}">{{ pDate($vw?->date_to) }}</td>
        <td colspan="2" class="{{ $val }}">{{ $vw?->number_of_hours?? 'N/A' }}</td>
        <td colspan="7" class="{{ $val }}">{{ $vw?->position?? 'N/A' }}</td>
    </tr>
    @endfor
    <tr><td colspan="20" class="{{ $note }}">(Continue on separate sheet if necessary)</td></tr>

    <tr><td colspan="20" class="{{ $sectionHeader }}">VII. LEARNING AND DEVELOPMENT (L&amp;D) INTERVENTIONS/TRAINING PROGRAMS ATTENDED</td></tr>
    <tr style="height:18pt;" class="text-center">
        <td colspan="7" rowspan="2" class="{{ $lbl }} align-middle">
            <div class="flex justify-center">
                <p>30.</p> 
                <p class="grow">TITLE OF LEARNING AND DEVELOPMENT INTERVENTIONS/<br>TRAINING PROGRAMS <span class="normal-case block">(Write in full)</span></p>
            </div>
        <td colspan="4" class="{{ $lbl }}">INCLUSIVE DATES OF <br>ATTENDANCE<br><span class="normal-case">(dd/mm/yyyy)</span></td>
        <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle">NUMBER OF<br> HOURS</td>
        <td colspan="2" rowspan="2" class="{{ $lbl }}align-middle">Type of L&amp;D<br><span class="normal-case">(Managerial/<br>Supervisory/<br>Technical/etc)</span></td>
        <td colspan="5" rowspan="2" class="{{ $lbl }} align-middle">CONDUCTED/ SPONSORED BY<br><span class="normal-case">(Write in full)</span></td>
    </tr>
    <tr style="height:13pt;" class="{{ $lbl }} text-center normal-case">
        <td colspan="2">From</td>
        <td colspan="2">To</td>
    </tr>
    @php $trainings=$pds['trainings']??[]; @endphp
    @for($i=0;$i<21;$i++)
    @php $tr=$trainings[$i]??null; @endphp
    <tr style="height:19pt;" class="{{ $val }} uppercase text-center">
        <td colspan="7" class="px-1 align-middle">{{ $tr?->title?? 'N/A' }}</td>
        <td colspan="2" class="align-middle">  {{ pDate($tr?->date_from) }}</td>
        <td colspan="2" class="align-middle">  {{ pDate($tr?->date_to) }}</td>
        <td colspan="2" class="align-middle">  {{ $tr?->number_of_hours ?? 'N/A' }}</td>
        <td colspan="2" class="align-middle">  {{ $tr?->type_of_ld ?? 'N/A' }}</td>
        <td colspan="5" class="px-1 align-middle">{{ $tr?->conducted_by ?? 'N/A' }}</td>
    </tr>
    @endfor
    <tr><td colspan="20" class="{{ $note }}">(Continue on separate sheet if necessary)</td></tr>

    <tr><td colspan="20" class="{{ $sectionHeader }}">VIII. OTHER INFORMATION</td></tr>
    <tr style="height:33pt;" class="text-center">
        <td colspan="5" class="{{ $lbl }} align-middle">
            <div class="flex justify-center">
                <p>31.</p> 
                <p class="grow">SPECIAL SKILLS and HOBBIES</p></td>
            </div>
        <td colspan="10" class="{{ $lbl }} align-middle">
            <div class="flex justify-center">
                <span>32.</span> 
                <div class="text-center grow">
                    <p>NON-ACADEMIC DISTINCTIONS / RECOGNITION</p>
                    <p class="normal-case">(Write in full)</p>
                </div>
            </div>
        </td>
        <td colspan="5" class="{{ $lbl }} align-middle">
            <div class="flex">
                <span>33.</span> 
                <div>
                    <p>MEMBERSHIP IN ASSOCIATION/ORGANIZATION</p>
                    <p class="normal-case">(Write in full)</p>
                </div>
            </div>
        </td>
    </tr>
    @php $oi=$pds['other_info']??null; $skills=$oi?->special_skills??[]; $distinctions=$oi?->non_academic_distinctions??[]; $memberships=$oi?->organization_memberships??[]; @endphp
    @for($i=0;$i<7;$i++)
    <tr style="height:19pt;" class="text-center">
        <td colspan="5" class="{{ $val }} px-1">{{ $skills[$i]?? 'N/A' }}</td>
        <td colspan="10" class="{{ $val }} px-1">{{ $distinctions[$i]?? 'N/A' }}</td>
        <td colspan="5" class="{{ $val }} px-1">{{ $memberships[$i]?? 'N/A' }}</td>
    </tr>
    @endfor
    <tr><td colspan="20" class="{{ $note }}">(Continue on separate sheet if necessary)</td></tr>

    {{-- Page 3 Signature --}}
        <tr style="height:22pt;">
            {{-- Signature Label (3 cols) --}}
            <td colspan="5" class="text-center border-2 border-black align-middle font-black italic text-[10pt] bg-gray-100">SIGNATURE</td>
            
            {{-- Signature Value (8 cols to reach 11) --}}
            <td colspan="6" class="{{ $sig }} text-center align-middle">
                @if(empty($govId?->signature))
                    <span class="text-red-500 italic text-[7pt]">(wet signature/e-signature/digital certificate)</span>
                @else
                    <img src="{{ storage_path('app/public/' . $govId->signature) }}" class="max-h-8 max-w-full mx-auto block">
                @endif
            </td>

            {{-- Date Label (3 cols to reach 14) --}}
             <td colspan="4" class="text-center border-2 border-black align-middle font-black italic text-[10pt] bg-gray-100">DATE</td>
            
            {{-- Date Value (4 cols to reach 18) --}}
            <td colspan="5" class="border-2 border-black align-middle px-2 text-center font-bold uppercase">
                {{ $govId?->date_accomplished ? \Carbon\Carbon::parse($govId->date_accomplished)->format('F j, Y') : 'N/A' }}
            </td>
        </tr>
    </table>
    <p class="text-right italic text-[6pt]">CS FORM 212 (Revised 2025), Page 3 of 4</p>
</div>


{{-- ══════════════════════════════════════════════════ --}}
{{-- PAGE 4 – Questions / References / Declaration      --}}
{{-- ══════════════════════════════════════════════════ --}}
@php $q=$pds['questions']??null; $refs=$pds['references']??[]; @endphp
<div class="page">
    <table class="border-2 border-black">
        {{-- Q34 --}}
        <tr style="height:13pt;">
            <td colspan="11" class="text-[8pt] bg-gray-100">
                <div class="flex normal-case">
                    <span>34.</span>
                    <p class="px-1">Are you related by consanguinity or affinity to the appointing or recommending authority, or to the chief of bureau or office or to the person who has immediate supervision over you in the Office, Bureau or Department where you will be appointed,</p>
                </div>
                <div class="px-4 normal-case space-y-2">
                    <p>a. within the third degree?</p>
                    <p>b. within the fourth degree (for Local Government Unit - Career Employees)?</p>
                </div>
                <div class="py-3"></div>
            </td>
            <td colspan="8" class="align-bottom p-2 text-[8pt]">
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q34_a === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>

                    <div class="checkbox-container">
                        <div class="box {{ $q?->q34_a === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q34_b === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>

                    <div class="checkbox-container">
                        <div class="box {{ $q?->q34_b === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="text-[7pt]">
                    <p>If YES, give details:</p>
                    <p class="border-b border-black h-4 mx-2 font-semibold">{{ $q?->q34_details?? '' }}</p>
                </div>
            </td>
        </tr>
        
        {{-- Q35 --}}
        <tr style="height:18pt;">
            <td colspan="11" class=" text-[8pt] bg-gray-100">
                <div class="flex normal-case">
                    <span>35.</span>
                    <p class="px-1">a. Have you ever been found guilty of any administrative offense?</p>
                </div>
                <div class="px-4 normal-case my-14">
                    <p>b. Have you been criminally charged before any court?</p>
                </div>
            </td>
            <td colspan="8" class="align-top text-[8pt]">
                <div class="mb-2 border-b border-black p-2 pb-1">
                    <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q35_a === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q35_a === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                    <div class=" flex flex-col text-[7pt] mb-1">
                        <p>If YES, give details: </p>
                        <p class="border-b border-black h-4 mx-2 font-semibold">{{ $q?->q35_a_details?? '' }}</p>
                    </div>
                </div>
                <div class="mb-2 p-2 pb-0">
                    <div class="flex items-center gap-10 mb-1">
                        <div class="checkbox-container">
                            <div class="box {{ $q?->q35_b === true ? 'checked' : '' }}"></div>
                            <span class="text-[7pt]">YES</span>
                        </div>

                        <div class="checkbox-container">
                            <div class="box {{ $q?->q35_b === false ? 'checked' : '' }}"></div>
                            <span class="text-[7pt]">NO</span>
                        </div>
                    </div>
                    <div class="text-[7pt] space-y-1">
                        <p>If YES, give details: </p>
                        <p>{{ $q?->q35_b_details??'' }}</p>
                        <div class="flex ml-5">
                            <p class="shrink-0">Date Filed:</p> 
                            <p class="border-b border-black w-full mx-2 font-semibold">{{ $q?->q35_b_date??'' }}</p>
                        </div>
                        <div class="flex">
                            <span class="shrink-0">Status of Case/s: </span>
                            <p class="border-b border-black mx-2 w-full font-semibold">{{ $q?->q35_b_status??'' }}</p>
                        </div>
                    </div>
                </div>
            </td>
        </tr>

        {{-- Q36 --}}
        <tr style="height:18pt;">
            <td colspan="11" class="text-[8pt] bg-gray-100">
                <div class="flex normal-case mb-8">
                    <p>36.</p>
                    <p class="px-2">Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?</p>
                </div>
            </td>
            <td colspan="8" class="align-top p-2 text-[8pt]">
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q36 === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q36 === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="text-[7pt]">
                    <p>If YES, give details:</p> 
                    <p class="border-b border-black h-4 mx-2 font-semibold">{{ $q?->q36_details??'' }}</p>
                </div>
            </td>
        </tr>

        {{-- Q37 (separation) --}}
        <tr style="height:14pt;">
            <td colspan="11" class="text-[8pt] bg-gray-100">
                <div class="flex normal-case mb-2">
                    <p>37.</p>
                    <p class="px-2">Have you ever been separated from the service in any of the following modes: resignation, retirement, dropped from the rolls, dismissal, termination, end of term, finished contract or phased out (abolition) in the public or private sector?</p>
                </div>
            </td>
            <td colspan="8" class="align-top p-2 text-[8pt]">
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q37 === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q37 === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="text-[7pt]">
                    <p>If YES, give details: </p>
                    <p class="border-b border-black h-4 mx-2 font-semibold">{{ $q?->q37_details??'' }}</p>
                </div>
            </td>
        </tr>

        {{-- Q38 (candidacy) --}}
        <tr style="height:18pt;">
            <td colspan="11" class="text-[8pt] bg-gray-100">
                <div class="flex normal-case mb-3">
                    <p>38.</p>
                    <p class="px-1">a. Have you ever been a candidate in a national or local election held within the last year (except Barangay election)?</p>
                </div>
                <div class="px-4 normal-case mb-2">
                    <p>b. Have you resigned from the government service during the three (3)-month period before the last election to promote/actively campaign for a national or local candidate?</p>
                </div>
            </td>
            <td colspan="8" class="align-top p-2 text-[8pt]">
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q38_a === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q38_a === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="flex gap-1 text-[7pt] mb-1">
                    <p class="shrink-0">If YES, give details:</p> 
                    <p class="border-b border-black h-4 mr-2 w-full font-semibold">{{ $q?->q38_a_details??'' }}</p>
                </div>
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q38_b === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q38_b === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="flex gap-1 text-[7pt]">
                    <p class="shrink-0">If YES, give details: </p>
                    <p class="border-b border-black h-4 mr-2 w-full font-semibold">{{ $q?->q38_b_details??'' }}</p>
                </div>
            </td>
         </tr>

        {{-- Q39 --}}
        <tr style="height:18pt;">
            <td colspan="11" class="text-[8pt] bg-gray-100">
                <div class="flex normal-case">
                    <p>39.</p>
                    <p class="px-1">Have you acquired the status of an immigrant or permanent resident of another country?</p>
                </div>
            </td>
            <td colspan="8" class="align-top p-2 text-[8pt]">
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q39 === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q39 === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="text-[7pt]">
                    <p>If YES, give details (country): </p>
                    <p class="border-b border-black h-4 mx-2 font-semibold">{{ $q?->q39_details??'' }}</p>
                </div>
            </td>
        </tr>

        {{-- Q40 --}}
        <tr style="height:45pt;">
            <td colspan="11" class="text-[8pt] align-top bg-gray-100">
                <div class="flex normal-case">
                    <p>40.</p>
                    <p class="px-2">Pursuant to: (a) Indigenous People's Act (RA 8371); (b) Magna Carta for Disabled Persons (RA 7277, as ammended); and (c) Expanded Solo Parents Welfare Act (RA 11861), please answer the following items:</p>
                </div>
                <div class="normal-case space-y-5 mb-6">
                    <div class="flex">
                        <p>a.</p>
                        <p class="px-4">Are you a member of any indigenous group?</p>
                    </div>
                    <div class="flex">
                        <p>b.</p>
                        <p class="px-4">Are you a person with disability?</p>
                    </div>
                    <div class="flex">
                        <p>c.</p>
                        <p class="px-4">Are you a solo parent?</p>
                    </div>
                </div>
            </td>
            <td colspan="8" class="align-bottom p-2 text-[7=8pt]">
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q40_a === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q40_a === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="flex gap-1 text-[7pt] mb-1">
                    <p class="shrink-0">If YES, specify: </p>
                    <p class="border-b border-black ml-8 mr-2 w-full font-semibold h-3">{{ $q?->q40_a_details??'' }}</p>
                </div>
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q40_b === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q40_b === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="flex gap-1 text-[7pt] mb-1">
                    <p class="shrink-0">If YES, specify ID No: </p>
                    <p class="border-b border-black ml-1 mr-2 w-full font-semibold h-3">{{ $q?->q40_b_details??'' }}</p>
                </div>
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q40_c === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q40_c === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="flex gap-1 text-[7pt]">
                    <p class="shrink-0">If YES, specify ID No: </p>
                    <p class="border-b border-black ml-1 mr-2 w-full font-semibold h-3">{{ $q?->q40_c_details??'' }}</p>
                </div>
            </td>
        </tr>

        {{-- 41. REFERENCES + PHOTO --}}
        <tr style="height:18pt;">
            <td colspan="14" class="text-[8pt] p-1 border-b-0 border-t-2 border-black bg-gray-100">
                41. REFERENCES <span class="font-semibold normal-case text-[7pt]">(Person not related by consanguinity or affinity to applicant/appointee)</span>
            </td>
            <td colspan="5" rowspan="6" class="text-center align-middle border-b-0 border-l-2 border-t-2 border-black">
                <div class="photo-box mt-5">
                    @if(!empty($govId?->passport_photo))
                        <img src="{{ storage_path('app/public/' . $govId->passport_photo) }}" class="w-full h-full object-cover">
                    @else
                        <span class="text-[6.5pt] text-gray-600 p-1 normal-case font-semibold leading-tight">
                            Passport-sized unfiltered <br> digital picture taken within <br> the last 6 months <br> 4.5 cm X 3.5 cm
                        </span>
                    @endif
                </div>
                <p class="text-[8pt] text-center mt-2 text-gray-400">PHOTO</p>
            </td>
        </tr>

        <tr style="height:20pt;" class="uppercase text-center">
            <td colspan="6" class="{{ $lbl }} text-[7pt] border-y align-middle">NAME</td>
            <td colspan="5" class="{{ $lbl }} text-[7pt] border-y align-middle">OFFICE / RESIDENTIAL ADDRESS</td>
            <td colspan="3" class="{{ $lbl }} text-[7pt] border-y align-middle">CONTACT NO. <br> AND/OR EMAIL</td>
        </tr>

        @for($i=0; $i<3; $i++)
        @php $ref = $refs[$i] ?? null; @endphp
        <tr style="height:20pt;">
            <td colspan="6" class="{{ $val }} uppercase text-[6.5pt] px-1 border-y">{{ $ref?->name ?? 'N/A' }}</td>
            <td colspan="5" class="{{ $val }} uppercase text-[6.5pt] px-1 border-y">{{ $ref?->address ?? 'N/A' }}</td>
            <td colspan="3" class="{{ $val }} text-[6.5pt] px-1 border-y">{{ $ref?->telephone ?? 'N/A' }}</td>
        </tr>
        @endfor

        {{-- 42. DECLARATION + THUMBMARK (Start) --}}
        <tr style="height:22pt;">
            <td colspan="14" class="align-top text-[8pt] p-1 text-justify normal-case border-b-black border-2 bg-gray-100">
                <div class="flex">
                    <span>42.</span>
                    <p class="px-2 leading-tight">
                        I declare under oath that I have personally accomplished this Personal Data Sheet which is a true, correct, and complete statement pursuant to the provisions of pertinent laws, rules, and regulations of the Republic of the Philippines. I authorize the agency head/authorized representative to verify/validate the contents stated herein. I agree that any misrepresentation made in this document and its attachments shall cause the filing of administrative/criminal case/s against me.
                    </p>
                </div>
            </td>
        </tr>

        {{-- GOV ID & SIGNATURE --}}
        <tr>
            {{-- ID Block --}}
            <td colspan="7" class="align-top p-2 py-1.5 border-0 border-r-0">
                <div class="border-2 border-black h-full">
                    <div class="bg-gray-100 border-b border-black p-1 text-[8pt] leading-tight">
                        Government Issued ID <span class="text-[7pt] font-normal">(i.e. Passport, GSIS, SSS, PRC, Driver's License, etc.)</span><br>
                        <span class="italic">PLEASE INDICATE ID Number and Date of Issuance</span>
                    </div>
                    <div class="py-2 text-[7pt] border-b border-black">Government Issued ID: <span class="font-semibold uppercase">{{ $govId?->id_type ?? 'N/A' }}</span></div>
                    <div class="py-2 text-[7pt] border-b border-black">ID/License/Passport No.: <span class="font-semibold uppercase">{{ $govId?->id_number ?? 'N/A' }}</span></div>
                    <div class="py-2 text-[7pt]">Date/Place of Issuance: <span class="font-semibold uppercase">{{ ($govId?->date_of_issuance ?? '').($govId?->place_of_issuance ? ' / '.$govId->place_of_issuance : 'N/A') }}</span></div>
                </div>
            </td>
            {{-- Signature Block --}}
            <td colspan="7" class="align-top p-2 py-1.5 pr-0 border-t-0 border-r-0 border-l-0">
                <div class="border-2 border-black h-full flex flex-col">
                    <div class="grow flex items-center justify-center p-1 min-h-20">
                        @if(empty($govId?->signature))
                            <span class="text-red-500 text-[7pt] text-center leading-tight">(wet signature/e-signature/digital certificate)</span>
                        @else
                            <img src="{{ storage_path('app/public/' . $govId->signature) }}" class="max-h-14">
                        @endif
                    </div>
                    <div class="bg-gray-100 border-t border-b border-black text-center py-0.5 text-[7pt]">Signature (Sign inside the box)</div>
                    <div class="text-center py-1 text-[7pt] min-h-[14pt] uppercase">{{ $govId?->date_accomplished ? \Carbon\Carbon::parse($govId->date_accomplished)->format('F j, Y') : 'N/A' }}</div>
                    <div class="bg-gray-100 border-t border-black text-center py-0.5 text-[7pt] ">Date Accomplished</div>
                </div>
            </td>

            {{-- Thumbmark Rowspan starts here --}}
            <td colspan="5" class="text-center align-middle p-2 border-l-0 border-t-0 border-b-black">
                <div class="thumb-box flex flex-col">
                    <div class="grow bg-white"></div>
                    <div class="bg-gray-100 border-t border-black text-center py-0.5 text-[7pt]">
                        Right Thumbmark
                    </div>
                </div>
            </td>
        </tr>

        {{-- SUBSCRIBED AND SWORN --}}
        <tr>
            <td colspan="19" class="text-center p-3 text-[7.5pt] border-b-0 border-2 border-black">
                <span class="uppercase">SUBSCRIBED AND SWORN</span> to before me this <span class="px-16 border-b border-black"></span>, affiant exhibiting his/her validly issued government ID as indicated above.
            </td>
        </tr>

        {{-- PERSON ADMINISTERING OATH --}}
        <tr>
            <td colspan="19" class="p-4 pt-0 border-t-0">
                <div class="ml-60 w-full max-w-[235pt] border-2 border-black">
                    <div class="py-8 text-center text-red-500 text-[7pt] leading-tight font-bold">
                        (wet signature/e-signature/digital certificate except for notary public)
                    </div>
                    <div class="bg-gray-100 border-t border-black text-center py-1 text-[7pt] normal-case">
                        Person Administering Oath
                    </div>
                </div>
            </td>
        </tr>
    </table>
    <div class="text-right italic text-[6.5pt]">CS FORM 212 (Revised 2025), Page 4 of 4</div>
</div>

</body>
</html>