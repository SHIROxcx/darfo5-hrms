<?php

namespace App\Support;

use Illuminate\Support\Collection;
use InvalidArgumentException;

/**
 * Splits the rows of one PDS section into what fits on the main page and
 * the continuation sheets (C5-C11) that carry the overflow.
 */
final class PdsRowSplitter
{
    /**
     * @return array{main: Collection, sheets: list<Collection>}
     */
    public static function split(iterable $rows, int $mainCapacity, int $sheetCapacity): array
    {
        if ($mainCapacity < 1 || $sheetCapacity < 1) {
            throw new InvalidArgumentException('Row capacities must be at least 1.');
        }

        $all = Collection::make($rows)->values();

        return [
            'main' => $all->take($mainCapacity)->values(),
            'sheets' => $all->slice($mainCapacity)
                ->values()
                ->chunk($sheetCapacity)
                ->map(fn (Collection $sheet) => $sheet->values())
                ->values()
                ->all(),
        ];
    }
}
