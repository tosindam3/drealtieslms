<?php

namespace Database\Factories;

use App\Models\ModuleCompletion;
use App\Models\User;
use App\Models\Module;
use Illuminate\Database\Eloquent\Factories\Factory;

class ModuleCompletionFactory extends Factory
{
    protected $model = ModuleCompletion::class;

    public function definition(): array
    {
        $startedAt = $this->faker->dateTimeBetween('-30 days', '-1 day');
        $completed = $this->faker->boolean(70); // 70% chance of completion
        
        return [
            'user_id' => User::factory(),
            'module_id' => Module::factory(),
            'started_at' => $startedAt,
            'completed_at' => $completed ? $this->faker->dateTimeBetween($startedAt, 'now') : null,
            'time_spent_seconds' => $this->faker->numberBetween(300, 7200), // 5 min to 2 hours
            'completion_percentage' => $completed ? 100.00 : $this->faker->randomFloat(2, 0, 99.99),
            'completion_data' => [
                'lessons_completed' => $this->faker->numberBetween(0, 10),
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
