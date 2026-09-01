<?php

namespace App\Actions\ServiceRecords;

use App\Models\EmployeeProfile;
use App\Models\ServiceRecord;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator as ValidatorFacade;

class ImportServiceRecords
{
    public const EXPECTED_HEADERS = [
        'employee_number', 'date_from', 'date_to', 'designation', 'employment_status',
        'salary', 'station_place_of_assignment', 'branch', 'leave_without_pay',
        'separation_date', 'separation_cause', 'remarks',
    ];

    private const PERSISTABLE_FIELDS = [
        'date_from', 'date_to', 'designation', 'employment_status', 'salary',
        'station_place_of_assignment', 'branch', 'leave_without_pay',
        'separation_date', 'separation_cause', 'remarks',
    ];

    private const DATE_FIELDS = ['date_from', 'date_to', 'separation_date'];

    /**
     * Parse + validate a CSV without writing anything to the database.
     *
     * @throws \RuntimeException on missing/empty file or header mismatch
     */
    public function preview(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        $header = fgetcsv($handle);

        if ($header === false) {
            fclose($handle);
            throw new \RuntimeException('The CSV file is empty.');
        }

        $normalizedHeader = array_map(fn ($h) => strtolower(trim((string) $h)), $header);
        $missing = array_diff(self::EXPECTED_HEADERS, $normalizedHeader);

        if (! empty($missing)) {
            fclose($handle);
            throw new \RuntimeException('CSV is missing expected column(s): ' . implode(', ', $missing));
        }

        $columnCount = count($normalizedHeader);
        $employeesByNumber = EmployeeProfile::whereNotNull('employee_number')
            ->where('employee_number', '!=', '')
            ->pluck('user_id', 'employee_number');
        $existingUserIds = ServiceRecord::query()->distinct()->pluck('user_id')->flip();

        $newRows = [];
        $duplicateRows = [];
        $notFound = [];
        $invalid = [];
        $employeeMeta = [];
        $seenNewUserIds = [];
        $seenDuplicateUserIds = [];

        $rowNumber = 1; // header occupies row 1

        while (($csvRow = fgetcsv($handle)) !== false) {
            $rowNumber++;

            $nonEmptyCells = array_filter($csvRow, fn ($v) => $v !== null && trim((string) $v) !== '');
            if (count($nonEmptyCells) === 0) {
                continue; // skip blank lines
            }

            if (count($csvRow) !== $columnCount) {
                $invalid[] = [
                    'row'             => $rowNumber,
                    'employee_number' => $csvRow[0] ?? '',
                    'reason'          => 'Row has ' . count($csvRow) . " column(s), expected {$columnCount}.",
                ];
                continue;
            }

            $raw = array_combine($normalizedHeader, $csvRow);
            $employeeNumber = trim((string) ($raw['employee_number'] ?? ''));
            $userId = $employeesByNumber[$employeeNumber] ?? null;

            if ($employeeNumber === '' || $userId === null) {
                $notFound[] = [
                    'row'             => $rowNumber,
                    'employee_number' => $employeeNumber,
                    'reason'          => 'Employee number not found.',
                ];
                continue;
            }

            // Blank CSV cells are '' — treat as null for nullable fields before validating.
            $normalizedRow = array_map(
                fn ($v) => trim((string) $v) === '' ? null : trim((string) $v),
                array_intersect_key($raw, array_flip(self::PERSISTABLE_FIELDS))
            );

            $validator = ValidatorFacade::make($normalizedRow, [
                'date_from'                   => 'required|date',
                'date_to'                     => 'nullable|date',
                'designation'                 => 'required|string|max:255',
                'employment_status'           => 'required|string|max:255',
                'salary'                      => 'required|numeric|min:0',
                'station_place_of_assignment' => 'required|string|max:255',
                'branch'                      => 'nullable|string|max:255',
                'leave_without_pay'           => 'nullable|string',
                'separation_date'             => 'nullable|date',
                'separation_cause'            => 'nullable|string|max:255',
                'remarks'                     => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                $invalid[] = [
                    'row'             => $rowNumber,
                    'employee_number' => $employeeNumber,
                    'reason'          => implode(' ', $validator->errors()->all()),
                ];
                continue;
            }

            $fields = array_intersect_key($normalizedRow, array_flip(self::PERSISTABLE_FIELDS));

            try {
                $fields = $this->normalizeDates($fields);
            } catch (\Exception $e) {
                $invalid[] = [
                    'row'             => $rowNumber,
                    'employee_number' => $employeeNumber,
                    'reason'          => 'Unrecognized date format.',
                ];
                continue;
            }

            $fields['user_id'] = $userId;

            if (! isset($employeeMeta[$userId])) {
                $employeeMeta[$userId] = [
                    'user_id'         => $userId,
                    'employee_number' => $employeeNumber,
                    'name'            => optional(User::find($userId))->full_name ?? $employeeNumber,
                ];
            }

            if (isset($existingUserIds[$userId])) {
                $duplicateRows[$userId][] = $fields;
                $seenDuplicateUserIds[$userId] = true;
            } else {
                $newRows[$userId][] = $fields;
                $seenNewUserIds[$userId] = true;
            }
        }

        fclose($handle);

        return [
            'new_rows'       => $newRows,
            'duplicate_rows' => $duplicateRows,
            'summary'        => [
                'new_count'           => array_sum(array_map('count', $newRows)),
                'duplicate_count'     => array_sum(array_map('count', $duplicateRows)),
                'not_found_count'     => count($notFound),
                'invalid_count'       => count($invalid),
                'new_employees'       => array_values(array_intersect_key($employeeMeta, $seenNewUserIds)),
                'duplicate_employees' => array_values(array_intersect_key($employeeMeta, $seenDuplicateUserIds)),
                'not_found'           => $notFound,
                'invalid'             => $invalid,
            ],
        ];
    }

    /**
     * Write a previously-validated payload (from preview()) to the database.
     * Every row is inserted, including rows for employees who already have
     * service record entries — one employee accumulates many entries over
     * their career (a new appointment, a salary change, etc.), so a
     * "duplicate" employee_number means append another entry, never
     * replace their existing history.
     *
     * Dates are re-normalized here too (not just in preview()) — the
     * validated payload may have been cached by an older app version, or
     * the cache could otherwise drift from what preview() would produce
     * today, so commit() never blindly trusts what it's handed.
     */
    public function commit(array $validated): array
    {
        $newRows = $validated['new_rows'] ?? [];
        $duplicateRows = $validated['duplicate_rows'] ?? [];

        $insertedCount = 0;
        $appendedEmployeeCount = 0;

        DB::transaction(function () use ($newRows, $duplicateRows, &$insertedCount, &$appendedEmployeeCount) {
            foreach ($newRows as $rows) {
                foreach ($rows as $row) {
                    ServiceRecord::create($this->normalizeDates($row));
                    $insertedCount++;
                }
            }

            foreach ($duplicateRows as $rows) {
                foreach ($rows as $row) {
                    ServiceRecord::create($this->normalizeDates($row));
                    $insertedCount++;
                }
                $appendedEmployeeCount++;
            }
        });

        return [
            'inserted_count'           => $insertedCount,
            'appended_employee_count'  => $appendedEmployeeCount,
        ];
    }

    /**
     * The 'date' validation rule accepts any parseable format (e.g. "1/16/2020"),
     * but MySQL's DATE column only accepts Y-m-d — normalize before saving.
     */
    private function normalizeDates(array $row): array
    {
        foreach (self::DATE_FIELDS as $field) {
            if (! empty($row[$field])) {
                $row[$field] = Carbon::parse($row[$field])->format('Y-m-d');
            }
        }

        return $row;
    }
}
