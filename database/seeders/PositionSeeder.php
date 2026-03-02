<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Position;

class PositionSeeder extends Seeder
{
    public function run(): void
    {
        $positions = [

            // ── Executive / Director Level ────────────────────────────────
            ['title' => 'Secretary of Department',                  'salary_grade' => 31],
            ['title' => 'Undersecretary',                           'salary_grade' => 30],
            ['title' => 'Assistant Secretary',                      'salary_grade' => 29],
            ['title' => 'Director IV',                              'salary_grade' => 28],
            ['title' => 'Director III',                             'salary_grade' => 27],
            ['title' => 'Director II',                              'salary_grade' => 26],
            ['title' => 'Director I',                               'salary_grade' => 25],

            // ── Regional / Division Chiefs ────────────────────────────────
            ['title' => 'Regional Director',                        'salary_grade' => 28],
            ['title' => 'Assistant Regional Director',              'salary_grade' => 27],
            ['title' => 'Chief Agriculturist',                      'salary_grade' => 24],
            ['title' => 'Agricultural Center Chief IV',             'salary_grade' => 24],
            ['title' => 'Agricultural Center Chief III',            'salary_grade' => 22],
            ['title' => 'Agricultural Center Chief II',             'salary_grade' => 20],
            ['title' => 'Agricultural Center Chief I',              'salary_grade' => 18],
            ['title' => 'Supervising Agriculturist',                'salary_grade' => 22],
            ['title' => 'Senior Agriculturist',                     'salary_grade' => 18],
            ['title' => 'Agriculturist II',                         'salary_grade' => 15],
            ['title' => 'Agriculturist I',                          'salary_grade' => 11],
            ['title' => 'Agricultural Technologist',                'salary_grade' => 10],
            ['title' => 'Agricultural Technician II',               'salary_grade' => 8],
            ['title' => 'Agricultural Technician I',                'salary_grade' => 6],
            ['title' => 'Agricultural Products Inspector III',      'salary_grade' => 11],
            ['title' => 'Agricultural Products Inspector II',       'salary_grade' => 8],
            ['title' => 'Agricultural Products Inspector I',        'salary_grade' => 6],
            ['title' => 'Provincial Agricultural Officer',          'salary_grade' => 26],
            ['title' => 'Municipal Agricultural Officer',           'salary_grade' => 20],

            // ── Administrative ────────────────────────────────────────────
            ['title' => 'Chief Administrative Officer',            'salary_grade' => 24],
            ['title' => 'Administrative Officer V',                'salary_grade' => 18],
            ['title' => 'Administrative Officer IV',               'salary_grade' => 15],
            ['title' => 'Administrative Officer III',              'salary_grade' => 14],
            ['title' => 'Administrative Officer II',               'salary_grade' => 11],
            ['title' => 'Administrative Officer I',                'salary_grade' => 10],
            ['title' => 'Administrative Assistant VI',             'salary_grade' => 12],
            ['title' => 'Administrative Assistant V',              'salary_grade' => 11],
            ['title' => 'Administrative Assistant IV',             'salary_grade' => 10],
            ['title' => 'Administrative Assistant III',            'salary_grade' => 9],
            ['title' => 'Administrative Assistant II',             'salary_grade' => 8],
            ['title' => 'Administrative Assistant I',              'salary_grade' => 7],
            ['title' => 'Administrative Aide VI',                  'salary_grade' => 6],
            ['title' => 'Administrative Aide V',                   'salary_grade' => 5],
            ['title' => 'Administrative Aide IV',                  'salary_grade' => 4],
            ['title' => 'Administrative Aide III',                 'salary_grade' => 3],
            ['title' => 'Administrative Aide II',                  'salary_grade' => 2],
            ['title' => 'Administrative Aide I',                   'salary_grade' => 1],

            // ── Finance & Accounting ──────────────────────────────────────
            ['title' => 'Accountant IV',                           'salary_grade' => 22],
            ['title' => 'Accountant III',                          'salary_grade' => 19],
            ['title' => 'Accountant II',                           'salary_grade' => 16],
            ['title' => 'Accountant I',                            'salary_grade' => 12],
            ['title' => 'Accounting Analyst',                      'salary_grade' => 11],
            ['title' => 'Accounting Clerk III',                    'salary_grade' => 8],
            ['title' => 'Accounting Clerk II',                     'salary_grade' => 6],
            ['title' => 'Accounting Clerk I',                      'salary_grade' => 4],
            ['title' => 'Budget Officer V',                        'salary_grade' => 22],
            ['title' => 'Budget Officer IV',                       'salary_grade' => 19],
            ['title' => 'Budget Officer III',                      'salary_grade' => 16],
            ['title' => 'Budget Officer II',                       'salary_grade' => 12],
            ['title' => 'Budget Officer I',                        'salary_grade' => 11],
            ['title' => 'Cashier IV',                              'salary_grade' => 19],
            ['title' => 'Cashier III',                             'salary_grade' => 16],
            ['title' => 'Cashier II',                              'salary_grade' => 12],
            ['title' => 'Cashier I',                               'salary_grade' => 8],

            // ── Human Resource ────────────────────────────────────────────
            ['title' => 'Human Resource Management Officer V',     'salary_grade' => 22],
            ['title' => 'Human Resource Management Officer IV',    'salary_grade' => 19],
            ['title' => 'Human Resource Management Officer III',   'salary_grade' => 16],
            ['title' => 'Human Resource Management Officer II',    'salary_grade' => 12],
            ['title' => 'Human Resource Management Officer I',     'salary_grade' => 11],
            ['title' => 'Human Resource Management Assistant',     'salary_grade' => 8],

            // ── Legal ─────────────────────────────────────────────────────
            ['title' => 'Attorney V',                              'salary_grade' => 26],
            ['title' => 'Attorney IV',                             'salary_grade' => 24],
            ['title' => 'Attorney III',                            'salary_grade' => 22],
            ['title' => 'Attorney II',                             'salary_grade' => 18],
            ['title' => 'Attorney I',                              'salary_grade' => 16],
            ['title' => 'Legal Officer V',                         'salary_grade' => 26],
            ['title' => 'Legal Officer IV',                        'salary_grade' => 24],
            ['title' => 'Legal Officer III',                       'salary_grade' => 22],
            ['title' => 'Legal Officer II',                        'salary_grade' => 18],
            ['title' => 'Legal Officer I',                         'salary_grade' => 16],
            ['title' => 'Legal Assistant II',                      'salary_grade' => 11],
            ['title' => 'Legal Assistant I',                       'salary_grade' => 10],

            // ── Information Technology ────────────────────────────────────
            ['title' => 'Information Technology Officer II',       'salary_grade' => 22],
            ['title' => 'Information Technology Officer I',        'salary_grade' => 19],
            ['title' => 'Programmer III',                          'salary_grade' => 19],
            ['title' => 'Programmer II',                           'salary_grade' => 16],
            ['title' => 'Programmer I',                            'salary_grade' => 12],
            ['title' => 'Computer Maintenance Technologist II',    'salary_grade' => 15],
            ['title' => 'Computer Maintenance Technologist I',     'salary_grade' => 11],
            ['title' => 'Data Entry Machine Operator III',         'salary_grade' => 8],
            ['title' => 'Data Entry Machine Operator II',          'salary_grade' => 6],
            ['title' => 'Data Entry Machine Operator I',           'salary_grade' => 4],

            // ── Engineering ───────────────────────────────────────────────
            ['title' => 'Engineer V',                              'salary_grade' => 24],
            ['title' => 'Engineer IV',                             'salary_grade' => 22],
            ['title' => 'Engineer III',                            'salary_grade' => 19],
            ['title' => 'Engineer II',                             'salary_grade' => 16],
            ['title' => 'Engineer I',                              'salary_grade' => 12],
            ['title' => 'Engineering Aide',                        'salary_grade' => 6],

            // ── Planning & Development ────────────────────────────────────
            ['title' => 'Planning Officer V',                      'salary_grade' => 22],
            ['title' => 'Planning Officer IV',                     'salary_grade' => 19],
            ['title' => 'Planning Officer III',                    'salary_grade' => 16],
            ['title' => 'Planning Officer II',                     'salary_grade' => 12],
            ['title' => 'Planning Officer I',                      'salary_grade' => 11],
            ['title' => 'Project Development Officer V',           'salary_grade' => 22],
            ['title' => 'Project Development Officer IV',          'salary_grade' => 19],
            ['title' => 'Project Development Officer III',         'salary_grade' => 16],
            ['title' => 'Project Development Officer II',          'salary_grade' => 12],
            ['title' => 'Project Development Officer I',           'salary_grade' => 11],

            // ── Information & Communications ──────────────────────────────
            ['title' => 'Information Officer V',                   'salary_grade' => 22],
            ['title' => 'Information Officer IV',                  'salary_grade' => 19],
            ['title' => 'Information Officer III',                 'salary_grade' => 16],
            ['title' => 'Information Officer II',                  'salary_grade' => 12],
            ['title' => 'Information Officer I',                   'salary_grade' => 11],

            // ── Supply / Property ─────────────────────────────────────────
            ['title' => 'Supply Officer IV',                       'salary_grade' => 19],
            ['title' => 'Supply Officer III',                      'salary_grade' => 16],
            ['title' => 'Supply Officer II',                       'salary_grade' => 12],
            ['title' => 'Supply Officer I',                        'salary_grade' => 11],
            ['title' => 'Property Custodian II',                   'salary_grade' => 11],
            ['title' => 'Property Custodian I',                    'salary_grade' => 10],

            // ── Records / Library ─────────────────────────────────────────
            ['title' => 'Records Officer III',                     'salary_grade' => 16],
            ['title' => 'Records Officer II',                      'salary_grade' => 12],
            ['title' => 'Records Officer I',                       'salary_grade' => 11],
            ['title' => 'Records Management Analyst',              'salary_grade' => 11],
            ['title' => 'Librarian III',                           'salary_grade' => 19],
            ['title' => 'Librarian II',                            'salary_grade' => 16],
            ['title' => 'Librarian I',                             'salary_grade' => 12],

            // ── Health / Medical ──────────────────────────────────────────
            ['title' => 'Medical Officer V',                       'salary_grade' => 26],
            ['title' => 'Medical Officer IV',                      'salary_grade' => 25],
            ['title' => 'Medical Officer III',                     'salary_grade' => 24],
            ['title' => 'Nurse III',                               'salary_grade' => 19],
            ['title' => 'Nurse II',                                'salary_grade' => 16],
            ['title' => 'Nurse I',                                 'salary_grade' => 12],

            // ── Security / Utility ─────────────────────────────────────────
            ['title' => 'Security Guard II',                       'salary_grade' => 6],
            ['title' => 'Security Guard I',                        'salary_grade' => 4],
            ['title' => 'Utility Worker II',                       'salary_grade' => 2],
            ['title' => 'Utility Worker I',                        'salary_grade' => 1],
            ['title' => 'Driver II',                               'salary_grade' => 4],
            ['title' => 'Driver I',                                'salary_grade' => 3],
            ['title' => 'Messenger',                               'salary_grade' => 3],
            ['title' => 'Janitor',                                 'salary_grade' => 1],

            // ── Statistics ────────────────────────────────────────────────
            ['title' => 'Statistician IV',                         'salary_grade' => 22],
            ['title' => 'Statistician III',                        'salary_grade' => 19],
            ['title' => 'Statistician II',                         'salary_grade' => 16],
            ['title' => 'Statistician I',                          'salary_grade' => 12],
            ['title' => 'Statistical Analyst',                     'salary_grade' => 11],

            // ── Science & Research ────────────────────────────────────────
            ['title' => 'Science Research Specialist II',          'salary_grade' => 15],
            ['title' => 'Science Research Specialist I',           'salary_grade' => 12],
            ['title' => 'Science Research Analyst',                'salary_grade' => 11],
            ['title' => 'Veterinarian III',                        'salary_grade' => 19],
            ['title' => 'Veterinarian II',                         'salary_grade' => 16],
            ['title' => 'Veterinarian I',                          'salary_grade' => 12],

        ];

        foreach ($positions as $position) {
            Position::create($position);
        }
    }
}