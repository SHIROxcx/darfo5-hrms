{{-- C6 – Work Experience (continuation). $rows = one chunk of PdsWorkExperience, $sheet = 'C6'. --}}
@use('App\Support\PdsFormat')
@php $capacity = \App\Services\PdsPdfService::CAPACITY['work_experience'][1]; @endphp
<div class="page" data-sheet="{{ $sheet }}">
    <table class="border-2 border-black">
        <tr><td colspan="24" class="{{ $sectionHeader }}">WORK EXPERIENCE (Continuation)</td></tr>
        <tr><td colspan="24" class="{{ $lbl }} italic normal-case">(Include private employment. Start from your recent work) Description of duties should be indicated in the attached Work Experience Sheet</td></tr>
        <tr style="height:18pt;" class="text-center">
            <td colspan="4" class="{{ $lbl }} align-middle">INCLUSIVE DATES<br><span class="normal-case">(dd/mm/yyyy)</span></td>
            <td colspan="6" rowspan="2" class="{{ $lbl }} align-middle">POSITION TITLE<br><span class="normal-case">(Write in full/Do not abbreviate)</span></td>
            <td colspan="6" rowspan="2" class="{{ $lbl }} align-middle">DEPARTMENT / AGENCY / OFFICE / COMPANY<br><span class="normal-case">(Write in full/Do not abbreviate)</span></td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle">MONTHLY SALARY</td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle">SALARY/ JOB/ PAY GRADE (if applicable) &amp; STEP INCREMENT (Format "00-0")</td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle">STATUS OF APPOINTMENT</td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle">GOV'T SERVICE (Y/N)</td>
        </tr>
        <tr style="height:13pt;" class="{{ $lbl }} text-center normal-case">
            <td colspan="2">From</td>
            <td colspan="2">To</td>
        </tr>
        @for($i = 0; $i < $capacity; $i++)
        @php $we = $rows[$i] ?? null; @endphp
        <tr style="height:21pt;" class="uppercase text-center" data-row="work-experience">
            <td colspan="2" class="{{ $val }}">{{ $we ? PdsFormat::date($we->date_from) : '' }}</td>
            <td colspan="2" class="{{ $val }}">{{ $we ? ($we->is_present ? 'Present' : PdsFormat::date($we->date_to)) : '' }}</td>
            <td colspan="6" class="{{ $val }} px-1">{{ $we ? PdsFormat::text($we->position_title) : '' }}</td>
            <td colspan="6" class="{{ $val }} px-1">{{ $we ? PdsFormat::text($we->department) : '' }}</td>
            <td colspan="2" class="{{ $val }} px-1">{{ $we ? PdsFormat::money($we->monthly_salary) : '' }}</td>
            <td colspan="2" class="{{ $val }} px-1">{{ $we ? PdsFormat::text($we->salary_grade) : '' }}</td>
            <td colspan="2" class="{{ $val }} px-1">{{ $we ? PdsFormat::text($we->status_of_appointment) : '' }}</td>
            <td colspan="2" class="{{ $val }}">{{ $we ? ($we->is_government_service ? 'Y' : 'N') : '' }}</td>
        </tr>
        @endfor
        @include('pds.pdf.signature-row', ['spans' => [4, 8, 4, 8]])
    </table>
    <p class="text-right italic text-[6pt]">CS FORM 212 (Revised 2026)</p>
</div>
