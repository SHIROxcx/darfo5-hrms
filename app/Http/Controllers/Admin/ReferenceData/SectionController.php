<?php

namespace App\Http\Controllers\Admin\ReferenceData;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\EmployeeProfile;
use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        DB::transaction(function () use ($section, $data) {
            $oldName = $section->name;
            $divisionName = $section->division->name;
            $section->update($data);

            // EmployeeProfile.section is a denormalized string snapshot, not a
            // foreign key — a rename must cascade or every employee here goes
            // stale. Scoped to this section's own division, since section names
            // are only unique within a division (e.g. "Office of the Chief"
            // repeats under almost every division) — matching on section name
            // alone would rename it for employees in an unrelated division too.
            if ($data['name'] !== $oldName) {
                EmployeeProfile::where('division', $divisionName)
                    ->where('section', $oldName)
                    ->update(['section' => $data['name']]);
            }
        });

        return back()->with('success', 'Section updated.');
    }

    /**
     * Move a section to a different division, cascading the change to every
     * employee currently assigned to it (EmployeeProfile.division/section
     * are denormalized string snapshots, not foreign keys, so they'd
     * otherwise go stale).
     */
    public function move(Request $request, Section $section)
    {
        $data = $request->validate([
            'division_id' => ['required', 'integer', 'exists:divisions,id'],
        ]);

        if ((int) $data['division_id'] === $section->division_id) {
            throw ValidationException::withMessages([
                'division_id' => 'The section is already in this division.',
            ]);
        }

        // Section names are only unique within a division (store()/update()
        // enforce this) — a move must respect the same rule in the target.
        $nameConflict = Section::where('division_id', $data['division_id'])
            ->where('name', $section->name)
            ->exists();

        if ($nameConflict) {
            throw ValidationException::withMessages([
                'division_id' => 'The target division already has a section named "' . $section->name . '".',
            ]);
        }

        $targetDivision = Division::findOrFail($data['division_id']);
        $oldDivisionName = $section->division->name;
        $sectionName = $section->name;

        $affectedCount = DB::transaction(function () use ($section, $targetDivision, $oldDivisionName, $sectionName) {
            // Scoped to both division AND section name — section names are only
            // unique within a division, so matching on section name alone could
            // reassign employees from an unrelated division's same-named section.
            $affected = EmployeeProfile::where('division', $oldDivisionName)
                ->where('section', $sectionName)
                ->update(['division' => $targetDivision->name]);

            $section->update(['division_id' => $targetDivision->id]);

            return $affected;
        });

        return response()->json([
            'message' => $affectedCount > 0
                ? "Section moved. {$affectedCount} employee record" . ($affectedCount === 1 ? '' : 's') . ' updated.'
                : 'Section moved.',
            'affected_count' => $affectedCount,
        ]);
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
