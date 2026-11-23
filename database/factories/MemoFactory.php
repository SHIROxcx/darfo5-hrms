<?php

namespace Database\Factories;

use App\Models\Memo;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Memo> */
class MemoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'type' => 'Memorandum',
            'subject' => rtrim(fake()->sentence(6), '.'),
            'addressed_to' => 'All DA RFO 5 Employees',
            'memo_date' => now()->toDateString(),
            'memo_time' => null,
            'mode' => Memo::MODE_WRITTEN,
            'body' => fake()->paragraphs(2, true),
            'status' => Memo::STATUS_DRAFT,
            'created_by' => User::factory(),
        ];
    }

    /** Published and numbered (the next free number of its type and year). */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Memo::STATUS_PUBLISHED,
            'series_year' => 2026,
            'number' => fake()->unique()->numberBetween(1, 1_000_000),
            'published_at' => now(),
            'published_by' => User::factory(),
        ]);
    }

    public function withdrawn(): static
    {
        return $this->published()->state(fn (array $attributes) => [
            'status' => Memo::STATUS_WITHDRAWN,
            'withdrawn_reason' => 'Issued by mistake.',
        ]);
    }

    /** A memo that is a ready-made file, not text. */
    public function uploaded(): static
    {
        return $this->state(fn (array $attributes) => [
            'mode' => Memo::MODE_UPLOADED,
            'body' => null,
            'file_path' => 'memos/1/file/memo.pdf',
            'file_name' => 'memo.pdf',
        ]);
    }
}
