<?php

namespace App\Services;

use App\Models\EmployeeProfile;
use App\Models\PdsChild;
use App\Models\PdsEducation;
use App\Models\PdsEligibility;
use App\Models\PdsFamilyBackground;
use App\Models\PdsGovernmentId;
use App\Models\PdsOtherInfo;
use App\Models\PdsPersonalInfo;
use App\Models\PdsQuestion;
use App\Models\PdsReference;
use App\Models\PdsTraining;
use App\Models\PdsVoluntaryWork;
use App\Models\PdsWorkExperience;
use App\Models\User;
use App\Support\PdfBrowsershot;
use App\Support\PdsRowSplitter;
use Illuminate\Support\Collection;
use Spatie\Browsershot\Browsershot;

/**
 * Renders CS Form No. 212 (Personal Data Sheet) for one employee.
 */
class PdsPdfService
{
    /**
     * Rows that fit [on the main page, on one continuation sheet] of the official
     * CS Form 212 Revised 2026 (sheets C1-C4 and C5-C11 of the workbook).
     */
    public const CAPACITY = [
        'children' => [13, 20],               // C1 rows 37-49 / C7
        'education' => [5, 38],               // five levels / C8
        'eligibility' => [7, 24],             // C2 / C9
        'work_experience' => [24, 34],        // C2 / C6
        'learning_development' => [17, 44],   // C3 / C5
        'voluntary_work' => [9, 29],          // C3 / C10
        'other_info' => [7, 32],              // C3 / C11
    ];

    private const EDUCATION_LEVELS = ['Elementary', 'Secondary', 'Vocational', 'College', 'Graduate Studies'];

    /**
     * Everything the PDS view needs for one employee.
     *
     * @return array{user: User, ep: ?EmployeeProfile, pds: array<string, mixed>}
     */
    public function dataFor(User $user): array
    {
        $id = $user->id;

        return [
            'user' => $user,
            'ep' => EmployeeProfile::where('user_id', $id)->first(),
            'pds' => [
                'personal' => PdsPersonalInfo::where('user_id', $id)->first(),
                'family' => PdsFamilyBackground::where('user_id', $id)->first(),
                'children' => PdsChild::where('user_id', $id)->orderBy('sort_order')->get(),
                'education' => PdsEducation::where('user_id', $id)->get(),
                'eligibilities' => PdsEligibility::where('user_id', $id)->orderBy('sort_order')->get(),
                'work_experience' => PdsWorkExperience::where('user_id', $id)->orderBy('sort_order')->get(),
                'voluntary_work' => PdsVoluntaryWork::where('user_id', $id)->orderBy('sort_order')->get(),
                'trainings' => PdsTraining::where('user_id', $id)->orderBy('sort_order')->get(),
                'other_info' => PdsOtherInfo::where('user_id', $id)->first(),
                'questions' => PdsQuestion::where('user_id', $id)->first(),
                'references' => PdsReference::where('user_id', $id)->orderBy('sort_order')->get(),
                'government_id' => PdsGovernmentId::where('user_id', $id)->first(),
            ],
        ];
    }

    /**
     * Each section's rows split into what the main page holds and the continuation
     * sheets that carry the overflow: ['main' => Collection, 'sheets' => list<Collection>].
     *
     * @param  array<string, mixed>  $pds  the 'pds' part of dataFor()
     * @return array<string, array{main: Collection, sheets: list<Collection>}>
     */
    public function sectionsFor(array $pds): array
    {
        $split = fn (string $key, iterable $rows) => PdsRowSplitter::split($rows, ...self::CAPACITY[$key]);

        return [
            'children' => $split('children', $pds['children'] ?? []),
            'education' => $this->educationSections($pds['education'] ?? []),
            'eligibility' => $split('eligibility', $pds['eligibilities'] ?? []),
            'work_experience' => $split('work_experience', $pds['work_experience'] ?? []),
            'learning_development' => $split('learning_development', $pds['trainings'] ?? []),
            'voluntary_work' => $split('voluntary_work', $pds['voluntary_work'] ?? []),
            'other_info' => $split('other_info', $this->otherInfoRows($pds['other_info'] ?? null)),
        ];
    }

    /**
     * Render the PDS Blade view for one employee.
     *
     * $preview adds an on-screen page outline for the browser-based
     * html-preview route only; it never applies to the actual PDF.
     */
    public function buildHtml(User $user, bool $preview = false): string
    {
        $data = $this->dataFor($user);

        return view('pds.pdf', $data + [
            'preview' => $preview,
            'sections' => $this->sectionsFor($data['pds']),
        ])->render();
    }

    public function buildPdf(User $user): string
    {
        return $this->buildBrowsershot($this->buildHtml($user))->pdf();
    }

    public function filenameFor(User $user): string
    {
        return 'PDS_'
            .str_replace(' ', '_', strtoupper($user->last_name ?? 'EMPLOYEE'))
            .'_'.now()->format('Ymd').'.pdf';
    }

    /**
     * The first row of each level stays on page 1; any further row of a level goes to C8.
     */
    private function educationSections(iterable $rows): array
    {
        $byLevel = collect($rows)->groupBy('level');

        $main = collect(self::EDUCATION_LEVELS)
            ->map(fn (string $level) => $byLevel->get($level)?->first())
            ->filter()
            ->values();

        $extras = collect(self::EDUCATION_LEVELS)
            ->flatMap(fn (string $level) => $byLevel->get($level, collect())->slice(1))
            ->values();

        return [
            'main' => $main,
            'sheets' => $extras->chunk(self::CAPACITY['education'][1])
                ->map(fn (Collection $sheet) => $sheet->values())
                ->values()
                ->all(),
        ];
    }

    /**
     * The three stored lists side by side: one row per index, as the form prints them.
     */
    private function otherInfoRows(?PdsOtherInfo $info): Collection
    {
        $skills = $info?->special_skills ?? [];
        $distinctions = $info?->non_academic_distinctions ?? [];
        $memberships = $info?->organization_memberships ?? [];

        return Collection::times(
            max(count($skills), count($distinctions), count($memberships)),
            fn (int $n) => [
                'skill' => $skills[$n - 1] ?? null,
                'distinction' => $distinctions[$n - 1] ?? null,
                'membership' => $memberships[$n - 1] ?? null,
            ]
        );
    }

    private function buildBrowsershot(string $html): Browsershot
    {
        // A4, like the official workbook. The view zooms its pages to the 188 x 278 mm printable area.
        return PdfBrowsershot::make($html)
            ->format('A4')
            ->margins(11, 11, 8, 11, 'mm')
            ->showBackground()
            ->waitUntilNetworkIdle()
            ->deviceScaleFactor(2)
            ->timeout(60);
    }
}
