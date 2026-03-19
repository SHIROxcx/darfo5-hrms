<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Philippine Location Seeder
 *
 * Seeds ALL provinces (82) and ALL cities/municipalities (~1,642) nationwide.
 * Data based on PSGC 2020 / PSA official list.
 *
 * After running this seeder, run PhilippineBarangaySeeder for barangay data
 */
class PhilippineLocationSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('ph_barangays')->truncate();
        DB::table('ph_cities')->truncate();
        DB::table('ph_provinces')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->seedProvinces();
        $this->seedCities();

        $this->command->info('Philippine provinces and cities/municipalities seeded successfully.');
        $this->command->info('Run PhilippineBarangaySeeder separately for barangays (large dataset).');
    }

    // =========================================================================
    // PROVINCES
    // =========================================================================

    private function seedProvinces(): void
    {
        $provinces = [
            // NCR
            ['code' => '133900000', 'name' => 'Metro Manila',              'region' => 'NCR'],

            // Region I — Ilocos Region
            ['code' => '012800000', 'name' => 'Ilocos Norte',              'region' => 'Region I'],
            ['code' => '012900000', 'name' => 'Ilocos Sur',                'region' => 'Region I'],
            ['code' => '013300000', 'name' => 'La Union',                  'region' => 'Region I'],
            ['code' => '015500000', 'name' => 'Pangasinan',                'region' => 'Region I'],

            // Region II — Cagayan Valley
            ['code' => '021500000', 'name' => 'Batanes',                   'region' => 'Region II'],
            ['code' => '021900000', 'name' => 'Cagayan',                   'region' => 'Region II'],
            ['code' => '023100000', 'name' => 'Isabela',                   'region' => 'Region II'],
            ['code' => '025000000', 'name' => 'Nueva Vizcaya',             'region' => 'Region II'],
            ['code' => '025700000', 'name' => 'Quirino',                   'region' => 'Region II'],

            // Region III — Central Luzon
            ['code' => '030800000', 'name' => 'Bataan',                    'region' => 'Region III'],
            ['code' => '031400000', 'name' => 'Bulacan',                   'region' => 'Region III'],
            ['code' => '034900000', 'name' => 'Nueva Ecija',               'region' => 'Region III'],
            ['code' => '035400000', 'name' => 'Pampanga',                  'region' => 'Region III'],
            ['code' => '036900000', 'name' => 'Tarlac',                    'region' => 'Region III'],
            ['code' => '037100000', 'name' => 'Zambales',                  'region' => 'Region III'],
            ['code' => '037700000', 'name' => 'Aurora',                    'region' => 'Region III'],

            // Region IV-A — CALABARZON
            ['code' => '041000000', 'name' => 'Batangas',                  'region' => 'Region IV-A'],
            ['code' => '042100000', 'name' => 'Cavite',                    'region' => 'Region IV-A'],
            ['code' => '043400000', 'name' => 'Laguna',                    'region' => 'Region IV-A'],
            ['code' => '045600000', 'name' => 'Quezon',                    'region' => 'Region IV-A'],
            ['code' => '045800000', 'name' => 'Rizal',                     'region' => 'Region IV-A'],

            // Region IV-B — MIMAROPA
            ['code' => '174000000', 'name' => 'Marinduque',                'region' => 'Region IV-B'],
            ['code' => '175100000', 'name' => 'Occidental Mindoro',        'region' => 'Region IV-B'],
            ['code' => '175200000', 'name' => 'Oriental Mindoro',          'region' => 'Region IV-B'],
            ['code' => '175300000', 'name' => 'Palawan',                   'region' => 'Region IV-B'],
            ['code' => '175900000', 'name' => 'Romblon',                   'region' => 'Region IV-B'],

            // Region V — Bicol Region
            ['code' => '050500000', 'name' => 'Albay',                     'region' => 'Region V'],
            ['code' => '051600000', 'name' => 'Camarines Norte',           'region' => 'Region V'],
            ['code' => '051700000', 'name' => 'Camarines Sur',             'region' => 'Region V'],
            ['code' => '051800000', 'name' => 'Catanduanes',               'region' => 'Region V'],
            ['code' => '054100000', 'name' => 'Masbate',                   'region' => 'Region V'],
            ['code' => '056200000', 'name' => 'Sorsogon',                  'region' => 'Region V'],

            // Region VI — Western Visayas
            ['code' => '060400000', 'name' => 'Aklan',                     'region' => 'Region VI'],
            ['code' => '060600000', 'name' => 'Antique',                   'region' => 'Region VI'],
            ['code' => '061900000', 'name' => 'Capiz',                     'region' => 'Region VI'],
            ['code' => '063000000', 'name' => 'Iloilo',                    'region' => 'Region VI'],
            ['code' => '064500000', 'name' => 'Negros Occidental',         'region' => 'Region VI'],
            ['code' => '079800000', 'name' => 'Guimaras',                  'region' => 'Region VI'],

            // Region VII — Central Visayas
            ['code' => '071200000', 'name' => 'Bohol',                     'region' => 'Region VII'],
            ['code' => '072200000', 'name' => 'Cebu',                      'region' => 'Region VII'],
            ['code' => '074600000', 'name' => 'Negros Oriental',           'region' => 'Region VII'],
            ['code' => '076100000', 'name' => 'Siquijor',                  'region' => 'Region VII'],

            // Region VIII — Eastern Visayas
            ['code' => '082600000', 'name' => 'Eastern Samar',             'region' => 'Region VIII'],
            ['code' => '083200000', 'name' => 'Leyte',                     'region' => 'Region VIII'],
            ['code' => '084300000', 'name' => 'Northern Samar',            'region' => 'Region VIII'],
            ['code' => '086000000', 'name' => 'Samar (Western Samar)',     'region' => 'Region VIII'],
            ['code' => '086400000', 'name' => 'Southern Leyte',            'region' => 'Region VIII'],
            ['code' => '087800000', 'name' => 'Biliran',                   'region' => 'Region VIII'],

            // Region IX — Zamboanga Peninsula
            ['code' => '097200000', 'name' => 'Zamboanga del Norte',       'region' => 'Region IX'],
            ['code' => '097300000', 'name' => 'Zamboanga del Sur',         'region' => 'Region IX'],
            ['code' => '098300000', 'name' => 'Zamboanga Sibugay',         'region' => 'Region IX'],

            // Region X — Northern Mindanao
            ['code' => '101300000', 'name' => 'Bukidnon',                  'region' => 'Region X'],
            ['code' => '101800000', 'name' => 'Camiguin',                  'region' => 'Region X'],
            ['code' => '103500000', 'name' => 'Lanao del Norte',           'region' => 'Region X'],
            ['code' => '104200000', 'name' => 'Misamis Occidental',        'region' => 'Region X'],
            ['code' => '104300000', 'name' => 'Misamis Oriental',          'region' => 'Region X'],

            // Region XI — Davao Region
            ['code' => '112300000', 'name' => 'Davao de Oro',              'region' => 'Region XI'],
            ['code' => '112400000', 'name' => 'Davao del Norte',           'region' => 'Region XI'],
            ['code' => '112500000', 'name' => 'Davao del Sur',             'region' => 'Region XI'],
            ['code' => '118200000', 'name' => 'Davao Occidental',          'region' => 'Region XI'],
            ['code' => '118600000', 'name' => 'Davao Oriental',            'region' => 'Region XI'],

            // Region XII — SOCCSKSARGEN
            ['code' => '124700000', 'name' => 'Cotabato (North Cotabato)', 'region' => 'Region XII'],
            ['code' => '126300000', 'name' => 'Sarangani',                 'region' => 'Region XII'],
            ['code' => '126500000', 'name' => 'South Cotabato',            'region' => 'Region XII'],
            ['code' => '126700000', 'name' => 'Sultan Kudarat',            'region' => 'Region XII'],

            // Region XIII — Caraga
            ['code' => '160200000', 'name' => 'Agusan del Norte',          'region' => 'Region XIII'],
            ['code' => '160300000', 'name' => 'Agusan del Sur',            'region' => 'Region XIII'],
            ['code' => '166800000', 'name' => 'Dinagat Islands',           'region' => 'Region XIII'],
            ['code' => '166500000', 'name' => 'Surigao del Norte',         'region' => 'Region XIII'],
            ['code' => '166600000', 'name' => 'Surigao del Sur',           'region' => 'Region XIII'],

            // CAR — Cordillera Administrative Region
            ['code' => '140900000', 'name' => 'Abra',                      'region' => 'CAR'],
            ['code' => '141100000', 'name' => 'Apayao',                    'region' => 'CAR'],
            ['code' => '141400000', 'name' => 'Benguet',                   'region' => 'CAR'],
            ['code' => '142700000', 'name' => 'Ifugao',                    'region' => 'CAR'],
            ['code' => '143200000', 'name' => 'Kalinga',                   'region' => 'CAR'],
            ['code' => '144400000', 'name' => 'Mountain Province',         'region' => 'CAR'],

            // BARMM — Bangsamoro Autonomous Region in Muslim Mindanao
            ['code' => '150700000', 'name' => 'Basilan',                   'region' => 'BARMM'],
            ['code' => '153600000', 'name' => 'Lanao del Sur',             'region' => 'BARMM'],
            ['code' => '153800000', 'name' => 'Maguindanao del Norte',     'region' => 'BARMM'],
            ['code' => '153900000', 'name' => 'Maguindanao del Sur',       'region' => 'BARMM'],
            ['code' => '156600000', 'name' => 'Sulu',                      'region' => 'BARMM'],
            ['code' => '157000000', 'name' => 'Tawi-Tawi',                 'region' => 'BARMM'],
        ];

        DB::table('ph_provinces')->insert(array_map(fn($p) => array_merge($p, [
            'created_at' => now(), 'updated_at' => now(),
        ]), $provinces));

        $this->command->info('Provinces seeded: ' . count($provinces));
    }

    // =========================================================================
    // CITIES / MUNICIPALITIES
    // =========================================================================

    private function seedCities(): void
    {
        $pid = fn(string $code) => DB::table('ph_provinces')->where('code', $code)->value('id');

        $cities = [];
        $add = function (int $provinceId, array $lguList) use (&$cities) {
            foreach ($lguList as [$name, $zip, $isCity]) {
                $cities[] = [
                    'province_id' => $provinceId,
                    'name'        => $name,
                    'zip_code'    => $zip,
                    'is_city'     => $isCity,
                    'code'        => md5($provinceId . $name),
                ];
            }
        };

        // ─────────────────────────────────────────────────────────────
        // NCR — Metro Manila (no municipalities, all cities + Pateros)
        // ─────────────────────────────────────────────────────────────
        $add($pid('133900000'), [
            ['Caloocan',     '1400', true],
            ['Las Piñas',    '1740', true],
            ['Makati',       '1200', true],
            ['Malabon',      '1470', true],
            ['Mandaluyong',  '1550', true],
            ['Manila',       '1000', true],
            ['Marikina',     '1800', true],
            ['Muntinlupa',   '1770', true],
            ['Navotas',      '1485', true],
            ['Parañaque',    '1700', true],
            ['Pasay',        '1300', true],
            ['Pasig',        '1600', true],
            ['Pateros',      '1620', false],
            ['Quezon City',  '1100', true],
            ['San Juan',     '1500', true],
            ['Taguig',       '1630', true],
            ['Valenzuela',   '1440', true],
        ]);

        // ─────────────────────────────────────────────────────────────
        // REGION I
        // ─────────────────────────────────────────────────────────────

        // Ilocos Norte
        $add($pid('012800000'), [
            ['Adams', '2919', false], ['Bacarra', '2916', false], ['Badoc', '2904', false],
            ['Bangui', '2920', false], ['Banna (Espiritu)', '2908', false],
            ['City of Batac', '2906', true], ['Burgos', '2922', false],
            ['Carasi', '2911', false], ['Currimao', '2903', false], ['Dingras', '2913', false],
            ['Dumalneg', '2921', false], ['City of Laoag', '2900', true],
            ['Marcos', '2910', false], ['Nueva Era', '2914', false], ['Pagudpud', '2923', false],
            ['Paoay', '2902', false], ['Pasuquin', '2917', false], ['Piddig', '2915', false],
            ['Pinili', '2907', false], ['San Nicolas', '2901', false], ['Sarrat', '2912', false],
            ['Solsona', '2909', false], ['Vintar', '2918', false],
        ]);

        // Ilocos Sur
        $add($pid('012900000'), [
            ['Alilem', '2708', false], ['Banayoyo', '2727', false], ['Bantay', '2727', false],
            ['Burgos', '2726', false], ['Cabugao', '2724', false], ['City of Candon', '2734', true],
            ['Caoayan', '2700', false], ['Cervantes', '2705', false], ['Galimuyod', '2732', false],
            ['Gregorio del Pilar', '2704', false], ['Lidlidda', '2707', false],
            ['Magsingal', '2725', false], ['Nagbukel', '2716', false], ['Narvacan', '2713', false],
            ['Quirino', '2706', false], ['Salcedo', '2728', false],
            ['San Emilio', '2710', false], ['San Esteban', '2714', false],
            ['San Ildefonso', '2715', false], ['San Juan', '2709', false],
            ['San Vicente', '2711', false], ['Santa', '2726', false],
            ['Santa Catalina', '2705', false], ['Santa Cruz', '2717', false],
            ['Santa Lucia', '2712', false], ['Santa Maria', '2723', false],
            ['Santiago', '2731', false], ['Sigay', '2703', false],
            ['Sinait', '2722', false], ['Sugpon', '2700', false],
            ['Suyo', '2720', false], ['Tagudin', '2719', false],
            ['City of Vigan', '2700', true],
        ]);

        // La Union
        $add($pid('013300000'), [
            ['Agoo', '2508', false], ['Aringay', '2507', false], ['Bacnotan', '2515', false],
            ['Bagulin', '2505', false], ['Balaoan', '2512', false], ['Bangar', '2520', false],
            ['Bauang', '2501', false], ['Burgos', '2519', false], ['Caba', '2502', false],
            ['Luna', '2513', false], ['Naguilian', '2506', false], ['Pugo', '2504', false],
            ['Rosario', '2514', false], ['City of San Fernando', '2500', true],
            ['San Gabriel', '2521', false], ['San Juan', '2509', false],
            ['Santo Tomas', '2503', false], ['Santol', '2516', false],
            ['Sudipen', '2518', false], ['Tubao', '2511', false],
        ]);

        // Pangasinan
        $add($pid('015500000'), [
            ['Agno', '2447', false], ['Aguilar', '2415', false],
            ['City of Alaminos', '2404', true], ['Alcala', '2425', false],
            ['Anda', '2405', false], ['Asingan', '2426', false], ['Balungao', '2443', false],
            ['Bani', '2407', false], ['Basista', '2416', false], ['Bautista', '2411', false],
            ['Bayambang', '2423', false], ['Binalonan', '2436', false],
            ['Binmaley', '2417', false], ['Bolinao', '2406', false],
            ['Bugallon', '2409', false], ['Burgos', '2429', false], ['Calasiao', '2418', false],
            ['Dasol', '2445', false], ['Dagupan City', '2400', true],
            ['Infanta', '2412', false], ['Labrador', '2412', false],
            ['Laoac', '2437', false], ['Lingayen', '2401', false], ['Mabini', '2406', false],
            ['Malasiqui', '2422', false], ['Manaoag', '2430', false],
            ['Mangaldan', '2432', false], ['Mangatarem', '2413', false],
            ['Mapandan', '2430', false], ['Natividad', '2441', false],
            ['Pozorrubio', '2408', false], ['Rosales', '2441', false],
            ['San Carlos City', '2420', true], ['San Fabian', '2433', false],
            ['San Jacinto', '2428', false], ['San Manuel', '2438', false],
            ['San Nicolas', '2447', false], ['San Quintin', '2442', false],
            ['Santa Barbara', '2419', false], ['Santa Maria', '2444', false],
            ['Santo Tomas', '2410', false], ['Sison', '2434', false],
            ['Sual', '2403', false], ['Tayug', '2445', false], ['Umingan', '2427', false],
            ['Urbiztondo', '2414', false], ['City of Urdaneta', '2428', true],
            ['Villasis', '2427', false],
        ]);

        // ─────────────────────────────────────────────────────────────
        // REGION II — Cagayan Valley
        // ─────────────────────────────────────────────────────────────

        // Batanes
        $add($pid('021500000'), [
            ['Basco', '3900', false], ['Itbayat', '3903', false], ['Ivana', '3904', false],
            ['Mahatao', '3905', false], ['Sabtang', '3906', false], ['Uyugan', '3901', false],
        ]);

        // Cagayan
        $add($pid('021900000'), [
            ['Abulug', '3517', false], ['Alcala', '3507', false], ['Allacapan', '3511', false],
            ['Amulung', '3505', false], ['Aparri', '3515', false], ['Baggao', '3506', false],
            ['Ballesteros', '3516', false], ['Buguey', '3519', false], ['Calayan', '3522', false],
            ['Camalaniugan', '3521', false], ['Claveria', '3518', false],
            ['Enrile', '3504', false], ['Gattaran', '3512', false], ['Gonzaga', '3513', false],
            ['Iguig', '3509', false], ['Lal-lo', '3514', false], ['Lasam', '3510', false],
            ['Pamplona', '3524', false], ['Peñablanca', '3502', false],
            ['Piat', '3523', false], ['Rizal', '3509', false], ['Sanchez-Mira', '3520', false],
            ['Santa Ana', '3514', false], ['Santa Praxedes', '3521', false],
            ['Santa Teresita', '3511', false], ['Santo Niño', '3505', false],
            ['Solana', '3503', false], ['Tuguegarao City', '3500', true],
            ['Tuao', '3508', false],
        ]);

        // Isabela
        $add($pid('023100000'), [
            ['Alicia', '3343', false], ['Angadanan', '3316', false],
            ['Aurora', '3302', false], ['Benito Soliven', '3310', false],
            ['Burgos', '3317', false], ['Cabagan', '3328', false],
            ['Cabatuan', '3318', false], ['City of Cauayan', '3305', true],
            ['Cordon', '3313', false], ['Delfin Albano', '3322', false],
            ['Dinapigue', '3308', false], ['Divilacan', '3307', false],
            ['Echague', '3309', false], ['Gamu', '3326', false],
            ['Ilagan City', '3300', true], ['Jones', '3304', false],
            ['Luna', '3312', false], ['Maconacon', '3311', false],
            ['Mallig', '3341', false], ['Naguilian', '3325', false],
            ['Palanan', '3306', false], ['Quezon', '3327', false],
            ['Quirino', '3329', false], ['Ramon', '3320', false],
            ['Reina Mercedes', '3319', false], ['Roxas', '3303', false],
            ['San Agustin', '3315', false], ['San Guillermo', '3321', false],
            ['San Isidro', '3324', false], ['San Manuel', '3314', false],
            ['City of Santiago', '3311', true], ['Santo Tomas', '3346', false],
            ['Tumauini', '3327', false],
        ]);

        // Nueva Vizcaya
        $add($pid('025000000'), [
            ['Alfonso Castañeda', '3711', false], ['Ambaguio', '3702', false],
            ['Aritao', '3709', false], ['Bagabag', '3706', false],
            ['Bambang', '3702', false], ['Bayombong', '3700', false],
            ['Diadi', '3713', false], ['Dupax del Norte', '3712', false],
            ['Dupax del Sur', '3712', false], ['Kasibu', '3703', false],
            ['Kayapa', '3605', false], ['Quezon', '3710', false],
            ['Santa Fe', '3705', false], ['Solano', '3709', false],
            ['Villaverde', '3714', false],
        ]);

        // Quirino
        $add($pid('025700000'), [
            ['Aglipay', '3407', false], ['Cabarroguis', '3400', false],
            ['Diffun', '3401', false], ['Maddela', '3404', false],
            ['Nagtipunan', '3402', false], ['Saguday', '3405', false],
        ]);

        // ─────────────────────────────────────────────────────────────
        // REGION III — Central Luzon
        // ─────────────────────────────────────────────────────────────

        // Bataan
        $add($pid('030800000'), [
            ['Abucay', '2114', false], ['Bagac', '2107', false],
            ['City of Balanga', '2100', true], ['Dinalupihan', '2110', false],
            ['Hermosa', '2111', false], ['Limay', '2103', false],
            ['Mariveles', '2105', false], ['Morong', '2108', false],
            ['Orani', '2112', false], ['Orion', '2102', false],
            ['Pilar', '2101', false], ['Samal', '2113', false],
        ]);

        // Bulacan
        $add($pid('031400000'), [
            ['Angat', '3012', false], ['Balagtas', '3016', false],
            ['Baliuag', '3006', false], ['Bocaue', '3018', false],
            ['Bulakan', '3017', false], ['Bustos', '3007', false],
            ['Calumpit', '3003', false], ['Doña Remedios Trinidad', '3009', false],
            ['Guiguinto', '3015', false], ['Hagonoy', '3002', false],
            ['City of Malolos', '3000', true], ['Marilao', '3020', false],
            ['City of Meycauayan', '3020', true], ['Norzagaray', '3013', false],
            ['Obando', '3021', false], ['Pandi', '3014', false],
            ['Paombong', '3001', false], ['Plaridel', '3004', false],
            ['Pulilan', '3005', false], ['San Ildefonso', '3010', false],
            ['City of San Jose del Monte', '3023', true], ['San Miguel', '3011', false],
            ['San Rafael', '3008', false], ['Santa Maria', '3022', false],
        ]);

        // Nueva Ecija
        $add($pid('034900000'), [
            ['Aliaga', '3111', false], ['Bongabon', '3128', false],
            ['Cabanatuan City', '3100', true], ['Cabiao', '3107', false],
            ['Carranglan', '3123', false], ['Cuyapo', '3117', false],
            ['Gabaldon', '3131', false], ['City of Gapan', '3105', true],
            ['General Mamerto Natividad', '3129', false],
            ['General Tinio', '3104', false], ['Guimba', '3115', false],
            ['Jaen', '3109', false], ['Laur', '3130', false],
            ['Licab', '3112', false], ['Llanera', '3126', false],
            ['Lupao', '3122', false], ['City of Munoz', '3119', true],
            ['Nampicuan', '3116', false], ['Palayan City', '3132', true],
            ['Pantabangan', '3124', false], ['Peñaranda', '3108', false],
            ['Quezon', '3113', false], ['Rizal', '3127', false],
            ['San Antonio', '3106', false], ['San Isidro', '3110', false],
            ['San Jose City', '3121', true], ['San Leonardo', '3102', false],
            ['Santa Rosa', '3101', false], ['Santo Domingo', '3103', false],
            ['Talavera', '3114', false], ['Talugtug', '3118', false],
            ['Zaragoza', '3110', false],
        ]);

        // Pampanga
        $add($pid('035400000'), [
            ['Angeles City', '2009', true], ['Apalit', '2016', false],
            ['Arayat', '2012', false], ['Bacolor', '2001', false],
            ['Candaba', '2013', false], ['Floridablanca', '2006', false],
            ['Guagua', '2003', false], ['Lubao', '2005', false],
            ['Mabalacat City', '2010', true], ['Macabebe', '2018', false],
            ['Magalang', '2011', false], ['Masantol', '2017', false],
            ['Mexico', '2021', false], ['Minalin', '2019', false],
            ['Porac', '2008', false], ['City of San Fernando', '2000', true],
            ['San Luis', '2014', false], ['San Simon', '2015', false],
            ['Santa Ana', '2022', false], ['Santa Rita', '2002', false],
            ['Santo Tomas', '2020', false], ['Sasmuan (Sexmoan)', '2207', false],
        ]);

        // Tarlac
        $add($pid('036900000'), [
            ['Anao', '2310', false], ['Bamban', '2317', false],
            ['Camiling', '2306', false], ['Capas', '2315', false],
            ['Concepcion', '2316', false], ['Gerona', '2311', false],
            ['La Paz', '2314', false], ['Mayantoc', '2304', false],
            ['Moncada', '2308', false], ['Paniqui', '2307', false],
            ['Pura', '2312', false], ['Ramos', '2309', false],
            ['San Clemente', '2305', false], ['San Jose', '2318', false],
            ['San Manuel', '2303', false], ['Santa Ignacia', '2303', false],
            ['City of Tarlac', '2300', true], ['Victoria', '2313', false],
        ]);

        // Zambales
        $add($pid('037100000'), [
            ['Botolan', '2202', false], ['Cabangan', '2203', false],
            ['Candelaria', '2212', false], ['Castillejos', '2208', false],
            ['Iba', '2201', false], ['Masinloc', '2211', false],
            ['Olongapo City', '2200', true], ['Palauig', '2210', false],
            ['San Antonio', '2206', false], ['San Felipe', '2204', false],
            ['San Marcelino', '2207', false], ['San Narciso', '2205', false],
            ['Santa Cruz', '2213', false], ['Subic', '2209', false],
        ]);

        // Aurora
        $add($pid('037700000'), [
            ['Baler', '3200', false], ['Casiguran', '3204', false],
            ['Dilasag', '3205', false], ['Dinalungan', '3203', false],
            ['Dingalan', '3201', false], ['Dipaculao', '3206', false],
            ['Maria Aurora', '3202', false], ['San Luis', '3207', false],
        ]);

        // ─────────────────────────────────────────────────────────────
        // REGION IV-A — CALABARZON
        // ─────────────────────────────────────────────────────────────

        // Batangas
        $add($pid('041000000'), [
            ['Agoncillo', '4211', false], ['Alitagtag', '4205', false],
            ['Balayan', '4213', false], ['Balete', '4219', false],
            ['City of Batangas', '4200', true], ['Bauan', '4201', false],
            ['Calaca', '4212', false], ['Calatagan', '4215', false],
            ['Cuenca', '4224', false], ['Ibaan', '4230', false],
            ['Laurel', '4218', false], ['Lemery', '4209', false],
            ['Lian', '4216', false], ['Lipa City', '4217', true],
            ['Lobo', '4229', false], ['Mabini', '4202', false],
            ['Malvar', '4233', false], ['Mataas na Kahoy', '4223', false],
            ['Nasugbu', '4231', false], ['Padre Garcia', '4232', false],
            ['Rosario', '4225', false], ['San Jose', '4227', false],
            ['San Juan', '4226', false], ['San Luis', '4222', false],
            ['San Nicolas', '4228', false], ['San Pascual', '4204', false],
            ['Santa Teresita', '4220', false], ['Santo Tomas', '4234', false],
            ['Taal', '4208', false], ['Talisay', '4207', false],
            ['City of Tanauan', '4232', true], ['Taysan', '4228', false],
            ['Tingloy', '4203', false], ['Tuy', '4214', false],
        ]);

        // Cavite
        $add($pid('042100000'), [
            ['Alfonso', '4123', false], ['Amadeo', '4119', false],
            ['City of Bacoor', '4102', true], ['Carmona', '4116', false],
            ['City of Cavite', '4100', true], ['Dasmariñas City', '4114', true],
            ['General Emilio Aguinaldo', '4124', false],
            ['General Mariano Alvarez', '4117', false],
            ['General Trias City', '4107', true], ['Imus City', '4103', true],
            ['Indang', '4122', false], ['Kawit', '4104', false],
            ['Magallanes', '4126', false], ['Maragondon', '4112', false],
            ['Mendez', '4121', false], ['Naic', '4110', false],
            ['Noveleta', '4105', false], ['Rosario', '4106', false],
            ['Silang', '4118', false], ['City of Tagaytay', '4120', true],
            ['Tanza', '4108', false], ['Ternate', '4111', false],
            ['Trece Martires City', '4109', true],
        ]);

        // Laguna
        $add($pid('043400000'), [
            ['Alaminos', '4001', false], ['Bay', '4033', false],
            ['City of Biñan', '4024', true], ['City of Calamba', '4027', true],
            ['Calauan', '4012', false], ['Cavinti', '4013', false],
            ['Famy', '4021', false], ['Kalayaan', '4015', false],
            ['Liliw', '4004', false], ['Los Baños', '4030', false],
            ['Luisiana', '4032', false], ['Lumban', '4014', false],
            ['Mabitac', '4020', false], ['Magdalena', '4007', false],
            ['Majayjay', '4005', false], ['Nagcarlan', '4003', false],
            ['Paete', '4016', false], ['Pagsanjan', '4008', false],
            ['Pakil', '4017', false], ['Pangil', '4018', false],
            ['Pila', '4010', false], ['Rizal', '4022', false],
            ['City of San Pablo', '4000', true], ['San Pedro', '4023', false],
            ['City of Santa Cruz', '4009', true], ['Santa Maria', '4019', false],
            ['City of Santa Rosa', '4026', true], ['Siniloan', '4019', false],
            ['Victoria', '4011', false],
        ]);

        // Quezon
        $add($pid('045600000'), [
            ['Agdangan', '4304', false], ['Alabat', '4333', false],
            ['Atimonan', '4331', false], ['Buenavista', '4310', false],
            ['Burdeos', '4338', false], ['Calauag', '4318', false],
            ['Candelaria', '4323', false], ['Catanauan', '4311', false],
            ['Dolores', '4314', false], ['General Luna', '4312', false],
            ['General Nakar', '4335', false], ['Guinayangan', '4319', false],
            ['Gumaca', '4307', false], ['Infanta', '4336', false],
            ['Jomalig', '4339', false], ['Lopez', '4316', false],
            ['Lucban', '4328', false], ['Lucena City', '4301', true],
            ['Macalelon', '4309', false], ['Mauban', '4330', false],
            ['Mulanay', '4312', false], ['Padre Burgos', '4303', false],
            ['Pagbilao', '4302', false], ['Panukulan', '4337', false],
            ['Patnanungan', '4339', false], ['Perez', '4306', false],
            ['Pitogo', '4308', false], ['Plaridel', '4317', false],
            ['Polillo', '4334', false], ['Quezon', '4315', false],
            ['Real', '4335', false], ['Sampaloc', '4332', false],
            ['San Andres', '4314', false], ['San Antonio', '4306', false],
            ['San Francisco (Aurora)', '4320', false], ['San Narciso', '4321', false],
            ['Sariaya', '4322', false], ['Tagkawayan', '4313', false],
            ['City of Tayabas', '4327', true], ['Tiaong', '4325', false],
            ['Unisan', '4305', false],
        ]);

        // Rizal
        $add($pid('045800000'), [
            ['Angono', '1930', false], ['City of Antipolo', '1870', true],
            ['Baras', '1970', false], ['Binangonan', '1940', false],
            ['Cainta', '1900', false], ['Cardona', '1950', false],
            ['Jala-Jala', '1990', false], ['Rodriguez (Montalban)', '1860', false],
            ['Morong', '1960', false], ['Pililla', '1910', false],
            ['San Mateo', '1850', false], ['Tanay', '1980', false],
            ['Taytay', '1920', false], ['Teresa', '1880', false],
        ]);

        // ─────────────────────────────────────────────────────────────
        // REGION IV-B — MIMAROPA
        // ─────────────────────────────────────────────────────────────

        // Marinduque
        $add($pid('174000000'), [
            ['Boac', '4900', false], ['Buenavista', '4904', false],
            ['Gasan', '4905', false], ['Mogpog', '4901', false],
            ['Santa Cruz', '4903', false], ['Torrijos', '4906', false],
        ]);

        // Occidental Mindoro
        $add($pid('175100000'), [
            ['Abra de Ilog', '5106', false], ['Calintaan', '5109', false],
            ['Looc', '5108', false], ['Lubang', '5102', false],
            ['Magsaysay', '5110', false], ['Mamburao', '5100', false],
            ['Paluan', '5107', false], ['Rizal', '5101', false],
            ['Sablayan', '5104', false], ['San Jose', '5103', false],
            ['Santa Cruz', '5105', false],
        ]);

        // Oriental Mindoro
        $add($pid('175200000'), [
            ['Baco', '5201', false], ['Bansud', '5210', false],
            ['Bongabong', '5209', false], ['Bulalacao (San Pedro)', '5214', false],
            ['City of Calapan', '5200', true], ['Gloria', '5206', false],
            ['Mansalay', '5213', false], ['Naujan', '5203', false],
            ['Pinamalayan', '5208', false], ['Pola', '5204', false],
            ['Puerto Galera', '5203', false], ['Roxas', '5212', false],
            ['San Teodoro', '5202', false], ['Socorro', '5207', false],
            ['Victoria', '5205', false],
        ]);

        // Palawan
        $add($pid('175300000'), [
            ['Aborlan', '5302', false], ['Agutaya', '5320', false],
            ['Araceli', '5316', false], ['Balabac', '5307', false],
            ['Bataraza', '5306', false], ['Brooke\'s Point', '5305', false],
            ['Busuanga', '5317', false], ['Cagayancillo', '5321', false],
            ['Coron', '5316', false], ['Culion', '5315', false],
            ['Cuyo', '5318', false], ['Dumaran', '5313', false],
            ['El Nido (Bacuit)', '5313', false], ['Española', '5303', false],
            ['Kalayaan', '5322', false], ['Linapacan', '5314', false],
            ['Magsaysay', '5304', false], ['Narra', '5303', false],
            ['City of Puerto Princesa', '5300', true],
            ['Quezon', '5311', false], ['Rizal', '5308', false],
            ['Roxas', '5313', false], ['San Vicente', '5312', false],
            ['Sofronio Española', '5303', false], ['Taytay', '5310', false],
        ]);

        // Romblon
        $add($pid('175900000'), [
            ['Alcantara', '5511', false], ['Banton', '5515', false],
            ['Cajidiocan', '5508', false], ['Calatrava', '5507', false],
            ['Concepcion', '5516', false], ['Corcuera', '5514', false],
            ['Ferrol', '5505', false], ['Looc', '5509', false],
            ['Magdiwang', '5506', false], ['Odiongan', '5505', false],
            ['Romblon', '5500', false], ['San Agustin', '5503', false],
            ['San Andres', '5512', false], ['San Fernando', '5513', false],
            ['San Jose', '5510', false], ['Santa Fe', '5504', false],
            ['Santa Maria (Imelda)', '5502', false],
        ]);

        // ─────────────────────────────────────────────────────────────
        // REGION V — Bicol Region
        // ─────────────────────────────────────────────────────────────

        // Albay
        $add($pid('050500000'), [
            ['Bacacay', '4509', false], ['Camalig', '4502', false],
            ['Daraga', '4501', false], ['Guinobatan', '4503', false],
            ['Jovellar', '4516', false], ['Legazpi City', '4500', true],
            ['Libon', '4507', false], ['Ligao City', '4504', true],
            ['Malilipot', '4511', false], ['Malinao', '4512', false],
            ['Manito', '4515', false], ['Oas', '4505', false],
            ['Pio Duran', '4513', false], ['Polangui', '4506', false],
            ['Rapu-Rapu', '4510', false], ['Santo Domingo', '4508', false],
            ['Tabaco City', '4511', true], ['Tiwi', '4514', false],
        ]);

        // Camarines Norte
        $add($pid('051600000'), [
            ['Basud', '4608', false], ['Capalonga', '4607', false],
            ['Daet', '4600', false], ['Jose Panganiban', '4606', false],
            ['Labo', '4604', false], ['Mercedes', '4605', false],
            ['Paracale', '4609', false], ['San Lorenzo Ruiz', '4601', false],
            ['San Vicente', '4602', false], ['Santa Elena', '4610', false],
            ['Talisay', '4611', false], ['Vinzons', '4603', false],
        ]);

        // Camarines Sur
        $add($pid('051700000'), [
            ['Baao', '4432', false], ['Balatan', '4432', false],
            ['Bato', '4437', false], ['Bombon', '4434', false],
            ['Buhi', '4427', false], ['Bula', '4433', false],
            ['Cabusao', '4410', false], ['Calabanga', '4404', false],
            ['Camaligan', '4402', false], ['Canaman', '4401', false],
            ['Caramoan', '4406', false], ['Del Gallego', '4425', false],
            ['Gainza', '4409', false], ['Garchitorena', '4407', false],
            ['Goa', '4422', false], ['Iriga City', '4431', true],
            ['Lagonoy', '4423', false], ['Libmanan', '4411', false],
            ['Lupi', '4424', false], ['Magarao', '4403', false],
            ['Milaor', '4405', false], ['Minalabac', '4412', false],
            ['Nabua', '4434', false], ['Naga City', '4400', true],
            ['Ocampo', '4430', false], ['Pamplona', '4420', false],
            ['Pasacao', '4413', false], ['Pili', '4418', false],
            ['Presentacion', '4426', false], ['Ragay', '4426', false],
            ['Sagñay', '4421', false], ['San Fernando', '4415', false],
            ['San Jose', '4428', false], ['Sipocot', '4425', false],
            ['Siruma', '4408', false], ['Tigaon', '4429', false],
            ['Tinambac', '4421', false],
        ]);

        // Catanduanes
        $add($pid('051800000'), [
            ['Bagamanoc', '4808', false], ['Baras', '4805', false],
            ['Bato', '4806', false], ['Caramoran', '4807', false],
            ['Gigmoto', '4813', false], ['Pandan', '4811', false],
            ['Panganiban', '4809', false], ['San Andres', '4810', false],
            ['San Miguel', '4812', false], ['Viga', '4814', false],
            ['Virac', '4800', false],
        ]);

        // Masbate
        $add($pid('054100000'), [
            ['Aroroy', '5401', false], ['Baleno', '5413', false],
            ['Balud', '5410', false], ['Batuan', '5417', false],
            ['Cataingan', '5415', false], ['Cawayan', '5410', false],
            ['Claveria', '5406', false], ['Dimasalang', '5416', false],
            ['Esperanza', '5407', false], ['Mandaon', '5411', false],
            ['Masbate City', '5400', true], ['Milagros', '5415', false],
            ['Mobo', '5406', false], ['Monreal', '5408', false],
            ['Palanas', '5412', false], ['Pio V. Corpuz', '5403', false],
            ['Placer', '5402', false], ['San Fernando', '5409', false],
            ['San Jacinto', '5414', false], ['San Pascual', '5404', false],
            ['Uson', '5405', false],
        ]);

        // Sorsogon
        $add($pid('056200000'), [
            ['Barcelona', '4707', false], ['Bulan', '4706', false],
            ['Bulusan', '4713', false], ['Casiguran', '4705', false],
            ['Castilla', '4706', false], ['Donsol', '4715', false],
            ['Gubat', '4710', false], ['Irosin', '4712', false],
            ['Juban', '4703', false], ['Magallanes', '4714', false],
            ['Matnog', '4715', false], ['Pilar', '4704', false],
            ['Prieto Diaz', '4709', false], ['Santa Magdalena', '4711', false],
            ['Sorsogon City', '4700', true],
        ]);

        // ─────────────────────────────────────────────────────────────
        // REGION VI — Western Visayas
        // ─────────────────────────────────────────────────────────────

        // Aklan
        $add($pid('060400000'), [
            ['Altavas', '5611', false], ['Balete', '5614', false],
            ['Banga', '5601', false], ['Batan', '5615', false],
            ['Buruanga', '5616', false], ['Ibajay', '5612', false],
            ['Kalibo', '5600', false], ['Lezo', '5607', false],
            ['Libacao', '5610', false], ['Madalag', '5609', false],
            ['Makato', '5606', false], ['Malay', '5608', false],
            ['Malinao', '5613', false], ['Nabas', '5617', false],
            ['New Washington', '5605', false], ['Numancia', '5604', false],
            ['Tangalan', '5603', false],
        ]);

        // Antique
        $add($pid('060600000'), [
            ['Anini-y', '5717', false], ['Barbaza', '5711', false],
            ['Belison', '5701', false], ['Bugasong', '5712', false],
            ['Caluya', '5718', false], ['Culasi', '5715', false],
            ['Hamtic', '5704', false], ['Laua-an', '5713', false],
            ['Libertad', '5716', false], ['Pandan', '5714', false],
            ['Patnongon', '5710', false], ['City of San Jose', '5700', true],
            ['San Remigio', '5709', false], ['Sebaste', '5719', false],
            ['Sibalom', '5705', false], ['Tibiao', '5710', false],
            ['Tobias Fornier (Dao)', '5706', false],
            ['Valderrama', '5708', false],
        ]);

        // Capiz
        $add($pid('061900000'), [
            ['Cuartero', '5813', false], ['Dao', '5815', false],
            ['Dumalag', '5810', false], ['Dumarao', '5810', false],
            ['Ivisan', '5805', false], ['Jamindan', '5809', false],
            ['Ma-ayon', '5807', false], ['Mambusao', '5811', false],
            ['Panay', '5804', false], ['Panitan', '5803', false],
            ['Pilar', '5812', false], ['Pontevedra', '5806', false],
            ['President Roxas', '5809', false], ['Roxas City', '5800', true],
            ['Sapi-an', '5814', false], ['Sigma', '5808', false],
            ['Tapaz', '5816', false],
        ]);

        // Iloilo
        $add($pid('063000000'), [
            ['Ajuy', '5012', false], ['Alimodian', '5021', false],
            ['Anilao', '5011', false], ['Badiangan', '5019', false],
            ['Balasan', '5013', false], ['Banate', '5010', false],
            ['Barotac Nuevo', '5007', false], ['Barotac Viejo', '5015', false],
            ['Batad', '5012', false], ['Bingawan', '5006', false],
            ['Cabatuan', '5005', false], ['Calinog', '5024', false],
            ['Carles', '5019', false], ['Concepcion', '5016', false],
            ['Dingle', '5003', false], ['Dueñas', '5004', false],
            ['Dumangas', '5006', false], ['Estancia', '5015', false],
            ['Guimbal', '5022', false], ['Igbaras', '5023', false],
            ['Iloilo City', '5000', true], ['Janiuay', '5034', false],
            ['Lambunao', '5030', false], ['Leganes', '5003', false],
            ['Lemery', '5029', false], ['Leon', '5026', false],
            ['Maasin', '5028', false], ['Miagao', '5023', false],
            ['Mina', '5030', false], ['New Lucena', '5001', false],
            ['Oton', '5020', false], ['City of Passi', '5037', true],
            ['Pavia', '5001', false], ['Pototan', '5008', false],
            ['San Dionisio', '5014', false], ['San Enrique', '5031', false],
            ['San Joaquin', '5025', false], ['San Miguel', '5033', false],
            ['San Rafael', '5032', false], ['Santa Barbara', '5002', false],
            ['Sara', '5009', false], ['Tigbauan', '5021', false],
            ['Tubungan', '5027', false], ['Zarraga', '5002', false],
        ]);

        // Negros Occidental
        $add($pid('064500000'), [
            ['Bacolod City', '6100', true], ['Bago City', '6101', true],
            ['Binalbagan', '6107', false], ['Calatrava', '6126', false],
            ['Candoni', '6118', false], ['Cauayan', '6117', false],
            ['Enrique B. Magalona', '6108', false], ['Escalante City', '6124', true],
            ['Himamaylan City', '6110', true], ['Hinigaran', '6112', false],
            ['Hinoba-an (Asia)', '6119', false], ['Ilog', '6115', false],
            ['Isabela', '6117', false], ['Kabankalan City', '6111', true],
            ['La Castellana', '6120', false], ['Manapla', '6109', false],
            ['Moises Padilla (Magallon)', '6122', false],
            ['Murcia', '6129', false], ['Pontevedra', '6113', false],
            ['Pulupandan', '6104', false], ['Sagay City', '6123', true],
            ['Salvador Benedicto', '6128', false],
            ['San Carlos City', '6127', true], ['San Enrique', '6114', false],
            ['Silay City', '6102', true], ['Sipalay City', '6113', true],
            ['Talisay City', '6105', true], ['Toboso', '6125', false],
            ['Valladolid', '6106', false], ['Victorias City', '6119', true],
        ]);

        // Guimaras
        $add($pid('079800000'), [
            ['Buenavista', '5044', false], ['Jordan', '5045', false],
            ['Nueva Valencia', '5047', false], ['San Lorenzo', '5046', false],
            ['Sibunag', '5048', false],
        ]);

        // ─────────────────────────────────────────────────────────────
        // REGION VII — Central Visayas
        // ─────────────────────────────────────────────────────────────

        // Bohol
        $add($pid('071200000'), [
            ['Alburquerque', '6301', false], ['Alicia', '6325', false],
            ['Anda', '6311', false], ['Antequera', '6306', false],
            ['Baclayon', '6301', false], ['Balilihan', '6310', false],
            ['Batuan', '6318', false], ['Bien Unido', '6335', false],
            ['Bilar', '6317', false], ['Buenavista', '6332', false],
            ['Calape', '6308', false], ['Candijay', '6312', false],
            ['Carmen', '6329', false], ['Catigbian', '6322', false],
            ['Clarin', '6333', false], ['Corella', '6302', false],
            ['Cortes', '6304', false], ['Dagohoy', '6321', false],
            ['Danao', '6315', false], ['Dauis', '6339', false],
            ['Dimiao', '6316', false], ['Duero', '6313', false],
            ['Garcia Hernandez', '6314', false], ['Getafe', '6332', false],
            ['Guindulman', '6312', false], ['Inabanga', '6333', false],
            ['Jagna', '6308', false], ['Lila', '6307', false],
            ['Loay', '6305', false], ['Loboc', '6317', false],
            ['Loon', '6337', false], ['Mabini', '6312', false],
            ['Maribojoc', '6337', false], ['Panglao', '6340', false],
            ['Pilar', '6308', false], ['President Carlos P. Garcia', '6311', false],
            ['Sagbayan (Borja)', '6319', false], ['San Isidro', '6334', false],
            ['San Miguel', '6323', false], ['Sevilla', '6303', false],
            ['Sierra Bullones', '6324', false], ['Sikatuna', '6302', false],
            ['City of Tagbilaran', '6300', true], ['Talibon', '6325', false],
            ['Trinidad', '6322', false], ['Tubigon', '6336', false],
            ['Ubay', '6328', false], ['Valencia', '6320', false],
        ]);

        // Cebu
        $add($pid('072200000'), [
            ['Alcantara', '6038', false], ['Alcoy', '6040', false],
            ['Alegria', '6042', false], ['Aloguinsan', '6036', false],
            ['Argao', '6021', false], ['Asturias', '6033', false],
            ['Badian', '6031', false], ['Balamban', '6041', false],
            ['Bantayan', '6042', false], ['Barili', '6036', false],
            ['City of Bogo', '6010', true], ['Boljoon', '6022', false],
            ['Borbon', '6016', false], ['City of Carcar', '6019', true],
            ['Carmen', '6005', false], ['Catmon', '6006', false],
            ['City of Cebu', '6000', true], ['Compostela', '6003', false],
            ['Consolacion', '6001', false], ['Cordova', '6017', false],
            ['Daanbantayan', '6013', false], ['Dalaguete', '6027', false],
            ['Danao City', '6004', true], ['Dumanjug', '6037', false],
            ['Ginatilan', '6039', false], ['City of Lapu-Lapu (Opon)', '6015', true],
            ['Liloan', '6002', false], ['Madridejos', '6043', false],
            ['Malabuyoc', '6030', false], ['City of Mandaue', '6014', true],
            ['Medellin', '6012', false], ['Minglanilla', '6046', false],
            ['Moalboal', '6032', false], ['City of Naga', '6037', true],
            ['Oslob', '6023', false], ['Pilar', '6042', false],
            ['Pinamungajan', '6035', false], ['Poro', '6010', false],
            ['Ronda', '6038', false], ['Samboan', '6028', false],
            ['San Fernando', '6018', false], ['San Francisco', '6010', false],
            ['San Remigio', '6011', false], ['Santa Fe', '6042', false],
            ['Santander', '6029', false], ['Sibonga', '6020', false],
            ['Sogod', '6007', false], ['Tabogon', '6009', false],
            ['Tabuelan', '6034', false], ['City of Talisay', '6045', true],
            ['Toledo City', '6038', true], ['Tuburan', '6033', false],
            ['Tudela', '6010', false],
        ]);

        // Negros Oriental
        $add($pid('074600000'), [
            ['Amlan (Ayungon)', '6212', false], ['Ayungon', '6210', false],
            ['Bacong', '6206', false], ['Bayawan City', '6221', true],
            ['Bindoy (Payabon)', '6208', false], ['Bais City', '6206', true],
            ['Basay', '6222', false], ['Canlaon City', '6223', true],
            ['Dauin', '6217', false], ['Dumaguete City', '6200', true],
            ['Guihulngan City', '6214', true], ['Jimalalud', '6211', false],
            ['La Libertad', '6213', false], ['Mabinay', '6209', false],
            ['Manjuyod', '6207', false], ['Pamplona', '6205', false],
            ['San Jose', '6202', false], ['Santa Catalina', '6220', false],
            ['Siaton', '6219', false], ['Sibulan', '6201', false],
            ['Tanjay City', '6204', true], ['Tayasan', '6210', false],
            ['Valencia (Luzurriaga)', '6215', false], ['Vallehermoso', '6205', false],
            ['Zamboanguita', '6218', false],
        ]);

        // Siquijor
        $add($pid('076100000'), [
            ['Enrique Villanueva', '6229', false], ['Larena', '6225', false],
            ['Lazi', '6228', false], ['Maria', '6226', false],
            ['San Juan', '6227', false], ['Siquijor', '6225', false],
        ]);

        // ─────────────────────────────────────────────────────────────
        // REGION VIII — Eastern Visayas
        // ─────────────────────────────────────────────────────────────

        // Eastern Samar
        $add($pid('082600000'), [
            ['Arteche', '6809', false], ['Balangiga', '6807', false],
            ['Balangkayan', '6810', false], ['City of Borongan', '6800', true],
            ['Can-avid', '6811', false], ['Dolores', '6812', false],
            ['General MacArthur', '6813', false], ['Giporlos', '6806', false],
            ['Guiuan', '6809', false], ['Hernani', '6804', false],
            ['Jipapad', '6815', false], ['Lawaan', '6806', false],
            ['Llorente', '6804', false], ['Maslog', '6814', false],
            ['Maydolong', '6803', false], ['Mercedes', '6801', false],
            ['Oras', '6802', false], ['Quinapondan', '6808', false],
            ['Salcedo', '6808', false], ['San Julian', '6805', false],
            ['San Policarpo', '6816', false], ['Sulat', '6804', false],
            ['Taft', '6808', false],
        ]);

        // Leyte
        $add($pid('083200000'), [
            ['Abuyog', '6510', false], ['Alangalang', '6501', false],
            ['Albuera', '6511', false], ['Babatngon', '6511', false],
            ['Barugo', '6501', false], ['Bato', '6508', false],
            ['City of Baybay', '6521', true], ['Burauen', '6516', false],
            ['Calubian', '6504', false], ['Capoocan', '6503', false],
            ['Carigara', '6510', false], ['Dagami', '6515', false],
            ['Dulag', '6517', false], ['Hilongos', '6524', false],
            ['Hindang', '6523', false], ['Inopacan', '6522', false],
            ['Isabel', '6537', false], ['Jaro', '6513', false],
            ['Javier (Bugho)', '6519', false], ['Julita', '6518', false],
            ['Kananga', '6537', false], ['La Paz', '6512', false],
            ['Leyte', '6526', false], ['MacArthur', '6519', false],
            ['Mahaplag', '6523', false], ['Matag-ob', '6534', false],
            ['Matalom', '6525', false], ['Mayorga', '6521', false],
            ['Merida', '6531', false], ['City of Ormoc', '6541', true],
            ['Palo', '6501', false], ['Palompon', '6538', false],
            ['Pastrana', '6514', false], ['San Isidro', '6505', false],
            ['San Miguel', '6502', false], ['Santa Fe', '6507', false],
            ['Tabango', '6540', false], ['Tabontabon', '6518', false],
            ['City of Tacloban', '6500', true], ['Tanauan', '6501', false],
            ['Tolosa', '6501', false], ['Tunga', '6501', false],
            ['Villaba', '6539', false],
        ]);

        // Northern Samar
        $add($pid('084300000'), [
            ['Allen', '6408', false], ['Biri', '6411', false],
            ['Bobon', '6410', false], ['Capul', '6408', false],
            ['Catarman', '6400', false], ['Catubig', '6406', false],
            ['Gamay', '6407', false], ['Laoang', '6405', false],
            ['Lapinig', '6408', false], ['Las Navas', '6403', false],
            ['Lavezares', '6406', false], ['Lope de Vega', '6404', false],
            ['Mapanas', '6405', false], ['Mondragon', '6411', false],
            ['Palapag', '6407', false], ['Pambujan', '6406', false],
            ['Rosario', '6406', false], ['San Antonio', '6408', false],
            ['San Isidro', '6410', false], ['San Jose', '6403', false],
            ['San Roque', '6409', false], ['San Vicente', '6406', false],
            ['Silvino Lobos', '6404', false], ['Victoria', '6402', false],
        ]);

        // Samar (Western Samar)
        $add($pid('086000000'), [
            ['Almagro', '6712', false], ['Basey', '6720', false],
            ['Calbayog City', '6710', true], ['Calbiga', '6714', false],
            ['Catbalogan City', '6700', true], ['Daram', '6712', false],
            ['Gandara', '6706', false], ['Hinabangan', '6717', false],
            ['Jiabong', '6703', false], ['Marabut', '6721', false],
            ['Matuguinao', '6705', false], ['Motiong', '6710', false],
            ['Paranas (Wright)', '6718', false], ['Pinabacdao', '6704', false],
            ['San Jorge', '6707', false], ['San Jose de Buan', '6704', false],
            ['San Sebastian', '6708', false], ['Santa Margarita', '6708', false],
            ['Santa Rita', '6714', false], ['Santo Niño', '6708', false],
            ['Tagapul-an', '6713', false], ['Talalora', '6712', false],
            ['Tarangnan', '6709', false], ['Villareal', '6715', false],
            ['Zumarraga', '6716', false],
        ]);

        // Southern Leyte
        $add($pid('086400000'), [
            ['Anahawan', '6608', false], ['Bontoc', '6605', false],
            ['Hinunangan', '6612', false], ['Hinundayan', '6610', false],
            ['Libagon', '6607', false], ['Liloan', '6613', false],
            ['Limasawa', '6614', false], ['Maasin City', '6600', true],
            ['Macrohon', '6609', false], ['Malitbog', '6607', false],
            ['Padre Burgos', '6611', false], ['Pintuyan', '6606', false],
            ['Saint Bernard', '6615', false], ['San Francisco', '6616', false],
            ['San Juan', '6603', false], ['San Ricardo', '6609', false],
            ['Silago', '6615', false], ['Sogod', '6601', false],
            ['Tomas Oppus', '6608', false],
        ]);

        // Biliran
        $add($pid('087800000'), [
            ['Almeria', '6543', false], ['Biliran', '6549', false],
            ['Cabucgayan', '6541', false], ['Caibiran', '6548', false],
            ['Culaba', '6547', false], ['Kawayan', '6546', false],
            ['Maripipi', '6545', false], ['Naval', '6540', false],
        ]);

        // ─────────────────────────────────────────────────────────────
        // REGION IX — Zamboanga Peninsula
        // ─────────────────────────────────────────────────────────────

        // Zamboanga del Norte
        $add($pid('097200000'), [
            ['Bacungan', '7114', false], ['Baliguian', '7121', false],
            ['City of Dapitan', '7101', true], ['Dipolog City', '7100', true],
            ['Godod', '7115', false], ['Gutalac', '7116', false],
            ['Jose Dalman (Ponot)', '7113', false], ['Kalawit', '7112', false],
            ['Katipunan', '7109', false], ['La Libertad', '7107', false],
            ['Labason', '7117', false], ['Leon B. Postigo', '7118', false],
            ['Liloy', '7119', false], ['Manukan', '7110', false],
            ['Mutia', '7106', false], ['Piñan (New Piñan)', '7108', false],
            ['Polanco', '7106', false], ['President Manuel A. Roxas', '7113', false],
            ['Rizal', '7104', false], ['Salug', '7120', false],
            ['San Pablo', '7107', false], ['Sergio Osmeña, Sr.', '7115', false],
            ['Siayan', '7111', false], ['Sibuco', '7124', false],
            ['Sibutad', '7122', false], ['Sindangan', '7103', false],
            ['Siocon', '7123', false], ['Sirawai', '7124', false],
            ['Tampilisan', '7111', false],
        ]);

        // Zamboanga del Sur
        $add($pid('097300000'), [
            ['Aurora', '7022', false], ['Bayog', '7016', false],
            ['Dimataling', '7027', false], ['Dinas', '7025', false],
            ['Dumalinao', '7015', false], ['Dumingag', '7028', false],
            ['Guipos', '7010', false], ['Josefina', '7024', false],
            ['Kumalarang', '7020', false], ['Labangan', '7011', false],
            ['Lakewood', '7018', false], ['Lapuyan', '7013', false],
            ['Mahayag', '7022', false], ['Margosatubig', '7010', false],
            ['Midsalip', '7023', false], ['Molave', '7023', false],
            ['Pagadian City', '7016', true], ['Pitogo', '7011', false],
            ['Ramon Magsaysay (Liargo)', '7026', false],
            ['San Miguel', '7019', false], ['San Pablo', '7021', false],
            ['Sominot (Don Mariano Marcos)', '7023', false],
            ['Tambulig', '7012', false], ['Tigbao', '7025', false],
            ['Tukuran', '7013', false], ['Vincenzo A. Sagun', '7012', false],
            ['City of Zamboanga', '7000', true],
        ]);

        // Zamboanga Sibugay
        $add($pid('098300000'), [
            ['Alicia', '7040', false], ['Buug', '7009', false],
            ['Diplahan', '7039', false], ['Imelda', '7036', false],
            ['Ipil', '7001', false], ['Kabasalan', '7005', false],
            ['Mabuhay', '7043', false], ['Malangas', '7037', false],
            ['Naga', '7004', false], ['Olutanga', '7038', false],
            ['Payao', '7042', false], ['Roseller T. Lim', '7041', false],
            ['Talusan', '7044', false], ['Titay', '7007', false],
            ['Tungawan', '7002', false],
        ]);

        // ─────────────────────────────────────────────────────────────
        // REGION X — Northern Mindanao
        // ─────────────────────────────────────────────────────────────

        // Bukidnon
        $add($pid('101300000'), [
            ['Baungon', '8722', false], ['Cabanglasan', '8712', false],
            ['Damulog', '8706', false], ['Dangcagan', '8707', false],
            ['Don Carlos', '8712', false], ['Impasug-ong', '8705', false],
            ['Kadingilan', '8710', false], ['Kalilangan', '8709', false],
            ['Kibawe', '8707', false], ['Kitaotao', '8711', false],
            ['Lantapan', '8701', false], ['Libona', '8703', false],
            ['Malitbog', '8714', false], ['Manolo Fortich', '8703', false],
            ['Maramag', '8710', false], ['Pangantucan', '8708', false],
            ['Quezon', '8715', false], ['San Fernando', '8706', false],
            ['Sumilao', '8704', false], ['Talakag', '8702', false],
            ['Valencia City', '8709', true],
        ]);

        // Camiguin
        $add($pid('101800000'), [
            ['Catarman', '9105', false], ['Guinsiliban', '9104', false],
            ['Mahinog', '9103', false], ['Mambajao', '9100', false],
            ['Sagay', '9101', false],
        ]);

        // Lanao del Norte
        $add($pid('103500000'), [
            ['Bacolod', '9212', false], ['Baloi', '9207', false],
            ['Baroy', '9210', false], ['City of Iligan', '9200', true],
            ['Kapatagan', '9214', false], ['Kauswagan', '9205', false],
            ['Kolambugan', '9212', false], ['Lala', '9211', false],
            ['Linamon', '9204', false], ['Magsaysay', '9213', false],
            ['Maigo', '9203', false], ['Matungao', '9205', false],
            ['Munai', '9215', false], ['Nunungan', '9214', false],
            ['Pantao Ragat', '9215', false], ['Pantar', '9215', false],
            ['Poona Piagapo', '9212', false], ['Salvador', '9208', false],
            ['Sapad', '9216', false], ['Sultan Naga Dimaporo', '9211', false],
            ['Tagoloan', '9206', false], ['Tangcal', '9215', false],
            ['Tubod', '9209', false],
        ]);

        // Misamis Occidental
        $add($pid('104200000'), [
            ['Aloran', '7214', false], ['Baliangao', '7217', false],
            ['Bonifacio', '7215', false], ['Calamba', '7207', false],
            ['Clarin', '7213', false], ['Concepcion', '7208', false],
            ['City of Don Victor Limbago', '7204', false],
            ['Jimenez', '7204', false], ['Lopez Jaena', '7207', false],
            ['Oroquieta City', '7207', true], ['Ozamiz City', '7200', true],
            ['Panaon', '7216', false], ['Plaridel', '7212', false],
            ['Sapang Dalaga', '7211', false], ['Sinacaban', '7214', false],
            ['Tangub City', '7214', true], ['Tudela', '7214', false],
        ]);

        // Misamis Oriental
        $add($pid('104300000'), [
            ['Alubijid', '9019', false], ['Balingasag', '9005', false],
            ['Balingoan', '9007', false], ['Binuangan', '9007', false],
            ['Cagayan de Oro City', '9000', true], ['Claveria', '9004', false],
            ['El Salvador City', '9017', true], ['Gitagum', '9020', false],
            ['Initao', '9007', false], ['Jasaan', '9003', false],
            ['Kinoguitan', '9008', false], ['Lagonglong', '9009', false],
            ['Laguindingan', '9016', false], ['Libertad', '9011', false],
            ['Lugait', '9010', false], ['Magsaysay', '9012', false],
            ['Manticao', '9017', false], ['Medina', '9006', false],
            ['Naawan', '9003', false], ['Opol', '9016', false],
            ['Salay', '9004', false], ['Sugbongcogon', '9008', false],
            ['Tagoloan', '9001', false], ['Talisayan', '9010', false],
            ['Villanueva', '9003', false],
        ]);

        // ─────────────────────────────────────────────────────────────
        // REGION XI — Davao Region
        // ─────────────────────────────────────────────────────────────

        // Davao de Oro (formerly Compostela Valley)
        $add($pid('112300000'), [
            ['Compostela', '8803', false], ['Laak (San Vicente)', '8802', false],
            ['Mabini (Doña Alicia)', '8807', false], ['Maco', '8806', false],
            ['Maragusan (San Mariano)', '8808', false], ['Mawab', '8805', false],
            ['Monkayo', '8802', false], ['Montevista', '8801', false],
            ['Nabunturan', '8800', false], ['New Bataan', '8804', false],
            ['Pantukan', '8808', false],
        ]);

        // Davao del Norte
        $add($pid('112400000'), [
            ['Asuncion (Saug)', '8105', false], ['Braulio E. Dujali', '8105', false],
            ['Carmen', '8107', false], ['City of Panabo', '8105', true],
            ['Island Garden City of Samal', '8119', true],
            ['Kapalong', '8108', false], ['New Corella', '8102', false],
            ['City of Tagum', '8100', true], ['Talaingod', '8109', false],
            ['San Isidro', '8110', false], ['Santo Tomas', '8112', false],
        ]);

        // Davao del Sur
        $add($pid('112500000'), [
            ['Bansalan', '8006', false], ['Davao City', '8000', true],
            ['Digos City', '8002', true], ['Hagonoy', '8006', false],
            ['Kiblawan', '8009', false], ['Magsaysay', '8007', false],
            ['Malalag', '8011', false], ['Matanao', '8004', false],
            ['Padada', '8010', false], ['Santa Cruz', '8003', false],
            ['Sulop', '8008', false],
        ]);

        // Davao Occidental
        $add($pid('118200000'), [
            ['Don Marcelino', '8011', false], ['Jose Abad Santos', '8014', false],
            ['Malita', '8012', false], ['Santa Maria', '8013', false],
            ['Sarangani', '8015', false],
        ]);

        // Davao Oriental
        $add($pid('118600000'), [
            ['Baganga', '8217', false], ['Banaybanay', '8211', false],
            ['Boston', '8215', false], ['Caraga', '8216', false],
            ['City of Mati', '8200', true], ['Cateel', '8215', false],
            ['Governor Generoso', '8209', false], ['Lupon', '8207', false],
            ['Manay', '8214', false], ['San Isidro', '8209', false],
            ['Tarragona', '8210', false],
        ]);

        // ─────────────────────────────────────────────────────────────
        // REGION XII — SOCCSKSARGEN
        // ─────────────────────────────────────────────────────────────

        // Cotabato (North Cotabato)
        $add($pid('124700000'), [
            ['Alamada', '9402', false], ['Aleosan', '9408', false],
            ['Antipas', '9405', false], ['Arakan', '9409', false],
            ['Banisilan', '9407', false], ['Carmen', '9404', false],
            ['Kabacan', '9407', false], ['Kidapawan City', '9400', true],
            ['Libungan', '9408', false], ['Magpet', '9406', false],
            ['Makilala', '9410', false], ['Matalam', '9402', false],
            ['Midsayap', '9410', false], ['M\'lang', '9402', false],
            ['Pigkawayan', '9404', false], ['Pikit', '9405', false],
            ['President Roxas', '9404', false],
            ['Tulunan', '9403', false],
        ]);

        // Sarangani
        $add($pid('126300000'), [
            ['Alabel', '9501', false], ['Glan', '9508', false],
            ['Kiamba', '9507', false], ['Maasim', '9506', false],
            ['Maitum', '9507', false], ['Malapatan', '9505', false],
            ['Malungon', '9503', false],
        ]);

        // South Cotabato
        $add($pid('126500000'), [
            ['Banga', '9514', false], ['City of Koronadal', '9506', true],
            ['Lake Sebu', '9517', false], ['Norala', '9512', false],
            ['Polomolok', '9504', false], ['Santo Niño', '9514', false],
            ['Surallah', '9512', false], ['T\'Boli', '9519', false],
            ['Tampakan', '9503', false], ['Tantangan', '9512', false],
            ['Tupi', '9505', false],
        ]);

        // Sultan Kudarat
        $add($pid('126700000'), [
            ['Bagumbayan', '9815', false], ['Columbio', '9816', false],
            ['Esperanza', '9806', false], ['Isulan', '9800', false],
            ['Kalamansig', '9814', false],
            ['Lebak', '9804', false], ['Lutayan', '9808', false],
            ['Lambayong (Mariano Marcos)', '9805', false],
            ['Palimbang', '9813', false], ['President Quirino', '9803', false],
            ['City of Tacurong', '9800', true],
            ['Sen. Ninoy Aquino', '9812', false],
        ]);

        // ─────────────────────────────────────────────────────────────
        // REGION XIII — Caraga
        // ─────────────────────────────────────────────────────────────

        // Agusan del Norte
        $add($pid('160200000'), [
            ['Buenavista', '8505', false], ['Butuan City', '8600', true],
            ['Cabadbaran City', '8605', true], ['Carmen', '8506', false],
            ['Jabonga', '8508', false], ['Kitcharao', '8509', false],
            ['Las Nieves', '8507', false], ['Magallanes', '8504', false],
            ['Nasipit', '8602', false], ['Remedios T. Romualdez', '8511', false],
            ['Santiago', '8510', false], ['Tubay', '8503', false],
        ]);

        // Agusan del Sur
        $add($pid('160300000'), [
            ['Bayugan City', '8502', true], ['Bunawan', '8506', false],
            ['Esperanza', '8509', false], ['La Paz', '8501', false],
            ['Loreto', '8504', false], ['Prosperidad', '8800', false],
            ['Rosario', '8502', false], ['San Francisco', '8501', false],
            ['San Luis', '8507', false], ['Santa Josefa', '8509', false],
            ['Sibagat', '8510', false], ['Talacogon', '8508', false],
            ['Trento', '8507', false], ['Veruela', '8503', false],
        ]);

        // Dinagat Islands
        $add($pid('166800000'), [
            ['Basilisa (Rizal)', '8403', false], ['Cagdianao', '8405', false],
            ['Dinagat', '8401', false], ['Libjo (Albor)', '8406', false],
            ['Loreto', '8402', false], ['San Jose (Capital)', '8400', false],
            ['Tubajon', '8404', false],
        ]);

        // Surigao del Norte
        $add($pid('166500000'), [
            ['Alegria', '8418', false], ['Bacuag', '8407', false],
            ['Burgos', '8420', false], ['Claver', '8409', false],
            ['Dapa', '8418', false], ['Del Carmen', '8419', false],
            ['General Luna', '8419', false], ['Gigaquit', '8409', false],
            ['Mainit', '8408', false], ['Malimono', '8408', false],
            ['Pilar', '8421', false], ['Placer', '8411', false],
            ['San Benito', '8415', false], ['San Francisco (Anao-aon)', '8416', false],
            ['San Isidro', '8415', false], ['Santa Monica (Sapao)', '8420', false],
            ['Sison', '8416', false], ['Socorro', '8419', false],
            ['Surigao City', '8400', true], ['Tagana-an', '8407', false],
            ['Tubod', '8410', false],
        ]);

        // Surigao del Sur
        $add($pid('166600000'), [
            ['Barobo', '8309', false], ['Bayabas', '8308', false],
            ['City of Bislig', '8311', true], ['Cagwait', '8310', false],
            ['Cantilan', '8317', false], ['Carmen', '8316', false],
            ['Carrascal', '8316', false], ['Cortes', '8310', false],
            ['Hinatuan', '8311', false], ['Lanuza', '8315', false],
            ['Lianga', '8307', false], ['Lingig', '8312', false],
            ['Madrid', '8319', false], ['Marihatag', '8307', false],
            ['San Agustin', '8306', false], ['San Miguel', '8316', false],
            ['Tagbina', '8309', false], ['Tago', '8306', false],
            ['City of Tandag', '8300', true],
        ]);

        // ─────────────────────────────────────────────────────────────
        // CAR — Cordillera Administrative Region
        // ─────────────────────────────────────────────────────────────

        // Abra
        $add($pid('140900000'), [
            ['Bangued', '2800', false], ['Boliney', '2814', false],
            ['Bucay', '2803', false], ['Bucloc', '2817', false],
            ['Daguioman', '2815', false], ['Danglas', '2802', false],
            ['Dolores', '2806', false], ['La Paz', '2805', false],
            ['Lacub', '2815', false], ['Lagangilang', '2801', false],
            ['Lagayan', '2808', false], ['Langiden', '2808', false],
            ['Licuan-Baay (Licuan)', '2813', false], ['Luba', '2804', false],
            ['Malibcong', '2816', false], ['Manabo', '2807', false],
            ['Peñarrubia', '2802', false], ['Pidigan', '2800', false],
            ['Pilar', '2812', false], ['Sallapadan', '2809', false],
            ['San Isidro', '2810', false], ['San Juan', '2811', false],
            ['San Quintin', '2808', false], ['Tayum', '2801', false],
            ['Tineg', '2816', false], ['Tubo', '2814', false],
            ['Villaviciosa', '2808', false],
        ]);

        // Apayao
        $add($pid('141100000'), [
            ['Calanasan (Bayag)', '3814', false], ['Conner', '3806', false],
            ['Flora', '3809', false], ['Kabugao', '3800', false],
            ['Luna', '3810', false], ['Pudtol', '3812', false],
            ['Santa Marcela', '3813', false],
        ]);

        // Benguet
        $add($pid('141400000'), [
            ['Atok', '2612', false], ['City of Baguio', '2600', true],
            ['Bakun', '2619', false], ['Bokod', '2605', false],
            ['Buguias', '2607', false], ['Itogon', '2604', false],
            ['Kabayan', '2606', false], ['Kapangan', '2613', false],
            ['Kibungan', '2618', false], ['La Trinidad', '2601', false],
            ['Mankayan', '2608', false], ['Sablan', '2609', false],
            ['Tuba', '2603', false], ['Tublay', '2610', false],
        ]);

        // Ifugao
        $add($pid('142700000'), [
            ['Aguinaldo', '3606', false], ['Alfonso Lista (Potia)', '3614', false],
            ['Asipulo', '3612', false], ['Banaue', '3601', false],
            ['Hingyon', '3607', false], ['Hungduan', '3609', false],
            ['Kiangan', '3604', false], ['Lagawe', '3600', false],
            ['Lamut', '3602', false], ['Mayoyao', '3608', false],
            ['Tinoc', '3605', false],
        ]);

        // Kalinga
        $add($pid('143200000'), [
            ['Balbalan', '3703', false], ['City of Tabuk', '3800', true],
            ['Lubuagan', '3705', false], ['Pasil', '3706', false],
            ['Pinukpuk', '3707', false], ['Rizal (Liwan)', '3702', false],
            ['Tanudan', '3706', false], ['Tinglayan', '3704', false],
        ]);

        // Mountain Province
        $add($pid('144400000'), [
            ['Barlig', '2617', false], ['Bauko', '2616', false],
            ['Besao', '2614', false], ['Bontoc', '2616', false],
            ['Natonin', '2617', false], ['Paracelis', '2617', false],
            ['Sabangan', '2619', false], ['Sadanga', '2615', false],
            ['Sagada', '2619', false], ['Tadian', '2619', false],
        ]);

        // ─────────────────────────────────────────────────────────────
        // BARMM — Bangsamoro Autonomous Region in Muslim Mindanao
        // ─────────────────────────────────────────────────────────────

        // Basilan
        $add($pid('150700000'), [
            ['Akbar', '7302', false], ['Al-Barka', '7303', false],
            ['Hadji Mohammad Ajul', '7309', false],
            ['Hadji Muhtamad', '7303', false], ['Isabela City', '7300', true],
            ['Lamitan City', '7302', true], ['Lantawan', '7307', false],
            ['Maluso', '7308', false], ['Sumisip', '7305', false],
            ['Tabuan-Lasa', '7308', false], ['Tipo-Tipo', '7304', false],
            ['Tuburan', '7301', false], ['Ungkaya Pukan', '7306', false],
        ]);

        // Lanao del Sur
        $add($pid('153600000'), [
            ['Bacolod-Kalawi (Bacolod Grande)', '9307', false],
            ['Balabagan', '9306', false], ['Balindong (Watu)', '9309', false],
            ['Bayang', '9314', false], ['Binidayan', '9311', false],
            ['Buadiposo-Buntong', '9314', false], ['Bubong', '9313', false],
            ['Bumbaran', '9307', false], ['Butig', '9324', false],
            ['Calanogas', '9317', false], ['Ditsaan-Ramain', '9316', false],
            ['Ganassi', '9316', false], ['Kapai', '9314', false],
            ['Kapatagan', '9319', false], ['Lumba-Bayabao (Maguing)', '9322', false],
            ['Lumbaca-Unayan', '9315', false], ['Lumbatan', '9323', false],
            ['Lumbayanague', '9308', false], ['Madalum', '9309', false],
            ['Madamba', '9312', false], ['Marantao', '9302', false],
            ['City of Marawi', '9700', true], ['Masiu', '9310', false],
            ['Mulondo', '9324', false], ['Pagayawan (Tatarikan)', '9320', false],
            ['Piagapo', '9304', false], ['Picong (Sultan Gumander)', '9321', false],
            ['Poona Bayabao (Gata)', '9321', false],
            ['Pualas', '9308', false], ['Saguiaran', '9302', false],
            ['Sultan Dumalondong', '9325', false],
            ['Tagoloan II', '9310', false], ['Tamparan', '9312', false],
            ['Taraka', '9305', false], ['Tubaran', '9318', false],
            ['Tugaya', '9313', false], ['Wao', '9320', false],
        ]);

        // Maguindanao del Norte
        $add($pid('153800000'), [
            ['Barira', '9607', false], ['Buldon', '9602', false],
            ['Datu Blah T. Sinsuat', '9611', false],
            ['Datu Odin Sinsuat (Dinaig)', '9612', false],
            ['Kabuntalan (Tumbao)', '9606', false], ['Matanog', '9614', false],
            ['Northern Kabuntalan', '9605', false],
            ['Parang', '9608', false], ['Sultan Kudarat (Nuling)', '9604', false],
            ['Sultan Mastura', '9609', false], ['Upi', '9605', false],
        ]);

        // Maguindanao del Sur
        $add($pid('153900000'), [
            ['Ampatuan', '9605', false], ['Buluan', '9603', false],
            ['City of Cotabato', '9600', true], ['Datu Abdullah Sangki', '9610', false],
            ['Datu Anggal Midtimbang', '9603', false],
            ['Datu Hoffer Ampatuan', '9608', false],
            ['Datu Montawal (Pagagawan)', '9608', false],
            ['Datu Piang', '9615', false], ['Datu Salibo', '9607', false],
            ['Datu Saudi-Ampatuan', '9606', false],
            ['Datu Unsay', '9606', false], ['General Salipada K. Pendatun', '9601', false],
            ['Guindulungan', '9603', false], ['Kabuntulan', '9605', false],
            ['Mamasapano', '9607', false], ['Mangudadatu', '9605', false],
            ['Pagalungan', '9603', false], ['Paglat', '9606', false],
            ['Pandag', '9605', false], ['Rajah Buayan', '9612', false],
            ['Shariff Aguak (Maganoy)', '9605', false],
            ['Shariff Saydona Mustapha', '9613', false],
            ['South Upi', '9610', false], ['Sultan sa Barongis', '9603', false],
            ['Talayan', '9603', false], ['Talitay', '9608', false],
        ]);

        // Sulu
        $add($pid('156600000'), [
            ['Hadji Panglima Tahil (Marunggas)', '7404', false],
            ['Indanan', '7404', false], ['Jolo', '7400', false],
            ['Kalingalan Caluang', '7413', false], ['Lugus', '7415', false],
            ['Luuk', '7413', false], ['Maimbung', '7405', false],
            ['Old Panamao', '7408', false], ['Omar', '7413', false],
            ['Pandami', '7412', false], ['Panglima Estino', '7411', false],
            ['Pangutaran', '7404', false], ['Parang', '7407', false],
            ['Pata', '7416', false], ['Patikul', '7403', false],
            ['Siasi', '7409', false], ['Talipao', '7402', false],
            ['Tapul', '7410', false], ['Tongkil', '7414', false],
        ]);

        // Tawi-Tawi
        $add($pid('157000000'), [
            ['Bongao', '7500', false], ['Languyan', '7512', false],
            ['Mapun (Cagayan de Tawi-Tawi)', '7507', false],
            ['Panglima Sugala (Balimbing)', '7505', false],
            ['Sapa-Sapa', '7510', false], ['Sibutu', '7509', false],
            ['Simunul', '7504', false], ['Sitangkai', '7508', false],
            ['South Ubian', '7511', false], ['Tandubas', '7506', false],
            ['Turtle Islands', '7513', false],
        ]);

        // ─────────────────────────────────────────────────────────────
        // Batch insert
        // ─────────────────────────────────────────────────────────────
        $total = count($cities);
        foreach (array_chunk($cities, 100) as $chunk) {
            DB::table('ph_cities')->insert(array_map(fn($c) => array_merge($c, [
                'created_at' => now(), 'updated_at' => now(),
            ]), $chunk));
        }

        $this->command->info("Cities/municipalities seeded: {$total}");
    }
}