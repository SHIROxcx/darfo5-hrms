@use('App\Support\PdsFormat')
{{-- PAGE 2 – Eligibility + Work Experience --}}

<div class="page">
    <table class="border-2 border-black">

        <tr><td colspan="24" class="{{ $sectionHeader }}">IV. CIVIL SERVICE ELIGIBILITY</td></tr>
        <tr style="height:20pt;" >
            <td colspan="8" rowspan="2" class="{{ $lbl }} align-middle uppercase">
                <div class="flex justify-center text-center">
                    <p>27.</p> 
                    <p class="grow">CAREER SERVICE/ RA 1080 (BOARD/ BAR) UNDER SPECIAL LAWS/ CES/ CSEE<br>BARANGAY ELIGIBILITY / DRIVER'S LICENSE
                    </p>
                </div>
            </td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle uppercase text-center">RATING<br><span class="normal-case">(If Applicable)</span></td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle text-center">DATE OF EXAMINATION/<br>CONFERMENT</td>
            <td colspan="8" rowspan="2" class="{{ $lbl }} align-middle text-center">PLACE OF EXAMINATION /<br>CONFERMENT</td>
            <td colspan="4" class="{{ $lbl }} align-middle text-center">LICENSE <span class="normal-case">(If Applicable)</span></td>
        </tr>
        <tr style="height:17pt;" class="text-center">
            <td colspan="2" class="{{ $lbl }} align-middle uppercase">NUMBER</td>
            <td colspan="2" class="{{ $lbl }} align-middle normal-case">Date of Validity</td>
        </tr>
        @php $eligibilities = $sections['eligibility']['main']; @endphp
        @for($i = 0; $i < 7; $i++)
        @php $el = $eligibilities[$i] ?? null; @endphp
        <tr style="height:24pt;" class="text-center" data-row="eligibility">
            <td colspan="8" class="{{ $val }} px-1">{{ $el?->career_service ?? 'N/A' }}</td>
            <td colspan="2" class="{{ $val }}">{{ $el?->rating ?? 'N/A' }}</td>
            <td colspan="2" class="{{ $val }}">{{ PdsFormat::date($el?->date_of_examination) }}</td>
            <td colspan="8" class="{{ $val }} px-1">{{ $el?->place_of_examination ?? 'N/A' }}</td>
            <td colspan="2" class="{{ $val }}">{{ $el?->license_number ?? 'N/A' }}</td>
            <td colspan="2" class="{{ $val }}">{{ PdsFormat::date($el?->license_validity) }}</td>
        </tr>
        @endfor
        <tr><td colspan="24" class="{{ $note }}">(Continue on sheet C9 if necessary)</td></tr>

        {{-- Work Experience --}}
        <tr>
            <td colspan="24" class="{{ $sectionHeader }}">
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
            <td colspan="6" rowspan="3" class="{{ $lbl }} align-middle text-center">DEPARTMENT / AGENCY / OFFICE / COMPANY <br><span class="normal-case">(Write in full/Do not abbreviate)</span> </td>
            <td colspan="2" rowspan="3" class="{{ $lbl }} align-middle text-center">MONTHLY SALARY</td>
            <td colspan="2" rowspan="3" class="{{ $lbl }} text-[5pt] align-middle text-center">SALARY/ JOB/ PAY <br> GRADE(if applicable) & <br> STEP INCREMENT <br> (Format "00-0")</td>
            <td colspan="2" rowspan="3" class="{{ $lbl }} align-middle text-center">STATUS OF APPOINTMENT</td>
            <td colspan="2" rowspan="3" class="{{ $lbl }} align-middle text-center">GOV'T SERVICE <br>(Y/N)</td>
        </tr>
        <tr style="height:17pt;"></tr>
        <tr style="height:15pt;" class="text-center ">
            <td colspan="2" class="{{ $lbl }} normal-case">From</td>
            <td colspan="2" class="{{ $lbl }} normal-case">To</td>
        </tr>
        @php $workExp = $sections['work_experience']['main']; @endphp
        @for($i = 0; $i < 24; $i++)
        @php $we = $workExp[$i] ?? null; @endphp
        <tr style="height:21pt;" class="uppercase text-center" data-row="work-experience">
            <td colspan="2" class="{{ $val }}">{{ PdsFormat::date($we?->date_from) }}</td>
            <td colspan="2" class="{{ $val }}">@if($we?->is_present)<em>Present</em>@else{{ PdsFormat::date($we?->date_to) }}@endif</td>
            <td colspan="6" class="{{ $val }} px-1">{{ $we?->position_title ?? 'N/A' }}</td>
            <td colspan="6" class="{{ $val }} px-1">{{ $we?->department ?? 'N/A' }}</td>
            <td colspan="2" class="{{ $val }} px-1">{{ PdsFormat::money($we?->monthly_salary) }}</td>
            <td colspan="2" class="{{ $val }} px-1">{{ $we?->salary_grade ?? 'N/A' }}</td>
            <td colspan="2" class="{{ $val }} px-1">{{ $we?->status_of_appointment ?? 'N/A' }}</td>
            <td colspan="2" class="{{ $val }}">{{ $we ? ($we->is_government_service ? 'Y' : 'N') : 'N/A' }}</td>
        </tr>
        @endfor
        <tr><td colspan="24" class="{{ $note }}">(Continue on sheet C6 if necessary)</td></tr>

        @include('pds.pdf.signature-row', ['spans' => [4, 8, 4, 8]])
    </table>
    <p class="text-right italic text-[6pt]">CS FORM 212 (Revised 2026), Page 2 of 4</p>
</div>
