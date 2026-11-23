<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $title }} - {{ $subject }}</title>
    <style>
        /* A4. The page margins come from Browsershot (see MemoPdfService::buildPdf); sizes here are in mm and pt, never px. */
        @page { size: A4; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body {
            font-family: 'Book Antiqua', 'Palatino Linotype', Palatino, 'Times New Roman', serif;
            font-size: 11.5pt;
            line-height: 1.45;
            color: #111;
        }

        /* One table holds the whole memo so its head (the letterhead) repeats on every printed page. */
        table.sheet { width: 100%; table-layout: fixed; border-collapse: collapse; }
        table.sheet > thead { display: table-header-group; }
        table.sheet > thead > tr > td,
        table.sheet > tbody > tr > td { padding: 0; vertical-align: top; }

        .letterhead { width: 100%; table-layout: fixed; border-collapse: collapse; }
        .letterhead td { vertical-align: middle; padding: 0; }
        .lh-logos { width: 38mm; white-space: nowrap; }
        .lh-logos img { height: 17mm; width: auto; margin-right: 1.5mm; vertical-align: middle; }
        .lh-text { text-align: center; line-height: 1.25; }
        .lh-spacer { width: 38mm; }
        .lh-republic { font-size: 8.5pt; }
        .lh-dept, .lh-office { font-size: 11pt; font-weight: bold; }
        .lh-small { font-size: 8pt; }
        .rule-green { height: 1.4pt; background: #0f6b2f; margin-top: 3mm; }
        .rule-orange { height: 0.8pt; background: #f7941d; margin: 0.7mm 0 6mm; }

        .title { font-size: 12.5pt; font-weight: bold; letter-spacing: 0.3pt; }
        .number { font-size: 11pt; }

        table.meta { width: 100%; table-layout: fixed; border-collapse: collapse; margin: 5mm 0 0; }
        table.meta td { padding: 0 0 1.6mm; vertical-align: top; overflow-wrap: anywhere; word-break: break-word; }
        table.meta td.k { width: 26mm; font-weight: bold; }
        table.meta td.subject { font-weight: bold; }
        .meta-rule { height: 0.8pt; background: #111; margin: 1mm 0 5mm; }

        p.para { margin: 0 0 3.4mm; text-align: justify; overflow-wrap: anywhere; word-break: break-word; }
        p.para.ragged { text-align: left; }
        p.done { margin: 6mm 0 0; }

        .closing { break-inside: avoid; page-break-inside: avoid; }
        .signers { margin-top: 10mm; page-break-inside: avoid; }
        table.signers-table { width: 100%; table-layout: fixed; border-collapse: collapse; }
        td.signer { width: 50%; padding: 0 4mm 8mm; text-align: center; vertical-align: top; page-break-inside: avoid; }
        .sig-label { font-size: 9pt; font-style: italic; margin-bottom: 1mm; }
        .sig-space { height: 18mm; }
        .signature { display: block; margin: 0 auto; max-height: 18mm; max-width: 56mm; }
        .sig-name { font-weight: bold; font-size: 11pt; }
        .sig-position { font-size: 10pt; }

        .watermark {
            position: fixed; top: 40%; left: 0; width: 100%; text-align: center; z-index: 0;
            font-family: Arial, sans-serif; font-size: 120pt; font-weight: bold; letter-spacing: 6pt;
            color: rgba(190, 20, 20, 0.12); transform: rotate(-28deg);
        }
    </style>
</head>
<body>
@if($preview)
    <div class="watermark">DRAFT</div>
@endif

<table class="sheet">
    <thead>
    <tr>
        <td>
            <table class="letterhead">
                <tr>
                    <td class="lh-logos">
                        @foreach($logos as $logo)
                            @if($logo)<img src="{{ $logo }}" alt="">@endif
                        @endforeach
                    </td>
                    <td class="lh-text">
                        <div class="lh-republic">{{ $letterhead['republic'] }}</div>
                        <div class="lh-dept">{{ $letterhead['department'] }}</div>
                        <div class="lh-office">{{ $letterhead['office'] }}</div>
                        @if(filled($letterhead['address']))<div class="lh-small">{{ $letterhead['address'] }}</div>@endif
                        @if(filled($letterhead['contact']))<div class="lh-small">{{ $letterhead['contact'] }}</div>@endif
                    </td>
                    <td class="lh-spacer"></td>
                </tr>
            </table>
            <div class="rule-green"></div>
            <div class="rule-orange"></div>
        </td>
    </tr>
    </thead>
    <tbody>
    <tr>
        <td>
            <div class="title">{{ $title }}</div>
            <div class="number">{{ $numberLine }}</div>
            <div class="number">{{ $seriesLine }}</div>

            <table class="meta">
                <tr><td class="k">TO:</td><td>{{ $addressedTo }}</td></tr>
                <tr><td class="k">SUBJECT:</td><td class="subject">{{ $subject }}</td></tr>
                <tr><td class="k">DATE:</td><td>{{ $dateLine }}</td></tr>
            </table>
            <div class="meta-rule"></div>

            @php $lead = array_slice($paragraphs, 0, -1); $last = $paragraphs ? end($paragraphs) : null; @endphp
            @foreach($lead as $paragraph)
                <p class="para{{ $paragraph['ragged'] ? ' ragged' : '' }}">{!! $paragraph['html'] !!}</p>
            @endforeach

            <div class="closing">
            @if($last !== null)
                <p class="para{{ $last['ragged'] ? ' ragged' : '' }}">{!! $last['html'] !!}</p>
            @endif

            @if($doneLine)
                <p class="done">{{ $doneLine }}</p>
            @endif

            @if(count($signers))
                @php $only = count($signers) === 1; @endphp
                <div class="signers">
                    <table class="signers-table">
                        @foreach(array_chunk($signers, 2) as $pair)
                            <tr>
                                @foreach($pair as $signer)
                                    <td class="signer" @if($only) colspan="2" @endif>
                                        @if(filled($signer['label']))<div class="sig-label">{{ $signer['label'] }}</div>@endif
                                        <div class="sig-space">@if($signer['picture'])<img class="signature" src="{{ $signer['picture'] }}" alt="">@endif</div>
                                        <div class="sig-name">{{ $signer['name'] }}</div>
                                        <div class="sig-position">{{ $signer['position'] }}</div>
                                    </td>
                                @endforeach
                                @if(count($pair) === 1 && ! $only)<td class="signer"></td>@endif
                            </tr>
                        @endforeach
                    </table>
                </div>
            @endif
            </div>
        </td>
    </tr>
    </tbody>
</table>
</body>
</html>
