<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\ReadsQueryText;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMemoRequest;
use App\Http\Requests\Admin\UpdateMemoRequest;
use App\Models\Memo;
use App\Services\MemoService;
use App\Support\MemoEventLabels;
use App\Support\MemoFiles;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Memos for HR: upload a memo file as a draft, replace it, delete it, publish it, withdraw it and bring it back. */
class MemoController extends Controller
{
    use ReadsQueryText;

    public function __construct(private MemoService $memos) {}

    public function index(Request $request): Response
    {
        $status = $this->queryText($request, 'status');
        $search = $this->queryText($request, 'search');

        $memos = Memo::query()
            ->with('creator:id,name')
            ->when(in_array($status, [Memo::STATUS_DRAFT, Memo::STATUS_PUBLISHED, Memo::STATUS_WITHDRAWN], true), fn ($query) => $query->where('status', $status))
            ->when($search !== '', fn ($query) => $query->subjectContains($search))
            ->orderByDesc('memo_date')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Memo $memo) => [
                'id' => $memo->id,
                'subject' => $memo->subject,
                'memo_date' => $memo->memo_date->toDateString(),
                'status' => $memo->status,
                'published_at' => $memo->published_at?->toIso8601String(),
                'created_by_name' => $memo->creator?->name,
            ]);

        $counts = Memo::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        return Inertia::render('Admin/Memos/Index', [
            'memos' => $memos,
            'filters' => [
                'status' => $status !== '' ? $status : null,
                'search' => $search !== '' ? $search : null,
            ],
            'counts' => [
                'draft' => (int) ($counts[Memo::STATUS_DRAFT] ?? 0),
                'published' => (int) ($counts[Memo::STATUS_PUBLISHED] ?? 0),
                'withdrawn' => (int) ($counts[Memo::STATUS_WITHDRAWN] ?? 0),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Memos/Create');
    }

    public function store(StoreMemoRequest $request): RedirectResponse
    {
        $memo = $this->memos->saveDraft($request->file('file'), $request->user());

        return redirect()->route('admin.memos.edit', $memo)->with('success', 'Draft saved.');
    }

    /** One memo as saved, its history, and what HR may do with it now. */
    public function show(Request $request, Memo $memo): Response
    {
        $memo->load('publisher:id,name');
        $isHr = (bool) $request->user()->hasAnyRole(['admin', 'superadmin']);

        return Inertia::render('Admin/Memos/Show', [
            'memo' => [
                'id' => $memo->id,
                'status' => $memo->status,
                'subject' => $memo->subject,
                'memo_date' => $memo->memo_date->toDateString(),
                'file_name' => $memo->file_name,
                'has_file' => MemoFiles::fileOf($memo) !== null,
                'published_at' => $memo->published_at?->toIso8601String(),
                'published_by_name' => $memo->publisher?->name,
                'withdrawn_reason' => $memo->withdrawn_reason,
            ],
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

        return Inertia::render('Admin/Memos/Edit', [
            'memo' => [
                'id' => $memo->id,
                'subject' => $memo->subject,
                'file_name' => $memo->file_name,
            ],
        ]);
    }

    public function update(UpdateMemoRequest $request, Memo $memo): RedirectResponse
    {
        $this->memos->saveDraft($request->file('file'), $request->user(), $memo);

        return back()->with('success', 'Draft saved.');
    }

    public function destroy(Request $request, Memo $memo): RedirectResponse
    {
        abort_unless($memo->isDraft(), 403, 'Only a draft can be deleted.');

        $this->memos->deleteDraft($memo, $request->user());

        // Not back(): from the memo's own page that would point at the memo that was just deleted.
        return redirect()->route('admin.memos.index')->with('success', 'Draft deleted.');
    }

    /** Publish a draft. A draft with no file comes back as a plain message. */
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
}
