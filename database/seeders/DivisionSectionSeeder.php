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
                'name'         => 'Office of the Regional Executive Director',
                'abbreviation' => 'ORED',
                'sections' => [
                    ['name' => 'Office of the Chief',                              'abbreviation' => 'Office of the Chief'],
                    ['name' => 'Disaster Risk Reduction and Management Unit',       'abbreviation' => 'DRRM Unit'],
                    ['name' => 'ISO Unit',                                          'abbreviation' => 'ISO Unit'],
                    ['name' => 'Philippine Rural Development Project',              'abbreviation' => 'PRDP'],
                    ['name' => 'Regional Agriculture and Fisheries Information Section', 'abbreviation' => 'RAFIS'],
                    ['name' => 'Regional Crop Protection Center',                   'abbreviation' => 'RCPC'],
                ],
            ],
            [
                'name' => 'Office of the Regional Technical Director for Research and Regulations',
                'abbreviation' => 'ORTDRR',
                'sections' => [
                    ['name' => 'Office of the Chief', 'abbreviation' => 'Office of the Chief'],
                ],
            ],
            [
                'name'         => 'Office of the Regional Technical Director for Operations',
                'abbreviation' => 'ORTDO',
                'sections' => [
                    ['name' => 'Office of the Chief', 'abbreviation' => 'Office of the Chief'],
                ],
            ],
            [
                'name'         => 'Administrative and Finance Division',
                'abbreviation' => 'AFD',
                'sections' => [
                    ['name' => 'Office of the Chief',             'abbreviation' => 'Office of the Chief'],
                    ['name' => 'Administrative Section',          'abbreviation' => 'Admin'],
                    ['name' => 'Budget Section',                  'abbreviation' => 'Budget'],
                    ['name' => 'Accounting Section',              'abbreviation' => 'Accounting'],
                    ['name' => 'Human Resource Management Section','abbreviation' => 'HRMS'],
                    ['name' => 'Health and Safety Unit',          'abbreviation' => 'Health and Safety Unit'],
                    ['name' => 'General Services Section',        'abbreviation' => 'GSS'],
                    ['name' => 'Cash Unit',                       'abbreviation' => 'Cash'],
                    ['name' => 'Property Unit',                   'abbreviation' => 'Property'],
                    ['name' => 'Records Unit',                    'abbreviation' => 'Records'],
                    ['name' => 'Building and Maintenance Unit',   'abbreviation' => 'Building and Maintenance'],
                    ['name' => 'Motorpool',                       'abbreviation' => 'Motorpol'],
                ],
            ],
            [
                'name'         => 'Planning, Monitoring, and Evaluation Division',
                'abbreviation' => 'PMED',
                'sections' => [
                    ['name' => 'Office of the Chief',               'abbreviation' => 'Office of the Chief'],
                    ['name' => 'Planning and Programming Section',  'abbreviation' => 'Planning'],
                    ['name' => 'Monitoring and Evaluation Section', 'abbreviation' => 'Monitoring'],
                    ['name' => 'Project Development Section',       'abbreviation' => 'Project Development'],
                    ['name' => 'Special Concerns Unit',             'abbreviation' => 'Sepcial Concerns Unit'],
                    ['name' => 'Neutral Evaluation Unit',           'abbreviation' => 'Neutral Evaluation'],
                    ['name' => 'Admin and Technical Unit',          'abbreviation' => 'Admin and Technical'],
                    ['name' => 'Information and Communication Technology Unit',     'abbreviation' => 'ICT Unit'],
                ],
            ],
            [
                'name'         => 'Regional Agricultural Engineering Division',
                'abbreviation' => 'RAED',
                'sections' => [
                    ['name' => 'Office of the Chief',                               'abbreviation' => 'Office of the Chief'],
                    ['name' => 'Engineering Plan Design Specification Section',      'abbreviation' => 'EPDSS'],
                    ['name' => 'ABEMIS & ROW Unit',                                 'abbreviation' => 'ABEMIS-ROW'],
                    ['name' => 'Project Validation and Machinery Specifications Unit','abbreviation' => 'PVMSU'],
                    ['name' => 'Agri-Infra and Other Infra Design Specification Unit','abbreviation' => 'AIDSU'],
                    ['name' => 'Engineering Section',                               'abbreviation' => 'Engineering Section'],
                    ['name' => 'Project Program Management Section',                'abbreviation' => 'PPMS'],
                    ['name' => 'Programs and Projects Planning Unit',               'abbreviation' => 'PPPU'],
                    ['name' => 'Project Management and Information Unit',           'abbreviation' => 'PMIU'],
                    ['name' => 'Standard Regulations Enforcement Section',          'abbreviation' => 'SRES'],
                    ['name' => 'Regulation and Enforcement Unit',                   'abbreviation' => 'REU'],
                    ['name' => 'Accreditation and Registration Unit',               'abbreviation' => 'ARU'],
                ],
            ],
            [
                'name'         => 'Agribusiness and Marketing Assistance Division',
                'abbreviation' => 'AMAD',
                'sections' => [
                    ['name' => 'Office of the Chief',               'abbreviation' => 'Office of the Chief'],
                    ['name' => 'Market Development Section',        'abbreviation' => 'Market Development'],
                    ['name' => 'Agribusiness Support Industry Section','abbreviation' => 'Agribusiness Support Industry'],
                    ['name' => 'Agribusiness Promotion Section',    'abbreviation' => 'Agribusiness Promotion'],
                ],
            ],
            [
                'name'         => 'Field Operations Division',
                'abbreviation' => 'FOD',
                'sections' => [
                    ['name' => 'Office of the Chief',                                        'abbreviation' => 'Office of the Chief'],
                    ['name' => 'Adaptation and Mitigation Initiatives in Agriculture',        'abbreviation' => 'AMIA'],
                    ['name' => 'Albay & Sorsogon Agricultural Programs Coordinating Offices','abbreviation' => 'APCO - Albay and Sorsogon'],
                    ['name' => 'Camarines Norte Agricultural Programs Coordinating Offices', 'abbreviation' => 'APCO - Camarines Norte'],
                    ['name' => 'Camarines Sur Agricultural Programs Coordinating Offices',   'abbreviation' => 'APCO - Camarines Sur'],
                    ['name' => 'Catanduanes Agricultural Programs Coordinating Offices',     'abbreviation' => 'APCO - Cat'],
                    ['name' => 'Corn and Cassava Program',                                   'abbreviation' => 'Corn and Cassava'],
                    ['name' => 'Farm and Fisheries Clustering and Consolidation',            'abbreviation' => 'F2C2'],
                    ['name' => 'High Value Crops Development Program',                       'abbreviation' => 'HVCDP'],
                    ['name' => 'Institutional Development Unit',                             'abbreviation' => 'IDU'],
                    ['name' => 'Kabuhayan at Kaunlaran ng Kababayang Katutubo',              'abbreviation' => '4Ks'],
                    ['name' => 'Livestock and Poultry Program',                              'abbreviation' => 'Livestock and Poultry'],
                    ['name' => 'Masbate Agricultural Programs Coordinating Offices',         'abbreviation' => 'APCO-Mas'],
                    ['name' => 'Monitoring and Special Concerns Unit',                       'abbreviation' => 'MSCU'],
                    ['name' => 'National Urban and Per Urban Agriculture Program',           'abbreviation' => 'NUPAP'],
                    ['name' => 'Registry System for Basic Sectors in Agriculture',           'abbreviation' => 'RSBSA'],
                    ['name' => 'Rice Program',                                               'abbreviation' => 'Rice'],
                    ['name' => 'Special Area for Agricultural Development Program',          'abbreviation' => 'SAAD'],
                ],
            ],
            [
                'name'         => 'Research Division',
                'abbreviation' => 'RD',
                'sections' => [
                    ['name' => 'Office of the Chief',                                                           'abbreviation' => 'Office of the Chief'],
                    ['name' => 'Agriculture and Fisheries Resources, Research and Extension for Development Network', 'abbreviation' => 'AFRRDEN'],
                    ['name' => 'Planning Monitoring & Evaluation Unit',                                         'abbreviation' => 'PMEU'],
                    ['name' => 'Technical Programs Section',                                                    'abbreviation' => 'TPS'],
                    ['name' => 'Crop Improvement Unit',                                                         'abbreviation' => 'CIU'],
                    ['name' => 'Soil and Water Research Unit',                                                  'abbreviation' => 'SWRU'],
                    ['name' => 'Livestock Research Unit',                                                       'abbreviation' => 'LRU'],
                    ['name' => 'Crop Protection Unit',                                                          'abbreviation' => 'CPU'],
                    ['name' => 'Socio-economic and Policy Unit',                                                'abbreviation' => 'SPU'],
                    ['name' => 'Support Services Section',                                                      'abbreviation' => 'SSS'],
                    ['name' => 'Regional Food Laboratory',                                                      'abbreviation' => 'RFL'],
                    ['name' => 'Regional Tissue Culture Laboratory',                                            'abbreviation' => 'RTCL'],
                    ['name' => 'Plant Genetic Resource Center',                                                 'abbreviation' => 'PGRC'],
                    ['name' => 'Organic R4D Center',                                                            'abbreviation' => 'Organic'],
                    ['name' => 'Regional Technology and Commercialization Center',                              'abbreviation' => 'RTCC'],
                    ['name' => 'Crop Post Harvest Research and Development Facility Center',                    'abbreviation' => 'CPHRDF'],
                    ['name' => 'Central Bicol Experimental Station',                                            'abbreviation' => 'CBES'],
                    ['name' => 'Albay Breeding Station - Albay Research and Development Center',                'abbreviation' => 'ABS-ARDC'],
                    ['name' => 'Albay Experiment Station - Albay Research and Development Center',              'abbreviation' => 'AES-ARDC'],
                    ['name' => 'Sorsogon Dairy Production Tech Center - Regional Outreach Station',             'abbreviation' => 'SDPTC-ROS'],
                    ['name' => 'Camarines Norte Lowland Rainfed Research Station - Regional Outreach Station',  'abbreviation' => 'CNLRRS-ROS'],
                    ['name' => 'Regional Carabao Breeding Center - Masbate Center for Livestock Development',   'abbreviation' => 'RCBC-MCLD'],
                    ['name' => 'Masbate Breeding Station - Masbate Center for Livestock Development',           'abbreviation' => 'MBS-MCLD'],
                    ['name' => 'Catanduanes Hilly Upland Development Station',                                  'abbreviation' => 'CHUDS'],
                ],
            ],
            [
                'name'         => 'Regulatory Division',
                'abbreviation' => 'REGDIV',
                'sections' => [
                    ['name' => 'Office of the Chief',                                               'abbreviation' => 'Office of the Chief'],
                    ['name' => 'Permit & Licensing Section',                                        'abbreviation' => 'Permit & Licensing'],
                    ['name' => 'Plants Pest/Animal Disease Monitoring Surveillance & Early Warning Section', 'abbreviation' => 'Plants Pest/Animal Disease Monitoring'],
                    ['name' => 'Quality Control and Inspections Section',                           'abbreviation' => 'QCIS'],
                    ['name' => 'Food Safety Unit',                                                  'abbreviation' => 'FSU'],
                    ['name' => 'Organic Agriculture Program',                                       'abbreviation' => 'OAP'],
                ],
            ],
            [
                'name'         => 'Integrated Laboratory Division',
                'abbreviation' => 'ILD',
                'sections' => [
                    ['name' => 'Office of the Chief',                              'abbreviation' => 'Office of the Chief'],
                    ['name' => 'Regional Animal Disease and Diagnostic Laboratory','abbreviation' => 'RADDL'],
                    ['name' => 'Regional Soil Laboratory',                         'abbreviation' => 'RSL'],
                    ['name' => 'Regional Feed Chemical Analysis Laboratory',       'abbreviation' => 'RFCAL'],
                ],
            ],
        ];

        foreach ($divisions as $div) {
            $division = Division::create([
                'name'         => $div['name'],
                'abbreviation' => $div['abbreviation'],
            ]);

            foreach ($div['sections'] as $sec) {
                Section::create([
                    'division_id'  => $division->id,
                    'name'         => $sec['name'],
                    'abbreviation' => $sec['abbreviation'],
                ]);
            }
        }
    }
}