<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ReadsQueryText;
use App\Models\Memo;
use App\Support\MemoFiles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The employee side of memos: a read-only list and one memo. Everyone here sees published memos only, HR included;
 * HR sees the rest on the admin Memos tab.
 */
class MemoController extends Controller
{
    use ReadsQueryText;

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Memo::class);

        $search = $this->queryText($request, 'search');
        $year = $this->year($request);

        $memos = Memo::published()
            ->when($search !== '', fn ($query) => $query->subjectContains($search))
            ->when($year !== null, fn ($query) => $query->whereBetween('memo_date', ["{$year}-01-01", "{$year}-12-31"]))
            ->orderByDesc('memo_date')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Memo $memo) => [
                'id' => $memo->id,
                'type' => $memo->type,
                'number_label' => $memo->numberLabel(),
                'subject' => $memo->subject,
                'memo_date' => $memo->memo_date->toDateString(),
                'memo_time' => $this->time($memo),
                'addressed_to' => $memo->addressed_to,
            ]);

        return Inertia::render('Memos/Index', [
            'memos' => $memos,
            'filters' => ['search' => $search !== '' ? $search : null, 'year' => $year],
            'years' => Memo::published()->pluck('memo_date')->map(fn ($date) => $date->year)->unique()->sortDesc()->values()->all(),
        ]);
    }

    public function show(Memo $memo): Response
    {
        Gate::authorize('viewAny', Memo::class);
        abort_unless($memo->isPublished(), 404);

        $hasFile = MemoFiles::fileOf($memo) !== null;

        return Inertia::render('Memos/Show', [
            'memo' => [
                'id' => $memo->id,
                'type' => $memo->type,
                'number_label' => $memo->numberLabel(),
                'subject' => $memo->subject,
                'addressed_to' => $memo->addressed_to,
                'memo_date' => $memo->memo_date->toDateString(),
                'memo_time' => $this->time($memo),
                'mode' => $memo->mode,
                'body' => $memo->mode === Memo::MODE_WRITTEN ? $memo->body : null,
                'file_name' => $memo->mode === Memo::MODE_UPLOADED ? $memo->file_name : null,
                'has_file' => $hasFile,
            ],
            'signatories' => $memo->signatories->map(fn ($row) => [
                'label' => $row->label,
                'name' => $row->name,
                'position' => $row->position,
            ])->all(),
            'file_url' => $hasFile ? route('memos.file', $memo, false) : null,
        ]);
    }

    private function year(Request $request): ?int
    {
        $value = $this->queryText($request, 'year');

        return preg_match('/^\d{4}$/', $value) ? (int) $value : null;
    }

    private function time(Memo $memo): ?string
    {
        return $memo->memo_time !== null ? substr($memo->memo_time, 0, 5) : null;
    }
}
