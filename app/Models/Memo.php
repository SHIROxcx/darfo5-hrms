<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * An official memo. A draft can be edited and deleted; a published memo is frozen; a withdrawn memo is hidden from
 * employees but kept. See docs/superpowers/specs/2026-11-21-memos-design.md.
 */
class Memo extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_WITHDRAWN = 'withdrawn';

    public const MODE_WRITTEN = 'written';

    public const MODE_UPLOADED = 'uploaded';

    protected $fillable = [
        'type', 'series_year', 'number', 'reference', 'subject', 'addressed_to', 'memo_date', 'memo_time', 'mode', 'body',
        'file_path', 'file_name', 'final_pdf_path', 'status', 'published_at', 'published_by', 'withdrawn_reason',
        'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'memo_date' => 'date:Y-m-d',
            'published_at' => 'datetime',
            'series_year' => 'integer',
            'number' => 'integer',
        ];
    }

    public function signatories(): HasMany
    {
        return $this->hasMany(MemoSignatory::class)->orderBy('sort_order');
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

    /** "No. 12, Series of 2026", or null until the memo is numbered at publish. */
    public function numberLabel(): ?string
    {
        return $this->number !== null ? "No. {$this->number}, Series of {$this->series_year}" : null;
    }
}
