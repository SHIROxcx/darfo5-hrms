<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CS Form No. 212 – Personal Data Sheet</title>
{{-- Tailwind CDN — Browsershot (Chromium) loads this before rendering --}}
<script src="https://cdn.tailwindcss.com"></script>
<script>
    tailwind.config = {
        theme: {
            extend: {
                fontFamily: {
                    sans: ['"Arial Narrow"', 'Arial', 'sans-serif'],
                    'narrow': ['"Arial Narrow"', 'Arial', 'sans-serif'],
                },
            }
        }
    }
</script>
<style>
    /* Base resets for pixel-perfect PDF layout */
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @font-face {
        font-family: 'Arial Narrow';
        src: local('Arial Narrow'), local('Arial-Narrow'),
             url(data:font/ttf;base64,{{ base64_encode(file_get_contents(public_path('fonts/ARIALN.TTF'))) }}) format('truetype');
        font-weight: normal;
        font-style: normal;
    }
    @font-face {
        font-family: 'Arial Narrow';
        src: local('Arial Narrow Bold'), local('Arial-NarrowBold'),
             url(data:font/ttf;base64,{{ base64_encode(file_get_contents(public_path('fonts/ARIALNB.TTF'))) }}) format('truetype');
        font-weight: bold;
        font-style: normal;
    }
    @font-face {
        font-family: 'Arial Narrow';
        src: local('Arial Narrow Italic'), local('Arial-NarrowItalic'),
             url(data:font/ttf;base64,{{ base64_encode(file_get_contents(public_path('fonts/ARIALNI.TTF'))) }}) format('truetype');
        font-weight: normal;
        font-style: italic;
    }
    @font-face {
        font-family: 'Arial Narrow';
        src: local('Arial Narrow Bold Italic'), local('Arial-NarrowBoldItalic'),
             url(data:font/ttf;base64,{{ base64_encode(file_get_contents(public_path('fonts/ARIALNBI.TTF'))) }}) format('truetype');
        font-weight: bold;
        font-style: italic;
    }

    body { 
        font-family: "Arial Narrow", Arial, Helvetica, sans-serif; 
        font-size: 7pt; 
        color: #000; 
        background: #fff; 
    }

    .pds_header {
        font-family: Arial !important;
    }

    /* A4 printable area is 188 mm × 278 mm (Browsershot margins 11/11/8/11 mm). The layout is drawn
       218.6 mm wide and zoomed to 0.86, so it prints 188 mm wide: the same "fit to page" scaling the
       official workbook uses. Page breaks fall between pages only (no blank trailing page). */
    .page {
        width: 218.6mm;
        zoom: 0.86;
        background: #fff;
        position: relative;
    }
    .page + .page { page-break-before: always; }

    .photo-box {
        width: 3.5cm;
        height: 4.5cm;
        border: 2px solid black;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background-color: white;
    }
    .thumb-box {
        width: 4.5cm;
        height: 3.6cm;
        border: 2px solid black;
        margin: 0 auto;
        background-color: white;
    }
    .pds-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        border: 2px solid black;
        border-top: 0px;
    }

    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    td, th {
        border: 1px solid #000;
        padding: 1px 3px;
        vertical-align: top;
        font-size: 7pt;
        line-height: 1.3;
        word-wrap: break-word;
        overflow: hidden;
    }

    /* Custom Checkbox Container */
    .checkbox-container {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    .box {
        width: 12px;
        height: 12px;
        border: 1px solid #000;
        background-color: #fff;
        display: flex;
        align-items: center;
        justify-center: center;
        position: relative;
        transition: all 0.2s;
    }

    /* Checkmark */
    .box.checked::after {
        content: "✓";
        font-size: 9pt;
        font-weight: bold;
        color: #000;
        line-height: 1;
    }

    .photo-box img { width: 100%; height: 100%; object-fit: cover; }

    @page { size: A4; margin: 11mm 11mm 8mm 11mm; }
</style>
@if(!empty($preview))
{{-- On-screen page outline for the local html-preview route only. Never part of the PDF. --}}
<style id="pds-preview-outline">
    @media screen {
        body { background: #e5e7eb; }
        .page { background: #fff; margin: 12px auto; box-shadow: 0 0 6px rgba(0, 0, 0, 0.35); }
    }
</style>
@endif
</head>
<body class="font-sans text-black bg-white">

    @php
        $govId = $pds['government_id'] ?? null;

        // Tailwind utilities
        $lbl  = 'bg-gray-100 text-[7pt] uppercase';                                     // label cell
        $val  = 'align-middle text-[7pt] font-semibold';                               // value cell
        $sectionHeader  = 'bg-neutral-400 text-white font-narrow font-black italic text-[10pt] uppercase tracking-wide border-2 border-black py-0';
        $note = 'bg-gray-100 text-center italic text-[7pt] text-red-500 font-bold border-2 border-black'; // continue note
        $sig  = 'border-2 border-black align-middle text-center text-[7pt] font-semibold';
    @endphp

    @include('pds.pdf.page-1')
    @include('pds.pdf.page-2')
    @include('pds.pdf.page-3')
    @include('pds.pdf.page-4')

    {{-- Continuation sheets C5-C11: printed only for the rows that overflow a main page. --}}
    @foreach([
        ['C5', 'learning_development', 'learning-development'],
        ['C6', 'work_experience', 'work-experience'],
        ['C7', 'children', 'family-background'],
        ['C8', 'education', 'education'],
        ['C9', 'eligibility', 'eligibility'],
        ['C10', 'voluntary_work', 'voluntary-work'],
        ['C11', 'other_info', 'other-information'],
    ] as [$sheet, $key, $partial])
        @foreach($sections[$key]['sheets'] as $rows)
            @include('pds.pdf.continuation.'.$partial, ['rows' => $rows, 'sheet' => $sheet])
        @endforeach
    @endforeach

<script id="pds-fit-to-page">
    // Safety net for long text. A page is drawn 218.6 mm wide at zoom 0.86 (188 mm printed, see .page). When wrapped
    // text makes a page taller than the A4 printable height, shrink that page a little at a time, keeping its printed
    // width at 188 mm, so the signature row and footer never land alone on a second sheet of paper.
    (function () {
        var limit = 277 * 96 / 25.4; // px; the printable height is 278 mm
        function fit() {
            document.querySelectorAll('.page').forEach(function (page) {
                var zoom = 0.86;
                page.style.zoom = zoom;
                page.style.width = (188 / zoom) + 'mm';
                while (page.getBoundingClientRect().height > limit && zoom > 0.5) {
                    zoom = Math.round((zoom - 0.01) * 100) / 100;
                    page.style.zoom = zoom;
                    page.style.width = (188 / zoom) + 'mm';
                }
            });
        }
        fit();
        window.addEventListener('load', fit);
        if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fit); }
    })();
</script>
</body>
</html>
