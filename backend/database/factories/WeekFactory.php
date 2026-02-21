<?php

namespace Database\Factories;

use App\Models\Week;
use App\Models\Cohort;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Week>
 */
class WeekFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'cohort_id' => Cohort::factory(),
            'week_number' => fake()->numberBetween(1, 8),
            'title' => 'Week ' . fake()->numberBetween(1, 8) . ': ' . fake()->words(3, true),
            'description' => fake()->paragraph(),
            'unlock_rules' => [
                'min_coins' => fake()->numberBetween(0, 500),
                'required_completions' => [
                    'topics' => fake()->numberBetween(3, 8),
                    'quizzes' => fake()->numberBetween(1, 3),
                    'assignments' => fake()->numberBetween(0, 2),
                ],
            ],
        ];
    }

    /**
     * Create a week with no unlock requirements (Week 1).
     */
    public function firstWeek(): static
    {
        return $this->state(fn (array $attributes) => [
            'week_number' => 1,
            'title' => 'Week 1: Introduction to Forex Trading',
            'unlock_rules' => [
                'min_coins' => 0,
                'required_completions' => [],
            ],
        ]);
    }

    /**
     * Create a week with specific unlock requirements.
     */
    public function withUnlockRules(array $rules): static
    {
        return $this->state(fn (array $attributes) => [
            'unlock_rules' => $rules,
        ]);
    }
}