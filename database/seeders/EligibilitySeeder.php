<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class EligibilitySeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $items = [

            // Civil Service Commission (CSC)
            ['title' => 'Career Service Professional',                                       'abbreviation' => 'CSP'],
            ['title' => 'Career Service Sub-Professional',                                   'abbreviation' => 'CSSP'],
            ['title' => 'Career Service Executive Eligibility',                             'abbreviation' => 'CSEE'],
            ['title' => 'Career Service Executive Eligibility – Executive Leadership Program', 'abbreviation' => 'CSEE-ELP'],
            ['title' => 'Second Level Eligibility (R.A. 1080)',                             'abbreviation' => 'RA1080'],
            ['title' => 'Barangay Health Worker Eligibility',                               'abbreviation' => 'BHWE'],
            ['title' => 'Barangay Nutrition Scholar Eligibility',                           'abbreviation' => 'BNSE'],
            ['title' => 'Basic Competency on Bookkeeping',                                  'abbreviation' => 'BCB'],
            ['title' => 'Sangguniang Kabataan Official Eligibility',                        'abbreviation' => 'SKOE'],
            ['title' => 'Local Government Official Eligibility',                            'abbreviation' => 'LGOE'],
            ['title' => 'Veteran Preference Rating (VPR)',                                  'abbreviation' => 'VPR'],
            ['title' => 'Honor Graduate Eligibility (R.A. 7160)',                           'abbreviation' => 'R.A. 7160'],
            ['title' => 'Firefighter Eligibility',                                          'abbreviation' => 'FFE'],
            ['title' => 'Comelec Plebiscite/Election Officer Eligibility',                  'abbreviation' => 'CPOE'],
            ['title' => 'PDL Eligibility',                                                  'abbreviation' => 'PDLE'],
            ['title' => 'Agricultural Census Enumerator Eligibility',                       'abbreviation' => 'ACEE'],

            // PRC Boards – Engineering
            ['title' => 'Registered Electrical Engineer',                                   'abbreviation' => 'REE'],
            ['title' => 'Registered Electronics Engineer',                                  'abbreviation' => 'RECE'],
            ['title' => 'Registered Electronics Technician',                                'abbreviation' => 'RET'],
            ['title' => 'Registered Civil Engineer',                                        'abbreviation' => 'RCE'],
            ['title' => 'Registered Mechanical Engineer',                                   'abbreviation' => 'RME'],
            ['title' => 'Registered Master Plumber',                                        'abbreviation' => 'RMP'],
            ['title' => 'Registered Chemical Engineer',                                     'abbreviation' => 'RChE'],
            ['title' => 'Registered Environmental Planner',                                 'abbreviation' => 'REP'],
            ['title' => 'Registered Geodetic Engineer',                                     'abbreviation' => 'RGE'],
            ['title' => 'Registered Metallurgical Engineer',                                'abbreviation' => 'RMetE'],
            ['title' => 'Registered Mining Engineer',                                       'abbreviation' => 'RMnE'],
            ['title' => 'Registered Naval Architect and Marine Engineer',                   'abbreviation' => 'RNAME'],
            ['title' => 'Registered Sanitary Engineer',                                     'abbreviation' => 'RSanE'],
            ['title' => 'Registered Agricultural and Biosystems Engineer',                  'abbreviation' => 'RABE'],
            ['title' => 'Registered Petroleum Engineer',                                    'abbreviation' => 'RPetE'],

            // PRC Boards – Architecture & Allied
            ['title' => 'Registered Architect',                                             'abbreviation' => 'RA'],
            ['title' => 'Registered Interior Designer',                                     'abbreviation' => 'RID'],
            ['title' => 'Registered Landscape Architect',                                   'abbreviation' => 'RLA'],
            ['title' => 'Registered Master Electrician',                                    'abbreviation' => 'RMElec'],

            // PRC Boards – Information Technology
            ['title' => 'Registered Electronics and Communications Engineer',               'abbreviation' => 'ECE'],

            // PRC Boards – Medicine & Health Sciences
            ['title' => 'Physician (Board of Medicine)',                                    'abbreviation' => 'MD'],
            ['title' => 'Registered Nurse',                                                 'abbreviation' => 'RN'],
            ['title' => 'Registered Midwife',                                               'abbreviation' => 'RM'],
            ['title' => 'Registered Dentist',                                               'abbreviation' => 'DMD'],
            ['title' => 'Registered Pharmacist',                                            'abbreviation' => 'RPh'],
            ['title' => 'Registered Medical Technologist',                                  'abbreviation' => 'RMT'],
            ['title' => 'Registered Radiologic Technologist',                               'abbreviation' => 'RRT'],
            ['title' => 'Registered X-Ray Technologist',                                    'abbreviation' => 'RXT'],
            ['title' => 'Registered Physical Therapist',                                    'abbreviation' => 'RPT'],
            ['title' => 'Registered Occupational Therapist',                                'abbreviation' => 'ROT'],
            ['title' => 'Registered Respiratory Therapist',                                 'abbreviation' => 'RRespT'],
            ['title' => 'Registered Nutritionist-Dietitian',                                'abbreviation' => 'RND'],
            ['title' => 'Registered Sanitarian',                                            'abbreviation' => 'RS'],
            ['title' => 'Registered Optometrist',                                           'abbreviation' => 'RO'],
            ['title' => 'Registered Veterinarian',                                          'abbreviation' => 'RVM'],
            ['title' => 'Registered Medical Laboratory Scientist',                          'abbreviation' => 'RMLS'],
            ['title' => 'Registered Speech-Language Pathologist',                           'abbreviation' => 'RSLP'],
            ['title' => 'Registered Hearing Aid Specialist',                                'abbreviation' => 'RHAS'],

            // PRC Boards – Agriculture & Natural Sciences
            ['title' => 'Registered Agriculturist',                                         'abbreviation' => 'RAgr'],
            ['title' => 'Registered Forester',                                              'abbreviation' => 'RF'],
            ['title' => 'Registered Fisheries Technologist',                                'abbreviation' => 'RFishT'],
            ['title' => 'Registered Geologist',                                             'abbreviation' => 'RG'],
            ['title' => 'Registered Chemist',                                               'abbreviation' => 'RChem'],
            ['title' => 'Registered Biologist',                                             'abbreviation' => 'RBiol'],
            ['title' => 'Registered Food Technologist',                                     'abbreviation' => 'RFT'],

            // PRC Boards – Business & Accountancy
            ['title' => 'Certified Public Accountant',                                      'abbreviation' => 'CPA'],
            ['title' => 'Registered Real Estate Broker',                                    'abbreviation' => 'RREB'],
            ['title' => 'Registered Real Estate Appraiser',                                 'abbreviation' => 'RREA'],
            ['title' => 'Registered Real Estate Consultant',                                'abbreviation' => 'RREC'],
            ['title' => 'Certified Cost Engineer',                                          'abbreviation' => 'CCostE'],

            // PRC Boards – Education
            ['title' => 'Registered Professional Teacher (Elementary)',                     'abbreviation' => 'LPT-Elem'],
            ['title' => 'Registered Professional Teacher (Secondary)',                      'abbreviation' => 'LPT-Sec'],
            ['title' => 'Registered Guidance Counselor',                                    'abbreviation' => 'RGC'],
            ['title' => 'Registered Librarian',                                             'abbreviation' => 'RL'],

            // PRC Boards – Social Sciences & Services
            ['title' => 'Registered Psychologist',                                          'abbreviation' => 'RPsy'],
            ['title' => 'Registered Psychometrician',                                       'abbreviation' => 'RPm'],
            ['title' => 'Registered Social Worker',                                         'abbreviation' => 'RSW'],
            ['title' => 'Registered Criminologist',                                         'abbreviation' => 'RCrim'],
            ['title' => 'Registered Customs Broker',                                        'abbreviation' => 'RCBrok'],

            // PRC Boards – Hospitality & Tourism
            ['title' => 'Registered Hotel and Restaurant Administrator',                    'abbreviation' => 'RHRA'],
            ['title' => 'Registered Hospitality Industry Professional',                     'abbreviation' => 'RHIP'],

            //  PRC Boards – Fine Arts & Crafts
            ['title' => 'Registered Master Plumber',                                        'abbreviation' => 'RMPlumb'],
            ['title' => 'Registered Jeweler',                                               'abbreviation' => 'RJlr'],

            // Special Eligibilities (Sec. 9 of CSC MC)
            ['title' => 'Eligibility under RA 1080 (PRC Licensure)',                        'abbreviation' => 'RA1080-PRC'],
            ['title' => 'Eligibility under PD 997 (Scientific & Technological Specialists)','abbreviation' => 'PD997'],
            ['title' => 'Eligibility under RA 7883 (Barangay Health Workers)',              'abbreviation' => 'RA7883'],
            ['title' => 'Eligibility under EO 290 (CHED Scholars)',                         'abbreviation' => 'EO290'],
            ['title' => 'Eligibility under RA 6040 (PNP)',                                  'abbreviation' => 'RA6040'],
            ['title' => 'Eligibility under RA 6713 (AFP Veterans)',                         'abbreviation' => 'RA6713'],
            ['title' => 'Eligibility under MC 11 s. 1996 (Skilled Workers)',                'abbreviation' => 'MC11-96'],
            ['title' => 'Eligibility under EO 318 (Forest Guards)',                         'abbreviation' => 'EO318'],
            ['title' => 'Eligibility under Sec. 7(3) CSC Rules (Comelec)',                  'abbreviation' => 'SEC73'],
            ['title' => 'Eligibility under RA 9999 (Lawyers)',                              'abbreviation' => 'RA9999'],

            // Bar & Other Professional Boards
            ['title' => 'Philippine Bar (Lawyer / Attorney)',                               'abbreviation' => 'BAR'],
            ['title' => 'Philippine Shari\'a Bar',                                          'abbreviation' => 'SHBAR'],

            // Military & Uniformed Services
            ['title' => 'AFP Officer Eligibility',                                          'abbreviation' => 'AFPOE'],
            ['title' => 'PNP Officer Eligibility',                                          'abbreviation' => 'PNPOE'],
            ['title' => 'BFP Officer Eligibility',                                          'abbreviation' => 'BFPOE'],
            ['title' => 'BJMP Officer Eligibility',                                         'abbreviation' => 'BJMPOE'],
            ['title' => 'PCG Officer Eligibility',                                          'abbreviation' => 'PCGOE'],

            // TESDA / NCII Certifications
            ['title' => 'TESDA National Certificate II (NC II)',                            'abbreviation' => 'NCII'],
            ['title' => 'TESDA National Certificate III (NC III)',                          'abbreviation' => 'NCIII'],
            ['title' => 'TESDA Certificate of Competency',                                  'abbreviation' => 'COC'],

            // Other / Miscellaneous
            ['title' => 'Not Applicable',                                                   'abbreviation' => 'N/A'],
        ];

        $rows = array_map(fn($item) => array_merge($item, [
            'created_at' => $now,
            'updated_at' => $now,
        ]), $items);

        foreach (array_chunk($rows, 50) as $chunk) {
            DB::table('eligibilities')->upsert(
                $chunk,
                ['abbreviation'],       
                ['title', 'updated_at']
            );
        }
    }
}