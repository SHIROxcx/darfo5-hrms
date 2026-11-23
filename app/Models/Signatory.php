<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A person who may sign memos (name, position, an optional signature picture on the private disk).
 * Memos copy these details when they are published, so changing a signatory never changes an issued memo.
 */
class Signatory extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'position', 'signature_path', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
