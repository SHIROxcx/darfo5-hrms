<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;
use LogicException;

/**
 * One line of the shared history of memos and announcements: who did what to which record, and when.
 *
 * Append-only. A history that can be edited or deleted is not a history, so the model refuses to change or remove a row.
 */
class RecordEvent extends Model
{
    public $timestamps = false;

    protected $fillable = ['subject_type', 'subject_id', 'user_id', 'action', 'details', 'created_at'];

    protected function casts(): array
    {
        return [
            'details' => 'array',
            'created_at' => 'datetime',
        ];
    }

    /** Write one event. `$by` defaults to the logged-in user; the scheduler has none, so it stays empty. */
    public static function record(Model $subject, string $action, array $details = [], ?User $by = null): self
    {
        return static::create([
            'subject_type' => $subject::class,
            'subject_id' => $subject->getKey(),
            'user_id' => ($by ?? Auth::user())?->getKey(),
            'action' => $action,
            'details' => $details ?: null,
            'created_at' => now(),
        ]);
    }

    /** The history of one record, newest first. */
    public function scopeFor(Builder $query, Model $subject): Builder
    {
        return $query
            ->where('subject_type', $subject::class)
            ->where('subject_id', $subject->getKey())
            ->latest('created_at')
            ->latest('id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function update(array $attributes = [], array $options = []): never
    {
        throw new LogicException('History rows cannot be changed.');
    }

    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new LogicException('History rows cannot be changed.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('History rows cannot be deleted.');
    }

    public function forceDelete(): never
    {
        throw new LogicException('History rows cannot be deleted.');
    }
}
