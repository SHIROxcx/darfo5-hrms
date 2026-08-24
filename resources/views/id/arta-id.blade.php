<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>ARTA ID</title>

    </head>
    <body style="margin: 0; padding: 24px; background: #f4f4f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; box-sizing: border-box;">

    @php
        $isPermanent = strtolower($employee->employment_type ?? '') === 'permanent';
        $accentColor = $isPermanent ? '#006837' : '#116ebb';
        $accentBgColor = $isPermanent ? '#f0fdf4' : '#eff6ff';
    @endphp

        <div id="id-card-wrapper">

            @for($copy = 0; $copy < 2; $copy++)
            <div class="id-card {{ $copy === 1 ? 'print-only-card' : '' }}">

                <img src="{{ $employee->border_img }}" class="id-border-img" alt="">

                <div class="id-content">

                    <div class="id-header">
                        <img src="{{ $employee->bagong_pilipinas_img }}" class="id-logo-left" alt="Bagong Pilipinas">
                        <div class="id-header-text">
                            <p class="id-republic">Republic of the Philippines</p>
                            <p class="id-dept">DEPARTMENT OF AGRICULTURE</p>
                            <p class="id-office">REGIONAL FIELD OFFICE 5</p>
                            <p class="id-address">San Agustin, Pili, Camarines Sur</p>
                        </div>
                        <img src="{{ $employee->da_logo_img }}" class="id-logo-right" alt="DA Logo">
                    </div>

                    <div class="id-divider"></div>

                    <p class="id-emp-no">Employee No.: {{ $employee->employee_id ?? '0000' }}</p>

                    <div class="id-photo-box"
                            style="border-color: {{ $accentColor }};
                            background-color: {{ $accentBgColor }};">
                        @if(!empty($employee->photo_data_uri))
                            <img src="{{ $employee->photo_data_uri }}" class="id-photo-img" alt="Employee Photo">
                        @else
                            <span class="id-photo-empty">No Photo</span>
                        @endif
                    </div>

                    <h2 class="id-name" style="color: {{ $accentColor }};">
                        {{ strtoupper($employee->name) }}
                    </h2>

                    <p class="id-position">{{ $employee->position ?? 'Position' }}</p>

                    <p class="id-office-label">{{ $employee->office ?? '-' }}</p>

                    <div class="id-bottom">
                        <img src="{{ $employee->qr_data_uri }}" width="95" height="95" alt="QR Code">
                        <div class="id-signature">
                            <div style="position: relative; width: 120px; height: 35px;">
                                @if(!empty($employee->signature_data_uri))
                                    <img src="{{ $employee->signature_data_uri }}"
                                        style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); height: 50px; max-width: 120px; object-fit: contain; object-position: bottom; z-index: 10;">
                                @endif
                                <div style="position: absolute; bottom: 2px; left: 0; width: 100%; border-bottom: 2px solid #444; z-index: 999;"></div>
                            </div>
                            <p class="id-signature-label">Signature</p>
                        </div>
                    </div>

                </div>
            </div>
            @endfor

        </div>

        <script>
            document.title = 'DARFO5_{{ str_replace(' ', '_', strtoupper($employee->name)) }}_{{ $employee->employee_id ?? "" }}';
        </script>

        <style>
            .id-card, .id-card * { 
                font-family: 'Calibri', 'Trebuchet MS', sans-serif !important; 
            }
            #id-card-wrapper { 
                display: flex; justify-content: center; align-items: center; gap: 24px; 
            }
            .print-only-card { 
                width: 0 !important; 
                height: 0 !important; 
                overflow: hidden !important; 
                opacity: 0 !important; 
                padding: 0 !important; 
                margin: 0 !important; 
                border: none !important;
                box-shadow: none !important; 
            }
            .id-card { 
                position: relative; 
                width: 326px; 
                height: 509px; 
                background: #ffffff; 
                box-shadow: 0 4px 32px rgba(0,0,0,0.18); 
                display: flex; 
                flex-direction: column; 
                overflow: hidden; 
            }
            .id-border-img { 
                position: absolute; 
                inset: 0; 
                width: 100%; 
                height: 100%; 
                object-fit: fill; 
                pointer-events: none; 
                z-index: 1; 
            }
            .id-content { 
                position: relative; 
                z-index: 2; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                width: 100%; 
                height: 100%; 
                padding: 0.14in 0.12in; 
                box-sizing: border-box; 
            }
            .id-header { 
                position: relative; 
                width: 100%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                min-height: 65px; 
            }
            .id-logo-left { 
                position: absolute; 
                left: 8px; 
                top: 50%; 
                transform: translateY(-50%); 
                height: 80px; 
                width: 80px; 
                object-fit: contain; 
            }
            .id-logo-right { 
                position: absolute; 
                right: 4px; 
                top: 50%; 
                background: #ffffff; 
                transform: translateY(-50%); 
                height: 80px; 
                width: 80px; 
                object-fit: contain; 
            }
            .id-header-text { 
                width: 100%; 
                text-align: center; 
                padding: 0; 
            }
            .id-republic { 
                font-size: 6pt; 
                color: #222; 
                margin: 0; 
                line-height: 1.1; 
            }
            .id-dept { 
                font-size: 7pt; 
                font-weight: 700; 
                color: #111; 
                margin: 0; 
                line-height: 1.1;
                text-transform: uppercase; 
            }
            .id-office { 
                font-size: 6.5pt; 
                font-weight: 700; 
                color: #222; 
                margin: 0; 
                line-height: 1.1; 
                text-transform: uppercase; 
            }
            .id-address { 
                font-size: 6pt; 
                color: #222; 
                margin: 0; 
                line-height: 1.1; 
            }
            .id-divider { 
                width: 100%; 
                height: 1px; 
                margin: 4px 0 0 0; 
            }
            .id-emp-no { 
                font-size: 10pt; 
                font-weight: 700; 
                color: #222; 
                margin: 8px 0; 
            }
            .id-photo-box { 
                width: 2in; 
                height: 2in; 
                border: 3px solid; 
                margin-top: 5px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                background: #f8fafc; 
                overflow: hidden; 
                flex-shrink: 0; 
            }
            .id-photo-img { 
                width: 100%; 
                height: 100%; 
                object-fit: cover; 
            }
            .id-photo-empty { 
                font-size: 8pt; 
                color: #aaa; 
            }
            .id-name { 
                font-size: 16pt; 
                font-weight: bold; 
                text-align: center; 
                margin: 4px 0 0 0; 
                letter-spacing: 0.5px; 
                text-transform: uppercase; 
                line-height: 1; 
            }
            .id-position { 
                font-size: 10pt; 
                font-weight: 700; 
                color: #222; 
                margin: 1px 0; text-align: 
                center; line-height: 1; 
            }
            .id-office-label { 
                font-size: 12pt; 
                font-weight: 700; 
                color: #111; 
                margin: 1px 0 0 0; 
                letter-spacing: 1.1px; 
                text-align: center; 
                text-transform: uppercase; 
            }
            .id-bottom { 
                position: absolute; 
                bottom: 20px; 
                display: flex; 
                align-items: 
                flex-end; 
                gap: 10px; 
            }
            .id-signature { 
                flex: 1; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
            }
            .id-signature-label { 
                font-size: 9pt; 
                color: #222; 
            }

            @media print {
                @page { 
                    size: 6.8in 5.3in landscape; 
                    margin: 0; 
                }
                .print-only-card { 
                    width: 3.4in !important; 
                    height: 5.3in !important; 
                    overflow: visible !important; 
                    opacity: 1 !important; 
                    display: flex !important; 
                }
                body * { visibility: hidden !important; }

                #id-card-wrapper, #id-card-wrapper * { 
                    visibility: 
                    visible !important; 
                }

                #id-card-wrapper, .id-card {
                    box-sizing: border-box !important;
                }
                #id-card-wrapper { 
                    position: fixed !important; 
                    top: 0.5in !important;
                    left: 0.5in !important; 
                    width: 6.8in !important; 
                    height: 5.3in !important; 
                    display: flex !important; 
                    flex-direction: row !important; 
                    gap: 3px !important; 
                    margin: 0 !important; 
                    padding: 0 !important; 
                }
                .id-card { 
                    width: 3.4in !important; 
                    height: 5.3in !important; 
                    box-shadow: none !important; 
                    outline: none !important; 
                    border: 2.5px solid black !important; 
                }
            }
        </style>

    </body>
</html>