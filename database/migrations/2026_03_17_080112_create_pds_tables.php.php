<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // PDS Personal Info — single source of truth for personal details
        Schema::create('pds_personal_info', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date_of_birth')->nullable();
            $table->enum('sex', ['Male', 'Female'])->nullable();
            $table->string('birth_place')->nullable();
            $table->enum('civil_status', ['Single', 'Married', 'Widowed', 'Separated', 'Other'])->nullable();
            $table->string('mobile_number', 20)->nullable();
            // Citizenship
            $table->string('citizenship')->nullable();
            $table->string('citizenship_type')->nullable(); // by_birth, by_naturalization
            $table->string('citizenship_country')->nullable();
            // Physical
            $table->float('height')->nullable();
            $table->float('weight')->nullable();
            $table->string('blood_type', 5)->nullable();
            $table->string('agency_employee_no')->nullable(); // admin-only
            // Residential Address
            $table->string('res_house_no')->nullable();
            $table->string('res_street')->nullable();
            $table->string('res_subdivision')->nullable();
            $table->string('res_barangay')->nullable();
            $table->string('res_city')->nullable();
            $table->string('res_province')->nullable();
            $table->string('res_zipcode', 10)->nullable();
            // Permanent Address
            $table->string('perm_house_no')->nullable();
            $table->string('perm_street')->nullable();
            $table->string('perm_subdivision')->nullable();
            $table->string('perm_barangay')->nullable();
            $table->string('perm_city')->nullable();
            $table->string('perm_province')->nullable();
            $table->string('perm_zipcode', 10)->nullable();
            // Contact
            $table->string('telephone')->nullable();
            $table->string('email')->nullable();
            // Government IDs (formerly in employee_profiles)
            $table->string('umid_number')->nullable();
            $table->string('pagibig_number')->nullable();
            $table->string('philhealth_number')->nullable();
            $table->string('philsys_number')->nullable();
            $table->string('tin_number')->nullable();
            $table->timestamps();
        });

        // Family Background
        Schema::create('pds_family_background', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Spouse
            $table->string('spouse_surname')->nullable();
            $table->string('spouse_first_name')->nullable();
            $table->string('spouse_middle_name')->nullable();
            $table->string('spouse_name_ext')->nullable();
            $table->string('spouse_occupation')->nullable();
            $table->string('spouse_employer')->nullable();
            $table->string('spouse_business_address')->nullable();
            $table->string('spouse_telephone')->nullable();
            // Father
            $table->string('father_surname')->nullable();
            $table->string('father_first_name')->nullable();
            $table->string('father_middle_name')->nullable();
            $table->string('father_name_ext')->nullable();
            // Mother
            $table->string('mother_surname')->nullable();
            $table->string('mother_first_name')->nullable();
            $table->string('mother_middle_name')->nullable();
            $table->timestamps();
        });

        // Children
        Schema::create('pds_children', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('full_name');
            $table->date('date_of_birth')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Educational Background
        Schema::create('pds_education', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('level', ['Elementary', 'Secondary', 'Vocational', 'College', 'Graduate Studies']);
            $table->string('school_name')->nullable();
            $table->string('course')->nullable();
            $table->string('period_from')->nullable();
            $table->string('period_to')->nullable();
            $table->string('highest_level')->nullable();
            $table->string('year_graduated')->nullable();
            $table->string('honors_received')->nullable();
            $table->timestamps();
        });

        // Civil Service Eligibility
        Schema::create('pds_eligibilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('career_service')->nullable();
            $table->string('rating')->nullable();
            $table->date('date_of_examination')->nullable();
            $table->string('place_of_examination')->nullable();
            $table->string('license_number')->nullable();
            $table->date('license_validity')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Work Experience
        Schema::create('pds_work_experience', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date_from')->nullable();
            $table->date('date_to')->nullable();
            $table->boolean('is_present')->default(false);
            $table->string('position_title')->nullable();
            $table->string('department')->nullable();
            $table->decimal('monthly_salary', 10, 2)->nullable();
            $table->string('salary_grade')->nullable();
            $table->string('status_of_appointment')->nullable();
            $table->boolean('is_government_service')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Voluntary Work
        Schema::create('pds_voluntary_work', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('organization_name')->nullable();
            $table->string('organization_address')->nullable();
            $table->date('date_from')->nullable();
            $table->date('date_to')->nullable();
            $table->integer('number_of_hours')->nullable();
            $table->string('position')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // L&D Trainings
        Schema::create('pds_trainings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->date('date_from')->nullable();
            $table->date('date_to')->nullable();
            $table->integer('number_of_hours')->nullable();
            $table->string('type_of_ld')->nullable();
            $table->string('conducted_by')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Other Information
        Schema::create('pds_other_info', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->json('special_skills')->nullable();
            $table->json('non_academic_distinctions')->nullable();
            $table->json('organization_memberships')->nullable();
            $table->timestamps();
        });

        // Questions (Page 4)
        Schema::create('pds_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->boolean('q34_a')->nullable(); // related within 3rd degree
            $table->boolean('q34_b')->nullable(); // related within 4th degree
            $table->string('q34_details')->nullable();
            $table->boolean('q35_a')->nullable(); // admin offense
            $table->string('q35_a_details')->nullable();
            $table->boolean('q35_b')->nullable(); // criminally charged
            $table->string('q35_b_date')->nullable();
            $table->string('q35_b_status')->nullable();
            $table->boolean('q36')->nullable(); // convicted
            $table->string('q36_details')->nullable();
            $table->boolean('q37_a')->nullable(); // election candidate
            $table->string('q37_a_details')->nullable();
            $table->boolean('q37_b')->nullable(); // resigned to campaign
            $table->string('q37_b_details')->nullable();
            $table->boolean('q38')->nullable(); // separated from service
            $table->string('q38_details')->nullable();
            $table->boolean('q39')->nullable(); // immigrant/permanent resident
            $table->string('q39_details')->nullable();
            $table->boolean('q40_a')->nullable(); // indigenous
            $table->string('q40_a_details')->nullable();
            $table->boolean('q40_b')->nullable(); // person with disability
            $table->string('q40_b_details')->nullable();
            $table->boolean('q40_c')->nullable(); // solo parent
            $table->string('q40_c_details')->nullable();
            $table->timestamps();
        });

        // References
        Schema::create('pds_references', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->string('address')->nullable();
            $table->string('telephone')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Government ID (Page 4)
        Schema::create('pds_government_id', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('id_type')->nullable();
            $table->string('id_number')->nullable();
            $table->string('date_of_issuance')->nullable();
            $table->string('place_of_issuance')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pds_government_id');
        Schema::dropIfExists('pds_references');
        Schema::dropIfExists('pds_questions');
        Schema::dropIfExists('pds_other_info');
        Schema::dropIfExists('pds_trainings');
        Schema::dropIfExists('pds_voluntary_work');
        Schema::dropIfExists('pds_work_experience');
        Schema::dropIfExists('pds_eligibilities');
        Schema::dropIfExists('pds_education');
        Schema::dropIfExists('pds_children');
        Schema::dropIfExists('pds_family_background');
        Schema::dropIfExists('pds_personal_info');
    }
};