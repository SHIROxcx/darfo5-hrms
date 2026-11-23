{{-- C7 – Family Background (continuation). $rows = one chunk of PdsChild, $sheet = 'C7'.
     The spouse columns of the official sheet have no data behind them here and print blank. --}}
@use('App\Support\PdsFormat')
@php $capacity = \App\Services\PdsPdfService::CAPACITY['children'][1]; @endphp
<div class="page" data-sheet="{{ $sheet }}">
    <table class="border-2 border-black">
        <tr><td colspan="24" class="{{ $sectionHeader }}">FAMILY BACKGROUND (Continuation)</td></tr>
        <tr style="height:26pt;" class="text-center">
            <td colspan="2" class="{{ $lbl }} align-middle">SPOUSE'S SURNAME</td>
            <td colspan="2" class="{{ $lbl }} align-middle">MIDDLE NAME</td>
            <td colspan="2" class="{{ $lbl }} align-middle">FIRST NAME</td>
            <td colspan="2" class="{{ $lbl }} align-middle">NAME EXTENSION (JR., SR)</td>
            <td colspan="2" class="{{ $lbl }} align-middle">OCCUPATION</td>
            <td colspan="3" class="{{ $lbl }} align-middle">EMPLOYER/BUSINESS NAME</td>
            <td colspan="3" class="{{ $lbl }} align-middle">BUSINESS ADDRESS</td>
            <td colspan="2" class="{{ $lbl }} align-middle">TELEPHONE NO.</td>
            <td colspan="4" class="{{ $lbl }} align-middle">NAME of CHILDREN<br><span class="normal-case">(Write full name and list all)</span></td>
            <td colspan="2" class="{{ $lbl }} align-middle">DATE OF BIRTH<br><span class="normal-case">(dd/mm/yyyy)</span></td>
        </tr>
        @for($i = 0; $i < $capacity; $i++)
        @php $child = $rows[$i] ?? null; @endphp
        <tr style="height:28pt;" class="text-center" data-row="child">
            <td colspan="2" class="{{ $val }}"></td>
            <td colspan="2" class="{{ $val }}"></td>
            <td colspan="2" class="{{ $val }}"></td>
            <td colspan="2" class="{{ $val }}"></td>
            <td colspan="2" class="{{ $val }}"></td>
            <td colspan="3" class="{{ $val }}"></td>
            <td colspan="3" class="{{ $val }}"></td>
            <td colspan="2" class="{{ $val }}"></td>
            <td colspan="4" class="{{ $val }} uppercase px-1">{{ $child ? PdsFormat::text(strtoupper($child->full_name ?? '')) : '' }}</td>
            <td colspan="2" class="{{ $val }}">{{ $child ? PdsFormat::date($child->date_of_birth) : '' }}</td>
        </tr>
        @endfor
        @include('pds.pdf.signature-row', ['spans' => [4, 8, 4, 8]])
    </table>
    <p class="text-right italic text-[6pt]">CS FORM 212 (Revised 2026)</p>
</div>
