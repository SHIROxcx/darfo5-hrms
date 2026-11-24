<?php

namespace App\Services;

use App\Models\Memo;
use App\Models\RecordEvent;
use App\Models\User;
use App\Notifications\MemoPublishedNotification;
use App\Support\FileTitle;
use App\Support\MemoFiles;
use Illuminate\Http\UploadedFile;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

/** Everything that changes a memo: saving a draft, publishing it, and withdrawing or restoring it afterwards. */
class MemoService
{
    public function __construct(private MemoNotifier $notifier) {}

    /**
     * Create a draft from a file, or replace the file of an existing draft. The subject is the file's name, and a new memo is
     * dated today (a memo is dated again with the day it is published).
     */
    public function saveDraft(UploadedFile $file, User $by, ?Memo $memo = null): Memo
    {
        return DB::transaction(function () use ($file, $by, $memo) {
            $isNew = $memo === null;
            if (! $isNew) {
                // Look at the memo as it is now, not as this request loaded it: it may have been published in between.
                $memo = $this->lockedDraft($memo, 'form', 'This memo is no longer a draft, so your changes were not saved.');
            }
            $memo ??= new Memo(['status' => Memo::STATUS_DRAFT, 'created_by' => $by->id, 'memo_date' => $this->today()]);

            $memo->fill(['subject' => FileTitle::from($file, 'Memo'), 'updated_by' => $by->id]);

            $changed = $isNew ? [] : array_keys(Arr::except($memo->getDirty(), ['updated_by', 'updated_at']));
            $memo->save();

            $this->storeFile($memo, $file);
            $changed[] = 'file';

            if ($isNew) {
                RecordEvent::record($memo, 'created', ['subject' => $memo->subject], $by);
            } else {
                RecordEvent::record($memo, 'updated', ['changed' => array_values(array_unique($changed))], $by);
            }

            return $memo;
        });
    }

    /** Remove a draft: it is hidden (soft deleted), its file goes, and the history keeps a "deleted" line. */
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
     * Publish a draft, then tell the employees. Nothing is published unless the memo has its file.
     *
     * @throws ValidationException when the memo has no file (the message says so)
     * @throws HttpException 409 when the memo is not a draft
     */
    public function publish(Memo $memo, User $by): Memo
    {
        $published = DB::transaction(function () use ($memo, $by) {
            // The row is locked first, so two admins cannot publish the same draft twice.
            $locked = Memo::lockForUpdate()->findOrFail($memo->id);
            if (! $locked->isDraft()) {
                throw new HttpException(409, 'Only a draft can be published.');
            }

            if (MemoFiles::fileOf($locked) === null) {
                throw ValidationException::withMessages(['file' => 'Upload the memo file before publishing.']);
            }

            // The memo is dated with the day it goes out, not the day its file was first saved.
            $locked->update(['status' => Memo::STATUS_PUBLISHED, 'memo_date' => $this->today(), 'published_at' => now(), 'published_by' => $by->id, 'updated_by' => $by->id]);
            RecordEvent::record($locked, 'published', [], $by);

            return $locked;
        });

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

    /** Put a withdrawn memo back on the employees' pages. Nobody is notified again. */
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

    /** The memo as it is in the database right now, locked; refused with a plain message unless it is still a draft. */
    private function lockedDraft(Memo $memo, string $errorKey, string $message): Memo
    {
        $locked = Memo::lockForUpdate()->findOrFail($memo->id);

        if (! $locked->isDraft()) {
            throw ValidationException::withMessages([$errorKey => $message]);
        }

        return $locked;
    }

    /** Today's date in the office's time zone (the app itself runs in UTC, a day behind in the early morning). */
    private function today(): string
    {
        return now(config('memos.timezone'))->toDateString();
    }

    /** Keep the uploaded file, replacing the one the draft had. */
    private function storeFile(Memo $memo, UploadedFile $file): void
    {
        if ($memo->file_path !== null) {
            MemoFiles::disk()->delete($memo->file_path);
        }

        $memo->update([
            'file_path' => $file->store(MemoFiles::memoDir($memo->id).'/file', MemoFiles::DISK),
            'file_name' => mb_substr($file->getClientOriginalName(), 0, 255),
        ]);
    }
}
