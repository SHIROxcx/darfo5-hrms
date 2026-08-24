<?php

namespace App\Http\Controllers\Admin\ReferenceData;

use App\Http\Controllers\Controller;
use App\Models\BachelorsDegree;
use App\Models\PdsEducation;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class BachelorsDegreeController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/ReferenceData/BachelorsDegrees/Index', [
            'degrees' => BachelorsDegree::orderBy('degree')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'degree'       => 'required|string|max:255|unique:bachelors_degrees,degree',
            'abbreviation' => 'nullable|string|max:50',
        ]);

        BachelorsDegree::create($data);

        return back()->with('success', "Bachelor's degree added.");
    }

    public function update(Request $request, BachelorsDegree $bachelorsDegree)
    {
        $data = $request->validate([
            'degree'       => 'required|string|max:255|unique:bachelors_degrees,degree,' . $bachelorsDegree->id,
            'abbreviation' => 'nullable|string|max:50',
        ]);

        $bachelorsDegree->update($data);

        return back()->with('success', "Bachelor's degree updated.");
    }

    public function destroy(BachelorsDegree $bachelorsDegree)
    {
        $inUse = PdsEducation::where('level', 'College')
            ->where('course', $bachelorsDegree->degree)
            ->exists();

        if ($inUse) {
            throw ValidationException::withMessages([
                'degree' => 'Cannot delete "' . $bachelorsDegree->degree . '" — it is still referenced in one or more employee PDS records.',
            ]);
        }

        $bachelorsDegree->delete();

        return back()->with('success', "Bachelor's degree deleted.");
    }
}
