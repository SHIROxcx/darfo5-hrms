@use('App\Support\PdsFormat')
{{-- ══════════════════════════════════════════════════ --}}
{{-- PAGE 3 – Voluntary Work / Trainings / Other Info  --}}
{{-- ══════════════════════════════════════════════════ --}}
<div class="page">
    <table class="border-2 border-black">


    <tr><td colspan="20" class="{{ $sectionHeader }}">VI. LEARNING AND DEVELOPMENT (L&amp;D) INTERVENTIONS/TRAINING PROGRAMS ATTENDED</td></tr>
    <tr style="height:18pt;" class="text-center">
        <td colspan="7" rowspan="2" class="{{ $lbl }} align-middle">
            <div class="flex justify-center">
                <p>29.</p> 
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
    @php $trainings = $sections['learning_development']['main']; @endphp
    @for($i=0;$i<17;$i++)
    @php $tr=$trainings[$i]??null; @endphp
    <tr style="height:19pt;" class="{{ $val }} uppercase text-center" data-row="learning-development">
        <td colspan="7" class="px-1 align-middle">{{ $tr?->title?? 'N/A' }}</td>
        <td colspan="2" class="align-middle">  {{ PdsFormat::date($tr?->date_from) }}</td>
        <td colspan="2" class="align-middle">  {{ PdsFormat::date($tr?->date_to) }}</td>
        <td colspan="2" class="align-middle">  {{ $tr?->number_of_hours ?? 'N/A' }}</td>
        <td colspan="2" class="align-middle">  {{ $tr?->type_of_ld ?? 'N/A' }}</td>
        <td colspan="5" class="px-1 align-middle">{{ $tr?->conducted_by ?? 'N/A' }}</td>
    </tr>
    @endfor
    <tr><td colspan="20" class="{{ $note }}">(Continue on sheet C5 if necessary)</td></tr>

     <tr><td colspan="20" class="{{ $sectionHeader }}">VII. VOLUNTARY WORK OR INVOLVEMENT IN CIVIC / NON-GOVERNMENT / PEOPLE / VOLUNTARY ORGANIZATIONS</td></tr>
    <tr style="height:18pt;" class="text-center">
        <td colspan="7" rowspan="2" class="{{ $lbl }} align-middle">
            <div class="flex justify-center">
                <p>30.</p> 
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
    @php $volWork = $sections['voluntary_work']['main']; @endphp
    @for($i=0;$i<9;$i++)
    @php $vw=$volWork[$i]??null; @endphp
    <tr style="height:20pt;" class="text-center" data-row="voluntary-work">
        <td colspan="7" class="{{ $val }} px-1">
            @if($vw && ($vw->organization_name || $vw->organization_address))
                {{ $vw->organization_name }}
                {{ ($vw->organization_name && $vw->organization_address) ? ', ' : '' }}
                {{ $vw->organization_address }}
            @else
                N/A
            @endif
        </td>
        <td colspan="2" class="{{ $val }}">{{ PdsFormat::date($vw?->date_from) }}</td>
        <td colspan="2" class="{{ $val }}">{{ PdsFormat::date($vw?->date_to) }}</td>
        <td colspan="2" class="{{ $val }}">{{ $vw?->number_of_hours?? 'N/A' }}</td>
        <td colspan="7" class="{{ $val }}">{{ $vw?->position?? 'N/A' }}</td>
    </tr>
    @endfor
    <tr><td colspan="20" class="{{ $note }}">(Continue on sheet C10 if necessary)</td></tr>

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
    @php $otherInfo = $sections['other_info']['main']; @endphp
    @for($i=0;$i<7;$i++)
    <tr style="height:19pt;" class="text-center" data-row="other-info">
        <td colspan="5" class="{{ $val }} px-1">{{ $otherInfo[$i]['skill'] ?? 'N/A' }}</td>
        <td colspan="10" class="{{ $val }} px-1">{{ $otherInfo[$i]['distinction'] ?? 'N/A' }}</td>
        <td colspan="5" class="{{ $val }} px-1">{{ $otherInfo[$i]['membership'] ?? 'N/A' }}</td>
    </tr>
    @endfor
    <tr><td colspan="20" class="{{ $note }}">(Continue on sheet C11 if necessary)</td></tr>

    @include('pds.pdf.signature-row', ['spans' => [5, 6, 4, 5]])
    </table>
    <p class="text-right italic text-[6pt]">CS FORM 212 (Revised 2026), Page 3 of 4</p>
</div>
