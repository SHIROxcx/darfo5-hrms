<?php

namespace App\Http\Controllers\Admin\ReferenceData;

use App\Http\Controllers\Controller;
use App\Models\GraduateProgram;
use App\Models\PdsEducation;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class GraduateProgramController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/ReferenceData/GraduatePrograms/Index', [
            'programs' => GraduateProgram::orderBy('program')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'program'      => 'required|string|max:255|unique:graduate_programs,program',
            'abbreviation' => 'nullable|string|max:50',
        ]);

        GraduateProgram::create($data);

        return back()->with('success', 'Graduate program added.');
    }

    public function update(Request $request, GraduateProgram $graduateProgram)
    {
        $data = $request->validate([
            'program'      => 'required|string|max:255|unique:graduate_programs,program,' . $graduateProgram->id,
            'abbreviation' => 'nullable|string|max:50',
        ]);

        $graduateProgram->update($data);

        return back()->with('success', 'Graduate program updated.');
    }

    public function destroy(GraduateProgram $graduateProgram)
    {
        $inUse = PdsEducation::where('level', 'Graduate Studies')
            ->where('course', $graduateProgram->program)
            ->exists();

        if ($inUse) {
            throw ValidationException::withMessages([
                'program' => 'Cannot delete "' . $graduateProgram->program . '" — it is still referenced in one or more employee PDS records.',
            ]);
        }

        $graduateProgram->delete();

        return back()->with('success', 'Graduate program deleted.');
    }
}
