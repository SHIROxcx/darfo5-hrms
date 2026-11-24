<?php

namespace Database\Factories;

use App\Models\Memo;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Memo> */
class MemoFactory extends Factory
{
    /** A draft with its subject and date filled in and no file stored yet (tests attach one with attachMemoFile()). */
    public function definition(): array
    {
        return [
            'subject' => rtrim(fake()->sentence(6), '.'),
            'memo_date' => now()->toDateString(),
            'status' => Memo::STATUS_DRAFT,
            'created_by' => User::factory(),
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Memo::STATUS_PUBLISHED,
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
}
