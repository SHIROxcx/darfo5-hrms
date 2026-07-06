<?php

namespace App\Http\Controllers\Concerns;

trait BuildsPdsData
{
    private function getPdsData(int $userId): array
    {
        return [
            'personal'        => \App\Models\PdsPersonalInfo::where('user_id', $userId)->first(),
            'family'          => \App\Models\PdsFamilyBackground::where('user_id', $userId)->first(),
            'education'       => \App\Models\PdsEducation::where('user_id', $userId)->get(),
            'eligibilities'   => \App\Models\PdsEligibility::where('user_id', $userId)->orderBy('sort_order')->get(),
            'work_experience' => \App\Models\PdsWorkExperience::where('user_id', $userId)->orderBy('sort_order')->get(),
            'voluntary_work'  => \App\Models\PdsVoluntaryWork::where('user_id', $userId)->orderBy('sort_order')->get(),
            'trainings'       => \App\Models\PdsTraining::where('user_id', $userId)->orderBy('sort_order')->get(),
            'other_info'      => \App\Models\PdsOtherInfo::where('user_id', $userId)->first(),
            'questions'       => \App\Models\PdsQuestion::where('user_id', $userId)->first(),
            'references'      => \App\Models\PdsReference::where('user_id', $userId)->orderBy('sort_order')->get(),
        ];
    }
}