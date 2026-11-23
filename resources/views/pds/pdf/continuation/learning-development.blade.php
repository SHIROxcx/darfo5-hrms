{{-- C5 – Learning and Development (continuation). $rows = one chunk of PdsTraining, $sheet = 'C5'. --}}
@use('App\Support\PdsFormat')
@php $capacity = \App\Services\PdsPdfService::CAPACITY['learning_development'][1]; @endphp
<div class="page" data-sheet="{{ $sheet }}">
    <table class="border-2 border-black">
        <tr><td colspan="20" class="{{ $sectionHeader }}">LEARNING AND DEVELOPMENT (L&amp;D) INTERVENTIONS/TRAINING PROGRAMS ATTENDED (Continuation)</td></tr>
        <tr style="height:18pt;" class="text-center">
            <td colspan="7" rowspan="2" class="{{ $lbl }} align-middle">TITLE OF LEARNING AND DEVELOPMENT INTERVENTIONS/<br>TRAINING PROGRAMS <span class="normal-case block">(Write in full)</span></td>
            <td colspan="4" class="{{ $lbl }}">INCLUSIVE DATES OF <br>ATTENDANCE<br><span class="normal-case">(dd/mm/yyyy)</span></td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle">NUMBER OF<br> HOURS</td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle">Type of L&amp;D<br><span class="normal-case">(Managerial/<br>Supervisory/<br>Technical/etc)</span></td>
            <td colspan="5" rowspan="2" class="{{ $lbl }} align-middle">CONDUCTED/ SPONSORED BY<br><span class="normal-case">(Write in full)</span></td>
        </tr>
        <tr style="height:13pt;" class="{{ $lbl }} text-center normal-case">
            <td colspan="2">From</td>
            <td colspan="2">To</td>
        </tr>
        @for($i = 0; $i < $capacity; $i++)
        @php $tr = $rows[$i] ?? null; @endphp
        <tr style="height:16.5pt;" class="{{ $val }} uppercase text-center" data-row="learning-development">
            <td colspan="7" class="px-1 align-middle">{{ $tr ? PdsFormat::text($tr->title) : '' }}</td>
            <td colspan="2" class="align-middle">{{ $tr ? PdsFormat::date($tr->date_from) : '' }}</td>
            <td colspan="2" class="align-middle">{{ $tr ? PdsFormat::date($tr->date_to) : '' }}</td>
            <td colspan="2" class="align-middle">{{ $tr ? PdsFormat::text($tr->number_of_hours) : '' }}</td>
            <td colspan="2" class="align-middle">{{ $tr ? PdsFormat::text($tr->type_of_ld) : '' }}</td>
            <td colspan="5" class="px-1 align-middle">{{ $tr ? PdsFormat::text($tr->conducted_by) : '' }}</td>
        </tr>
        @endfor
        @include('pds.pdf.signature-row', ['spans' => [5, 6, 4, 5]])
    </table>
    <p class="text-right italic text-[6pt]">CS FORM 212 (Revised 2026)</p>
</div>
