<?php

namespace App\Services;

use App\Models\Holiday;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class HolidayService
{
    /**
     * Whether the given date is an observed holiday (recurring or one-off),
     * honoring any per-year exception on a recurring holiday.
     *
     * Type-hinted against CarbonInterface, not the concrete Carbon class:
     * this app's date casts and `now()` hand back CarbonImmutable, while
     * CarbonPeriod iteration (used by LeaveService) yields plain Carbon —
     * both implement CarbonInterface, so this accepts either.
     */
    public function isHoliday(CarbonInterface $date): bool
    {
        return $this->holidayNameFor($date) !== null;
    }

    /**
     * The name of the holiday observed on this date, or null if it isn't one.
     */
    public function holidayNameFor(CarbonInterface $date): ?string
    {
        $oneOff = Holiday::where('is_recurring', false)
            ->whereDate('date', $date->toDateString())
            ->value('name');

        if ($oneOff) {
            return $oneOff;
        }

        $recurring = Holiday::where('is_recurring', true)
            ->with(['exceptions' => fn ($q) => $q->where('year', $date->year)])
            ->get();

        foreach ($recurring as $holiday) {
            $exception = $holiday->exceptions->first();

            if ($exception) {
                // An exception for this year fully replaces the default month/day:
                // null observed_date = skipped, otherwise it only applies on the moved date.
                if ($exception->observed_date && $exception->observed_date->isSameDay($date)) {
                    return $holiday->name;
                }

                continue;
            }

            if ((int) $holiday->month === $date->month && (int) $holiday->day === $date->day) {
                return $holiday->name;
            }
        }

        return null;
    }

    /**
     * All holidays observed in a given year — one-off holidays dated that year,
     * plus every recurring holiday's effective date for that year (its default
     * month/day, or whatever a per-year exception overrides it to).
     *
     * @return Collection<int, array{
     *     id: int, name: string, type: string, is_recurring: bool,
     *     date: ?string, is_skipped: bool, is_moved: bool, default_date: ?string,
     * }>
     */
    public function holidaysForYear(int $year): Collection
    {
        $oneOffs = Holiday::where('is_recurring', false)
            ->whereYear('date', $year)
            ->get()
            ->map(fn (Holiday $h) => [
                'id' => $h->id,
                'name' => $h->name,
                'type' => $h->type,
                'is_recurring' => false,
                'date' => $h->date->toDateString(),
                'is_skipped' => false,
                'is_moved' => false,
                'default_date' => null,
            ]);

        $recurring = Holiday::where('is_recurring', true)
            ->with(['exceptions' => fn ($q) => $q->where('year', $year)])
            ->get()
            ->map(function (Holiday $h) use ($year) {
                $exception = $h->exceptions->first();
                $defaultDate = Carbon::create($year, $h->month, $h->day)->toDateString();

                return [
                    'id' => $h->id,
                    'name' => $h->name,
                    'type' => $h->type,
                    'is_recurring' => true,
                    'date' => $exception ? $exception->observed_date?->toDateString() : $defaultDate,
                    'is_skipped' => $exception !== null && $exception->observed_date === null,
                    'is_moved' => $exception !== null && $exception->observed_date !== null,
                    'default_date' => $defaultDate,
                ];
            });

        return $oneOffs->concat($recurring)
            ->sortBy(fn (array $h) => $h['date'] ?? $h['default_date'])
            ->values();
    }

    /**
     * Map of date string => holiday name for every holiday observed within
     * [$start, $end], for calendar display.
     *
     * @return array<string, string>
     */
    public function holidayMapForRange(CarbonInterface $start, CarbonInterface $end): array
    {
        $map = [];

        for ($year = $start->year; $year <= $end->year; $year++) {
            foreach ($this->holidaysForYear($year) as $occurrence) {
                if (! $occurrence['date']) {
                    continue;
                }

                $date = Carbon::parse($occurrence['date']);
                if ($date->betweenIncluded($start, $end)) {
                    $map[$occurrence['date']] = $occurrence['name'];
                }
            }
        }

        return $map;
    }
}
