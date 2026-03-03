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
                    'Information and Communication Technology Unit'
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
                'name' => 'Administrative and Finance Division',
                'sections' => [
                    'Office of the Chief',
                    'Administrative Section',
                    'Budget Section',
                    'Accounting Section',
                    'Human Resource Management Section',
                    'Health and Safety Unit',
                    'General Services Section',
                    'Cash Unit',
                    'Property Unit',
                    'Records Unit',
                    'Building and Maintenance Unit',
                    'Motorpool',
                ],
            ],
            [
                'name' => 'Planning, Monitoring, and Evaluation Division',
                'sections' => [
                    'Planning and Programming Section',
                    'Monitoring and Evaluation Section',
                    'Prohject Development Section',
                    'Special Concerns Unit',
                    'Neutral Evaluation Unit',
                    'Admin and Technical Unit'
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
                'name' => 'Agribusiness and Marketing Assistance Division',
                'sections' => [
                    'Market Development Section',
                    'Agribusiness Support Industry Section',
                    'Agribusiness Promotion Section',
                ],
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