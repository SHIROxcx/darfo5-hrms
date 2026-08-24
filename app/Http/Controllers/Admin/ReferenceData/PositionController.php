<?php

namespace App\Http\Controllers\Admin\ReferenceData;

use App\Http\Controllers\Controller;
use App\Models\EmployeeProfile;
use App\Models\Position;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PositionController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/ReferenceData/Positions/Index', [
            'positions' => Position::orderBy('title')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'        => 'required|string|max:255|unique:positions,title',
            'salary_grade' => 'required|integer|min:1|max:33',
        ]);

        Position::create($data);

        return back()->with('success', 'Position added.');
    }

    public function update(Request $request, Position $position)
    {
        $data = $request->validate([
            'title'        => 'required|string|max:255|unique:positions,title,' . $position->id,
            'salary_grade' => 'required|integer|min:1|max:33',
        ]);

        $position->update($data);

        return back()->with('success', 'Position updated.');
    }

    public function destroy(Position $position)
    {
        if (EmployeeProfile::where('position', $position->title)->exists()) {
            throw ValidationException::withMessages([
                'title' => 'Cannot delete "' . $position->title . '" — it is still assigned to one or more employees.',
            ]);
        }

        $position->delete();

        return back()->with('success', 'Position deleted.');
    }
}
