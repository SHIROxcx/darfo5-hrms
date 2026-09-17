<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\EmployeeProfile;
use App\Models\PdsPersonalInfo;
use App\Models\Position;
use App\Models\ServiceRecord;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds 10 demo permanent employees with full personal info and a 5-entry
 * service record history each. Only permanent employees get service
 * records — the Service Record tab in the profile only shows for them.
 */
class PermanentEmployeeSeeder extends Seeder
{
    private const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

    private const CIVIL_STATUSES = ['Single', 'Married', 'Widowed', 'Separated'];

    private const REMARKS_CYCLE = ['Original', 'NBC 594', 'NBC 597', 'NBC 601', 'NBC 604'];

    public function run(): void
    {
        $divisions = Division::with('sections')->get();
        $positions = Position::all();

        if ($divisions->isEmpty() || $positions->isEmpty()) {
            $this->command?->warn('PermanentEmployeeSeeder: no divisions/positions found — run DivisionSectionSeeder and PositionSeeder first.');

            return;
        }

        for ($i = 1; $i <= 10; $i++) {
            $firstName = fake()->firstName();
            $lastName = fake()->lastName();
            $email = "permanent{$i}@hris.com";

            $division = $divisions->random();
            $section = $division->sections->isNotEmpty() ? $division->sections->random() : null;
            $position = $positions->random();

            $dateHired = fake()->dateTimeBetween('-9 years', '-5 years');
            $employeeNumber = 'EMP-'.str_pad((string) (2000 + $i), 4, '0', STR_PAD_LEFT);

            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => "{$firstName} {$lastName}",
                    'first_name' => $firstName,
                    'middle_name' => fake()->lastName(),
                    'last_name' => $lastName,
                    'name_ext' => null,
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'is_approved' => true,
                ]
            );

            if (! $user->hasRole('employee')) {
                $user->assignRole('employee');
            }

            EmployeeProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'employee_number' => $employeeNumber,
                    'employment_type' => 'permanent',
                    'position' => $position->title,
                    'salary_grade' => (string) $position->salary_grade,
                    'place_assign' => 'DA RFO-5',
                    'division' => $division->name,
                    'section' => $section?->name,
                    'date_hired' => $dateHired->format('Y-m-d'),
                    'is_active' => true,
                ]
            );

            $sex = fake()->randomElement(['Male', 'Female']);

            PdsPersonalInfo::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'date_of_birth' => fake()->dateTimeBetween('-55 years', '-25 years')->format('Y-m-d'),
                    'sex' => $sex,
                    'birth_place' => fake()->city().', '.fake()->randomElement(['Camarines Sur', 'Albay', 'Sorsogon', 'Camarines Norte', 'Catanduanes', 'Masbate']),
                    'civil_status' => fake()->randomElement(self::CIVIL_STATUSES),
                    'mobile_number' => '09'.fake()->numerify('#########'),
                    'citizenship' => 'Filipino',
                    'citizenship_type' => 'by_birth',
                    'citizenship_country' => null,
                    'height' => $sex === 'Male' ? fake()->randomFloat(2, 1.6, 1.85) : fake()->randomFloat(2, 1.5, 1.7),
                    'weight' => fake()->numberBetween(45, 95),
                    'blood_type' => fake()->randomElement(self::BLOOD_TYPES),
                    'agency_employee_no' => $employeeNumber,
                    'res_house_no' => (string) fake()->buildingNumber(),
                    'res_street' => fake()->streetName(),
                    'res_subdivision' => null,
                    'res_barangay' => 'Barangay '.fake()->numberBetween(1, 30),
                    'res_city' => fake()->city(),
                    'res_province' => 'Camarines Sur',
                    'res_zipcode' => (string) fake()->numberBetween(4400, 4900),
                    'perm_house_no' => (string) fake()->buildingNumber(),
                    'perm_street' => fake()->streetName(),
                    'perm_subdivision' => null,
                    'perm_barangay' => 'Barangay '.fake()->numberBetween(1, 30),
                    'perm_city' => fake()->city(),
                    'perm_province' => 'Camarines Sur',
                    'perm_zipcode' => (string) fake()->numberBetween(4400, 4900),
                    'telephone' => fake()->numerify('(054) ###-####'),
                    'email' => $email,
                    'umid_number' => fake()->numerify('####-#######-#'),
                    'pagibig_number' => fake()->numerify('####-####-####'),
                    'philhealth_number' => fake()->numerify('##-#########-#'),
                    'philsys_number' => fake()->numerify('####-####-####-####'),
                    'tin_number' => fake()->numerify('###-###-###-###'),
                ]
            );

            // 5 chronological service record entries — same designation/station
            // across entries so the -do- ditto rendering in the PDF is exercised,
            // with a salary step-up and a rotating NBC remarks code each year.
            ServiceRecord::where('user_id', $user->id)->delete();

            $salary = fake()->numberBetween(22000, 45000);
            $yearFrom = (int) $dateHired->format('Y');

            for ($row = 0; $row < 5; $row++) {
                $isLast = $row === 4;
                $dateFrom = $row === 0
                    ? $dateHired->format('Y-m-d')
                    : sprintf('%d-01-01', $yearFrom + $row);
                $dateTo = $isLast ? null : sprintf('%d-12-31', $yearFrom + $row);

                ServiceRecord::create([
                    'user_id' => $user->id,
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'designation' => $position->title,
                    'employment_status' => 'Permanent',
                    'salary' => $salary,
                    'station_place_of_assignment' => 'DA RFO-5',
                    'branch' => "Nat'l",
                    'leave_without_pay' => null,
                    'separation_date' => null,
                    'separation_cause' => null,
                    'remarks' => self::REMARKS_CYCLE[$row],
                ]);

                $salary = (int) round($salary * 1.05);
            }
        }

        $this->command?->info('PermanentEmployeeSeeder: seeded 10 permanent employees with 5 service records each.');
    }
}
