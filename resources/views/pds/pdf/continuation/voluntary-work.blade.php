{{-- C10 – Voluntary Work (continuation). $rows = one chunk of PdsVoluntaryWork, $sheet = 'C10'. --}}
@use('App\Support\PdsFormat')
@php $capacity = \App\Services\PdsPdfService::CAPACITY['voluntary_work'][1]; @endphp
<div class="page" data-sheet="{{ $sheet }}">
    <table class="border-2 border-black">
        <tr><td colspan="20" class="{{ $sectionHeader }}">VOLUNTARY WORK OR INVOLVEMENT IN CIVIC / NON-GOVERNMENT / PEOPLE / VOLUNTARY ORGANIZATIONS (Continuation)</td></tr>
        <tr style="height:18pt;" class="text-center">
            <td colspan="7" rowspan="2" class="{{ $lbl }} align-middle">NAME &amp; ADDRESS OF ORGANIZATION<br><span class="normal-case">(Write in full)</span></td>
            <td colspan="4" class="{{ $lbl }} py-1">INCLUSIVE DATES<br><span class="normal-case">(dd/mm/yyyy)</span></td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle">NUMBER OF<br> HOURS</td>
            <td colspan="7" rowspan="2" class="{{ $lbl }} align-middle">POSITION / NATURE OF WORK</td>
        </tr>
        <tr style="height:13pt;" class="{{ $lbl }} text-center normal-case">
            <td colspan="2">From</td>
            <td colspan="2">To</td>
        </tr>
        @for($i = 0; $i < $capacity; $i++)
        @php $vw = $rows[$i] ?? null; @endphp
        <tr style="height:25pt;" class="text-center" data-row="voluntary-work">
            <td colspan="7" class="{{ $val }} px-1">
                @if($vw)
                    {{ PdsFormat::text(collect([$vw->organization_name, $vw->organization_address])->filter()->implode(', ')) }}
                @endif
            </td>
            <td colspan="2" class="{{ $val }}">{{ $vw ? PdsFormat::date($vw->date_from) : '' }}</td>
            <td colspan="2" class="{{ $val }}">{{ $vw ? PdsFormat::date($vw->date_to) : '' }}</td>
            <td colspan="2" class="{{ $val }}">{{ $vw ? PdsFormat::text($vw->number_of_hours) : '' }}</td>
            <td colspan="7" class="{{ $val }} px-1">{{ $vw ? PdsFormat::text($vw->position) : '' }}</td>
        </tr>
        @endfor
        @include('pds.pdf.signature-row', ['spans' => [5, 6, 4, 5]])
    </table>
    <p class="text-right italic text-[6pt]">CS FORM 212 (Revised 2026)</p>
</div>
