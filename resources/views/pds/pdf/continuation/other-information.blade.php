{{-- C11 – Other Information (continuation). $rows = one chunk of rows with keys skill, distinction, membership; $sheet = 'C11'. --}}
@use('App\Support\PdsFormat')
@php $capacity = \App\Services\PdsPdfService::CAPACITY['other_info'][1]; @endphp
<div class="page" data-sheet="{{ $sheet }}">
    <table class="border-2 border-black">
        <tr><td colspan="20" class="{{ $sectionHeader }}">OTHER INFORMATION (Continuation)</td></tr>
        <tr style="height:26pt;" class="text-center">
            <td colspan="5" class="{{ $lbl }} align-middle">SPECIAL SKILLS and HOBBIES</td>
            <td colspan="10" class="{{ $lbl }} align-middle">NON-ACADEMIC DISTINCTIONS / RECOGNITION<br><span class="normal-case">(Write in full)</span></td>
            <td colspan="5" class="{{ $lbl }} align-middle">MEMBERSHIP IN ASSOCIATION/ORGANIZATION<br><span class="normal-case">(Write in full)</span></td>
        </tr>
        @for($i = 0; $i < $capacity; $i++)
        @php $row = $rows[$i] ?? null; @endphp
        <tr style="height:22pt;" class="text-center" data-row="other-info">
            <td colspan="5" class="{{ $val }} px-1">{{ $row ? PdsFormat::text($row['skill']) : '' }}</td>
            <td colspan="10" class="{{ $val }} px-1">{{ $row ? PdsFormat::text($row['distinction']) : '' }}</td>
            <td colspan="5" class="{{ $val }} px-1">{{ $row ? PdsFormat::text($row['membership']) : '' }}</td>
        </tr>
        @endfor
        @include('pds.pdf.signature-row', ['spans' => [5, 6, 4, 5]])
    </table>
    <p class="text-right italic text-[6pt]">CS FORM 212 (Revised 2026)</p>
</div>
