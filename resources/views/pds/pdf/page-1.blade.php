@use('App\Support\PdsFormat')
@php
    $pi       = $pds['personal']            ?? null;
    $fam      = $pds['family']              ?? null;
    $children = $sections['children']['main'];
    $eduList  = $sections['education']['main'];

    $dob = PdsFormat::date($pi?->date_of_birth);

    $isFil   = !$pi || $pi->citizenship === 'Filipino' || !$pi->citizenship;
    $isDual  = $pi?->citizenship === 'Dual Citizenship';
    $byBirth = $isDual && ($pi?->citizenship_type === 'by_birth');
    $byNat   = $isDual && ($pi?->citizenship_type === 'by_naturalization');

    $cs     = $pi?->civil_status ?? '';
    $csList = ['Single','Married','Widow/er','Separated'];

    // Closures, not named functions: this partial is included, and a named PHP function can be declared only once per process.
    $chName = function ($ch, $i) {
        $c = $ch[$i] ?? null;
        $name = $c ? strtoupper($c->full_name ?? '') : '';
        return $name ?: 'N/A';
    };
    $chDob = function ($ch, $i) {
        $c = $ch[$i] ?? null;
        return PdsFormat::date($c?->date_of_birth);
    };
    $eduF = function ($list, $level, $field) {
        $e = $list->firstWhere('level', $level);
        return $e?->$field ?? 'N/A';
    };
@endphp
    {{-- ══════════════════════════════════════════════════ --}}
    {{-- PAGE 1 – Personal Info / Family / Education        --}}
    {{-- ══════════════════════════════════════════════════ --}}
    <div class="page">
        {{-- Header --}}
        <table class="border-2 border-b-0 border-black">
            
            <tr>
                <td class="relative p-0.5 text-[6.5pt]">
                    <p class="absolute italic font-bold text-[8pt]">CS Form No. 212<span class="block font-normal text-[7pt]">Revised 2026 <span/></p>
                    <p class="pds_header text-center text-[22pt] font-black tracking-wide my-2">PERSONAL DATA SHEET</p>
                    <p class="text-[8pt] italic font-semibold mb-2"><span class="uppercase">WARNING:</span> Any misrepresentation made in the Personal Data Sheet and the Work Experience Sheet shall cause the filing of administrative/criminal case/s against the person concerned.</p>
                    <p class="text-[8pt] font-semibold italic">READ THE ATTACHED GUIDE TO FILLING OUT THE PERSONAL DATA SHEET (PDS) BEFORE ACCOMPLISHING THE PDS FORM.</p>
                    <p class="text-[8pt] font-light tracking-tight">Tick appropriate boxes (<span class="cb"></span>) and use separate sheet if necessary. Indicate N/A if not applicable. <span class="text-[8pt]">DO NOT ABBREVIATE.</span></p>
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
                    <p>{!! PdsFormat::checkbox($pi?->citizenship == 'Filipino') !!} <span>Filipino</span></p>
                    <p>{!! PdsFormat::checkbox($pi?->citizenship == 'Dual Citizenship') !!} <span>Dual Citizenship</span></p>
                </div>
                <div class="flex gap-2 pl-20 mb-2">
                    <p>{!! PdsFormat::checkbox($pi?->citizenship_type == 'by_birth') !!} <span>by birth</span></p>
                    <p>{!! PdsFormat::checkbox($pi?->citizenship_type == 'by_naturalization') !!} <span>by naturalization</span></p>
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
                <span>{!! PdsFormat::checkbox($pi?->sex === 'Male') !!} Male </span>
                <span class="ml-12">{!! PdsFormat::checkbox($pi?->sex === 'Female') !!} Female</span>
            </td>
        </tr>

        {{-- 6, 7, 8: Physical Info + 17. Residential Address (Spans 3 Rows) --}}
        <tr style="height:45pt;">
            <td colspan="3" class="{{ $lbl }} align-top px-1">6. CIVIL STATUS</td>
            <td colspan="4" class="align-top p-1 py-1 text-[8pt]">
                <div class="grid grid-cols-2 gap-y-1 gap-x-3">
                    @foreach(['Single', 'Married', 'Widowed', 'Separated'] as $s)
                        <div>{!! PdsFormat::checkbox($cs === $s) !!} {{ $s }}</div>
                    @endforeach
                </div>
                <div class="mt-1">{!! PdsFormat::checkbox(!in_array($cs, ['Single', 'Married', 'Widowed', 'Separated'])) !!} Other/s: <span class="pl-1">{{ !in_array($cs, ['Single', 'Married', 'Widowed', 'Separated']) ? $cs : '' }}</span></div>
            </td>
            {{-- Residential Address Starts Here --}}
            <td colspan="3" rowspan="3" class="{{ $lbl }} align-top pt-0">17. RESIDENTIAL ADDRESS<br><br><br><br><p class="text-center pt-10">ZIP CODE</p></td>
            <td colspan="9" rowspan="3" class="align-top px-0 text-[7pt]">
                @foreach([['House/Block/Lot No.', 'Street', $pi?->res_house_no, $pi?->res_street], ['Subdivision/Village', 'Barangay', $pi?->res_subdivision, $pi?->res_barangay], ['City/Municipality', 'Province', $pi?->res_city, $pi?->res_province]] as [$l1, $l2, $v1, $v2])
                    <div class="flex border-b border-black italic">
                        <div class="w-1/2">
                            <div class="text-center h-3 uppercase align-middle font-semibold border-r border-black">{{ $v1 ?? 'N/A' }}</div>
                            <div class="italic text-[7pt] text-center border-t border-black/50 border-r border-r-black">{{ $l1 }}</div>
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
            <td colspan="9" rowspan="4" class="align-top px-0 text-[7pt]">
                @foreach([['House/Block/Lot No.', 'Street', $pi?->perm_house_no, $pi?->perm_street], ['Subdivision/Village', 'Barangay', $pi?->perm_subdivision, $pi?->perm_barangay], ['City/Municipality', 'Province', $pi?->perm_city, $pi?->perm_province]] as [$l1, $l2, $v1, $v2])
                    <div class="flex border-b border-black italic">
                        <div class="w-1/2">
                            <div class="text-center h-3 uppercase align-middle font-semibold border-r border-r-black">{{ $v1 ?? 'N/A' }}</div>
                            <div class="italic text-[7pt] text-center border-t border-black/40 border-r border-r-black">{{ $l1 }}</div>
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
            <td colspan="3" class="{{ $lbl }} px-1 align-middle">13. PhilSys Card Number (PCN):</td>
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
        <tr style="height:16pt;" class="uppercase" data-row="child">
            <td colspan="3" class="{{ $lbl }} pl-4  border-b-gray-100">FIRST NAME</td>
            <td colspan="4" class="{{ $val }} px-1">{{ strtoupper($fam?->spouse_first_name ?? 'N/A') }}</td>
            <td colspan="3" class="{{ $lbl }}">
                <div>
                    <p>NAME EXTENSION (JR., SR)</p>
                    <p class="text-center font-semibold">{{ strtoupper($fam?->spouse_name_ext ?? 'N/A') }}</p>
                </div>
            </td>
            <td colspan="5" class="{{ $val }} px-1">{{ $chName($children, 0) }}</td>
            <td colspan="4" class="{{ $val }} text-center">{{ $chDob($children, 0) }}</td>
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
        <tr style="height:16pt;" class="uppercase" data-row="child">
            <td colspan="3" class="{{ $lbl }}  {{ $indent ? 'pl-4' : 'px-4' }}">{{ $rowLbl }}</td>
            <td colspan="7" class="{{ $val }}  px-1">{{ strtoupper($fam?->$field ?? 'N/A') }}</td>
            <td colspan="5" class="{{ $val }}  px-1">{{ $chName($children, $chI) }}</td>
            <td colspan="4" class="{{ $val }} text-center">{{ $chDob($children, $chI) }}</td>
        </tr>
        @endforeach
        <tr style="height:16pt;" data-row="child">
            <td colspan="10" class="{{ $note }} border-none align-middle normal-case">(Continue on sheet C7 if necessary)</td>
            <td colspan="5" class="{{ $val }}  px-1">{{ $chName($children, 6) }}</td>
            <td colspan="4" class="{{ $val }} text-center">{{ $chDob($children, 6) }}</td>
        </tr>

        {{-- Father --}}
        <tr style="height:16pt;" class="uppercase" data-row="child">
            <td colspan="3" class="{{ $lbl }} px-1  border-b-gray-100">24. FATHER'S SURNAME</td>
            <td colspan="7" class="{{ $val }} px-1">{{ strtoupper($fam?->father_surname ?? 'N/A') }}</td>
            <td colspan="5" class="{{ $val }}  px-1">{{ $chName($children, 7) }}</td>
            <td colspan="4" class="{{ $val }} text-center ">{{ $chDob($children, 7) }}</td>
        </tr>
        <tr style="height:16pt;" class="uppercase" data-row="child">
            <td colspan="3" class="{{ $lbl }} pl-4 border-b-gray-100 pt-1">FIRST NAME</td>
            <td colspan="4" class="{{ $val }} px-1">{{ strtoupper($fam?->father_first_name ?? 'N/A') }}</td>
            <td colspan="3" class="{{ $lbl }}">
                <div>
                    <p>NAME EXTENSION (JR., SR)</p>
                    <p class="text-center font-semibold">{{ strtoupper($fam?->father_name_ext ?? 'N/A') }}</p>
                </div>
            </td>
            <td colspan="5" class="{{ $val }} px-1">{{ $chName($children, 8) }}</td>
            <td colspan="4" class="{{ $val }} text-center">{{ $chDob($children, 8) }}</td>
        </tr>
        <tr style="height:16pt;" class="uppercase" data-row="child">
            <td colspan="3" class="{{ $lbl }} pl-4 ">MIDDLE NAME</td>
            <td colspan="7" class="{{ $val }} px-1">{{ strtoupper($fam?->father_middle_name ?? 'N/A') }}</td>
            <td colspan="5" class="{{ $val }} px-1">{{ $chName($children, 9) }}</td>
            <td colspan="4" class="{{ $val }} text-center">{{ $chDob($children, 9) }}</td>
        </tr>

        {{-- Mother --}}
        <tr style="height:16pt;" class="uppercase" data-row="child">
            <td colspan="3" class="{{ $lbl }} px-1 border-r-0 border-b-gray-100">25. MOTHER'S MAIDEN NAME</td>
            <td colspan="7" class="bg-gray-100 border-l-0 "></td>
            <td colspan="5" class="{{ $val }} px-1">{{ $chName($children, 10) }}</td>
            <td colspan="4" class="{{ $val }} text-center">{{ $chDob($children, 10) }}</td>
        </tr>
        @foreach([['SURNAME','mother_surname',false,11],['FIRST NAME','mother_first_name',false,12],['MIDDLE NAME','mother_middle_name',true,null]] as [$mLbl,$mField,$mLast,$mChI])
        <tr style="height:16pt;" class="uppercase" @if(!$mLast) data-row="child" @endif>
            <td colspan="3" class="{{ $lbl }} pl-4 border-b-gray-100">{{ $mLbl }}</td>
            @if(!$mLast)
            <td colspan="7" class="{{ $val }} px-1">{{ strtoupper($fam?->$mField ?? 'N/A') }}</td>
            <td colspan="5" class="{{ $val }} px-1">{{ $chName($children, $mChI) }}</td>
            <td colspan="4" class="{{ $val }} text-center">{{ $chDob($children, $mChI) }}</td>
            @else
            {{-- Mother middle name: last child col replaced by continue note --}}
            <td colspan="7" class="{{ $val }} px-1">{{ strtoupper($fam?->$mField ?? 'N/A') }}</td>
            <td colspan="9" class="{{ $note }} border-none align-middle normal-case">(Continue on sheet C7 if necessary)</td>
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
            <td colspan="4" class="{{ $val }} px-1">{{ $eduF($eduList, $eKey, 'school_name') }}</td>
            <td colspan="4" class="{{ $val }} px-1">{{ $eduF($eduList, $eKey, 'course') }}</td>
            <td class="{{ $val }} border-l-2 border-black text-center">{{ $eduF($eduList, $eKey, 'period_from') }}</td>
            <td class="{{ $val }} border-r-2 border-black text-center">{{ $eduF($eduList, $eKey, 'period_to') }}</td>
            <td colspan="2" class="{{ $val }} text-center">{{ $eduF($eduList, $eKey, 'highest_level') }}</td>
            <td colspan="2" class="{{ $val }} text-center">{{ $eduF($eduList, $eKey, 'year_graduated') }}</td>
            <td colspan=2"" class="{{ $val }} text-center">{{ $eduF($eduList, $eKey, 'honors_received') }}</td>
        </tr>
        @endforeach
        <tr><td colspan="19" class="{{ $note }}">(Continue on sheet C8 if necessary)</td></tr>

        @include('pds.pdf.signature-row', ['spans' => [3, 8, 2, 6]])
        </table>
        <p class="text-right italic text-[6pt]">CS FORM 212 (Revised 2026), Page 1 of 4</p>
    </div>
