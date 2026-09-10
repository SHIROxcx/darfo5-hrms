<?php

namespace App\Http\Controllers\Admin\ReferenceData;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use App\Models\HolidayException;
use App\Services\HolidayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class HolidayController extends Controller
{
    public function __construct(protected HolidayService $holidays) {}

    /**
     * Standard fixed-date Philippine regular holidays offered for one-click
     * prefill. Movable holidays (Maundy Thursday, Good Friday, National
     * Heroes Day, Eid'l Fitr/Adha, etc.) aren't fixed month/day and are
     * intentionally left out — admins add those per year as needed.
     */
    private const PREFILL_HOLIDAYS = [
        ['name' => "New Year's Day", 'month' => 1, 'day' => 1],
        ['name' => 'Araw ng Kagitingan', 'month' => 4, 'day' => 9],
        ['name' => 'Labor Day', 'month' => 5, 'day' => 1],
        ['name' => 'Independence Day', 'month' => 6, 'day' => 12],
        ['name' => 'Bonifacio Day', 'month' => 11, 'day' => 30],
        ['name' => 'Christmas Day', 'month' => 12, 'day' => 25],
        ['name' => 'Rizal Day', 'month' => 12, 'day' => 30],
    ];

    public function index(Request $request)
    {
        $year = (int) $request->input('year', now()->year);

        return Inertia::render('Admin/ReferenceData/Holidays/Index', [
            'year' => $year,
            'holidays' => $this->holidays->holidaysForYear($year),
            'hasAnyRecurring' => Holiday::where('is_recurring', true)->exists(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validatePayload($request);

        Holiday::create($data);

        return back()->with('success', 'Holiday added.');
    }

    /**
     * Edit the master holiday definition — affects every year, not just the
     * one currently being viewed. For a recurring holiday, changing its date
     * for a single year is done via storeException(), not this endpoint.
     */
    public function update(Request $request, Holiday $holiday)
    {
        $data = $this->validatePayload($request);

        $holiday->update($data);

        return back()->with('success', 'Holiday updated.');
    }

    /**
     * Delete the holiday entirely — for a recurring holiday, this removes it
     * (and its per-year exceptions) from every year, not just the one being
     * viewed. To skip a single year instead, use storeException().
     */
    public function destroy(Holiday $holiday)
    {
        $holiday->delete();

        return back()->with('success', 'Holiday deleted.');
    }

    /**
     * Create or replace this holiday's exception for one specific year —
     * either skipping it (observed_date null) or moving it to a different
     * date that year — without touching the recurring definition itself.
     */
    public function storeException(Request $request, Holiday $holiday)
    {
        if (! $holiday->is_recurring) {
            abort(422, 'Only recurring holidays can have a per-year exception.');
        }

        $data = $request->validate([
            'year' => 'required|integer|min:1900|max:2200',
            'observed_date' => 'nullable|date',
        ]);

        HolidayException::updateOrCreate(
            ['holiday_id' => $holiday->id, 'year' => $data['year']],
            ['observed_date' => $data['observed_date'] ?? null]
        );

        return back()->with('success', 'Holiday updated for '.$data['year'].'.');
    }

    /**
     * Remove this holiday's exception for a year, restoring its default
     * month/day for that year.
     */
    public function destroyException(Holiday $holiday, int $year)
    {
        $holiday->exceptions()->where('year', $year)->delete();

        return back()->with('success', 'Restored to default for '.$year.'.');
    }

    /**
     * One-click insert of the standard fixed-date PH regular holidays as
     * recurring templates. Skips any that already exist by name so it's
     * safe to click more than once.
     */
    public function prefill()
    {
        $existingNames = Holiday::where('is_recurring', true)
            ->whereIn('name', array_column(self::PREFILL_HOLIDAYS, 'name'))
            ->pluck('name')
            ->all();

        $toInsert = collect(self::PREFILL_HOLIDAYS)
            ->reject(fn (array $h) => in_array($h['name'], $existingNames, true))
            ->map(fn (array $h) => [
                'name' => $h['name'],
                'type' => 'regular',
                'is_recurring' => true,
                'date' => null,
                'month' => $h['month'],
                'day' => $h['day'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

        if ($toInsert->isNotEmpty()) {
            DB::table('holidays')->insert($toInsert->all());
        }

        $count = $toInsert->count();

        return back()->with(
            'success',
            $count > 0
                ? "Added {$count} standard regular holiday".($count === 1 ? '' : 's').'.'
                : 'Standard regular holidays are already present.'
        );
    }

    private function validatePayload(Request $request): array
    {
        $isRecurring = $request->boolean('is_recurring');

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['regular', 'special'])],
            'is_recurring' => ['required', 'boolean'],
        ];

        if ($isRecurring) {
            $rules['month'] = ['required', 'integer', 'between:1,12'];
            $rules['day'] = ['required', 'integer', 'between:1,31'];
        } else {
            $rules['date'] = ['required', 'date'];
        }

        $data = $request->validate($rules);

        // Only persist the fields relevant to the chosen mode, so switching a
        // holiday from one-off to recurring (or back) via update() doesn't
        // leave a stale date/month/day behind from its previous shape.
        return $isRecurring
            ? ['name' => $data['name'], 'type' => $data['type'], 'is_recurring' => true, 'month' => $data['month'], 'day' => $data['day'], 'date' => null]
            : ['name' => $data['name'], 'type' => $data['type'], 'is_recurring' => false, 'date' => $data['date'], 'month' => null, 'day' => null];
    }
}
