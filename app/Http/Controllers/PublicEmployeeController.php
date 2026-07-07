<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\Section;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PublicEmployeeController extends Controller
{
    public function show(string $employeeNumber)
    {
        $user = User::with('employeeProfile')
            ->whereHas('employeeProfile', fn ($q) => $q->where('employee_number', $employeeNumber))
            ->orWhereHas('pdsPersonalInfo', fn ($q) => $q->where('agency_employee_no', $employeeNumber))
            ->first();

        if (!$user) {
            return Inertia::render('public/employee-id', [
                'found' => false,
            ]);
        }

        $ep = $user->employeeProfile;

        $office = $this->resolveOfficeAbbreviation($ep->section, $ep->division);

        return Inertia::render('public/employee-id', [
            'found' => true,
            'employee' => [
                'employee_number' => $employeeNumber,
                'name'     => trim($user->first_name . ' ' . $user->last_name),
                'position' => $ep->position ?? null,
                'office'   => $office,
                'photo'    => $user->photo ? Storage::url($user->photo) : null,
                'status'   => $ep->is_active ?? null, 
            ],
        ]);
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