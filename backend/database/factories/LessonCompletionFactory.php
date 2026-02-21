<?php

namespace Database\Factories;

use App\Models\LessonCompletion;
use App\Models\User;
use App\Models\Lesson;
use Illuminate\Database\Eloquent\Factories\Factory;

class LessonCompletionFactory extends Factory
{
    protected $model = LessonCompletion::class;

    public function definition(): array
    {
        $startedAt = $this->faker->dateTimeBetween('-30 days', '-1 day');
        $completed = $this->faker->boolean(70); // 70% chance of completion
        
        return [
            'user_id' => User::factory(),
            'lesson_id' => Lesson::factory(),
            'started_at' => $startedAt,
            'completed_at' => $completed ? $this->faker->dateTimeBetween($startedAt, 'now') : null,
            'time_spent_seconds' => $this->faker->numberBetween(180, 3600), // 3 min to 1 hour
            'completion_percentage' => $completed ? 100.00 : $this->faker->randomFloat(2, 0, 99.99),
            'completion_data' => [
                'topics_completed' => $this->faker->numberBetween(0, 5),
            ],
            'coins_awarded' => 0,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'completed_at' => now(),
            'completion_percentage' => 100.00,
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'completed_at' => null,
            'completion_percentage' => $this->faker->randomFloat(2, 10, 90),
        ]);
    }
}
