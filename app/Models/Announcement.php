<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Announcement extends Model
{
    protected $fillable = ['title', 'body', 'date', 'tag', 'created_by'];

    protected $casts = [
        'date' => 'date',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Return the tag color classes used in both dashboards.
     */
    public static function tagColor(string $tag): string
    {
        return match ($tag) {
            'Reminder' => 'bg-yellow-100 text-yellow-700',
            'Policy'   => 'bg-blue-100 text-blue-700',
            'Health'   => 'bg-green-100 text-green-700',
            'Holiday'  => 'bg-red-100 text-red-700',
            default    => 'bg-gray-100 text-gray-600',
        };
    }
}