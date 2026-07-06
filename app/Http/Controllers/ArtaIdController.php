<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\PdsGovernmentId;
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

        // Generate the QR code as a base64 PNG, encoding the employee number.
        // $qrCodeBase64 = null;
        // if ($employeeNumber) {
        //     $qrCodeBase64 = base64_encode(
        //         QrCode::format('png')
        //             ->size(160)
        //             ->margin(1)
        //             ->errorCorrection('H')
        //             ->generate((string) $employeeNumber)
        //     );
        // }

        return (object) [
            'employee_id'     => $employeeNumber,
            'name'            => trim($user->first_name . ' ' . $user->last_name),
            'position'        => $ep->position ?? null,
            'office'          => $ep->division ?? null,
            'employment_type' => $ep->employment_type ?? null,
            'photo'           => $user->photo,
            'signature'       => $gov->signature ?? null,
            // 'qr_code_base64'  => $qrCodeBase64,
        ];
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

        $html = view('arta-id', compact('employee'))->render();

        $safeName = Str::upper(str_replace(' ', '_', $employee->name));
        $fileName = "DARFO5_{$safeName}_{$employee->employee_id}.pdf";
        $tmpDir   = storage_path('app/tmp');
        $tmpPath  = $tmpDir . '/' . $fileName;

        if (!is_dir($tmpDir)) {
            mkdir($tmpDir, 0755, true);
        }

        Browsershot::html($html)
            ->showBackground()
            ->paperSize(6.8, 5.3, 'in')
            ->margins(0, 0, 0, 0)
            ->savePdf($tmpPath);

        return response()->download($tmpPath, $fileName)->deleteFileAfterSend(true);
    }
}