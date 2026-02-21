<?php

namespace Database\Factories;

use App\Models\Cohort;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Cohort>
 */
class CohortFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = fake()->dateTimeBetween('now', '+30 days');
        $endDate = (clone $startDate)->modify('+8 weeks');

        return [
            'name' => fake()->words(3, true) . ' Cohort',
            'description' => fake()->paragraph(),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'capacity' => fake()->numberBetween(20, 100),
            'status' => fake()->randomElement(['draft', 'published', 'active', 'completed']),
        ];
    }

    /**
     * Create a draft cohort.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
        ]);
    }

    /**
     * Create a published cohort.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'published',
        ]);
    }

    /**
     * Create an active cohort.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
            'start_date' => fake()->dateTimeBetween('-2 weeks', 'now'),
        ]);
    }

    /**
     * Create a completed cohort.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'start_date' => fake()->dateTimeBetween('-12 weeks', '-8 weeks'),
            'end_date' => fake()->dateTimeBetween('-4 weeks', 'now'),
        ]);
    }
}