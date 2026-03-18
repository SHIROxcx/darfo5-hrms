<?php

namespace App\Http\Controllers;

use App\Models\PhProvince;
use App\Models\PhCity;
use App\Models\PhBarangay;

class LocationController extends Controller
{
    public function provinces()
    {
        return PhProvince::orderBy('name')
            ->select('id', 'name', 'region')
            ->get();
    }

    public function cities(int $provinceId)
    {
        return PhCity::where('province_id', $provinceId)
            ->orderBy('name')
            ->select('id', 'name', 'zip_code', 'is_city')
            ->get();
    }

    public function barangays(int $cityId)
    {
        return PhBarangay::where('city_id', $cityId)
            ->orderBy('name')
            ->select('id', 'name')
            ->get();
    }
}