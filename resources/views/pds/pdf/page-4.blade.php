@use('App\Support\PdsFormat')
{{-- ══════════════════════════════════════════════════ --}}
{{-- PAGE 4 – Questions / References / Declaration      --}}
{{-- ══════════════════════════════════════════════════ --}}
@php $q=$pds['questions']??null; $refs=$pds['references']??[]; @endphp
<div class="page">
    <table class="border-2 border-black">
        {{-- Q34 --}}
        <tr style="height:13pt;">
            <td colspan="11" class="text-[8pt] bg-gray-100">
                <div class="flex normal-case">
                    <span>34.</span>
                    <p class="px-1">Are you related by consanguinity or affinity to the appointing or recommending authority, or to the chief of bureau or office or to the person who has immediate supervision over you in the Office, Bureau or Department where you will be appointed,</p>
                </div>
                <div class="px-4 normal-case space-y-2">
                    <p>a. within the third degree?</p>
                    <p>b. within the fourth degree (for Local Government Unit - Career Employees)?</p>
                </div>
                <div class="py-3"></div>
            </td>
            <td colspan="8" class="align-bottom p-2 text-[8pt]">
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q34_a === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>

                    <div class="checkbox-container">
                        <div class="box {{ $q?->q34_a === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q34_b === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>

                    <div class="checkbox-container">
                        <div class="box {{ $q?->q34_b === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="text-[7pt]">
                    <p>If YES, give details:</p>
                    <p class="border-b border-black h-4 mx-2 font-semibold">{{ $q?->q34_details?? '' }}</p>
                </div>
            </td>
        </tr>
        
        {{-- Q35 --}}
        <tr style="height:18pt;">
            <td colspan="11" class=" text-[8pt] bg-gray-100">
                <div class="flex normal-case">
                    <span>35.</span>
                    <p class="px-1">a. Have you ever been found guilty of any administrative offense?</p>
                </div>
                <div class="px-4 normal-case my-14">
                    <p>b. Have you been criminally charged before any court?</p>
                </div>
            </td>
            <td colspan="8" class="align-top text-[8pt]">
                <div class="mb-2 border-b border-black p-2 pb-1">
                    <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q35_a === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q35_a === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                    <div class=" flex flex-col text-[7pt] mb-1">
                        <p>If YES, give details: </p>
                        <p class="border-b border-black h-4 mx-2 font-semibold">{{ $q?->q35_a_details?? '' }}</p>
                    </div>
                </div>
                <div class="mb-2 p-2 pb-0">
                    <div class="flex items-center gap-10 mb-1">
                        <div class="checkbox-container">
                            <div class="box {{ $q?->q35_b === true ? 'checked' : '' }}"></div>
                            <span class="text-[7pt]">YES</span>
                        </div>

                        <div class="checkbox-container">
                            <div class="box {{ $q?->q35_b === false ? 'checked' : '' }}"></div>
                            <span class="text-[7pt]">NO</span>
                        </div>
                    </div>
                    <div class="text-[7pt] space-y-1">
                        <p>If YES, give details: </p>
                        <p>{{ $q?->q35_b_details??'' }}</p>
                        <div class="flex ml-5">
                            <p class="shrink-0">Date Filed:</p> 
                            <p class="border-b border-black w-full mx-2 font-semibold">{{ $q?->q35_b_date??'' }}</p>
                        </div>
                        <div class="flex">
                            <span class="shrink-0">Status of Case/s: </span>
                            <p class="border-b border-black mx-2 w-full font-semibold">{{ $q?->q35_b_status??'' }}</p>
                        </div>
                    </div>
                </div>
            </td>
        </tr>

        {{-- Q36 --}}
        <tr style="height:18pt;">
            <td colspan="11" class="text-[8pt] bg-gray-100">
                <div class="flex normal-case mb-8">
                    <p>36.</p>
                    <p class="px-2">Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?</p>
                </div>
            </td>
            <td colspan="8" class="align-top p-2 text-[8pt]">
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q36 === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q36 === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="text-[7pt]">
                    <p>If YES, give details:</p> 
                    <p class="border-b border-black h-4 mx-2 font-semibold">{{ $q?->q36_details??'' }}</p>
                </div>
            </td>
        </tr>

        {{-- Q37 (separation) --}}
        <tr style="height:14pt;">
            <td colspan="11" class="text-[8pt] bg-gray-100">
                <div class="flex normal-case mb-2">
                    <p>37.</p>
                    <p class="px-2">Have you ever been separated from the service in any of the following modes: resignation, retirement, dropped from the rolls, dismissal, termination, end of term, finished contract or phased out (abolition) in the public or private sector?</p>
                </div>
            </td>
            <td colspan="8" class="align-top p-2 text-[8pt]">
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q37 === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q37 === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="text-[7pt]">
                    <p>If YES, give details: </p>
                    <p class="border-b border-black h-4 mx-2 font-semibold">{{ $q?->q37_details??'' }}</p>
                </div>
            </td>
        </tr>

        {{-- Q38 (candidacy) --}}
        <tr style="height:18pt;">
            <td colspan="11" class="text-[8pt] bg-gray-100">
                <div class="flex normal-case mb-3">
                    <p>38.</p>
                    <p class="px-1">a. Have you ever been a candidate in a national or local election held within the last year (except Barangay election)?</p>
                </div>
                <div class="px-4 normal-case mb-2">
                    <p>b. Have you resigned from the government service during the three (3)-month period before the last election to promote/actively campaign for a national or local candidate?</p>
                </div>
            </td>
            <td colspan="8" class="align-top p-2 text-[8pt]">
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q38_a === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q38_a === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="flex gap-1 text-[7pt] mb-1">
                    <p class="shrink-0">If YES, give details:</p> 
                    <p class="border-b border-black h-4 mr-2 w-full font-semibold">{{ $q?->q38_a_details??'' }}</p>
                </div>
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q38_b === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q38_b === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="flex gap-1 text-[7pt]">
                    <p class="shrink-0">If YES, give details: </p>
                    <p class="border-b border-black h-4 mr-2 w-full font-semibold">{{ $q?->q38_b_details??'' }}</p>
                </div>
            </td>
         </tr>

        {{-- Q39 --}}
        <tr style="height:18pt;">
            <td colspan="11" class="text-[8pt] bg-gray-100">
                <div class="flex normal-case">
                    <p>39.</p>
                    <p class="px-1">Have you acquired the status of an immigrant or permanent resident of another country?</p>
                </div>
            </td>
            <td colspan="8" class="align-top p-2 text-[8pt]">
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q39 === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q39 === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="text-[7pt]">
                    <p>If YES, give details (country): </p>
                    <p class="border-b border-black h-4 mx-2 font-semibold">{{ $q?->q39_details??'' }}</p>
                </div>
            </td>
        </tr>

        {{-- Q40 --}}
        <tr style="height:45pt;">
            <td colspan="11" class="text-[8pt] align-top bg-gray-100">
                <div class="flex normal-case">
                    <p>40.</p>
                    <p class="px-2">Pursuant to: (a) Indigenous People's Act (RA 8371); (b) Magna Carta for Disabled Persons (RA 7277, as amended); and (c) Expanded Solo Parents Welfare Act (RA 11861), please answer the following items:</p>
                </div>
                <div class="normal-case space-y-5 mb-6">
                    <div class="flex">
                        <p>a.</p>
                        <p class="px-4">Are you a member of any indigenous group?</p>
                    </div>
                    <div class="flex">
                        <p>b.</p>
                        <p class="px-4">Are you a person with disability?</p>
                    </div>
                    <div class="flex">
                        <p>c.</p>
                        <p class="px-4">Are you a solo parent?</p>
                    </div>
                </div>
            </td>
            <td colspan="8" class="align-bottom p-2 text-[7=8pt]">
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q40_a === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q40_a === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="flex gap-1 text-[7pt] mb-1">
                    <p class="shrink-0">If YES, please specify: </p>
                    <p class="border-b border-black ml-8 mr-2 w-full font-semibold h-3">{{ $q?->q40_a_details??'' }}</p>
                </div>
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q40_b === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q40_b === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="flex gap-1 text-[7pt] mb-1">
                    <p class="shrink-0">If YES, please specify ID No: </p>
                    <p class="border-b border-black ml-1 mr-2 w-full font-semibold h-3">{{ $q?->q40_b_details??'' }}</p>
                </div>
                <div class="flex items-center gap-10 mb-1">
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q40_c === true ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">YES</span>
                    </div>
                    <div class="checkbox-container">
                        <div class="box {{ $q?->q40_c === false ? 'checked' : '' }}"></div>
                        <span class="text-[7pt]">NO</span>
                    </div>
                </div>
                <div class="flex gap-1 text-[7pt]">
                    <p class="shrink-0">If YES, please specify ID No: </p>
                    <p class="border-b border-black ml-1 mr-2 w-full font-semibold h-3">{{ $q?->q40_c_details??'' }}</p>
                </div>
            </td>
        </tr>

        {{-- 41. REFERENCES + PHOTO --}}
        <tr style="height:18pt;">
            <td colspan="14" class="text-[8pt] p-1 border-b-0 border-t-2 border-black bg-gray-100">
                41. REFERENCES <span class="font-semibold normal-case text-[7pt]">(Person not related by consanguinity or affinity to applicant/appointee)</span>
            </td>
            <td colspan="5" rowspan="6" class="text-center align-middle border-b-0 border-l-2 border-t-2 border-black">
                <div class="photo-box mt-5">
                    @if(!empty($govId?->passport_photo))
                        <img src="{{ \App\Support\PdsFiles::path($govId->passport_photo) }}" class="w-full h-full object-cover">
                    @else
                        <span class="text-[6.5pt] text-gray-600 p-1 normal-case font-semibold leading-tight">
                            Passport-sized unfiltered <br> digital picture taken within <br> the last 6 months <br> 4.5 cm X 3.5 cm
                        </span>
                    @endif
                </div>
                <p class="text-[8pt] text-center mt-2 text-gray-400">PHOTO</p>
            </td>
        </tr>

        <tr style="height:20pt;" class="uppercase text-center">
            <td colspan="6" class="{{ $lbl }} text-[7pt] border-y align-middle">NAME</td>
            <td colspan="5" class="{{ $lbl }} text-[7pt] border-y align-middle">OFFICE / RESIDENTIAL ADDRESS</td>
            <td colspan="3" class="{{ $lbl }} text-[7pt] border-y align-middle">CONTACT NO. <br> AND/OR EMAIL</td>
        </tr>

        @for($i=0; $i<3; $i++)
        @php $ref = $refs[$i] ?? null; @endphp
        <tr style="height:20pt;" data-row="reference">
            <td colspan="6" class="{{ $val }} uppercase text-[6.5pt] px-1 border-y">{{ $ref?->name ?? 'N/A' }}</td>
            <td colspan="5" class="{{ $val }} uppercase text-[6.5pt] px-1 border-y">{{ $ref?->address ?? 'N/A' }}</td>
            <td colspan="3" class="{{ $val }} text-[6.5pt] px-1 border-y">{{ $ref?->telephone ?? 'N/A' }}</td>
        </tr>
        @endfor

        {{-- 42. DECLARATION + THUMBMARK (Start) --}}
        <tr style="height:22pt;">
            <td colspan="14" class="align-top text-[8pt] p-1 text-justify normal-case border-b-black border-2 bg-gray-100">
                <div class="flex">
                    <span>42.</span>
                    <p class="px-2 leading-tight">
                        I declare under oath that I have personally accomplished this Personal Data Sheet which is a true, correct, and complete statement pursuant to the provisions of pertinent laws, rules, and regulations of the Republic of the Philippines. I authorize the agency head/authorized representative to verify/validate the contents stated herein. I agree that any misrepresentation made in this document and its attachments shall cause the filing of administrative/criminal case/s against me.
                    </p>
                </div>
            </td>
        </tr>

        {{-- GOV ID & SIGNATURE --}}
        <tr>
            {{-- ID Block --}}
            <td colspan="7" class="align-top p-2 py-1.5 border-0 border-r-0">
                <div class="border-2 border-black h-full">
                    <div class="bg-gray-100 border-b border-black p-1 text-[8pt] leading-tight">
                        Government Issued ID <span class="text-[7pt] font-normal">(i.e. Passport, GSIS, SSS, PRC, Driver's License, etc.)</span><br>
                        <span class="italic">PLEASE INDICATE ID Number and Date of Issuance</span>
                    </div>
                    <div class="py-2 text-[7pt] border-b border-black">Government Issued ID: <span class="font-semibold uppercase">{{ $govId?->id_type ?? 'N/A' }}</span></div>
                    <div class="py-2 text-[7pt] border-b border-black">ID/License/Passport No.: <span class="font-semibold uppercase">{{ $govId?->id_number ?? 'N/A' }}</span></div>
                    <div class="py-2 text-[7pt]">Date/Place of Issuance: <span class="font-semibold uppercase">{{ collect([$govId?->date_of_issuance ? PdsFormat::date($govId->date_of_issuance) : null, $govId?->place_of_issuance])->filter()->implode(' / ') ?: 'N/A' }}</span></div>
                </div>
            </td>
            {{-- Signature Block --}}
            <td colspan="7" class="align-top p-2 py-1.5 pr-0 border-t-0 border-r-0 border-l-0">
                <div class="border-2 border-black h-full flex flex-col">
                    <div class="grow flex items-center justify-center p-1 min-h-20">
                        @if(empty($govId?->signature))
                            <span class="text-red-500 text-[7pt] text-center leading-tight">(e-signature/digital certificate)</span>
                        @else
                            <img src="{{ \App\Support\PdsFiles::path($govId->signature) }}" class="max-h-14">
                        @endif
                    </div>
                    <div class="bg-gray-100 border-t border-b border-black text-center py-0.5 text-[7pt]">Signature (Sign inside the box)</div>
                    <div class="text-center py-1 text-[7pt] min-h-[14pt] uppercase">{{ PdsFormat::date($govId?->date_accomplished) }}</div>
                    <div class="bg-gray-100 border-t border-black text-center py-0.5 text-[7pt] ">Date Accomplished</div>
                </div>
            </td>

            {{-- Thumbmark Rowspan starts here --}}
            <td colspan="5" class="text-center align-middle p-2 border-l-0 border-t-0 border-b-black">
                <div class="thumb-box flex flex-col">
                    <div class="grow bg-white"></div>
                    <div class="bg-gray-100 border-t border-black text-center py-0.5 text-[7pt]">
                        Right Thumbmark
                    </div>
                </div>
            </td>
        </tr>

        {{-- SUBSCRIBED AND SWORN --}}
        <tr>
            <td colspan="19" class="text-center p-3 text-[7.5pt] border-b-0 border-2 border-black">
                <span class="uppercase">SUBSCRIBED AND SWORN</span> to before me this <span class="px-16 border-b border-black"></span>, affiant exhibiting his/her validly issued government ID as indicated above.
            </td>
        </tr>

        {{-- PERSON ADMINISTERING OATH --}}
        <tr>
            <td colspan="19" class="p-4 pt-0 border-t-0">
                <div class="ml-60 w-full max-w-[235pt] border-2 border-black">
                    <div class="py-8 text-center text-red-500 text-[7pt] leading-tight font-bold">
                        (e-signature/digital certificate except for notary public)
                    </div>
                    <div class="bg-gray-100 border-t border-black text-center py-1 text-[7pt] normal-case">
                        Person Administering Oath
                    </div>
                </div>
            </td>
        </tr>
    </table>
    <div class="text-right italic text-[6.5pt]">CS FORM 212 (Revised 2026), Page 4 of 4</div>
</div>
