<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\ReadsQueryText;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMemoRequest;
use App\Http\Requests\Admin\UpdateMemoRequest;
use App\Models\Memo;
use App\Models\Signatory;
use App\Services\MemoPdfService;
use App\Services\MemoService;
use App\Support\MemoEventLabels;
use App\Support\MemoFiles;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

/** Memos for HR: write or upload a memo as a draft, change it, delete it, publish it, withdraw it and bring it back. */
class MemoController extends Controller
{
    use ReadsQueryText;

    public function __construct(private MemoService $memos) {}

    public function index(Request $request): Response
    {
        $status = $this->queryText($request, 'status');
        $type = $this->queryText($request, 'type');
        $search = $this->queryText($request, 'search');

        $memos = Memo::query()
            ->with('creator:id,name')
            ->when(in_array($status, [Memo::STATUS_DRAFT, Memo::STATUS_PUBLISHED, Memo::STATUS_WITHDRAWN], true), fn ($query) => $query->where('status', $status))
            ->when(in_array($type, config('memos.types'), true), fn ($query) => $query->where('type', $type))
            ->when($search !== '', fn ($query) => $query->subjectContains($search))
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
                'status' => $memo->status,
                'mode' => $memo->mode,
                'published_at' => $memo->published_at?->toIso8601String(),
                'created_by_name' => $memo->creator?->name,
            ]);

        $counts = Memo::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        return Inertia::render('Admin/Memos/Index', [
            'memos' => $memos,
            'filters' => [
                'status' => $status !== '' ? $status : null,
                'type' => $type !== '' ? $type : null,
                'search' => $search !== '' ? $search : null,
            ],
            'counts' => [
                'draft' => (int) ($counts[Memo::STATUS_DRAFT] ?? 0),
                'published' => (int) ($counts[Memo::STATUS_PUBLISHED] ?? 0),
                'withdrawn' => (int) ($counts[Memo::STATUS_WITHDRAWN] ?? 0),
            ],
            'types' => config('memos.types'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Memos/Create', $this->formProps() + [
            'defaults' => [
                'addressed_to' => MemoService::DEFAULT_ADDRESSED_TO,
                'memo_date' => now(config('memos.timezone'))->toDateString(),
            ],
        ]);
    }

    public function store(StoreMemoRequest $request): RedirectResponse
    {
        $memo = $this->memos->saveDraft($request->validated(), $request->file('file'), $request->user());

        return redirect()->route('admin.memos.edit', $memo)->with('success', 'Draft saved.');
    }

    /** One memo as saved, its history, and what HR may do with it now. */
    public function show(Request $request, Memo $memo): Response
    {
        $memo->load(['signatories.signatory', 'publisher:id,name']);
        $isHr = (bool) $request->user()->hasAnyRole(['admin', 'superadmin']);
        $live = $memo->isDraft();

        return Inertia::render('Admin/Memos/Show', [
            'memo' => [
                'id' => $memo->id,
                'type' => $memo->type,
                'status' => $memo->status,
                'number_label' => $memo->numberLabel(),
                'subject' => $memo->subject,
                'addressed_to' => $memo->addressed_to,
                'memo_date' => $memo->memo_date->toDateString(),
                'memo_time' => $memo->memo_time !== null ? substr($memo->memo_time, 0, 5) : null,
                'mode' => $memo->mode,
                'body' => $memo->body,
                'reference' => $memo->reference,
                'file_name' => $memo->file_name,
                'has_file' => MemoFiles::fileOf($memo) !== null,
                'published_at' => $memo->published_at?->toIso8601String(),
                'published_by_name' => $memo->publisher?->name,
                'withdrawn_reason' => $memo->withdrawn_reason,
            ],
            'signatories' => $memo->signatories->map(function ($row) use ($live) {
                $shown = $row->shown($live);

                return [
                    'label' => $row->label,
                    'name' => $shown->name,
                    'position' => $shown->position,
                    'has_signature' => $shown->signature_path !== null,
                ];
            })->all(),
            'events' => $memo->events()
                ->with('user:id,name')
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->get()
                ->map(fn ($event) => [
                    'id' => $event->id,
                    'action' => $event->action,
                    'label' => MemoEventLabels::for($event),
                    'user_name' => $event->user?->name,
                    'created_at' => $event->created_at->toIso8601String(),
                    'details' => $event->details,
                ])->all(),
            'can' => [
                'edit' => $isHr && $memo->isDraft(),
                'publish' => $isHr && $memo->isDraft(),
                'withdraw' => $isHr && $memo->isPublished(),
                'restore' => $isHr && $memo->isWithdrawn(),
                'delete' => $isHr && $memo->isDraft(),
            ],
        ]);
    }

    public function edit(Memo $memo): Response
    {
        abort_unless($memo->isDraft(), 403, 'Only a draft can be edited.');

        return Inertia::render('Admin/Memos/Edit', $this->formProps() + [
            'memo' => [
                'id' => $memo->id,
                'type' => $memo->type,
                'subject' => $memo->subject,
                'addressed_to' => $memo->addressed_to,
                'memo_date' => $memo->memo_date->toDateString(),
                'memo_time' => $memo->memo_time !== null ? substr($memo->memo_time, 0, 5) : null,
                'mode' => $memo->mode,
                'body' => $memo->body,
                'reference' => $memo->reference,
                'file_name' => $memo->file_name,
                'signatories' => $memo->signatories->map(fn ($row) => [
                    'signatory_id' => $row->signatory_id,
                    'label' => $row->label,
                ])->all(),
            ],
        ]);
    }

    public function update(UpdateMemoRequest $request, Memo $memo): RedirectResponse
    {
        $this->memos->saveDraft($request->validated(), $request->file('file'), $request->user(), $memo);

        return back()->with('success', 'Draft saved.');
    }

    public function destroy(Request $request, Memo $memo): RedirectResponse
    {
        abort_unless($memo->isDraft(), 403, 'Only a draft can be deleted.');

        $this->memos->deleteDraft($memo, $request->user());

        // Not back(): from the memo's own page that would point at the memo that was just deleted.
        return redirect()->route('admin.memos.index')->with('success', 'Draft deleted.');
    }

    /** Publish a draft. A problem (nothing to publish, no signatory, the PDF failed) comes back as plain messages. */
    public function publish(Request $request, Memo $memo): RedirectResponse
    {
        $this->memos->publish($memo, $request->user());

        // The draft's edit page is closed once it is published, so go to the memo's own page.
        return redirect()->route('admin.memos.show', $memo)->with('success', 'Memo published. Employees have been notified.');
    }

    public function withdraw(Request $request, Memo $memo): RedirectResponse
    {
        $reason = $request->input('reason');

        $this->memos->withdraw($memo, $request->user(), is_string($reason) ? $reason : '');

        return back()->with('success', 'Memo withdrawn. Employees can no longer see it.');
    }

    public function restore(Request $request, Memo $memo): RedirectResponse
    {
        $this->memos->restore($memo, $request->user());

        return back()->with('success', 'Memo restored. Employees can see it again.');
    }

    /**
     * The printed memo, inline. A draft is printed now with a DRAFT watermark; a published or withdrawn memo shows the
     * final copy frozen when it was published. An uploaded memo has nothing to print: its file is the memo.
     */
    public function preview(Memo $memo, MemoPdfService $pdf): HttpResponse
    {
        abort_if($memo->mode === Memo::MODE_UPLOADED, 404);

        if ($memo->isDraft()) {
            $content = $pdf->buildPdf($memo, preview: true);
        } else {
            abort_unless($memo->final_pdf_path && MemoFiles::disk()->exists($memo->final_pdf_path), 404);
            $content = MemoFiles::disk()->get($memo->final_pdf_path);
        }

        return response($content, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$pdf->filenameFor($memo).'"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /** What the create and edit forms share: the types and the signatories that can be picked. */
    private function formProps(): array
    {
        return [
            'types' => config('memos.types'),
            'signatories' => Signatory::active()->orderBy('name')->get()->map(fn (Signatory $signatory) => [
                'id' => $signatory->id,
                'name' => $signatory->name,
                'position' => $signatory->position,
                'has_signature' => $signatory->signature_path !== null,
            ])->all(),
        ];
    }
}
