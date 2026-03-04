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
                    'Disaster Risk Reduction and Management Unit',
                    'Information and Communication Technology Unit',
                    'ISO Unit',
                    'Philippine Rural Development Project',
                    'Regional Agriculture and Fisheries Information Section',
                    'Regional Crop Protection Center',
                ],
            ],
            [
                'name' => 'Office of the Regional Technical Director for Reseach and Regulations',
                'sections' => [
                    'Office of the Chief',
                ],
            ],
            [
                'name' => 'Office of the Regional Technical Director for Operations',
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
                    'Office of the Chief',
                    'Planning and Programming Section',
                    'Monitoring and Evaluation Section',
                    'Prohject Development Section',
                    'Special Concerns Unit',
                    'Neutral Evaluation Unit',
                    'Admin and Technical Unit'
                ],
            ],
            [
                'name' => 'Regional Agricultural Engineering Division',
                'sections' => [
                    'Office of the Chief',
                    'Engineering Plan Design Specification Section',
                    'ABEMIS & ROW Unit',
                    'Project Validation and Machinery Specifications Unit',
                    'Agri-Infra and Other Infra Design Specification Unit',
                    'Engineering Section',
                    'Project Program Management Section',
                    'Programs and Projects Planning Unit',
                    'Programs and Projects Planning Unit',
                    'Project Management and Information Unit',
                    'Standard Regulations Enforcement Section',
                    'Regulation and Enforcement Unit',
                    'Accreditation and Registration Unit',


                ],
            ],
            [
                'name' => 'Agribusiness and Marketing Assistance Division',
                'sections' => [
                    'Office of the Chief',
                    'Market Development Section',
                    'Agribusiness Support Industry Section',
                    'Agribusiness Promotion Section',
                ],
            ],
            [
                'name' => 'Field Operations Division',
                'sections' => [
                    'Office of the Chief',
                    'Adaptation and Mitigation Initiatives in Agriculture',
                    'Albay & Sorsogon Agricultural Programs Coordinating Offices',
                    'Camarines Norte Agricultural Programs Coordinating Offices',
                    'Camarines Sur Agricultural Programs Coordinating Offices',
                    'Catanduanes Agricultural Programs Coordinating Offices',
                    'Corn and Cassava Program',
                    'Farm and Fisheries Clustering and Consolidation',
                    'High Value Crops Development Program',
                    'Institutional Development Unit',
                    'Kabuhayan at Kaunlaran ng Kababayang Katutubo',
                    'Livestock and Poultry Program',
                    'Masbate Agricultural Programs Coordinating Offices',
                    'Monitoring and Special Concerns Unit',
                    'National Urban and Per Urban Agriculture Program',
                    'Registry System for Basic Sectors in Agriculture',
                    'Rice Program',
                    'Special Area for Agricultural Development Program',
                ],
            ],
            [
                'name' => 'Research Division',
                'sections' => [
                    'Office of the Chief',
                    'Agriculture and Fisheries Resources, Research and Extension for Development Network',
                    'Planning Monitoring & Evaluation Unit',
                    'Technical Programs Section',
                    'Crop Improvement Unit',
                    'Soil and Water Research Unit',
                    'Livestock Research Unit',
                    'Crop Protection Unit',
                    'Socio-economic and Policy Unit',
                    'Support Services Section',
                    'Regional Food Laboratory',
                    'Regional Tissue Culture Laboratory',
                    'Plant Genetic Resource Center',
                    'Organic R4D Center',
                    'Regional Technology and Commercialization Center',
                    'Crop Post Harvest Research and Development Facility Center',
                    'Central Bicol Experimental Station',
                    'Albay Breeding Station - Albay Research and Development Center',
                    'Albay Experiment Station - Albay Research and Development Center',
                    'Sorsogon Dairy Production Tech Center - Regional Outreach Station',
                    'Camarines Norte Lowland Rainfed Research Station - Regional Outreach Station',
                    'Regional Carabao Breeding Center - Masbate Center for Livestock Development',
                    'Masbate Breeding Station - Masbate Center for Livestock Development',
                    'Catanduanes Hilly Upland Development Station'
                ],
            ],
            [
                'name' => 'Regulatory Division',
                'sections' => [
                    'Office of the Chief',
                    'Permit & Licensing Section',
                    'Plants Pest/Animal Disease Monitoring Surveillance & Early Warning Section',
                    'Quality Control and Inspections Section',
                    'Food Safety Unit',
                    'Organic Agriculture Program',
                    '',
                ],
            ],[
                'name' => 'Integrated Laboratory Division',
                'sections' => [
                    'Office of the Chief',
                    'Regional Animal Disease and Diagnostic Laboratory',
                    'Regional Soil Laboratory',
                    'Regional Feed Chemical Analysis Laboratory',
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