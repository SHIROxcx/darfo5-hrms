<?php

namespace App\Http\Controllers\Admin\ReferenceData;

use App\Http\Controllers\Controller;
use App\Models\Eligibility;
use App\Models\PdsEligibility;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class EligibilityController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/ReferenceData/Eligibilities/Index', [
            'eligibilities' => Eligibility::orderBy('title')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'        => 'required|string|max:255|unique:eligibilities,title',
            'abbreviation' => 'nullable|string|max:50',
        ]);

        Eligibility::create($data);

        return back()->with('success', 'Eligibility added.');
    }

    public function update(Request $request, Eligibility $eligibility)
    {
        $data = $request->validate([
            'title'        => 'required|string|max:255|unique:eligibilities,title,' . $eligibility->id,
            'abbreviation' => 'nullable|string|max:50',
        ]);

        $eligibility->update($data);

        return back()->with('success', 'Eligibility updated.');
    }

    public function destroy(Eligibility $eligibility)
    {
        if (PdsEligibility::where('career_service', $eligibility->title)->exists()) {
            throw ValidationException::withMessages([
                'title' => 'Cannot delete "' . $eligibility->title . '" — it is still referenced in one or more employee PDS records.',
            ]);
        }

        $eligibility->delete();

        return back()->with('success', 'Eligibility deleted.');
    }
}
