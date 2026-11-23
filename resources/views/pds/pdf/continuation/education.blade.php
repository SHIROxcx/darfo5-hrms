{{-- C8 – Educational Background (continuation). $rows = one chunk of PdsEducation (further rows of a level), $sheet = 'C8'. --}}
@use('App\Support\PdsFormat')
@php
    $capacity = \App\Services\PdsPdfService::CAPACITY['education'][1];
    $levelLabels = [
        'Elementary' => 'ELEMENTARY', 'Secondary' => 'SECONDARY', 'Vocational' => 'VOCATIONAL / TRADE COURSE',
        'College' => 'COLLEGE', 'Graduate Studies' => 'GRADUATE STUDIES',
    ];
@endphp
<div class="page" data-sheet="{{ $sheet }}">
    <table class="border-2 border-black">
        <tr><td colspan="19" class="{{ $sectionHeader }}">EDUCATIONAL BACKGROUND (Continuation)</td></tr>
        <tr style="height:20pt;" class="text-center">
            <td colspan="3" rowspan="2" class="{{ $lbl }} align-middle">LEVEL</td>
            <td colspan="4" rowspan="2" class="{{ $lbl }} align-middle">NAME OF SCHOOL<br><span class="normal-case">(Write in full)</span></td>
            <td colspan="4" rowspan="2" class="{{ $lbl }} align-middle">BASIC EDUCATION/DEGREE/COURSE<br><span class="normal-case">(Write in full)</span></td>
            <td colspan="2" class="{{ $lbl }} align-middle">PERIOD OF ATTENDANCE</td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle">HIGHEST LEVEL/<br>UNITS EARNED<br><span class="normal-case">(if not graduated)</span></td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle">YEAR<br>GRADUATED</td>
            <td colspan="2" rowspan="2" class="{{ $lbl }} align-middle">SCHOLARSHIP/<br>ACADEMIC<br>HONORS<br>RECEIVED</td>
        </tr>
        <tr style="height:13pt;" class="{{ $lbl }} text-center normal-case">
            <td>From</td>
            <td>To</td>
        </tr>
        @for($i = 0; $i < $capacity; $i++)
        @php $edu = $rows[$i] ?? null; @endphp
        <tr style="height:19pt;" class="{{ $val }} uppercase text-center" data-row="education">
            <td colspan="3" class="px-1">{{ $edu ? ($levelLabels[$edu->level] ?? $edu->level) : '' }}</td>
            <td colspan="4" class="px-1">{{ $edu ? PdsFormat::text($edu->school_name) : '' }}</td>
            <td colspan="4" class="px-1">{{ $edu ? PdsFormat::text($edu->course) : '' }}</td>
            <td>{{ $edu ? PdsFormat::text($edu->period_from) : '' }}</td>
            <td>{{ $edu ? PdsFormat::text($edu->period_to) : '' }}</td>
            <td colspan="2">{{ $edu ? PdsFormat::text($edu->highest_level) : '' }}</td>
            <td colspan="2">{{ $edu ? PdsFormat::text($edu->year_graduated) : '' }}</td>
            <td colspan="2">{{ $edu ? PdsFormat::text($edu->honors_received) : '' }}</td>
        </tr>
        @endfor
        @include('pds.pdf.signature-row', ['spans' => [3, 8, 2, 6]])
    </table>
    <p class="text-right italic text-[6pt]">CS FORM 212 (Revised 2026)</p>
</div>
