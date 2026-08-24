<?php

namespace App\Http\Controllers\Admin\ReferenceData;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\EmployeeProfile;
use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SectionController extends Controller
{
    public function store(Request $request, Division $division)
    {
        $data = $request->validate([
            'name'         => [
                'required', 'string', 'max:255',
                Rule::unique('sections', 'name')->where('division_id', $division->id),
            ],
            'abbreviation' => 'nullable|string|max:50',
        ]);

        $division->sections()->create($data);

        return back()->with('success', 'Section added.');
    }

    public function update(Request $request, Section $section)
    {
        $data = $request->validate([
            'name'         => [
                'required', 'string', 'max:255',
                Rule::unique('sections', 'name')->where('division_id', $section->division_id)->ignore($section->id),
            ],
            'abbreviation' => 'nullable|string|max:50',
        ]);

        $section->update($data);

        return back()->with('success', 'Section updated.');
    }

    public function destroy(Section $section)
    {
        if (EmployeeProfile::where('section', $section->name)->exists()) {
            throw ValidationException::withMessages([
                'section' => 'Cannot delete "' . $section->name . '" — it is still assigned to one or more employees.',
            ]);
        }

        $section->delete();

        return back()->with('success', 'Section deleted.');
    }
}
