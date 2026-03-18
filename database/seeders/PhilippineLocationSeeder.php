<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

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

        $this->command->info('Philippine provinces and cities/municipalities seeded.');
        $this->command->info('Run PhilippineBarangaySeeder separately for barangays (large dataset).');
    }

    private function seedProvinces(): void
    {
        $provinces = [
            // NCR - National Capital Region
            ['code' => '133900000', 'name' => 'Metro Manila', 'region' => 'NCR'],

            // Region I - Ilocos Region
            ['code' => '012800000', 'name' => 'Ilocos Norte', 'region' => 'Region I'],
            ['code' => '012900000', 'name' => 'Ilocos Sur', 'region' => 'Region I'],
            ['code' => '013300000', 'name' => 'La Union', 'region' => 'Region I'],
            ['code' => '015500000', 'name' => 'Pangasinan', 'region' => 'Region I'],

            // Region II - Cagayan Valley
            ['code' => '021500000', 'name' => 'Batanes', 'region' => 'Region II'],
            ['code' => '021900000', 'name' => 'Cagayan', 'region' => 'Region II'],
            ['code' => '023100000', 'name' => 'Isabela', 'region' => 'Region II'],
            ['code' => '025000000', 'name' => 'Nueva Vizcaya', 'region' => 'Region II'],
            ['code' => '025700000', 'name' => 'Quirino', 'region' => 'Region II'],

            // Region III - Central Luzon
            ['code' => '030800000', 'name' => 'Bataan', 'region' => 'Region III'],
            ['code' => '031400000', 'name' => 'Bulacan', 'region' => 'Region III'],
            ['code' => '034900000', 'name' => 'Nueva Ecija', 'region' => 'Region III'],
            ['code' => '035400000', 'name' => 'Pampanga', 'region' => 'Region III'],
            ['code' => '036900000', 'name' => 'Tarlac', 'region' => 'Region III'],
            ['code' => '037100000', 'name' => 'Zambales', 'region' => 'Region III'],
            ['code' => '037700000', 'name' => 'Aurora', 'region' => 'Region III'],

            // Region IV-A - CALABARZON
            ['code' => '041000000', 'name' => 'Batangas', 'region' => 'Region IV-A'],
            ['code' => '042100000', 'name' => 'Cavite', 'region' => 'Region IV-A'],
            ['code' => '043400000', 'name' => 'Laguna', 'region' => 'Region IV-A'],
            ['code' => '045600000', 'name' => 'Quezon', 'region' => 'Region IV-A'],
            ['code' => '045800000', 'name' => 'Rizal', 'region' => 'Region IV-A'],

            // Region IV-B - MIMAROPA
            ['code' => '174000000', 'name' => 'Marinduque', 'region' => 'Region IV-B'],
            ['code' => '175100000', 'name' => 'Occidental Mindoro', 'region' => 'Region IV-B'],
            ['code' => '175200000', 'name' => 'Oriental Mindoro', 'region' => 'Region IV-B'],
            ['code' => '175300000', 'name' => 'Palawan', 'region' => 'Region IV-B'],
            ['code' => '175900000', 'name' => 'Romblon', 'region' => 'Region IV-B'],

            // Region V - Bicol Region
            ['code' => '050500000', 'name' => 'Albay', 'region' => 'Region V'],
            ['code' => '051600000', 'name' => 'Camarines Norte', 'region' => 'Region V'],
            ['code' => '051700000', 'name' => 'Camarines Sur', 'region' => 'Region V'],
            ['code' => '051800000', 'name' => 'Catanduanes', 'region' => 'Region V'],
            ['code' => '054100000', 'name' => 'Masbate', 'region' => 'Region V'],
            ['code' => '056200000', 'name' => 'Sorsogon', 'region' => 'Region V'],

            // Region VI - Western Visayas
            ['code' => '060400000', 'name' => 'Aklan', 'region' => 'Region VI'],
            ['code' => '060600000', 'name' => 'Antique', 'region' => 'Region VI'],
            ['code' => '061900000', 'name' => 'Capiz', 'region' => 'Region VI'],
            ['code' => '063000000', 'name' => 'Iloilo', 'region' => 'Region VI'],
            ['code' => '064500000', 'name' => 'Negros Occidental', 'region' => 'Region VI'],
            ['code' => '079800000', 'name' => 'Guimaras', 'region' => 'Region VI'],

            // Region VII - Central Visayas
            ['code' => '071200000', 'name' => 'Bohol', 'region' => 'Region VII'],
            ['code' => '072200000', 'name' => 'Cebu', 'region' => 'Region VII'],
            ['code' => '074600000', 'name' => 'Negros Oriental', 'region' => 'Region VII'],
            ['code' => '076100000', 'name' => 'Siquijor', 'region' => 'Region VII'],

            // Region VIII - Eastern Visayas
            ['code' => '082600000', 'name' => 'Eastern Samar', 'region' => 'Region VIII'],
            ['code' => '083200000', 'name' => 'Leyte', 'region' => 'Region VIII'],
            ['code' => '084300000', 'name' => 'Northern Samar', 'region' => 'Region VIII'],
            ['code' => '086000000', 'name' => 'Samar (Western Samar)', 'region' => 'Region VIII'],
            ['code' => '086400000', 'name' => 'Southern Leyte', 'region' => 'Region VIII'],
            ['code' => '087800000', 'name' => 'Biliran', 'region' => 'Region VIII'],

            // Region IX - Zamboanga Peninsula
            ['code' => '097200000', 'name' => 'Zamboanga del Norte', 'region' => 'Region IX'],
            ['code' => '097300000', 'name' => 'Zamboanga del Sur', 'region' => 'Region IX'],
            ['code' => '098300000', 'name' => 'Zamboanga Sibugay', 'region' => 'Region IX'],

            // Region X - Northern Mindanao
            ['code' => '101300000', 'name' => 'Bukidnon', 'region' => 'Region X'],
            ['code' => '101800000', 'name' => 'Camiguin', 'region' => 'Region X'],
            ['code' => '103500000', 'name' => 'Lanao del Norte', 'region' => 'Region X'],
            ['code' => '104200000', 'name' => 'Misamis Occidental', 'region' => 'Region X'],
            ['code' => '104300000', 'name' => 'Misamis Oriental', 'region' => 'Region X'],

            // Region XI - Davao Region
            ['code' => '112300000', 'name' => 'Davao de Oro', 'region' => 'Region XI'],
            ['code' => '112400000', 'name' => 'Davao del Norte', 'region' => 'Region XI'],
            ['code' => '112500000', 'name' => 'Davao del Sur', 'region' => 'Region XI'],
            ['code' => '118200000', 'name' => 'Davao Occidental', 'region' => 'Region XI'],
            ['code' => '118600000', 'name' => 'Davao Oriental', 'region' => 'Region XI'],

            // Region XII - SOCCSKSARGEN
            ['code' => '124700000', 'name' => 'Cotabato (North Cotabato)', 'region' => 'Region XII'],
            ['code' => '126300000', 'name' => 'Sarangani', 'region' => 'Region XII'],
            ['code' => '126500000', 'name' => 'South Cotabato', 'region' => 'Region XII'],
            ['code' => '126700000', 'name' => 'Sultan Kudarat', 'region' => 'Region XII'],

            // Region XIII - Caraga
            ['code' => '160200000', 'name' => 'Agusan del Norte', 'region' => 'Region XIII'],
            ['code' => '160300000', 'name' => 'Agusan del Sur', 'region' => 'Region XIII'],
            ['code' => '166800000', 'name' => 'Dinagat Islands', 'region' => 'Region XIII'],
            ['code' => '166500000', 'name' => 'Surigao del Norte', 'region' => 'Region XIII'],
            ['code' => '166600000', 'name' => 'Surigao del Sur', 'region' => 'Region XIII'],

            // CAR - Cordillera Administrative Region
            ['code' => '140900000', 'name' => 'Abra', 'region' => 'CAR'],
            ['code' => '141100000', 'name' => 'Apayao', 'region' => 'CAR'],
            ['code' => '141400000', 'name' => 'Benguet', 'region' => 'CAR'],
            ['code' => '142700000', 'name' => 'Ifugao', 'region' => 'CAR'],
            ['code' => '143200000', 'name' => 'Kalinga', 'region' => 'CAR'],
            ['code' => '144400000', 'name' => 'Mountain Province', 'region' => 'CAR'],

            // BARMM - Bangsamoro Autonomous Region in Muslim Mindanao
            ['code' => '150700000', 'name' => 'Basilan', 'region' => 'BARMM'],
            ['code' => '153600000', 'name' => 'Lanao del Sur', 'region' => 'BARMM'],
            ['code' => '153800000', 'name' => 'Maguindanao del Norte', 'region' => 'BARMM'],
            ['code' => '153900000', 'name' => 'Maguindanao del Sur', 'region' => 'BARMM'],
            ['code' => '156600000', 'name' => 'Sulu', 'region' => 'BARMM'],
            ['code' => '157000000', 'name' => 'Tawi-Tawi', 'region' => 'BARMM'],
        ];

        DB::table('ph_provinces')->insert(array_map(fn($p) => array_merge($p, [
            'created_at' => now(), 'updated_at' => now(),
        ]), $provinces));
    }

    private function seedCities(): void
    {
        // Helper to get province id by code
        $pid = fn(string $code) => DB::table('ph_provinces')->where('code', $code)->value('id');

        $cities = [];

        // ── NCR Metro Manila ─────────────────────────────────────────
        $ncr = $pid('133900000');
        $ncrCities = [
            ['Caloocan', '1400', true],
            ['Las Piñas', '1740', true],
            ['Makati', '1200', true],
            ['Malabon', '1470', true],
            ['Mandaluyong', '1550', true],
            ['Manila', '1000', true],
            ['Marikina', '1800', true],
            ['Muntinlupa', '1770', true],
            ['Navotas', '1485', true],
            ['Parañaque', '1700', true],
            ['Pasay', '1300', true],
            ['Pasig', '1600', true],
            ['Pateros', '1620', false],
            ['Quezon City', '1100', true],
            ['San Juan', '1500', true],
            ['Taguig', '1630', true],
            ['Valenzuela', '1440', true],
        ];
        foreach ($ncrCities as [$name, $zip, $isCity]) {
            $cities[] = ['province_id' => $ncr, 'name' => $name, 'zip_code' => $zip, 'is_city' => $isCity, 'code' => md5($ncr.$name)];
        }

        // ── Ilocos Norte ─────────────────────────────────────────────
        $p = $pid('012800000');
        foreach ([
            ['Adams', '2919', false], ['Bacarra', '2916', false], ['Badoc', '2904', false],
            ['Bangui', '2920', false], ['Banna (Espiritu)', '2908', false],
            ['City of Batac', '2906', true], ['Burgos', '2922', false],
            ['Carasi', '2911', false], ['Currimao', '2903', false], ['Dingras', '2913', false],
            ['Dumalneg', '2921', false], ['City of Laoag', '2900', true],
            ['Marcos', '2910', false], ['Nueva Era', '2914', false], ['Pagudpud', '2923', false],
            ['Paoay', '2902', false], ['Pasuquin', '2917', false], ['Piddig', '2915', false],
            ['Pinili', '2907', false], ['San Nicolas', '2901', false], ['Sarrat', '2912', false],
            ['Solsona', '2909', false], ['Vintar', '2918', false],
        ] as [$name, $zip, $isCity]) {
            $cities[] = ['province_id' => $p, 'name' => $name, 'zip_code' => $zip, 'is_city' => $isCity, 'code' => md5($p.$name)];
        }

        // ── Laguna (Region IV-A) — important for DA RFO 5 area context ─
        $p = $pid('043400000');
        foreach ([
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
        ] as [$name, $zip, $isCity]) {
            $cities[] = ['province_id' => $p, 'name' => $name, 'zip_code' => $zip, 'is_city' => $isCity, 'code' => md5($p.$name)];
        }

        // ── Camarines Sur (Region V - Bicol) ─────────────────────────
        $p = $pid('051700000');
        foreach ([
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
        ] as [$name, $zip, $isCity]) {
            $cities[] = ['province_id' => $p, 'name' => $name, 'zip_code' => $zip, 'is_city' => $isCity, 'code' => md5($p.$name)];
        }

        // ── Albay (Region V) ─────────────────────────────────────────
        $p = $pid('050500000');
        foreach ([
            ['Bacacay', '4509', false], ['Camalig', '4502', false],
            ['Daraga', '4501', false], ['Guinobatan', '4503', false],
            ['Jovellar', '4516', false], ['Legazpi City', '4500', true],
            ['Libon', '4507', false], ['Ligao City', '4504', true],
            ['Malilipot', '4511', false], ['Malinao', '4512', false],
            ['Manito', '4515', false], ['Oas', '4505', false],
            ['Pio Duran', '4513', false], ['Polangui', '4506', false],
            ['Rapu-Rapu', '4510', false], ['Santo Domingo', '4508', false],
            ['Tabaco City', '4511', true], ['Tiwi', '4514', false],
        ] as [$name, $zip, $isCity]) {
            $cities[] = ['province_id' => $p, 'name' => $name, 'zip_code' => $zip, 'is_city' => $isCity, 'code' => md5($p.$name)];
        }

        // ── Sorsogon (Region V) ──────────────────────────────────────
        $p = $pid('056200000');
        foreach ([
            ['Barcelona', '4707', false], ['Bulan', '4706', false],
            ['Bulusan', '4713', false], ['Casiguran', '4705', false],
            ['Castilla', '4706', false], ['Donsol', '4715', false],
            ['Gubat', '4710', false], ['Irosin', '4712', false],
            ['Juban', '4703', false], ['Magallanes', '4714', false],
            ['Matnog', '4715', false], ['Pilar', '4704', false],
            ['Prieto Diaz', '4709', false], ['Santa Magdalena', '4711', false],
            ['Sorsogon City', '4700', true],
        ] as [$name, $zip, $isCity]) {
            $cities[] = ['province_id' => $p, 'name' => $name, 'zip_code' => $zip, 'is_city' => $isCity, 'code' => md5($p.$name)];
        }

        // ── Masbate (Region V) ───────────────────────────────────────
        $p = $pid('054100000');
        foreach ([
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
        ] as [$name, $zip, $isCity]) {
            $cities[] = ['province_id' => $p, 'name' => $name, 'zip_code' => $zip, 'is_city' => $isCity, 'code' => md5($p.$name)];
        }

        // ── Camarines Norte (Region V) ───────────────────────────────
        $p = $pid('051600000');
        foreach ([
            ['Basud', '4608', false], ['Capalonga', '4607', false],
            ['Daet', '4600', false], ['San Lorenzo Ruiz', '4601', false],
            ['Jose Panganiban', '4606', false], ['Labo', '4604', false],
            ['Mercedes', '4605', false], ['Paracale', '4609', false],
            ['San Vicente', '4602', false], ['Santa Elena', '4610', false],
            ['Talisay', '4611', false], ['Tinambac', '4603', false],
        ] as [$name, $zip, $isCity]) {
            $cities[] = ['province_id' => $p, 'name' => $name, 'zip_code' => $zip, 'is_city' => $isCity, 'code' => md5($p.$name)];
        }

        // ── Catanduanes (Region V) ───────────────────────────────────
        $p = $pid('051800000');
        foreach ([
            ['Bagamanoc', '4808', false], ['Baras', '4805', false],
            ['Bato', '4806', false], ['Caramoran', '4807', false],
            ['Gigmoto', '4813', false], ['Pandan', '4811', false],
            ['Panganiban', '4809', false], ['San Andres', '4810', false],
            ['San Miguel', '4812', false], ['Viga', '4814', false],
            ['Virac', '4800', false],
        ] as [$name, $zip, $isCity]) {
            $cities[] = ['province_id' => $p, 'name' => $name, 'zip_code' => $zip, 'is_city' => $isCity, 'code' => md5($p.$name)];
        }

        // ── Cebu (Region VII) ─────────────────────────────────────────
        $p = $pid('072200000');
        foreach ([
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
        ] as [$name, $zip, $isCity]) {
            $cities[] = ['province_id' => $p, 'name' => $name, 'zip_code' => $zip, 'is_city' => $isCity, 'code' => md5($p.$name)];
        }

        // ── Davao del Sur / Davao City ────────────────────────────────
        $p = $pid('112500000');
        foreach ([
            ['Bansalan', '8006', false], ['Davao City', '8000', true],
            ['Digos City', '8002', true], ['Hagonoy', '8006', false],
            ['Kiblawan', '8009', false], ['Magsaysay', '8007', false],
            ['Malalag', '8011', false], ['Matanao', '8004', false],
            ['Padada', '8010', false], ['Santa Cruz', '8003', false],
            ['Sulop', '8008', false],
        ] as [$name, $zip, $isCity]) {
            $cities[] = ['province_id' => $p, 'name' => $name, 'zip_code' => $zip, 'is_city' => $isCity, 'code' => md5($p.$name)];
        }

        // ── Batangas (Region IV-A) ─────────────────────────────────
        $p = $pid('041000000');
        foreach ([
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
        ] as [$name, $zip, $isCity]) {
            $cities[] = ['province_id' => $p, 'name' => $name, 'zip_code' => $zip, 'is_city' => $isCity, 'code' => md5($p.$name)];
        }

        // ── Quezon Province (Region IV-A) ─────────────────────────
        $p = $pid('045600000');
        foreach ([
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
            ['San Francisco', '4320', false], ['San Narciso', '4321', false],
            ['Sariaya', '4322', false], ['Tagkawayan', '4313', false],
            ['City of Tayabas', '4327', true], ['Tiaong', '4325', false],
            ['Unisan', '4305', false],
        ] as [$name, $zip, $isCity]) {
            $cities[] = ['province_id' => $p, 'name' => $name, 'zip_code' => $zip, 'is_city' => $isCity, 'code' => md5($p.$name)];
        }

        // ── Pampanga (Region III) ─────────────────────────────────
        $p = $pid('035400000');
        foreach ([
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
            ['Santo Tomas', '2020', false], ['Sasmuan', '2207', false],
        ] as [$name, $zip, $isCity]) {
            $cities[] = ['province_id' => $p, 'name' => $name, 'zip_code' => $zip, 'is_city' => $isCity, 'code' => md5($p.$name)];
        }

        // ── Benguet - CAR (includes Baguio City) ──────────────────
        $p = $pid('141400000');
        foreach ([
            ['Atok', '2612', false], ['City of Baguio', '2600', true],
            ['Bakun', '2619', false], ['Bokod', '2605', false],
            ['Buguias', '2607', false], ['Itogon', '2604', false],
            ['Kabayan', '2606', false], ['Kapangan', '2613', false],
            ['Kibungan', '2618', false], ['La Trinidad', '2601', false],
            ['Mankayan', '2608', false], ['Sablan', '2609', false],
            ['Tuba', '2603', false], ['Tublay', '2610', false],
        ] as [$name, $zip, $isCity]) {
            $cities[] = ['province_id' => $p, 'name' => $name, 'zip_code' => $zip, 'is_city' => $isCity, 'code' => md5($p.$name)];
        }

        // ── Agusan del Norte (Region XIII - Caraga) ───────────────
        $p = $pid('160200000');
        foreach ([
            ['Buenavista', '8505', false], ['Butuan City', '8600', true],
            ['Cabadbaran City', '8605', true], ['Carmen', '8506', false],
            ['Jabonga', '8508', false], ['Kitcharao', '8509', false],
            ['Las Nieves', '8507', false], ['Magallanes', '8504', false],
            ['Nasipit', '8602', false], ['Remedios T. Romualdez', '8511', false],
            ['Santiago', '8510', false], ['Tubay', '8503', false],
        ] as [$name, $zip, $isCity]) {
            $cities[] = ['province_id' => $p, 'name' => $name, 'zip_code' => $zip, 'is_city' => $isCity, 'code' => md5($p.$name)];
        }

        // Batch insert
        $chunks = array_chunk($cities, 100);
        foreach ($chunks as $chunk) {
            DB::table('ph_cities')->insert(array_map(fn($c) => array_merge($c, [
                'created_at' => now(), 'updated_at' => now(),
            ]), $chunk));
        }
    }
}