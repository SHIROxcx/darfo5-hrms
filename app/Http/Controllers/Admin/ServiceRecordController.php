<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServiceRecord;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ServiceRecordController extends Controller
{
    private const DATE_FIELDS = ['date_from', 'date_to', 'separation_date'];

    private function rules(): array
    {
        return [
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
        ];
    }

    /**
     * The 'date' validation rule accepts any parseable format (e.g. "1/16/2020"),
     * but MySQL's DATE column only accepts Y-m-d — normalize before saving.
     */
    private function normalizeDates(array $data): array
    {
        foreach (self::DATE_FIELDS as $field) {
            if (! empty($data[$field])) {
                $data[$field] = Carbon::parse($data[$field])->format('Y-m-d');
            }
        }

        return $data;
    }

    public function store(Request $request, User $user)
    {
        $data = $this->normalizeDates($request->validate($this->rules()));
        $data['user_id'] = $user->id;

        ServiceRecord::create($data);

        return back()->with('success', 'Service record added.');
    }

    public function update(Request $request, ServiceRecord $serviceRecord)
    {
        $data = $this->normalizeDates($request->validate($this->rules()));

        $serviceRecord->update($data);

        return back()->with('success', 'Service record updated.');
    }

    public function destroy(ServiceRecord $serviceRecord)
    {
        $serviceRecord->delete();

        return back()->with('success', 'Service record deleted.');
    }
}
