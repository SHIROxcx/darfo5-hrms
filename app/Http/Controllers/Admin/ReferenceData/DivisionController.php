<?php

namespace App\Http\Controllers\Admin\ReferenceData;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\EmployeeProfile;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class DivisionController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/ReferenceData/DivisionsSections/Index', [
            'divisions' => Division::with('sections')->orderBy('name')->get(),
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

        $division->update($data);

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
