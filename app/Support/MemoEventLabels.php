<?php

namespace App\Support;

use App\Models\RecordEvent;

/** The history of a memo in plain words, one line per event. */
final class MemoEventLabels
{
    /** What each edited column is called on screen. */
    private const FIELDS = [
        'subject' => 'subject',
        'file' => 'file',
    ];

    public static function for(RecordEvent $event): string
    {
        $details = $event->details ?? [];

        return match ($event->action) {
            'created' => 'Draft created',
            'updated' => self::withList('Edited', self::fields($details['changed'] ?? [])),
            'published' => 'Published',
            'withdrawn' => self::withList('Withdrawn', (string) ($details['reason'] ?? '')),
            'restored' => 'Restored',
            'deleted' => 'Draft deleted',
            default => ucfirst(str_replace('_', ' ', $event->action)),
        };
    }

    /** "subject, date" from the edited column names. */
    private static function fields(array $changed): string
    {
        return collect($changed)
            ->map(fn ($column) => self::FIELDS[$column] ?? str_replace('_', ' ', (string) $column))
            ->implode(', ');
    }

    private static function withList(string $label, string $list): string
    {
        return $list === '' ? $label : "{$label}: {$list}";
    }
}
