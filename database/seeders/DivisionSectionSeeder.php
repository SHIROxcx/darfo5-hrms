<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Division;
use App\Models\Section;

class DivisionSectionSeeder extends Seeder
{
    public function run(): void
    {
        $divisions = [
            [
                'name' => 'Office of the Regional Executive Director',
                'sections' => [
                    'Office of the Chief',
                ],
            ],
            [
                'name' => 'Office of the Regional Technical Director for Reseach and Regulations',
                'sections' => [
                    'Office of the Chief',
                ],
            ],
            [
                'name' => 'Office of the Regional Technical Director for Reseach and Operations',
                'sections' => [
                    'Office of the Chief',
                ],
            ],
            [
                'name' => 'Field Operations Division',
                'sections' => [
                    'Office of the Chief',
                ],
            ],
            [
                'name' => 'Finance and Administrative Division',
                'sections' => [
                    'Administrative Section',
                    'Finance Section',
                    'Human Resource Management Section',
                    'Records Section',
                ],
            ],
            [
                'name' => 'Planning and Monitoring Division',
                'sections' => [
                    'Planning Section',
                    'Monitoring and Evaluation Section',
                    'Programming Section',
                ],
            ],
            [
                'name' => 'Research Division',
                'sections' => [
                    'Research Section',
                    'Regulatory Section',
                ],
            ],
            [
                'name' => 'Regional Agricultural Engineering Division',
                'sections' => [
                    'Engineering Section',
                ],
            ],
            [
                'name' => 'Information and Communication Technology Unit',
                'sections' => ['Software Development Section'],
            ],
        ];

        foreach ($divisions as $div) {
            $division = Division::create(['name' => $div['name']]);

            foreach ($div['sections'] as $sectionName) {
                Section::create([
                    'division_id' => $division->id,
                    'name'        => $sectionName,
                ]);
            }
        }
    }
}