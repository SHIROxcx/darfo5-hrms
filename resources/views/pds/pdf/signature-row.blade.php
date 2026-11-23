{{-- SIGNATURE / DATE row at the bottom of a page.
     $spans = [label, signature, date label, date] column spans of the page's table. --}}
@use('App\Support\PdsFormat')
@php [$labelSpan, $signatureSpan, $dateLabelSpan, $dateSpan] = $spans; @endphp
<tr style="height:18pt;">
    <td colspan="{{ $labelSpan }}" class="text-center border-2 border-black align-middle font-black italic text-[10pt] bg-gray-100">SIGNATURE</td>
    <td colspan="{{ $signatureSpan }}" class="{{ $sig }} text-center align-middle">
        @if(empty($govId?->signature))
            <span class="text-red-500 italic text-[7pt]">(e-signature/digital certificate)</span>
        @else
            <img src="{{ \App\Support\PdsFiles::path($govId->signature) }}" class="max-h-8 max-w-full mx-auto block">
        @endif
    </td>
    <td colspan="{{ $dateLabelSpan }}" class="text-center border-2 border-black align-middle font-black italic text-[10pt] bg-gray-100">DATE</td>
    <td colspan="{{ $dateSpan }}" class="border-2 border-black align-middle px-2 text-center font-bold uppercase">{{ PdsFormat::date($govId?->date_accomplished) }}</td>
</tr>
