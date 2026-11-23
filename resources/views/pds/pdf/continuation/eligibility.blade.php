{{-- C9 – Civil Service Eligibility (continuation). $rows = one chunk of PdsEligibility, $sheet = 'C9'. --}}
@use('App\Support\PdsFormat')
@php $capacity = \App\Services\PdsPdfService::CAPACITY['eligibility'][1]; @endphp
<div class="page" data-sheet="{{ $sheet }}">
    <table class="border-2 border-black">
        <tr><td colspan="24" class="{{ $sectionHeader }}">CIVIL SERVICE ELIGIBILITY (Continuation)</td></tr>
        <tr style="height:20pt;" class="text-center">
            <td colspan="8" rowspan="2" class="{{ $lbl }} align-middle">CES/CSEE/CAREER SERVICE/RA 1080 (BOARD/ BAR)/UNDER SPECIAL LAWS/CATEGORY II/ IV ELIGIBILITY <span class="normal-case">and</span> ELIGIBILITIES FOR UNIFORMED PERSONNEL</td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle">RATING<br><span class="normal-case">(If Applicable)</span></td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle">DATE OF EXAMINATION/ CONFERMENT</td>
            <td colspan="8" rowspan="2" class="{{ $lbl }} align-middle">PLACE OF EXAMINATION / CONFERMENT</td>
            <td colspan="4" class="{{ $lbl }} align-middle">LICENSE <span class="normal-case">(If Applicable)</span></td>
        </tr>
        <tr style="height:15pt;" class="{{ $lbl }} text-center">
            <td colspan="2">NUMBER</td>
            <td colspan="2" class="normal-case">Valid Until</td>
        </tr>
        @for($i = 0; $i < $capacity; $i++)
        @php $el = $rows[$i] ?? null; @endphp
        <tr style="height:28pt;" class="text-center" data-row="eligibility">
            <td colspan="8" class="{{ $val }} px-1">{{ $el ? PdsFormat::text($el->career_service) : '' }}</td>
            <td colspan="2" class="{{ $val }}">{{ $el ? PdsFormat::text($el->rating) : '' }}</td>
            <td colspan="2" class="{{ $val }}">{{ $el ? PdsFormat::date($el->date_of_examination) : '' }}</td>
            <td colspan="8" class="{{ $val }} px-1">{{ $el ? PdsFormat::text($el->place_of_examination) : '' }}</td>
            <td colspan="2" class="{{ $val }}">{{ $el ? PdsFormat::text($el->license_number) : '' }}</td>
            <td colspan="2" class="{{ $val }}">{{ $el ? PdsFormat::date($el->license_validity) : '' }}</td>
        </tr>
        @endfor
        @include('pds.pdf.signature-row', ['spans' => [4, 8, 4, 8]])
    </table>
    <p class="text-right italic text-[6pt]">CS FORM 212 (Revised 2026)</p>
</div>
