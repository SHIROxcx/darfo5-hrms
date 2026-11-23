<?php

namespace Database\Factories;

use App\Models\Signatory;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Signatory> */
class SignatoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'position' => fake()->jobTitle(),
            'signature_path' => null,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
