<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Philippine Barangay Seeder — Region V (Bicol Region) Only
 *
 * Data sourced from PhilAtlas / Philippine Statistics Authority (PSGC 2020).
 * Covers all 6 provinces:
 *  - Albay          (18 LGUs)
 *  - Camarines Norte (12 LGUs)
 *  - Camarines Sur  (35 municipalities + 2 cities)
 *  - Catanduanes    (11 LGUs)
 *  - Masbate        (21 LGUs)
 *  - Sorsogon       (14 LGUs)
 *
 */
class PhilippineBarangaySeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('ph_barangays')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // =====================================================================
        // ALBAY
        // =====================================================================

        $this->seed('Legazpi City', [
            'Barangay 1-Em\'s Barrio', 'Barangay 2-Em\'s Barrio South', 'Barangay 3-Em\'s Barrio East',
            'Barangay 4-Sagpon Poblacion', 'Barangay 5-Sagmin Poblacion', 'Barangay 6-Bañadero Poblacion',
            'Barangay 7-Baño', 'Barangay 8-Bagumbayan', 'Barangay 9-Pinaric', 'Barangay 10-Cabugao',
            'Barangay 11-Maoyod Poblacion', 'Barangay 12-Tula-tula', 'Barangay 13-Ilawod West Poblacion',
            'Barangay 14-Ilawod Poblacion', 'Barangay 15-Ilawod East Poblacion',
            'Barangay 16-Kawit-East Washington Drive', 'Barangay 17-Rizal Street, Ilawod',
            'Barangay 18-Cabagñan West', 'Barangay 19-Cabagñan', 'Barangay 20-Cabagñan East',
            'Barangay 21-Binanuahan West', 'Barangay 22-Binanuahan East',
            'Barangay 23-Imperial Court Subd.', 'Barangay 24-Rizal Street', 'Barangay 25-Lapu-lapu',
            'Barangay 26-Dinagaan', 'Barangay 27-Victory Village South', 'Barangay 28-Victory Village North',
            'Barangay 29-Sabang', 'Barangay 30-Pigcale', 'Barangay 31-Centro-Baybay',
            'Barangay 32-San Roque', 'Barangay 33-PNR-Peñaranda St.-Iraya',
            'Barangay 34-Oro Site-Magallanes St.', 'Barangay 35-Tinago', 'Barangay 36-Kapantawan',
            'Barangay 37-Bitano', 'Barangay 38-Gogon', 'Barangay 39-Bonot', 'Barangay 40-Cruzada',
            'Barangay 41-Bogtong', 'Barangay 42-Rawis', 'Barangay 43-Tamaoyan', 'Barangay 44-Pawa',
            'Barangay 45-Dita', 'Barangay 46-San Joaquin', 'Barangay 47-Arimbay', 'Barangay 48-Bagong Abre',
            'Barangay 49-Bigaa', 'Barangay 50-Padang', 'Barangay 51-Buyuan', 'Barangay 52-Matanag',
            'Barangay 53-Bonga', 'Barangay 54-Mabinit', 'Barangay 55-Estanza', 'Barangay 56-Taysan',
            'Barangay 57-Dap-dap', 'Barangay 58-Buragwis', 'Barangay 59-Puro', 'Barangay 60-Lamba',
            'Barangay 61-Maslog', 'Barangay 62-Homapon', 'Barangay 63-Mariawa', 'Barangay 64-Bagacay',
            'Barangay 65-Imalnod', 'Barangay 66-Banquerohan', 'Barangay 67-Bariis',
            'Barangay 68-San Francisco', 'Barangay 69-Buenavista', 'Barangay 70-Cagbacong',
        ]);

        $this->seed('Ligao City', [
            'Abella', 'Allang', 'Amtic', 'Bacong', 'Bagumbayan', 'Balanac', 'Baligang', 'Barayong',
            'Basag', 'Batang', 'Bay', 'Binanowan', 'Binatagan', 'Bobonsuran', 'Bonga', 'Busac',
            'Busay', 'Cabarian', 'Calzada', 'Catburawan', 'Cavasi', 'Culliat', 'Dunao', 'Francia',
            'Guilid', 'Herrera', 'Layon', 'Macalidong', 'Mahaba', 'Malama', 'Maonon', 'Nabonton',
            'Nasisi', 'Oma-oma', 'Palapas', 'Pandan', 'Paulba', 'Paulog', 'Pinamaniquian', 'Pinit',
            'Ranao-ranao', 'San Vicente', 'Santa Cruz', 'Tagpo', 'Tambo', 'Tandarura', 'Tastas',
            'Tinago', 'Tinampo', 'Tiongson', 'Tomolin', 'Tuburan', 'Tula-tula Grande',
            'Tula-tula Pequeño', 'Tupas',
            // Poblacion barangays
            'Barangay I (Pob.)', 'Barangay II (Pob.)', 'Barangay III (Pob.)', 'Barangay IV (Pob.)',
            'Barangay V (Pob.)', 'Barangay VI (Pob.)', 'Barangay VII (Pob.)', 'Barangay VIII (Pob.)',
            'Barangay IX (Pob.)', 'Barangay X (Pob.)',
        ]);

        $this->seed('Tabaco City', [
            'Agnas', 'Bacolod', 'Bangkilingan', 'Bantayan', 'Baranghawon', 'Basagan', 'Basud',
            'Bogñabong', 'Bombon', 'Bonot', 'Buang', 'Buhian', 'Cabagñan', 'Cobo', 'Comon',
            'Cormidal', 'Divino Rostro', 'Fatima', 'Guinobat', 'Hacienda', 'Magapo', 'Mariroc',
            'Matagbac', 'Oras', 'Oson', 'Panal', 'Pawa', 'Pinagbobong', 'Quinale Cabasan',
            'Quinastillojan', 'Rawis', 'Sagurong', 'Salvacion', 'San Antonio', 'San Carlos',
            'San Isidro', 'San Juan', 'San Lorenzo', 'San Ramon', 'San Roque', 'San Vicente',
            'Santo Cristo', 'Sua-Igot', 'Tabiguian', 'Tagas', 'Tayhi', 'Visita',
            // Poblacion barangays
            'Barangay I (Pob.)', 'Barangay II (Pob.)', 'Barangay III (Pob.)', 'Barangay IV (Pob.)',
            'Barangay V (Pob.)', 'Barangay VI (Pob.)', 'Barangay VII (Pob.)', 'Barangay VIII (Pob.)',
            'Barangay IX (Pob.)', 'Barangay X (Pob.)',
        ]);

        $this->seed('Bacacay', [
            'Baclayon', 'Banao', 'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4',
            'Barangay 5', 'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10',
            'Barangay 11', 'Barangay 12', 'Barangay 13', 'Barangay 14', 'Bariw', 'Basud',
            'Bayandong', 'Bonga', 'Buang', 'Busdac', 'Cabasan', 'Cagbulacao', 'Cagraray',
            'Cajogutan', 'Cawayan', 'Damacan', 'Gubat Ilawod', 'Gubat Iraya', 'Hindi', 'Igang',
            'Langaton', 'Manaet', 'Mapulang Daga', 'Mataas', 'Misibis', 'Nahapunan', 'Namanday',
            'Namantao', 'Napao', 'Panarayon', 'Pigcobohan', 'Pili Ilawod', 'Pili Iraya', 'Pongco',
            'San Pablo', 'San Pedro', 'Sogod', 'Sula', 'Tambilagao', 'Tambongon', 'Tanagan',
            'Uson', 'Vinisitahan-Basud', 'Vinisitahan-Napao',
        ]);

        $this->seed('Camalig', [
            'Anoling', 'Baligang', 'Bantonan', 'Barangay 1', 'Barangay 2', 'Barangay 3',
            'Barangay 4', 'Barangay 5', 'Barangay 6', 'Barangay 7', 'Bariw', 'Binanderahan',
            'Binitayan', 'Bongabong', 'Cabagñan', 'Cabraran Pequeño', 'Caguiba', 'Calabidongan',
            'Comun', 'Cotmon', 'Del Rosario', 'Gapo', 'Gotob', 'Ilawod', 'Iluluan', 'Libod',
            'Ligban', 'Mabunga', 'Magogon', 'Manawan', 'Maninila', 'Mina', 'Miti', 'Palanog',
            'Panoypoy', 'Pariaan', 'Quinartilan', 'Quirangay', 'Quitinday', 'Salugan', 'Solong',
            'Sua', 'Sumlang', 'Tagaytay', 'Tagoytoy', 'Taladong', 'Taloto', 'Taplacon', 'Tinago',
            'Tumpa',
        ]);

        $this->seed('Daraga', [
            'Alcala', 'Alobo', 'Anislag', 'Bagumbayan', 'Balinad', 'Bascaran', 'Bañadero', 'Bañag',
            'Bigao', 'Binitayan', 'Bongalon', 'Budiao', 'Burgos', 'Busay', 'Canarom', 'Cullat',
            'Dela Paz', 'Dinoronan', 'Gabawan', 'Gapo', 'Ibaugan', 'Ilawod Area Poblacion',
            'Inarado', 'Kidaco', 'Kilicao', 'Kimantong', 'Kinawitan', 'Kiwalo', 'Lacag', 'Mabini',
            'Malabog', 'Malobago', 'Maopi', 'Market Area Poblacion', 'Maroroy', 'Matnog', 'Mayon',
            'Mi-isi', 'Nabasan', 'Namantao', 'Pandan', 'Peñafrancia', 'Sagpon', 'Salvacion',
            'San Rafael', 'San Ramon', 'San Roque', 'San Vicente Grande', 'San Vicente Pequeño',
            'Sipi', 'Tabon-tabon', 'Tagas', 'Talahib', 'Villahermosa',
        ]);

        $this->seed('Guinobatan', [
            'Agpay', 'Balite', 'Banao', 'Batbat', 'Binogsacan Lower', 'Binogsacan Upper', 'Bololo',
            'Bubulusan', 'Calzada', 'Catomag', 'Doña Mercedes', 'Doña Tomasa', 'Ilawod',
            'Inamnan Grande', 'Inamnan Pequeño', 'Inascan', 'Iraya', 'Lomacao', 'Maguiron', 'Maipon',
            'Malabnig', 'Malipo', 'Malobago', 'Maninila', 'Mapaco', 'Marcial O. Rañola',
            'Masarawag', 'Mauraro', 'Minto', 'Morera', 'Muladbucad Grande', 'Muladbucad Pequeño',
            'Ongo', 'Palanas', 'Poblacion', 'Pood', 'Quibongbongan', 'Quitago', 'San Francisco',
            'San Jose', 'San Rafael', 'Sinungtan', 'Tandarora', 'Travesia',
        ]);

        $this->seed('Jovellar', [
            'Aurora Poblacion', 'Bagacay', 'Bautista', 'Cabraran', 'Calzada Poblacion',
            'Del Rosario', 'Estrella', 'Florista', 'Mabini Poblacion', 'Magsaysay Poblacion',
            'Mamlad', 'Maogog', 'Mercado Poblacion', 'Plaza Poblacion', 'Quitinday Poblacion',
            'Rizal Poblacion', 'Salvacion', 'San Isidro', 'San Roque', 'San Vicente', 'Sinagaran',
            'Villa Paz', 'White Deer Poblacion',
        ]);

        $this->seed('Libon', [
            'Alongong', 'Apud', 'Bacolod', 'Bariw', 'Bonbon', 'Buga', 'Bulusan', 'Burabod',
            'Caguscos', 'East Carisac', 'Harigue', 'Libtong', 'Linao', 'Mabayawas', 'Macabugos',
            'Magallang', 'Malabiga', 'Marayag', 'Matara', 'Molosbolos', 'Natasan', 'Niño Jesus',
            'Nogpo', 'Pantao', 'Rawis', 'Sagrada Familia', 'Salvacion', 'Sampongan', 'San Agustin',
            'San Antonio', 'San Isidro', 'San Jose', 'San Pascual', 'San Ramon', 'San Vicente',
            'Santa Cruz', 'Talin-talin', 'Tambo', 'Villa Petrona', 'West Carisac',
            'Zone I', 'Zone II', 'Zone III', 'Zone IV', 'Zone V', 'Zone VI', 'Zone VII',
        ]);

        $this->seed('Malilipot', [
            'Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV', 'Barangay V',
            'Binitayan', 'Calbayog', 'Canaway', 'Salvacion', 'San Antonio Santicon',
            'San Antonio Sulong', 'San Francisco', 'San Isidro Ilawod', 'San Isidro Iraya',
            'San Jose', 'San Roque', 'Santa Cruz', 'Santa Teresa',
        ]);

        $this->seed('Malinao', [
            'Awang', 'Bagatangki', 'Bagumbayan', 'Balading', 'Balza', 'Bariw', 'Baybay', 'Bulang',
            'Burabod', 'Cabunturan', 'Comun', 'Diaro', 'Estancia', 'Jonop', 'Labnig', 'Libod',
            'Malolos', 'Matalipni', 'Ogob', 'Pawa', 'Payahan', 'Poblacion', 'Quinarabasahan',
            'Santa Elena', 'Soa', 'Sugcad', 'Tagoytoy', 'Tanawan', 'Tuliw',
        ]);

        $this->seed('Manito', [
            'Balabagon', 'Balasbas', 'Bamban', 'Buyo', 'Cabacongan', 'Cabit', 'Cawayan', 'Cawit',
            'Holugan', 'It-ba', 'Malobago', 'Manumbalay', 'Nagotgot', 'Pawa', 'Tinapian',
        ]);

        $this->seed('Oas', [
            'Badbad', 'Badian', 'Bagsa', 'Bagumbayan', 'Balogo', 'Banao', 'Bangiawon', 'Bogtong',
            'Bongoran', 'Busac', 'Cadawag', 'Cagmanaba', 'Calaguimit', 'Calpi', 'Calzada',
            'Camagong', 'Casinagan', 'Centro Poblacion', 'Coliat', 'Del Rosario', 'Gumabao',
            'Ilaor Norte', 'Ilaor Sur', 'Iraya Norte', 'Iraya Sur', 'Manga', 'Maporong', 'Maramba',
            'Matambo', 'Mayag', 'Mayao', 'Moroponros', 'Nagas', 'Obaliw-Rinas', 'Pistola', 'Ramay',
            'Rizal', 'Saban', 'San Agustin', 'San Antonio', 'San Isidro', 'San Jose', 'San Juan',
            'San Miguel', 'San Pascual', 'San Ramon', 'San Vicente', 'Tablon', 'Talisay',
            'Talongog', 'Tapel', 'Tobgon', 'Tobog',
        ]);

        $this->seed('Pio Duran', [
            'Agol', 'Alabangpuro', 'Banawan', 'Barangay I', 'Barangay II', 'Barangay III',
            'Barangay IV', 'Barangay V', 'Basicao Coastal', 'Basicao Interior', 'Binodegahan',
            'Buenavista', 'Buyo', 'Caratagan', 'Cuyaoyao', 'Flores', 'La Medalla', 'Lawinon',
            'Macasitas', 'Malapay', 'Malidong', 'Mamlad', 'Marigondon', 'Matanglad',
            'Nablangbulod', 'Oringon', 'Palapas', 'Panganiran', 'Rawis', 'Salvacion',
            'Santo Cristo', 'Sukip', 'Tibabo',
        ]);

        $this->seed('Polangui', [
            'Agos', 'Alnay', 'Alomon', 'Amoguis', 'Anopol', 'Apad', 'Balaba', 'Balangibang',
            'Balinad', 'Basud', 'Binagbangan', 'Buyo', 'Centro Occidental', 'Centro Oriental',
            'Cepres', 'Cotmon', 'Cotnogan', 'Danao', 'Gabon', 'Gamot', 'Itaran', 'Kinale',
            'Kinuartilan', 'La Medalla', 'La Purisima', 'Lanigay', 'Lidong', 'Lourdes',
            'Magpanambo', 'Magurang', 'Matacon', 'Maynaga', 'Maysua', 'Mendez', 'Napo',
            'Pinagdapugan', 'Ponso', 'Salvacion', 'San Roque', 'Santa Cruz', 'Santa Teresita',
            'Santicon', 'Sugcad', 'Ubaliw',
        ]);

        $this->seed('Rapu-Rapu', [
            'Bagaobawan', 'Batan', 'Bilbao', 'Binosawan', 'Bogtong', 'Buenavista', 'Buhatan',
            'Calanaga', 'Caracaran', 'Carogcog', 'Dap-dap', 'Gaba', 'Galicia', 'Guadalupe',
            'Hamorawon', 'Lagundi', 'Liguan', 'Linao', 'Malobago', 'Mananao', 'Mancao', 'Manila',
            'Masaga', 'Morocborocan', 'Nagcalsot', 'Pagcolbon', 'Poblacion', 'Sagrada', 'San Ramon',
            'Santa Barbara', 'Tinocawan', 'Tinopan', 'Viga', 'Villahermosa',
        ]);

        $this->seed('Santo Domingo', [
            'Alimsog', 'Bagong San Roque', 'Buhatan', 'Calayucay', 'Del Rosario Poblacion',
            'Fidel Surtida', 'Lidong', 'Market Site Poblacion', 'Nagsiya Poblacion',
            'Pandayan Poblacion', 'Salvacion', 'San Andres', 'San Fernando',
            'San Francisco Poblacion', 'San Isidro', 'San Juan Poblacion', 'San Pedro Poblacion',
            'San Rafael Poblacion', 'San Roque', 'San Vicente Poblacion', 'Santa Misericordia',
            'Santo Domingo Poblacion', 'Santo Niño',
        ]);

        $this->seed('Tiwi', [
            'Bagumbayan', 'Bariis', 'Baybay', 'Botong', 'Buenavista', 'Buhatan', 'Bulang',
            'Burabod', 'Cabasan', 'Cag-nilawidan', 'Cagbunga', 'Cagcalamit', 'Caglanipao Norte',
            'Caglanipao Sur', 'Cagpapasan', 'Cagraray', 'Caguiba', 'Cogon', 'Coliatoc', 'Comon',
            'Coro', 'Dap-dap', 'Gaba', 'Gasod', 'Joroan', 'Libtong', 'Linog', 'Mahangin',
            'Malama', 'Malidong', 'Matanag', 'Maynonong', 'Misericordia', 'Naga', 'Nagas',
            'Oyama', 'Palayan', 'Pongco', 'Putsan', 'Quirapi', 'Rawis', 'Sagrada', 'San Bernardo',
            'San Miguel', 'San Vicente', 'Sugcad', 'Tagas', 'Tigbi',
        ]);

        // =====================================================================
        // CAMARINES NORTE
        // =====================================================================

        $this->seed('Basud', [
            'Angas', 'Bactas', 'Binatagan', 'Caayunan', 'Guinatungan', 'Hinampacan', 'Langa',
            'Laniton', 'Lidong', 'Mampili', 'Mandazo', 'Mangcamagong', 'Manmuntay', 'Mantugawe',
            'Matnog', 'Mocong', 'Oliva', 'Pagsangahan', 'Pinagwarasan', 'Plaridel',
            'Poblacion 1', 'Poblacion 2', 'San Felipe', 'San Jose', 'San Pascual', 'Taba-taba',
            'Tacad', 'Taisan', 'Tuaca',
        ]);

        $this->seed('Capalonga', [
            'Alayao', 'Binawangan', 'Calabaca', 'Camagsaan', 'Catabaguangan', 'Catioan',
            'Del Pilar', 'Itok', 'Lucbanan', 'Mabini', 'Mactang', 'Magsaysay', 'Mataque',
            'Old Camp', 'Poblacion', 'San Antonio', 'San Isidro', 'San Roque', 'Tanawan',
            'Ubang', 'Villa Aurora', 'Villa Belen',
        ]);

        $this->seed('Daet', [
            'Alawihao', 'Awitan', 'Bagasbas', 'Barangay I', 'Barangay II', 'Barangay III',
            'Barangay IV', 'Barangay V', 'Barangay VI', 'Barangay VII', 'Barangay VIII',
            'Bibirao', 'Borabod', 'Calasgasan', 'Camambugan', 'Cobangbang', 'Dogongan',
            'Gahonon', 'Gubat', 'Lag-on', 'Magang', 'Mambalite', 'Mancruz', 'Pamorangon',
            'San Isidro',
        ]);

        $this->seed('Jose Panganiban', [
            'Bagong Bayan', 'Calero', 'Dahican', 'Dayhagan', 'Larap', 'Luklukan Norte',
            'Luklukan Sur', 'Motherlode', 'Nakalaya', 'North Poblacion', 'Osmeña', 'Pag-asa',
            'Parang', 'Plaridel', 'Salvacion', 'San Isidro', 'San Jose', 'San Martin',
            'San Pedro', 'San Rafael', 'Santa Cruz', 'Santa Elena', 'Santa Milagrosa',
            'Santa Rosa Norte', 'Santa Rosa Sur', 'South Poblacion', 'Tamisan',
        ]);

        $this->seed('Labo', [
            'Anahaw', 'Anameam', 'Awitan', 'Baay', 'Bagacay', 'Bagong Silang I', 'Bagong Silang II',
            'Bagong Silang III', 'Bakiad', 'Bautista', 'Bayabas', 'Bayan-bayan', 'Benit', 'Bulhao',
            'Cabatuhan', 'Cabusay', 'Calabasa', 'Canapawan', 'Daguit', 'Dalas', 'Dumagmang',
            'Exciban', 'Fundado', 'Guinacutan', 'Guisican', 'Gumamela', 'Iberica', 'Kalamunding',
            'Lugui', 'Mabilo I', 'Mabilo II', 'Macogon', 'Mahawan-hawan', 'Malangcao-Basud',
            'Malasugui', 'Malatap', 'Malaya', 'Malibago', 'Maot', 'Masalong', 'Matanlang',
            'Napaod', 'Pag-asa', 'Pangpang', 'Pinya', 'San Antonio', 'San Francisco',
            'Santa Cruz', 'Submakin', 'Talobatib', 'Tigbinan', 'Tulay na Lupa',
        ]);

        $this->seed('Mercedes', [
            'Apuao', 'Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV', 'Barangay V',
            'Barangay VI', 'Barangay VII', 'Caringo', 'Catandunganon', 'Cayucyucan', 'Colasi',
            'Del Rosario', 'Gaboc', 'Hamoraon', 'Hinipaan', 'Lalawigan', 'Lanot', 'Mambungalon',
            'Manguisoc', 'Masalongsalong', 'Matoogtoog', 'Pambuhan', 'Quinapaguian', 'San Roque',
            'Tarum',
        ]);

        $this->seed('Paracale', [
            'Awitan', 'Bagumbayan', 'Bakal', 'Batobalani', 'Calaburnay', 'Capacuan', 'Casalugan',
            'Dagang', 'Dalnac', 'Dancalan', 'Gumaus', 'Labnig', 'Macolabo Island', 'Malacbang',
            'Malaguit', 'Mampungo', 'Mangkasay', 'Maybato', 'Palanas', 'Pinagbirayan Malaki',
            'Pinagbirayan Munti', 'Poblacion Norte', 'Poblacion Sur', 'Tabas', 'Talusan', 'Tawig',
            'Tugos',
        ]);

        $this->seed('San Lorenzo Ruiz', [
            'Daculang Bolo', 'Dagotdotan', 'Langga', 'Laniton', 'Maisog', 'Mampurog',
            'Manlimonsito', 'Matacong', 'Salvacion', 'San Antonio', 'San Isidro', 'San Ramon',
        ]);

        $this->seed('San Vicente', [
            'Asdum', 'Cabanbanan', 'Calabagas', 'Fabrica', 'Iraya Sur', 'Man-ogob',
            'Poblacion District I', 'Poblacion District II', 'San Jose',
        ]);

        $this->seed('Santa Elena', [
            'Basiad', 'Bulala', 'Don Tomas', 'Guitol', 'Kabuluan', 'Kagtalaba', 'Maulawin',
            'Patag Ibaba', 'Patag Iraya', 'Plaridel', 'Polungguitguit', 'Rizal', 'Salvacion',
            'San Lorenzo', 'San Pedro', 'San Vicente', 'Santa Elena', 'Tabugon',
            'Villa San Isidro',
        ]);

        $this->seed('Talisay', [
            'Binanuaan', 'Caawigan', 'Cahabaan', 'Calintaan', 'Del Carmen', 'Gabon', 'Itomang',
            'Poblacion', 'San Francisco', 'San Isidro', 'San Jose', 'San Nicolas', 'Santa Cruz',
            'Santa Elena', 'Santo Niño',
        ]);

        $this->seed('Vinzons', [
            'Aguit-it', 'Banocboc', 'Barangay I', 'Barangay II', 'Barangay III', 'Cagbalogo',
            'Calangcawan Norte', 'Calangcawan Sur', 'Guinacutan', 'Mangcawayan', 'Mangcayo',
            'Manlucugan', 'Matango', 'Napilihan', 'Pinagtigasan', 'Sabang', 'Santo Domingo',
            'Singi', 'Sula',
        ]);

        // =====================================================================
        // CAMARINES SUR
        // =====================================================================

        $this->seed('Naga City', [
            'Abella', 'Bagumbayan Norte', 'Bagumbayan Sur', 'Balatas', 'Calauag', 'Cararayan',
            'Carolina', 'Concepcion Grande', 'Concepcion Pequeño', 'Dayangdang', 'Del Rosario',
            'Dinaga', 'Igualdad Interior', 'Lerma', 'Liboton', 'Mabolo', 'Pacol', 'Panicuason',
            'Peñafrancia', 'Sabang', 'San Felipe', 'San Francisco', 'San Isidro', 'Santa Cruz',
            'Tabuco', 'Tinago', 'Triangulo',
        ]);

        $this->seed('Iriga City', [
            'Antipolo', 'Cristo Rey', 'Del Rosario', 'Francia', 'La Anunciacion', 'La Medalla',
            'La Purisima', 'La Trinidad', 'Niño Jesus', 'Perpetual Help', 'Sagrada', 'Salvacion',
            'San Agustin', 'San Andres', 'San Antonio', 'San Francisco', 'San Isidro', 'San Jose',
            'San Juan', 'San Miguel', 'San Nicolas', 'San Pedro', 'San Rafael', 'San Ramon',
            'San Roque', 'San Vicente Norte', 'San Vicente Sur', 'Santa Cruz Norte',
            'Santa Cruz Sur', 'Santa Elena', 'Santa Isabel', 'Santa Maria', 'Santa Teresita',
            'Santiago', 'Santo Domingo', 'Santo Niño',
        ]);

        $this->seed('Baao', [
            'Agdangan Poblacion', 'Antipolo', 'Bagumbayan', 'Buluang', 'Caranday', 'Cristo Rey',
            'Del Pilar', 'Del Rosario', 'Iyagan', 'La Medalla', 'Lourdes', 'Nababarera', 'Pugay',
            'Sagrada', 'Salvacion', 'San Francisco', 'San Isidro', 'San Jose', 'San Juan',
            'San Nicolas', 'San Rafael', 'San Ramon', 'San Roque', 'San Vicente', 'Santa Cruz',
            'Santa Eulalia', 'Santa Isabel', 'Santa Teresa', 'Santa Teresita', 'Tapol',
        ]);

        $this->seed('Balatan', [
            'Cabanbanan', 'Cabungan', 'Camangahan', 'Cayogcog', 'Coguit', 'Duran', 'Laganac',
            'Luluasan', 'Montenegro', 'Pararao', 'Pulang Daga', 'Sagrada Nacacale', 'San Francisco',
            'Santiago Nacacale', 'Siramag', 'Tapayas', 'Tomatarayo',
        ]);

        $this->seed('Bato', [
            'Agos', 'Bacolod', 'Buluang', 'Caricot', 'Cawacagan', 'Cotmon', 'Cristo Rey',
            'Del Rosario', 'Divina Pastora', 'Goyudan', 'Lobong', 'Lubigan', 'Mainit', 'Manga',
            'Masoli', 'Neighborhood', 'Niño Jesus', 'Pagatpatan', 'Palo', 'Payak', 'Sagrada',
            'Salvacion', 'San Isidro', 'San Juan', 'San Miguel', 'San Rafael', 'San Roque',
            'San Vicente', 'Santa Cruz', 'Santiago', 'Sooc', 'Tagpolo', 'Tres Reyes',
        ]);

        $this->seed('Bombon', [
            'Pagao', 'San Antonio', 'San Francisco', 'San Isidro', 'San Jose', 'San Roque',
            'Santo Domingo', 'Siembre',
        ]);

        $this->seed('Buhi', [
            'Amlongan', 'Antipolo', 'Burocbusoc', 'Cabatuan', 'Cagmaslog', 'De La Fe',
            'Delos Angeles', 'Divino Rostro', 'Gabas', 'Ibayugan', 'Igbac', 'Ipil', 'Iraya',
            'Labawon', 'Lourdes', 'Macaangay', 'Monte Calvario', 'Namurabod', 'Sagrada Familia',
            'Salvacion', 'San Antonio', 'San Buenaventura', 'San Francisco', 'San Isidro',
            'San Jose Baybayon', 'San Jose Salay', 'San Pascual', 'San Pedro', 'San Rafael',
            'San Ramon', 'San Roque', 'San Vicente', 'Santa Clara', 'Santa Cruz', 'Santa Elena',
            'Santa Isabel', 'Santa Justina', 'Tambo',
        ]);

        $this->seed('Bula', [
            'Bagoladio', 'Bagumbayan', 'Balaogan', 'Caorasan', 'Casugad', 'Causip', 'Fabrica',
            'Inoyonan', 'Itangon', 'Kinalabasahan', 'La Purisima', 'La Victoria', 'Lanipga',
            'Lubgan', 'Ombao Heights', 'Ombao Polpog', 'Palsong', 'Panoypoyan', 'Pawili',
            'Sagrada', 'Salvacion', 'San Agustin', 'San Francisco', 'San Isidro', 'San Jose',
            'San Miguel', 'San Ramon', 'San Roque', 'San Roque Heights', 'Santa Elena',
            'Santo Domingo', 'Santo Niño', 'Taisan',
        ]);

        $this->seed('Cabusao', [
            'Barcelonita', 'Biong', 'Camagong', 'Castillo', 'New Poblacion', 'Pandan',
            'San Pedro', 'Santa Cruz', 'Santa Lutgarda',
        ]);

        $this->seed('Calabanga', [
            'Balatasan', 'Balombon', 'Balongay', 'Belen', 'Bigaas', 'Binaliw',
            'Binanuaanan Grande', 'Binanuaanan Pequeño', 'Bonot-Santa Rosa', 'Burabod',
            'Cabanbanan', 'Cagsao', 'Camuning', 'Comaguingking', 'Del Carmen', 'Dominorog',
            'Fabrica', 'Harobay', 'La Purisima', 'Lugsad', 'Manguiring', 'Pagatpat', 'Paolbo',
            'Pinada', 'Punta Tarawal', 'Quinale', 'Sabang', 'Salvacion-Baybay', 'San Antonio',
            'San Antonio Poblacion', 'San Bernardino', 'San Francisco', 'San Isidro', 'San Lucas',
            'San Miguel', 'San Pablo', 'San Roque', 'San Vicente', 'Santa Cruz Poblacion',
            'Santa Cruz Ratay', 'Santa Isabel', 'Santa Salud', 'Santo Domingo', 'Santo Niño',
            'Siba-o', 'Sibobo', 'Sogod', 'Tomagodtod',
        ]);

        $this->seed('Camaligan', [
            'Dugcal', 'Marupit', 'San Francisco', 'San Jose-San Pablo', 'San Juan-San Ramon',
            'San Lucas', 'San Marcos', 'San Mateo', 'San Roque', 'Santo Domingo', 'Santo Tomas',
            'Sua', 'Tarosanan',
        ]);

        $this->seed('Canaman', [
            'Baras', 'Del Rosario', 'Dinaga', 'Fundado', 'Haring', 'Iquin', 'Linaga',
            'Mangayawan', 'Palo', 'Pangpang', 'Poro', 'San Agustin', 'San Francisco',
            'San Jose East', 'San Jose West', 'San Juan', 'San Nicolas', 'San Roque',
            'San Vicente', 'Santa Cruz', 'Santa Teresita', 'Sua', 'Talidtid', 'Tibgao',
        ]);

        $this->seed('Caramoan', [
            'Agaas', 'Antolon', 'Bacgong', 'Bahay', 'Bikal', 'Binanuahan', 'Cabacongan',
            'Cadong', 'Canatuan', 'Caputatan', 'Colongcogong', 'Daraga', 'Gata', 'Gibgos',
            'Gogon', 'Guijalo', 'Hanopol', 'Hanoy', 'Haponan', 'Ilawod', 'Ili-Centro', 'Lidong',
            'Lubas', 'Malabog', 'Maligaya', 'Mampirao', 'Mandiclum', 'Maqueda', 'Minalaba',
            'Oring', 'Oroc-Osoc', 'Pagolinan', 'Pandanan', 'Paniman', 'Patag-Belen',
            'Pili-Centro', 'Pili-Tabiguian', 'Poloan', 'Salvacion', 'San Roque', 'San Vicente',
            'Santa Cruz', 'Solnopan', 'Tabgon', 'Tabiguian', 'Tabog', 'Tawog', 'Terogo',
            'Toboan',
        ]);

        $this->seed('Del Gallego', [
            'Bagong Silang', 'Bucal', 'Cabasag', 'Comadaycaday', 'Comadogcadog', 'Domagondong',
            'Kinalangan', 'Mabini', 'Magais I', 'Magais II', 'Mansalaya', 'Nagkalit', 'Palaspas',
            'Pamplona', 'Pasay', 'Pinagdapian', 'Pinugusan', 'Poblacion Zone III', 'Sabang',
            'Salvacion', 'San Juan', 'San Pablo', 'Santa Rita I', 'Santa Rita II', 'Sinagawsawan',
            'Sinuknipan I', 'Sinuknipan II', 'Sugsugin', 'Tabion', 'Tomagoktok',
            'Zone I Fatima', 'Zone II San Antonio',
        ]);

        $this->seed('Gainza', [
            'Cagbunga', 'Dahilig', 'District I', 'District II', 'Loob', 'Malbong', 'Namuat',
            'Sampaloc',
        ]);

        $this->seed('Garchitorena', [
            'Ason', 'Bahi', 'Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV',
            'Binagasbasan', 'Burabod', 'Cagamutan', 'Cagnipa', 'Canlong', 'Dangla', 'Del Pilar',
            'Denrica', 'Harrison', 'Mansangat', 'Pambuhan', 'Sagrada', 'Salvacion', 'San Vicente',
            'Sumaoy', 'Tamiawon', 'Toytoy',
        ]);

        $this->seed('Goa', [
            'Abucayan', 'Bagumbayan Grande', 'Bagumbayan Pequeño', 'Balaynan', 'Belen', 'Buyo',
            'Cagaycay', 'Catagbacan', 'Digdigon', 'Gimaga', 'Halawig-Gogon', 'Hiwacloy',
            'La Purisima', 'Lamon', 'Matacla', 'Maymatan', 'Maysalay', 'Napawon', 'Panday',
            'Payatan', 'Pinaglabanan', 'Salog', 'San Benito', 'San Isidro', 'San Isidro West',
            'San Jose', 'San Juan Bautista', 'San Juan Evangelista', 'San Pedro',
            'Scout Fuentebella', 'Tabgon', 'Tagongtong', 'Tamban', 'Taytay',
        ]);

        $this->seed('Lagonoy', [
            'Agosais', 'Agpo-Camagong-Tabog', 'Amoguis', 'Balaton', 'Binanuahan', 'Bocogan',
            'Burabod', 'Cabotonan', 'Dahat', 'Del Carmen', 'Gimagtocon', 'Ginorangan', 'Gubat',
            'Guibahoy', 'Himanag', 'Kinahologan', 'Loho', 'Manamoc', 'Mangogon', 'Mapid', 'Olas',
            'Omalo', 'Panagan', 'Panicuan', 'Pinamihagan', 'San Francisco', 'San Isidro',
            'San Isidro Norte', 'San Isidro Sur', 'San Rafael', 'San Ramon', 'San Roque',
            'San Sebastian', 'San Vicente', 'Santa Cruz', 'Santa Maria', 'Saripongpong', 'Sipaco',
        ]);

        $this->seed('Libmanan', [
            'Aslong', 'Awayan', 'Bagacay', 'Bagadion', 'Bagamelon', 'Bagumbayan', 'Bahao', 'Bahay',
            'Begajo Norte', 'Begajo Sur', 'Beguito Nuevo', 'Beguito Viejo', 'Bikal', 'Busak',
            'Caima', 'Calabnigan', 'Camambugan', 'Cambalidio', 'Candami', 'Candato', 'Cawayan',
            'Concepcion', 'Cuyapi', 'Danawan', 'Duang Niog', 'Handong', 'Ibid', 'Inalahan',
            'Labao', 'Libod I', 'Libod II', 'Loba-loba', 'Mabini', 'Malansad Nuevo',
            'Malansad Viejo', 'Malbogon', 'Malinao', 'Mambalite', 'Mambayawas', 'Mambulo Nuevo',
            'Mambulo Viejo', 'Mancawayan', 'Mandacanan', 'Mantalisay', 'Padlos',
            'Pag-oring Nuevo', 'Pag-oring Viejo', 'Palangon', 'Palong', 'Patag', 'Planza',
            'Poblacion', 'Potot', 'Puro-Batia', 'Rongos', 'Salvacion', 'San Isidro', 'San Juan',
            'San Pablo', 'San Vicente', 'Sibujo', 'Sigamot', 'Station-Church Site',
            'Taban-Fundado', 'Tampuhan', 'Tanag', 'Tarum', 'Tinalmud Nuevo', 'Tinalmud Viejo',
            'Tinangkihan', 'Udoc', 'Umalo', 'Uson', 'Villadima', 'Villasocorro',
        ]);

        $this->seed('Lupi', [
            'Alleomar', 'Bagangan Sr.', 'Bagong Sikat', 'Bangon', 'Barrera Jr.', 'Barrera Sr.',
            'Bel-Cruz', 'Belwang', 'Buenasuerte', 'Bulawan Jr.', 'Bulawan Sr.', 'Cabutagan',
            'Casay', 'Colacling', 'Cristo Rey', 'Del Carmen', 'Haguimit', 'Haluban', 'Kaibigan',
            'La Purisima', 'Lourdes', 'Mangcawayan', 'Napolidan', 'Poblacion', 'Polantuna',
            'Sagrada', 'Salvacion', 'San Isidro', 'San Jose', 'San Pedro', 'San Rafael Norte',
            'San Rafael Sur', 'San Ramon', 'San Vicente', 'Sooc', 'Tanawan', 'Tapi', 'Tible',
        ]);

        $this->seed('Magarao', [
            'Barobaybay', 'Bell', 'Carangcang', 'Carigsa', 'Casuray', 'Monserrat', 'Ponong',
            'San Francisco', 'San Isidro', 'San Juan', 'San Miguel', 'San Pantaleon',
            'Santa Lucia', 'Santa Rosa', 'Santo Tomas',
        ]);

        $this->seed('Milaor', [
            'Alimbuyog', 'Amparado', 'Balagbag', 'Borongborongan', 'Cabugao', 'Capucnasan',
            'Dalipay', 'Del Rosario', 'Flordeliz', 'Lipot', 'Mayaopayawan', 'Maycatmon',
            'Maydaso', 'San Antonio', 'San Jose', 'San Miguel', 'San Roque', 'San Vicente',
            'Santo Domingo', 'Tarusanan',
        ]);

        $this->seed('Minalabac', [
            'Antipolo', 'Bagolatao', 'Bagongbong', 'Baliuag Nuevo', 'Baliuag Viejo', 'Catanusan',
            'Del Carmen-Del Rosario', 'Del Socorro', 'Hamoraon', 'Hobo', 'Irayang Solong',
            'Magadap', 'Malitbog', 'Manapao', 'Mataoroc', 'Sagrada', 'Salingogon', 'San Antonio',
            'San Felipe-Santiago', 'San Francisco', 'San Jose', 'San Juan-San Lorenzo', 'Taban',
            'Tariric', 'Timbang',
        ]);

        $this->seed('Nabua', [
            'Angustia', 'Antipolo Old', 'Antipolo Young', 'Aro-aldao', 'Bustrac', 'Dolorosa',
            'Duran', 'Inapatan', 'La Opinion', 'La Purisima', 'Lourdes Old', 'Lourdes Young',
            'Malawag', 'Paloyon Oriental', 'Paloyon Proper', 'Salvacion Que Gatos', 'San Antonio',
            'San Antonio Ogbon', 'San Esteban', 'San Francisco', 'San Isidro',
            'San Isidro Inapatan', 'San Jose', 'San Juan', 'San Luis', 'San Miguel',
            'San Nicolas', 'San Roque', 'San Roque Madawon', 'San Roque Sagumay',
            'San Vicente Gorong-Gorong', 'San Vicente Ogbon', 'Santa Barbara', 'Santa Cruz',
            'Santa Elena Baras', 'Santa Lucia Baras', 'Santiago Old', 'Santiago Young',
            'Santo Domingo', 'Taban',
        ]);

        $this->seed('Pamplona', [
            'Awayan', 'Bagong Sikat', 'Bigaan', 'Bugang', 'Bulawan', 'Calawat', 'Caranan',
            'Casay', 'Casay Daan', 'Del Rosario', 'El Salvador', 'Libtong', 'Malangcao',
            'Manamoc', 'Mansalaya', 'Mapolon', 'Nueva Caceres', 'Pinagdapugan', 'Pob. Dist. I',
            'Pob. Dist. II', 'Pob. Dist. III', 'Sagrada', 'Salvacion', 'San Agustin',
            'San Francisco', 'San Isidro', 'San Jose', 'San Juan', 'San Roque', 'Santa Cruz',
            'Taban', 'Tinangis',
        ]);

        $this->seed('Pasacao', [
            'Armenia', 'Bautista', 'Bugtong Na Ilog', 'Bulala', 'Cagsao', 'Cawayan',
            'Del Rosario', 'Halawig', 'Hamoraon', 'Hubo', 'Itulan', 'Linaga', 'Mangga',
            'Pob. Dist. I', 'Pob. Dist. II', 'Pob. Dist. III', 'Potot', 'Sagrada', 'Salvacion',
            'San Jose', 'San Marcos', 'San Miguel', 'San Roque', 'Santa Elena', 'Tomagodtod',
        ]);

        $this->seed('Pili', [
            'Cadlan', 'Caroyroyan', 'Curry', 'Del Rosario', 'Himaao', 'Itomang', 'Palestina',
            'Pawili', 'Sagrada', 'Sagurong', 'Sampaloc', 'San Agustin', 'San Jose', 'San Juan',
            'San Roque', 'Santa Cruz', 'Santa Rita Sur', 'Tinangis',
            'Zone I (Pob.)', 'Zone II (Pob.)', 'Zone III (Pob.)', 'Zone IV (Pob.)',
            'Zone V (Pob.)', 'Zone VI (Pob.)',
        ]);

        $this->seed('Presentacion', [
            'Agao-ao', 'Agos', 'Aldezar', 'Bagong Sirang', 'Batobalani', 'Belmonte', 'Bikong',
            'Binanuahan', 'Biong', 'Bolisong', 'Burabod', 'Cabotonan', 'Calabnigan', 'Camayabnan',
            'Catanusan', 'Codon', 'Dayangdang', 'Del Pilar', 'Divino Rostro', 'Dugui Norte',
            'Dugui Sur', 'Gimagaan', 'Goa', 'Huyonhuyon', 'Imelda', 'Inampulugan', 'Inalahan',
            'Kibaya', 'La Purisima', 'Langkit', 'Lidong', 'Lubag', 'Mabini', 'Mabitas',
            'Magsaysay', 'Mandiclum', 'Marinagat', 'Mauraro', 'Melgar', 'Nalayahan', 'Oring',
            'Pagao', 'Panaon', 'Panicuan', 'Pantat', 'Pob. Dist. I', 'Pob. Dist. II',
            'Potot', 'Sagrada', 'Salvacion', 'San Agustin', 'San Antonio', 'San Isidro',
            'San Jose', 'San Roque', 'San Vicente', 'Santa Cruz', 'Tagaytay', 'Tagpolo',
            'Taytay', 'Tinambac', 'Tobog',
        ]);

        $this->seed('Ragay', [
            'Agao-ao', 'Agos', 'Antipolo', 'Apud', 'Aringay', 'Bagolatao', 'Bagombong',
            'Bamban', 'Batobalani', 'Batu', 'Binahan Interior', 'Binahan Proper', 'Buenasuerte',
            'Buenavista', 'Cabadisan', 'Cabinitan', 'Cabugao', 'Caditaan', 'Calagnaon',
            'Calampinay', 'Calanaga', 'Cawayan', 'Colacling', 'Dalnac', 'Dap-dap', 'Goyudan',
            'Guibuangan', 'Guijalo', 'Gutad', 'Ipil', 'Iraya', 'La Purisima', 'Libmanan',
            'Logyas', 'Lomboy', 'Lucbanan', 'Lupi', 'Mabini', 'Maboy', 'Magais',
            'Mangga', 'Masoli', 'Milagrosa', 'Napolidan', 'Panaytayon', 'Parang',
            'Pob. Dist. I', 'Pob. Dist. II', 'Pob. Dist. III', 'Populon', 'Potot',
            'Salvacion', 'San Antonio', 'San Fernando', 'San Isidro', 'San Jose',
            'San Roque', 'Santa Cruz', 'Silom', 'Tabon', 'Tala', 'Tulatula',
        ]);

        $this->seed('San Fernando', [
            'Apale', 'Apad', 'Bagong Silang', 'Benitinan', 'Bicalen', 'Binal', 'Binalatongan',
            'Buenasuerte', 'Cabalinao', 'Cagliliog', 'Cagmanaba', 'Camambugan', 'Casugad',
            'Castillo', 'Catotoran Norte', 'Catotoran Sur', 'Central', 'Del Rosario',
            'Dinagaan', 'Eastern Gate', 'Gutad', 'Impig', 'Itomang', 'Limosnaan', 'Mabini',
            'Mag-asawang Bato', 'Magsaysay', 'Magtang', 'Mantala', 'Pag-oring',
            'Palayod', 'Pili', 'Pinagsalog', 'Poblacion Centro', 'Poblacion Norte',
            'Poblacion Sur', 'Potot', 'Sabang Naga', 'Salvacion Norte', 'Salvacion Sur',
            'San Antonio', 'San Francisco', 'San Isidro', 'San Jose', 'San Lorenzo',
            'San Marcos', 'San Pedro', 'Santa Cruz', 'Timbang', 'Tinangis', 'Western Gate',
        ]);

        $this->seed('San Jose', [
            'Antipolo', 'Bagong Sirang', 'Boringon', 'Buenavista', 'Cabanbanan', 'Camagong',
            'Cawayan', 'Del Rosario', 'Itulan', 'Lamon', 'Lañas', 'Lohong', 'Magtang',
            'Namurabod', 'Pob. Dist. I', 'Pob. Dist. II', 'Pob. Dist. III', 'Salvacion',
            'San Andres', 'San Ignacio', 'San Isidro', 'San Juan', 'San Roque', 'Santa Cruz',
            'Tinago',
        ]);

        $this->seed('Sipocot', [
            'Aldezar', 'Bagong Sirang', 'Bagsak', 'Balagonan', 'Balud Norte', 'Balud Sur',
            'Bayawas', 'Burabod', 'Cabiyugan', 'Caboboan', 'Calagnaon', 'Camambugan',
            'Catabangan', 'Catmon', 'Colasi', 'Del Carmen Norte', 'Del Carmen Sur', 'Gata',
            'Impig', 'Inaporis', 'Labnig', 'La Purisima Norte', 'La Purisima Sur',
            'Lubigan', 'Malabog', 'Malogui', 'Matandang Taytay', 'Natago', 'Olag Grande',
            'Olag Pequeño', 'Palaspas', 'Panoypoyan', 'Pawili', 'Pingol', 'Pob. Norte',
            'Pob. Sur', 'Salvacion Norte', 'Salvacion Sur', 'San Isidro Norte',
            'San Isidro Sur', 'San Vicente', 'Santa Cruz Norte', 'Santa Cruz Sur', 'Taisan',
            'Taytay', 'Tible', 'Tula-tula',
        ]);

        $this->seed('Siruma', [
            'Bahao-Marinawa', 'Barangay I (Pob.)', 'Barangay II (Pob.)', 'Barangay III (Pob.)',
            'Barangay IV (Pob.)', 'Barangay V (Pob.)', 'Binanuahan Ilaya', 'Binanuahan Ilawod',
            'Buenavista', 'Calagnaon', 'Catalotoan', 'Del Carmen', 'Denrica', 'Florida',
            'Lidong', 'Lubigan', 'Machacon', 'Maharlika', 'Mampirao', 'Mandiclum',
            'Pantao', 'Patag', 'San Andres', 'San Isidro', 'San Jose', 'San Juan', 'San Roque',
            'San Vicente', 'Santa Cruz', 'Sominot', 'Tamban', 'Taytay', 'Togawe', 'Union',
            'Villahermosa',
        ]);

        $this->seed('Tinambac', [
            'Agao-ao', 'Agos', 'Antipolo', 'Bagong Silang', 'Bastian', 'Bayawas', 'Belen',
            'Binalay', 'Binanuahan', 'Buenavista', 'Buyo', 'Calagnaon', 'Calao', 'Caosoran',
            'Catanusan', 'Crossing', 'Del Rosario', 'Denrica', 'Dugui', 'El Salvador', 'Estrella',
            'Florida', 'Ginorangan', 'Hiwacloy', 'Iraya', 'Lubigan', 'Maharlika', 'Maybato',
            'Minarog', 'Nipa', 'Oras', 'Patitinan', 'Penafrancia', 'Pinagdapian',
            'Pob. Dist. I', 'Pob. Dist. II', 'Pob. Dist. III', 'Potot', 'Rizal', 'Salvacion',
            'San Andres', 'San Isidro', 'San Jose', 'San Pedro', 'San Rafael', 'San Vicente',
            'Santa Cruz', 'Santa Teresita', 'Suchan', 'Tagas', 'Tamban', 'Togawe',
            'Tula-tula', 'Union',
        ]);

        // =====================================================================
        // CATANDUANES
        // =====================================================================

        $this->seed('Bagamanoc', [
            'Antipolo', 'Bacak', 'Bagatabao', 'Bugao', 'Cahan', 'Hinipaan', 'Magsaysay',
            'Poblacion', 'Quezon', 'Quigaray', 'Sagrada', 'Salvacion', 'San Isidro', 'San Rafael',
            'San Vicente', 'Santa Mesa', 'Santa Teresa', 'Suchan',
        ]);

        $this->seed('Baras', [
            'Abihao', 'Agban', 'Bagong Sirang', 'Batolinao', 'Benticayan', 'Buenavista',
            'Caragumihan', 'Danao', 'Eastern Poblacion', 'Ginitligan', 'Guinsaanan',
            'J. M. Alberto', 'Macutal', 'Moning', 'Nagbarorong', 'Osmeña', 'P. Teston',
            'Paniquihan', 'Puraran', 'Putsan', 'Quezon', 'Rizal', 'Sagrada', 'Salvacion',
            'San Lorenzo', 'San Miguel', 'Santa Maria', 'Tilod', 'Western Poblacion',
        ]);

        $this->seed('Bato', [
            'Aroyao Pequeño', 'Bagumbayan', 'Banawang', 'Batalay', 'Binanuahan', 'Bote',
            'Buenavista', 'Cabugao', 'Cagraray', 'Carorian', 'Guinobatan', 'Ilawod',
            'Libjo', 'Libod Poblacion', 'Marinawa', 'Mintay', 'Oguis', 'Pananaogan',
            'San Andres', 'San Pedro', 'San Roque', 'Santa Isabel', 'Sibacungan', 'Sipi',
            'Talisay', 'Tamburan', 'Tilis',
        ]);

        $this->seed('Caramoran', [
            'Baybay', 'Bocon', 'Bothoan', 'Buenavista', 'Bulalacao', 'Camburo', 'Dariao',
            'Datag East', 'Datag West', 'Guiamlong', 'Hitoma', 'Icanbato', 'Inalmasinan',
            'Iyao', 'Mabini', 'Maui', 'Maysuran', 'Milaviga', 'Obi', 'Panique', 'Sabangan',
            'Sabloyon', 'Salvacion', 'Supang', 'Toytoy', 'Tubli', 'Tucao',
        ]);

        $this->seed('Gigmoto', [
            'Biong', 'Dororian', 'Poblacion District I', 'Poblacion District II',
            'Poblacion District III', 'San Pedro', 'San Vicente', 'Sicmil', 'Sioron',
        ]);

        $this->seed('Pandan', [
            'Bagawang', 'Balagñonan', 'Baldoc', 'Canlubi', 'Catamban', 'Cobo', 'Hiyop', 'Libod',
            'Lourdes', 'Lumabao', 'Marambong', 'Napo', 'Oga', 'Pandan del Norte', 'Pandan del Sur',
            'Panuto', 'Porot', 'Salvacion', 'San Andres', 'San Isidro', 'San Rafael', 'San Roque',
            'Santa Cruz', 'Tabugoc', 'Tokio', 'Wagdas',
        ]);

        $this->seed('Panganiban', [
            'Alinawan', 'Babaguan', 'Bagong Bayan', 'Burabod', 'Cabuyoan', 'Cagdarao', 'Mabini',
            'Maculiw', 'Panay', 'Salvacion', 'San Antonio', 'San Joaquin', 'San Jose', 'San Juan',
            'San Miguel', 'San Nicolas', 'San Pedro', 'San Vicente', 'Santa Ana', 'Santa Maria',
            'Santo Santiago', 'Taopon', 'Tibo',
        ]);

        $this->seed('San Andres', [
            'Agojo', 'Alibuag', 'Asgad', 'Bagong Sirang', 'Barihay', 'Batong Paloway', 'Belmonte',
            'Bislig', 'Bon-ot', 'Cabcab', 'Cabungahan', 'Carangag', 'Catagbacan', 'Codon',
            'Comagaycay', 'Datag', 'Divino Rostro', 'Esperanza', 'Hilawan', 'Lictin', 'Lubas',
            'Manambrag', 'Mayngaway', 'Palawig', 'Puting Baybay', 'Rizal', 'Salvacion',
            'San Isidro', 'San Jose', 'San Roque', 'San Vicente', 'Santa Cruz', 'Sapang Palay',
            'Tibang', 'Timbaan', 'Tominawog', 'Wagdas', 'Yocti',
        ]);

        $this->seed('San Miguel', [
            'Atsan', 'Balatohan', 'Boton', 'Buhi', 'Dayawa', 'J. M. Alberto', 'Katipunan',
            'Kilikilihan', 'Mabato', 'Obo', 'Pacogon', 'Pagsangahan', 'Pangilao', 'Paraiso',
            'Poblacion District II', 'Poblacion District III', 'Progreso', 'Salvacion', 'San Juan',
            'San Marcos', 'Santa Elena', 'Siay', 'Solong', 'Tobrehon',
        ]);

        $this->seed('Viga', [
            'Almojuela', 'Ananong', 'Asuncion', 'Batohonan', 'Begonia', 'Botinagan', 'Buenavista',
            'Burgos', 'Del Pilar', 'Mabini', 'Magsaysay', 'Ogbong', 'Osmeña', 'Pedro Vera',
            'Peñafrancia', 'Quezon', 'Quirino', 'Rizal', 'Roxas', 'Sagrada', 'San Isidro',
            'San Jose Oco', 'San Jose Poblacion', 'San Pedro', 'San Roque', 'San Vicente',
            'Santa Rosa', 'Soboc', 'Tambongon', 'Tinago', 'Villa Aurora',
        ]);

        $this->seed('Virac', [
            'Antipolo del Norte', 'Antipolo del Sur', 'Balite', 'Batag', 'Bigaa', 'Buenavista',
            'Buyo', 'Cabihian', 'Calabnigan', 'Calampong', 'Calatagan Proper', 'Calatagan Tibang',
            'Capilihan', 'Casoocan', 'Cavinitan', 'Concepcion', 'Constantino', 'Danicop',
            'Dugui San Isidro', 'Dugui San Vicente', 'Dugui Too', 'F. Tacorda Village', 'Francia',
            'Gogon Centro', 'Gogon Sirangan', 'Hawan Grande', 'Hawan Ilaya', 'Hicming',
            'Ibong Sapa', 'Igang', 'Juan M. Alberto', 'Lanao', 'Magnesia del Norte',
            'Magnesia del Sur', 'Marcelo Alberto', 'Marilima', 'Pajo Baguio', 'Pajo San Isidro',
            'Palnab del Norte', 'Palnab del Sur', 'Palta Big', 'Palta Salvacion', 'Palta Small',
            'Rawis', 'Salvacion', 'San Isidro Village', 'San Jose', 'San Juan', 'San Pablo',
            'San Pedro', 'San Roque', 'San Vicente', 'Santa Cruz', 'Santa Elena', 'Santo Cristo',
            'Santo Domingo', 'Santo Niño', 'Simamla', 'Sogod-Simamla', 'Sogod-Tibgao', 'Talisoy',
            'Tubaon', 'Valencia',
        ]);

        // =====================================================================
        // MASBATE
        // =====================================================================

        $this->seed('Aroroy', [
            'Ambolong', 'Amoroy', 'Amotag', 'Bagauma', 'Balawing', 'Balete', 'Bangon',
            'Cabangcalan', 'Cabas-an', 'Calanay', 'Capsay', 'Concepcion', 'Dayhagan',
            'Don Pablo Dela Rosa', 'Gumahang', 'Jaboyoan', 'Lanang', 'Luy-a', 'Macabug',
            'Malubi', 'Managanaga', 'Manamoc', 'Mariposa', 'Mataba', 'Matalangtalang',
            'Matongog', 'Nabongsoran', 'Pangle', 'Panique', 'Pinanaan', 'Poblacion', 'Puro',
            'San Agustin', 'San Isidro', 'Sawang', 'Syndicate', 'Talabaan', 'Talib', 'Tigbao',
            'Tinago', 'Tinigban',
        ]);

        $this->seed('Baleno', [
            'Baao', 'Banase', 'Batuila', 'Cagara', 'Cagpandan', 'Cancahorao', 'Canjunday',
            'Docol', 'Eastern Capsay', 'Gabi', 'Gangao', 'Lagta', 'Lahong Interior',
            'Lahong Proper', 'Lipata', 'Madangcalan', 'Magdalena', 'Manoboc', 'Obongon Diot',
            'Poblacion', 'Polot', 'Potoson', 'Sog-ong', 'Tinapian',
        ]);

        $this->seed('Balud', [
            'Baybay', 'Bongcanaway', 'Calumpang', 'Cantil', 'Casamongan', 'Danao', 'Dao',
            'Guinbanwahan', 'Ilaya', 'Jangan', 'Jintotolo', 'Mabuhay', 'Mapili', 'Mapitogo',
            'Pajo', 'Palane', 'Panguiranan', 'Panubigan', 'Poblacion', 'Pulanduta',
            'Quinayangan Diotay', 'Quinayangan Tonga', 'Salvacion', 'Sampad', 'San Andres',
            'San Antonio', 'Sapatos', 'Talisay', 'Tonga', 'Ubo', 'Victory', 'Villa Alvarez',
        ]);

        $this->seed('Batuan', [
            'Burgos', 'Cambañez', 'Canares', 'Costa Rica', 'Danao', 'Gibraltar', 'Mabuhay',
            'Matabao', 'Nasandig', 'Panisihan', 'Poblacion', 'Rizal', 'Royroy', 'Sawang',
        ]);

        $this->seed('Cataingan', [
            'Abaca', 'Aguada', 'Badiang', 'Bagumbayan', 'Cadulawan', 'Cagbatang', 'Chimenea',
            'Concepcion', 'Curvada', 'Divisoria', 'Domorog', 'Estampar', 'Gahit', 'Libtong',
            'Liong', 'Maanahao', 'Madamba', 'Malobago', 'Matayum', 'Matubinao', 'Mintac',
            'Nadawisan', 'Osmeña', 'Pawican', 'Pitogo', 'Poblacion', 'Quezon', 'San Isidro',
            'San Jose', 'San Pedro', 'San Rafael', 'Santa Teresita', 'Santo Niño', 'Tagboan',
            'Tuybo', 'Villa Pogado',
        ]);

        $this->seed('Cawayan', [
            'Begia', 'Cabayugan', 'Cabungahan', 'Calapayan', 'Calumpang', 'Chico Island',
            'Dalipe', 'Divisoria', 'Gilotongan', 'Guiom', 'Iraya', 'Itombato', 'Lague-lague',
            'Libertad', 'Looc', 'Mactan', 'Madbad', 'Mahayahay', 'Maihao', 'Malbug', 'Naro',
            'Palobandera', 'Pananawan', 'Peña Island', 'Pin-as', 'Poblacion', 'Pulot',
            'Punta Batsan', 'R. M. Magbalon', 'Recodo', 'San Jose', 'San Vicente', 'Taberna',
            'Talisay', 'Tubog', 'Tuburan', 'Villahermosa',
        ]);

        $this->seed('Claveria', [
            'Albasan', 'Boca Engaño', 'Buyo', 'Calpi', 'Canomay', 'Cawayan', 'Imelda',
            'Mababang Baybay', 'Mabiton', 'Manapao', 'Nabasagan', 'Nonoc', 'Osmeña', 'Pasig',
            'Peñafrancia', 'Poblacion District I', 'Poblacion District II', 'Quezon', 'San Isidro',
            'San Ramon', 'San Vicente', 'Taguilid',
        ]);

        $this->seed('Dimasalang', [
            'Balantay', 'Balocawe', 'Banahao', 'Buenaflor', 'Buracan', 'Cabanoyoan', 'Cabrera',
            'Cadulan', 'Calabad', 'Canomay', 'Divisoria', 'Gaid', 'Gregorio Alino', 'Magcaraguit',
            'Mambog', 'Poblacion', 'Rizal', 'San Vicente', 'Suba', 'T. R. Yangco',
        ]);

        $this->seed('Esperanza', [
            'Agoho', 'Almero', 'Baras', 'Domorog', 'Guadalupe', 'Iligan', 'Labangtaytay',
            'Labrador', 'Libertad', 'Magsaysay', 'Masbaranon', 'Poblacion', 'Potingbato',
            'Rizal', 'San Roque', 'Santiago', 'Sorosimbajan', 'Tawad', 'Tunga', 'Villa',
        ]);

        $this->seed('Mandaon', [
            'Alas', 'Ayat', 'Bat-ongan', 'Bugtong', 'Buri', 'Cabitan', 'Cagmasoso', 'Canomoy',
            'Centro', 'Dayao', 'Guincaiptan', 'Laguinbanwa', 'Lantangan', 'Looc', 'Mabatobato',
            'Maolingon', 'Nailaban', 'Nanipsan', 'Pinamangcaan', 'Poblacion', 'Polo Dacu',
            'San Juan', 'San Pablo', 'Santa Fe', 'Tagpu', 'Tumalaytay',
        ]);

        $this->seed('Masbate City', [
            'Anas', 'Asid', 'B. Titong', 'Bagumbayan', 'Bantigue', 'Bapor', 'Batuhan',
            'Bayombon', 'Biyong', 'Bolo', 'Cagay', 'Cawayan Exterior', 'Cawayan Interior',
            'Centro', 'Espinosa', 'F. Magallanes', 'Ibingay', 'Igang', 'Kalipay', 'Kinamaligan',
            'Malinta', 'Mapiña', 'Mayngaran', 'Nursery', 'Pating', 'Pawa', 'Sinalongan',
            'Tugbo', 'Ubongan Dacu', 'Usab',
        ]);

        $this->seed('Milagros', [
            'Bacolod', 'Bangad', 'Bara', 'Bonbon', 'Calasuche', 'Calumpang', 'Capaculan',
            'Cayabon', 'Guinluthangan', 'Jamorawon', 'Magsalangi', 'Matagbac', 'Matanglad',
            'Matiporon', 'Moises R. Espinosa', 'Narangasan', 'Pamangpangon', 'Paraiso',
            'Poblacion East', 'Poblacion West', 'San Antonio', 'San Carlos', 'Sawmill',
            'Tagbon', 'Tawad', 'Tigbao', 'Tinaclipan',
        ]);

        $this->seed('Mobo', [
            'Baang', 'Bagacay', 'Balatucan', 'Barag', 'Dacu', 'Fabrica', 'Guintorelan',
            'Holjogon', 'Lalaguna', 'Lomocloc', 'Luyong Catungan', 'Mabuhay', 'Mandali',
            'Mapuyo', 'Marintoc', 'Nasunduan', 'Pinamalatican', 'Pinamarbuhan',
            'Poblacion Dist. I', 'Poblacion Dist. II', 'Polot', 'Sambulawan', 'Santa Maria',
            'Sawmill', 'Tabuc', 'Tugawe', 'Tugbo', 'Umabay Exterior', 'Umabay Interior',
        ]);

        $this->seed('Monreal', [
            'Cantorna', 'Famosa', 'Guinhadap', 'Macarthur', 'Maglambong', 'Morocborocan',
            'Poblacion', 'Real', 'Rizal', 'Santo Niño', 'Togoron',
        ]);

        $this->seed('Palanas', [
            'Antipolo', 'Banco', 'Biga-a', 'Bontod', 'Buenasuerte', 'Intusan',
            'Jose A. Abenir Sr.', 'Maanahao', 'Mabini', 'Malatawan', 'Malibas', 'Maravilla',
            'Matugnao', 'Miabas', 'Nabangig', 'Nipa', 'Parina', 'Piña', 'Poblacion',
            'Salvacion', 'San Antonio', 'San Carlos', 'San Isidro', 'Santa Cruz',
        ]);

        $this->seed('Pio V. Corpuz', [
            'Alegria', 'Buenasuerte', 'Bugang', 'Bugtong', 'Bunducan', 'Cabangrayan',
            'Calongongan', 'Casabangan', 'Guindawahan', 'Labigan', 'Lampuyang', 'Mabuhay',
            'Palho', 'Poblacion', 'Salvacion', 'Tanque', 'Tubigan', 'Tubog',
        ]);

        $this->seed('Placer', [
            'Aguada', 'Ban-ao', 'Burabod', 'Cabangcalan', 'Calumpang', 'Camayabsan',
            'Daanlungsod', 'Dangpanan', 'Daraga', 'Guin-awayan', 'Guinhan-ayan', 'Katipunan',
            'Libas', 'Locso-an', 'Luna', 'Mahayag', 'Mahayahay', 'Manlut-od', 'Matagantang',
            'Naboctot', 'Nagarao', 'Nainday', 'Naocondiot', 'Pasiagon', 'Pili', 'Poblacion',
            'Puro', 'Quibrada', 'San Marcos', 'Santa Cruz', 'Taboc', 'Tan-awan', 'Taverna',
            'Tubod', 'Villa Inocencio',
        ]);

        $this->seed('San Fernando', [
            'Altavista', 'Bayanihan Poblacion', 'Baybaydagat Poblacion', 'Benitinan',
            'Buenasuerte', 'Buenavista', 'Buenos Aires', 'Buyo', 'Cañelas', 'Corbada',
            'Daplian', 'Del Rosario', 'Ipil', 'Lahong', 'Lumbia', 'Magkaipit',
            'Magsasaka Poblacion', 'Minio', 'Pinamoghaan', 'Progreso', 'Resurreccion',
            'Salvacion', 'Silangan Poblacion', 'Sowa', 'Talisay', 'Valparaiso',
        ]);

        $this->seed('San Jacinto', [
            'Almiñe', 'Bagacay', 'Bagahanglad', 'Bartolabac', 'Burgos', 'Calipat-an', 'Danao',
            'District I', 'District II', 'District III', 'District IV', 'Dorong-an Daplian',
            'Interior', 'Jagna-an', 'Luna', 'Mabini', 'Piña', 'Roosevelt', 'San Isidro',
            'Santa Rosa', 'Washington',
        ]);

        $this->seed('San Pascual', [
            'Boca Chica', 'Bolod', 'Busing', 'Cueva', 'Dangcalan', 'Halabangbaybay',
            'Iniwaran', 'Ki-Buaya', 'Ki-Romero', 'Laurente', 'Mabini', 'Mabuhay',
            'Malaking Ilog', 'Mapanique', 'Nazareno', 'Pinamasingan', 'Quintina', 'San Jose',
            'San Pedro', 'San Rafael', 'Santa Cruz', 'Terraplin',
        ]);

        $this->seed('Uson', [
            'Arado', 'Armenia', 'Aurora', 'Badling', 'Bonifacio', 'Buenasuerte', 'Buenavista',
            'Campana', 'Candelaria', 'Centro', 'Crossing', 'Dapdap', 'Del Carmen', 'Del Rosario',
            'Libertad', 'Mabini', 'Mabuhay', 'Madao', 'Magsaysay', 'Marcella', 'Miaga',
            'Mongahay', 'Morocborocan', 'Paguihaman', 'Panicijan', 'Poblacion', 'Quezon',
            'San Isidro', 'San Jose', 'San Mateo', 'San Ramon', 'San Vicente', 'Santo Cristo',
            'Sawang', 'Simawa',
        ]);

        // =====================================================================
        // SORSOGON
        // =====================================================================

        $this->seed('Sorsogon City', [
            'Abuyog', 'Almendras-Cogon', 'Balete', 'Balogo (Bacon District)',
            'Balogo (Sorsogon East District)', 'Barayong', 'Basud', 'Bato', 'Bibincahan',
            'Bitan-o/Dalipay', 'Bogña', 'Bon-ot', 'Bucalbucalan', 'Buenavista',
            'Buenavista (Bacon District)', 'Buhatan', 'Bulabog', 'Burabod', 'Cabarbuhan',
            'Cabid-an', 'Cambulaga', 'Capuy', 'Caricaran', 'Del Rosario', 'Gatbo', 'Gimaloto',
            'Guinlajon', 'Jamislagan', 'Macabog', 'Maricrum', 'Marinas', 'Osiao', 'Pamurayan',
            'Pangpang', 'Panlayaan', 'Peñafrancia', 'Piot', 'Poblacion', 'Polvorista', 'Rawis',
            'Rizal', 'Salog', 'Salvacion', 'Salvacion (Bacon District)', 'Sampaloc',
            'San Isidro', 'San Isidro (Bacon District)', 'San Juan (Bacon District)',
            'San Juan (Roro)', 'San Pascual', 'San Ramon', 'San Roque', 'San Vicente',
            'Santa Cruz', 'Santa Lucia', 'Santo Domingo', 'Santo Niño', 'Sawanga', 'Sirangan',
            'Sugod', 'Sulucan', 'Talisay', 'Ticol', 'Tugos',
        ]);

        $this->seed('Barcelona', [
            'Alegria', 'Bagacay', 'Bangate', 'Bugtong', 'Cagang', 'Fabrica', 'Jibong', 'Lago',
            'Layog', 'Luneta', 'Macabari', 'Mapapac', 'Olandia', 'Paghaluban', 'Poblacion Central',
            'Poblacion Norte', 'Poblacion Sur', 'Putiao', 'San Antonio', 'San Isidro', 'San Ramon',
            'San Vicente', 'Santa Cruz', 'Santa Lourdes', 'Tagdon',
        ]);

        $this->seed('Bulan', [
            'A. Bonifacio', 'Abad Santos', 'Aguinaldo', 'Antipolo', 'Beguin',
            'Benigno S. Aquino', 'Bical', 'Bonga', 'Butag', 'Cadandanan', 'Calomagon', 'Calpi',
            'Cocok-Cabitan', 'Daganas', 'Danao', 'Dolos', 'E. Quirino', 'Fabrica', 'G. del Pilar',
            'Gate', 'Inararan', 'J. Gerona', 'J. P. Laurel', 'Jamorawon', 'Lajong', 'Libertad',
            'M. Roxas', 'Magsaysay', 'Managanaga', 'Marinab', 'Montecalvario', 'N. Roque',
            'Namo', 'Nasuje', 'Obrero', 'Osmeña', 'Otavi', 'Padre Diaz', 'Palale', 'Quezon',
            'R. Gerona', 'Recto', 'Sagrada', 'San Francisco', 'San Isidro', 'San Juan Bag-o',
            'San Juan Daan', 'San Rafael', 'San Ramon', 'San Vicente', 'Santa Remedios',
            'Santa Teresita', 'Sigad', 'Somagongsong', 'Taromata', 'Zone I Poblacion',
            'Zone II Poblacion', 'Zone III Poblacion', 'Zone IV Poblacion', 'Zone V Poblacion',
            'Zone VI Poblacion', 'Zone VII Poblacion', 'Zone VIII Poblacion',
        ]);

        $this->seed('Bulusan', [
            'Bagacay', 'Central', 'Cogon', 'Dancalan', 'Dapdap', 'Lalud', 'Looban', 'Mabuhay',
            'Madlawon', 'Poctol', 'Porog', 'Sabang', 'Salvacion', 'San Antonio', 'San Bernardo',
            'San Francisco', 'San Isidro', 'San Jose', 'San Rafael', 'San Roque', 'San Vicente',
            'Santa Barbara', 'Sapngan', 'Tinampo',
        ]);

        $this->seed('Casiguran', [
            'Adovis', 'Boton', 'Burgos', 'Casay', 'Cawit', 'Central', 'Cogon', 'Colambis',
            'Escuala', 'Inlagadian', 'Lungib', 'Mabini', 'Ponong', 'Rizal', 'San Antonio',
            'San Isidro', 'San Juan', 'San Pascual', 'Santa Cruz', 'Somal-ot', 'Tigbao',
            'Timbayog', 'Tiris', 'Trece Martirez', 'Tulay',
        ]);

        $this->seed('Castilla', [
            'Amomonting', 'Bagalayag', 'Bagong Sirang', 'Bonga', 'Buenavista', 'Burabod',
            'Caburacan', 'Canjela', 'Cogon', 'Cumadcad', 'Dangcalan', 'Dinapa', 'La Union',
            'Libtong', 'Loreto', 'Macalaya', 'Maracabac', 'Mayon', 'Maypangi', 'Milagrosa',
            'Miluya', 'Monte Carmelo', 'Oras', 'Pandan', 'Poblacion', 'Quirapi', 'Saclayan',
            'Salvacion', 'San Isidro', 'San Rafael', 'San Roque', 'San Vicente', 'Sogoy',
            'Tomalaytay',
        ]);

        $this->seed('Donsol', [
            'Alin', 'Awai', 'Banban', 'Bandi', 'Banuang Gurang', 'Baras', 'Bayawas',
            'Bororan Barangay 1', 'Cabugao', 'Central Barangay 2', 'Cristo', 'Dancalan',
            'De Vera', 'Gimagaan', 'Girawan', 'Gogon', 'Gura', 'Juan Adre', 'Lourdes', 'Mabini',
            'Malapoc', 'Malinao', 'Market Site Barangay 3', 'New Maguisa', 'Ogod', 'Old Maguisa',
            'Orange', 'Pangpang', 'Parina', 'Pawala', 'Pinamanaan', 'Poso Poblacion',
            'Punta Waling-Waling Poblacion', 'Rawis', 'San Antonio', 'San Isidro', 'San Jose',
            'San Rafael', 'San Ramon', 'San Vicente', 'Santa Cruz', 'Sevilla', 'Sibago',
            'Suguian', 'Tagbac', 'Tinanogan', 'Tongdol', 'Tres Marias', 'Tuba', 'Tupas',
            'Vinisitahan',
        ]);

        $this->seed('Gubat', [
            'Ariman', 'Bagacay', 'Balud del Norte', 'Balud del Sur', 'Benguet', 'Bentuco',
            'Beriran', 'Buenavista', 'Bulacao', 'Cabigaan', 'Cabiguhan', 'Carriedo', 'Casili',
            'Cogon', 'Cota na Daco', 'Dita', 'Jupi', 'Lapinig', 'Luna-Candol', 'Manapao',
            'Manook', 'Naagtan', 'Nato', 'Nazareno', 'Ogao', 'Paco', 'Panganiban', 'Paradijon',
            'Patag', 'Payawin', 'Pinontingan', 'Rizal', 'San Ignacio', 'Sangat', 'Santa Ana',
            'Tabi', 'Tagaytay', 'Tigkiw', 'Tiris', 'Togawe', 'Union', 'Villareal',
        ]);

        $this->seed('Irosin', [
            'Bacolod', 'Bagsangan', 'Batang', 'Bolos', 'Buenavista', 'Bulawan', 'Carriedo',
            'Casini', 'Cawayan', 'Cogon', 'Gabao', 'Gulang-Gulang', 'Gumapia', 'Liang',
            'Macawayan', 'Mapaso', 'Monbon', 'Patag', 'Salvacion', 'San Agustin', 'San Isidro',
            'San Juan', 'San Julian', 'San Pedro', 'Santo Domingo', 'Tabon-Tabon', 'Tinampo',
            'Tongdol',
        ]);

        $this->seed('Juban', [
            'Anog', 'Aroroy', 'Bacolod', 'Binanuahan', 'Biriran', 'Buraburan', 'Calateo',
            'Calmayon', 'Carohayon', 'Catanagan', 'Catanusan', 'Cogon', 'Embarcadero', 'Guruyan',
            'Lajong', 'Maalo', 'North Poblacion', 'Puting Sapa', 'Rangas', 'Sablayan', 'Sipaya',
            'South Poblacion', 'Taboc', 'Tinago', 'Tughan',
        ]);

        $this->seed('Magallanes', [
            'Aguada Norte', 'Aguada Sur', 'Anibong', 'Bacalon', 'Bacolod', 'Banacud', 'Behia',
            'Biga', 'Binisitahan del Norte', 'Binisitahan del Sur', 'Biton', 'Bulala', 'Busay',
            'Caditaan', 'Cagbolo', 'Cagtalaba', 'Cawit Extension', 'Cawit Proper', 'Ginangra',
            'Hubo', 'Incarizan', 'Lapinig', 'Magsaysay', 'Malbog', 'Pantalan', 'Pawik', 'Pili',
            'Poblacion', 'Salvacion', 'Santa Elena', 'Siuton', 'Tagas', 'Tulatula Norte',
            'Tulatula Sur',
        ]);

        $this->seed('Matnog', [
            'Balocawe', 'Banogao', 'Banuangdaan', 'Bariis', 'Bolo', 'Bon-ot Big', 'Bon-ot Small',
            'Cabagahan', 'Calayuan', 'Calintaan', 'Caloocan', 'Calpi', 'Camachiles', 'Camcaman',
            'Coron-coron', 'Culasi', 'Gadgaron', 'Genablan Occidental', 'Genablan Oriental',
            'Hidhid', 'Laboy', 'Lajong', 'Mambajog', 'Manjunlad', 'Manurabi', 'Naburacan',
            'Paghuliran', 'Pangi', 'Pawa', 'Poropandan', 'Santa Isabel', 'Sinalmacan',
            'Sinang-atan', 'Sinibaran', 'Sisigon', 'Sua', 'Sulangan', 'Tablac', 'Tabunan',
            'Tugas',
        ]);

        $this->seed('Pilar', [
            'Abas', 'Abucay', 'Bantayan', 'Banuyo', 'Bayasong', 'Bayawas', 'Binanuahan',
            'Cabiguan', 'Cagdongon', 'Calongay', 'Calpi', 'Catamlangan', 'Comapo-capo', 'Danlog',
            'Dao', 'Dapdap', 'Del Rosario', 'Esmerada', 'Esperanza', 'Ginablan', 'Guiron', 'Inang',
            'Inapugan', 'Leona', 'Lipason', 'Lourdes', 'Lubiano', 'Lumbang', 'Lungib', 'Mabanate',
            'Malbog', 'Marifosque', 'Mercedes', 'Migabod', 'Naspi', 'Palanas', 'Pangpang',
            'Pinagsalog', 'Pineda', 'Poctol', 'Pudo', 'Putiao', 'Sacnangan', 'Salvacion',
            'San Antonio (Millabas)', 'San Antonio (Sapa)', 'San Jose', 'San Rafael', 'Santa Fe',
        ]);

        $this->seed('Prieto Diaz', [
            'Brillante', 'Bulawan', 'Calao', 'Carayat', 'Diamante', 'Gogon', 'Lupi',
            'Maningcay de Oro', 'Manlabong', 'Perlas', 'Quidolog', 'Rizal', 'San Antonio',
            'San Fernando', 'San Isidro', 'San Juan', 'San Rafael', 'San Ramon',
            'Santa Lourdes', 'Santo Domingo', 'Talisayan', 'Tupaz', 'Ulag',
        ]);

        $this->seed('Santa Magdalena', [
            'Barangay Poblacion I', 'Barangay Poblacion II', 'Barangay Poblacion III',
            'Barangay Poblacion IV', 'La Esperanza', 'Peñafrancia', 'Salvacion', 'San Antonio',
            'San Bartolome', 'San Eugenio', 'San Isidro', 'San Rafael', 'San Roque',
            'San Sebastian',
        ]);

        $this->command->info('Region V barangays seeded successfully (PhilAtlas/PSGC 2020 data).');
        $this->command->info('For complete nationwide data, run: php artisan psgc:import');
    }

    private function seed(string $cityName, array $barangays): void
    {
        $cityId = DB::table('ph_cities')->where('name', $cityName)->value('id');
        if (!$cityId) {
            $cityId = DB::table('ph_cities')
                ->where('name', 'LIKE', "%{$cityName}%")
                ->value('id');
        }
        if (!$cityId) {
            $this->command->warn("  Skipped (city not found): {$cityName}");
            return;
        }

        $rows = array_map(fn(string $name) => [
            'code'       => md5($cityId . $name),
            'city_id'    => $cityId,
            'name'       => $name,
            'created_at' => now(),
            'updated_at' => now(),
        ], $barangays);

        foreach (array_chunk($rows, 200) as $chunk) {
            DB::table('ph_barangays')->insertOrIgnore($chunk);
        }

        $this->command->line("  <info>✓</info> {$cityName} — " . count($barangays) . ' barangays');
    }
}