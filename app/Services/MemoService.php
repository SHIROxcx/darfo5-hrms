<?php

namespace App\Services;

use App\Models\Memo;
use App\Models\RecordEvent;
use App\Models\Signatory;
use App\Models\User;
use App\Notifications\MemoPublishedNotification;
use App\Support\MemoFiles;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

/** Everything that changes a memo: saving a draft, publishing it, and withdrawing or restoring it afterwards. */
class MemoService
{
    public const DEFAULT_ADDRESSED_TO = 'All DA RFO 5 Employees';

    /** How many times a publish takes a fresh number when another memo took the same one at the same moment. */
    private const NUMBER_ATTEMPTS = 3;

    public function __construct(private MemoPdfService $pdf, private MemoNotifier $notifier) {}

    /**
     * Create a draft, or change an existing one.
     *
     * @param  array  $data  type, subject, addressed_to, memo_date, memo_time, mode, body, reference, signatories
     *                       (a list of ['signatory_id' => int, 'label' => ?string])
     */
    public function saveDraft(array $data, ?UploadedFile $file, User $by, ?Memo $memo = null): Memo
    {
        return DB::transaction(function () use ($data, $file, $by, $memo) {
            $isNew = $memo === null;
            if (! $isNew) {
                // Publishing holds this row while it prints the PDF. Look at the memo as it is now, not as this request loaded it.
                $memo = $this->lockedDraft($memo, 'form', 'This memo is no longer a draft, so your changes were not saved.');
            }
            $memo ??= new Memo(['status' => Memo::STATUS_DRAFT, 'created_by' => $by->id]);
            $written = $data['mode'] === Memo::MODE_WRITTEN;

            $memo->fill([
                'type' => $data['type'],
                'subject' => $data['subject'],
                'addressed_to' => filled($data['addressed_to'] ?? null) ? $data['addressed_to'] : self::DEFAULT_ADDRESSED_TO,
                'memo_date' => $data['memo_date'],
                'memo_time' => filled($data['memo_time'] ?? null) ? Carbon::createFromFormat('H:i', $data['memo_time'])->format('H:i:s') : null,
                'mode' => $data['mode'],
                'body' => $written ? ($data['body'] ?? null) : null,
                'reference' => filled($data['reference'] ?? null) ? $data['reference'] : null,
                'updated_by' => $by->id,
            ]);

            $changed = $isNew ? [] : array_keys(Arr::except($memo->getDirty(), ['updated_by', 'updated_at']));
            $memo->save();

            if ($this->syncFile($memo, $written, $file)) {
                $changed[] = 'file';
            }
            if ($this->syncSignatories($memo, $data['signatories'] ?? [])) {
                $changed[] = 'signatories';
            }

            if ($isNew) {
                RecordEvent::record($memo, 'created', ['subject' => $memo->subject], $by);
            } elseif ($changed !== []) {
                RecordEvent::record($memo, 'updated', ['changed' => array_values(array_unique($changed))], $by);
            }

            return $memo->load('signatories');
        });
    }

    /** Remove a draft: it is hidden (soft deleted), its files go, and the history keeps a "deleted" line. */
    public function deleteDraft(Memo $memo, User $by): void
    {
        DB::transaction(function () use ($memo, $by) {
            $memo = $this->lockedDraft($memo, 'memo', 'This memo is no longer a draft, so it cannot be deleted.');

            RecordEvent::record($memo, 'deleted', ['subject' => $memo->subject], $by);
            MemoFiles::disk()->deleteDirectory(MemoFiles::memoDir($memo->id));
            $memo->delete();
        });
    }

    /**
     * Publish a draft: number it (a written memo), freeze its signatories, make its final PDF (a written memo), then tell
     * the employees. Nothing is published unless every step before the notices worked.
     *
     * @throws ValidationException when the memo is not ready (the messages say what is missing)
     * @throws HttpException 409 when the memo is not a draft
     */
    public function publish(Memo $memo, User $by): Memo
    {
        for ($attempt = 1; ; $attempt++) {
            try {
                $published = DB::transaction(fn () => $this->publishLocked($memo->id, $by));
                break;
            } catch (UniqueConstraintViolationException) {
                if ($attempt >= self::NUMBER_ATTEMPTS) {
                    throw ValidationException::withMessages([
                        'publish' => 'Another memo was published at the same moment and took the same number. Nothing was published. Please press Publish again.',
                    ]);
                }
            }
        }

        // The memo is published and saved. A failure to tell people must not turn that into an error for the publisher.
        try {
            $this->notifier->publishedMemo($published);
        } catch (Throwable $e) {
            Log::error("Memo {$published->id} was published, but telling employees failed: ".$e->getMessage());
        }

        return $published;
    }

    /** Take a published memo off the employees' pages, keep it, and remove its bell rows. The reason is kept in the history. */
    public function withdraw(Memo $memo, User $by, string $reason): Memo
    {
        $reason = trim($reason);
        $max = config('memos.limits.withdraw_reason');

        if ($reason === '') {
            throw ValidationException::withMessages(['reason' => 'Say why this memo is being withdrawn.']);
        }
        if (mb_strlen($reason) > $max) {
            throw ValidationException::withMessages(['reason' => "The reason can be up to {$max} characters."]);
        }

        return DB::transaction(function () use ($memo, $by, $reason) {
            $memo = Memo::lockForUpdate()->findOrFail($memo->id);
            if (! $memo->isPublished()) {
                throw new HttpException(409, 'Only a published memo can be withdrawn.');
            }

            $memo->update(['status' => Memo::STATUS_WITHDRAWN, 'withdrawn_reason' => $reason, 'updated_by' => $by->id]);

            DatabaseNotification::where('type', MemoPublishedNotification::class)
                ->where('data->url', "/memos/{$memo->id}")
                ->delete();

            RecordEvent::record($memo, 'withdrawn', ['reason' => $reason], $by);

            return $memo;
        });
    }

    /** Put a withdrawn memo back on the employees' pages. It keeps its number, and nobody is notified again. */
    public function restore(Memo $memo, User $by): Memo
    {
        return DB::transaction(function () use ($memo, $by) {
            $memo = Memo::lockForUpdate()->findOrFail($memo->id);
            if (! $memo->isWithdrawn()) {
                throw new HttpException(409, 'Only a withdrawn memo can be restored.');
            }

            $memo->update(['status' => Memo::STATUS_PUBLISHED, 'withdrawn_reason' => null, 'updated_by' => $by->id]);
            RecordEvent::record($memo, 'restored', [], $by);

            return $memo;
        });
    }

    /** One publish attempt, inside a transaction. The row is locked first, so two admins cannot publish the same draft twice. */
    private function publishLocked(int $memoId, User $by): Memo
    {
        $memo = Memo::lockForUpdate()->findOrFail($memoId);
        if (! $memo->isDraft()) {
            throw new HttpException(409, 'Only a draft can be published.');
        }

        $this->assertReadyToPublish($memo);

        $written = $memo->mode === Memo::MODE_WRITTEN;
        $year = now(config('memos.timezone'))->year;

        try {
            $memo->update([
                'status' => Memo::STATUS_PUBLISHED,
                'series_year' => $year,
                'number' => $written ? $this->nextNumber($memo->type, $year) : null,
                'published_at' => now(),
                'published_by' => $by->id,
                'updated_by' => $by->id,
            ]);

            $this->freezeSignatories($memo);

            if ($written) {
                $this->storeFinalPdf($memo);
            }

            RecordEvent::record($memo, 'published', ['number' => $memo->number, 'series_year' => $year], $by);
        } catch (Throwable $e) {
            // The database work rolls back; the files written so far are removed so a retry starts clean.
            MemoFiles::disk()->deleteDirectory(MemoFiles::memoDir($memo->id).'/signatures');
            MemoFiles::disk()->delete(MemoFiles::memoDir($memo->id).'/final.pdf');

            throw $e;
        }

        return $memo->load('signatories');
    }

    /** What a memo must have before it can go out. A written memo needs its text and a signatory; an uploaded one, its file. */
    private function assertReadyToPublish(Memo $memo): void
    {
        $errors = [];

        if ($memo->mode === Memo::MODE_WRITTEN) {
            if (blank(trim((string) $memo->body))) {
                $errors['body'] = 'Write the memo text before publishing.';
            }

            $rows = $memo->signatories()->with('signatory')->get();
            if ($rows->isEmpty()) {
                $errors['signatories'] = 'Add at least one signatory before publishing.';
            } elseif ($off = $rows->first(fn ($row) => ! $row->signatory?->is_active)) {
                $errors['signatories'] = "{$off->name} is no longer an active signatory. Remove them from this memo, or turn them back on under Signatories.";
            }
        } elseif ($memo->file_path === null || ! MemoFiles::disk()->exists($memo->file_path)) {
            $errors['file'] = 'Upload the memo file before publishing.';
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    /** The next number for this type in this series year. Soft-deleted memos count, because the unique index does. */
    private function nextNumber(string $type, int $year): int
    {
        return (int) Memo::withTrashed()
            ->where('type', $type)
            ->where('series_year', $year)
            ->lockForUpdate()
            ->max('number') + 1;
    }

    /** Copy each signatory's name, position and picture from the saved list into the memo, so later changes to the list never reach it. */
    private function freezeSignatories(Memo $memo): void
    {
        foreach ($memo->signatories()->with('signatory')->get() as $row) {
            $saved = $row->signatory;
            $row->update([
                'name' => $saved->name,
                'position' => $saved->position,
                'signature_path' => $this->copyPicture($memo, $row->sort_order, $saved->signature_path),
            ]);
        }
    }

    private function copyPicture(Memo $memo, int $sortOrder, ?string $savedPath): ?string
    {
        if ($savedPath === null || ! MemoFiles::disk()->exists($savedPath)) {
            return null;
        }

        $extension = strtolower(pathinfo($savedPath, PATHINFO_EXTENSION)) ?: 'png';
        $copy = MemoFiles::memoDir($memo->id)."/signatures/{$sortOrder}.{$extension}";
        MemoFiles::disk()->put($copy, MemoFiles::disk()->get($savedPath));

        return $copy;
    }

    /** Print the memo once, as published, and keep that PDF: it is what employees open. */
    private function storeFinalPdf(Memo $memo): void
    {
        try {
            $pdf = $this->pdf->buildPdf($memo->load('signatories'));
        } catch (Throwable $e) {
            Log::error("The PDF of memo {$memo->id} could not be made: ".$e->getMessage());

            throw ValidationException::withMessages([
                'publish' => 'The PDF could not be made right now, so nothing was published. Please try again in a moment.',
            ]);
        }

        $path = MemoFiles::memoDir($memo->id).'/final.pdf';
        MemoFiles::disk()->put($path, $pdf);
        $memo->update(['final_pdf_path' => $path]);
    }

    /** The memo as it is in the database right now, locked; refused with a plain message unless it is still a draft. */
    private function lockedDraft(Memo $memo, string $errorKey, string $message): Memo
    {
        $locked = Memo::lockForUpdate()->findOrFail($memo->id);

        if (! $locked->isDraft()) {
            throw ValidationException::withMessages([$errorKey => $message]);
        }

        return $locked;
    }

    /** Keep the uploaded file in step with the mode. Returns true when the file changed. */
    private function syncFile(Memo $memo, bool $written, ?UploadedFile $file): bool
    {
        if ($written) {
            if ($memo->file_path === null) {
                return false;
            }

            MemoFiles::disk()->delete($memo->file_path);
            $memo->update(['file_path' => null, 'file_name' => null]);

            return true;
        }

        if ($file === null) {
            return false;
        }

        if ($memo->file_path !== null) {
            MemoFiles::disk()->delete($memo->file_path);
        }

        $memo->update([
            'file_path' => $file->store(MemoFiles::memoDir($memo->id).'/file', MemoFiles::DISK),
            'file_name' => mb_substr($file->getClientOriginalName(), 0, 255),
        ]);

        return true;
    }

    /**
     * Make the memo's signatory rows match the list given, copying each person's name and position from the saved list.
     * Returns true when something changed.
     */
    private function syncSignatories(Memo $memo, array $rows): bool
    {
        $wanted = collect($rows)->map(fn (array $row) => [
            'signatory_id' => (int) $row['signatory_id'],
            'label' => filled($row['label'] ?? null) ? $row['label'] : null,
        ])->values();

        $current = $memo->signatories()->get()->map(fn ($row) => [
            'signatory_id' => $row->signatory_id,
            'label' => $row->label,
        ])->values();

        if ($wanted->all() === $current->all()) {
            return false;
        }

        $people = Signatory::whereIn('id', $wanted->pluck('signatory_id'))->get()->keyBy('id');

        $memo->signatories()->delete();
        foreach ($wanted as $position => $row) {
            $person = $people[$row['signatory_id']];
            $memo->signatories()->create([
                'signatory_id' => $person->id,
                'sort_order' => $position,
                'label' => $row['label'],
                'name' => $person->name,
                'position' => $person->position,
            ]);
        }

        return true;
    }
}
