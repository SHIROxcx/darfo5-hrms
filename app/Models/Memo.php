<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * An official memo: an uploaded file (a PDF, Word document or picture) and nothing else. Its subject is the file's name and
 * its date is the day it was saved, or published. A draft can be replaced and deleted; a published memo is frozen; a withdrawn
 * memo is hidden from employees but kept. See docs/superpowers/specs/2026-11-21-memos-design.md.
 */
class Memo extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_WITHDRAWN = 'withdrawn';

    protected $fillable = [
        'subject', 'memo_date', 'file_path', 'file_name',
        'status', 'published_at', 'published_by', 'withdrawn_reason', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'memo_date' => 'date:Y-m-d',
            'published_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    /** The history of this memo (see RecordEvent). */
    public function events(): MorphMany
    {
        return $this->morphMany(RecordEvent::class, 'subject');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    /** Memos whose subject contains the text. "%" and "_" in the text are plain characters, not wildcards. */
    public function scopeSubjectContains(Builder $query, string $text): Builder
    {
        $escaped = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $text);

        return $query->whereRaw("subject like ? escape '!'", ["%{$escaped}%"]);
    }

    /** Admins and superadmins see every memo; everyone else sees published ones only. */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        return $user->hasAnyRole(['admin', 'superadmin']) ? $query : $query->published();
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    public function isWithdrawn(): bool
    {
        return $this->status === self::STATUS_WITHDRAWN;
    }
}
