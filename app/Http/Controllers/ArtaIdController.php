<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\PdsGovernmentId;
use App\Models\Section;
use App\Models\User;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\RoundBlockSizeMode;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Spatie\Browsershot\Browsershot;

class ArtaIdController extends Controller
{
    private function authorizeAdmin(): void
    {
        if (!Auth::user()->hasAnyRole(['admin', 'superadmin', 'hr'])) {
            abort(403, 'Only administrators can generate ARTA IDs.');
        }
    }

    private function buildEmployee(int $userId): object
    {
        $user = User::with(['employeeProfile', 'pdsPersonalInfo'])->findOrFail($userId);
        $ep   = $user->employeeProfile;
        $gov  = PdsGovernmentId::where('user_id', $userId)->first();

        $employeeNumber = $ep->employee_number
            ?? $user->pdsPersonalInfo->agency_employee_no
            ?? null;

        $office = $this->resolveOfficeAbbreviation($ep->section, $ep->division);

        return (object) [
            'employee_id'          => $employeeNumber,
            'name'                 => trim($user->first_name . ' ' . $user->last_name),
            'position'             => $ep->position ?? null,
            'office'               => $office,
            'employment_type'      => $ep->employment_type ?? null,
            'photo_data_uri'       => $user->photo ? $this->fileToDataUri(storage_path('app/public/' . $user->photo)) : null,
            'signature_data_uri'   => $gov?->signature ? $this->fileToDataUri(storage_path('app/public/' . $gov->signature)) : null,
            'border_img'           => $this->fileToDataUri(public_path('images/arta-border.png')),
            'bagong_pilipinas_img' => $this->fileToDataUri(public_path('images/bagong-pilipinas.png')),
            'da_logo_img'          => $this->fileToDataUri(public_path('images/da-masarig-logo.png')),
            'qr_data_uri'          => $employeeNumber ? $this->buildQrDataUri($employeeNumber) : null,
        ];
    }

    private function fileToDataUri(string $absolutePath): ?string
    {
        if (!is_file($absolutePath)) {
            return null;
        }

        $mime = mime_content_type($absolutePath) ?: 'image/png';
        $data = base64_encode(file_get_contents($absolutePath));

        return "data:{$mime};base64,{$data}";
    }

    private function buildQrDataUri(string $employeeNumber): string
    {
        $url = route('public.employee.show', $employeeNumber);

        $result = Builder::create()
            ->data($url)
            ->encoding(new Encoding('UTF-8'))
            ->errorCorrectionLevel(ErrorCorrectionLevel::Medium)
            ->size(300)
            ->margin(10)
            ->roundBlockSizeMode(RoundBlockSizeMode::Margin)
            ->build();

        return $result->getDataUri();
}

    public function preview(int $user)
    {
        $this->authorizeAdmin();
        $employee = $this->buildEmployee($user);

        return view('id.arta-id', compact('employee'));
    }

    public function download(int $user)
    {
        $this->authorizeAdmin();
        $employee = $this->buildEmployee($user);

        $html = view('id.arta-id', compact('employee'))->render();

        $safeName = Str::upper(str_replace(' ', '_', $employee->name));
        $fileName = "DARFO5_{$safeName}_{$employee->employee_id}.pdf";
        $tmpDir   = storage_path('app/tmp');
        $tmpPath  = $tmpDir . '/' . $fileName;

        if (!is_dir($tmpDir)) {
            mkdir($tmpDir, 0755, true);
        }

        Browsershot::html($html)
            ->showBackground()
            ->format('A4') // Changes canvas size from custom inches to standard A4
            ->margins(0, 0, 0, 0)
            ->savePdf($tmpPath);

        return response()->download($tmpPath, $fileName)->deleteFileAfterSend(true);
    }

    // Abbreviation Helper
    private function resolveOfficeAbbreviation(?string $sectionName, ?string $divisionName): ?string
    {
        $divisionAbbr = null;
        $sectionAbbr  = null;

        if ($divisionName) {
            $division = Division::where('name', $divisionName)->first();
            $divisionAbbr = $division->abbreviation ?? null;
        }

        if ($sectionName) {
            $section = Section::where('name', $sectionName)->first();
            $sectionAbbr = $section->abbreviation ?? null;
        }

        // Both present: "ORED - ICT Unit"
        if ($divisionAbbr && $sectionAbbr) {
            return "{$divisionAbbr} - {$sectionAbbr}";
        }

        // Only one present, return whichever exists
        return $divisionAbbr ?? $sectionAbbr ?? null;
    }
}