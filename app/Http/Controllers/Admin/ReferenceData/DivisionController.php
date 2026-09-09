<?php

namespace App\Http\Controllers\Admin\ReferenceData;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\EmployeeProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class DivisionController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/ReferenceData/DivisionsSections/Index', [
            // Section names are only unique within a division (e.g. "Office of
            // the Chief" repeats under almost every division), so the employee
            // count must be scoped to both division AND section name — matching
            // on section name alone would double-count across divisions that
            // happen to share a section name.
            'divisions' => Division::with(['sections' => fn ($q) => $q->addSelect([
                'employees_count' => EmployeeProfile::selectRaw('count(*)')
                    ->whereColumn('employee_profiles.section', 'sections.name')
                    ->whereRaw('employee_profiles.division = (select name from divisions where divisions.id = sections.division_id)'),
            ])])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'         => 'required|string|max:255|unique:divisions,name',
            'abbreviation' => 'nullable|string|max:50',
        ]);

        Division::create($data);

        return back()->with('success', 'Division added.');
    }

    public function update(Request $request, Division $division)
    {
        $data = $request->validate([
            'name'         => 'required|string|max:255|unique:divisions,name,' . $division->id,
            'abbreviation' => 'nullable|string|max:50',
        ]);

        DB::transaction(function () use ($division, $data) {
            $oldName = $division->name;
            $division->update($data);

            // EmployeeProfile.division is a denormalized string snapshot, not a
            // foreign key — a rename must cascade or every employee here goes stale.
            if ($data['name'] !== $oldName) {
                EmployeeProfile::where('division', $oldName)->update(['division' => $data['name']]);
            }
        });

        return back()->with('success', 'Division updated.');
    }

    public function destroy(Division $division)
    {
        if (EmployeeProfile::where('division', $division->name)->exists()) {
            throw ValidationException::withMessages([
                'division' => 'Cannot delete "' . $division->name . '" — it is still assigned to one or more employees.',
            ]);
        }

        $division->delete();

        return back()->with('success', 'Division deleted.');
    }
}
