<?php

namespace Database\Factories;

use App\Models\LiveClass;
use App\Models\Week;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LiveClass>
 */
class LiveClassFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = LiveClass::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'week_id' => Week::factory(),
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->paragraph(),
            'scheduled_at' => $this->faker->dateTimeBetween('now', '+1 month'),
            'duration' => $this->faker->numberBetween(30, 120),
            'join_url' => $this->faker->optional()->url(),
            'platform' => $this->faker->randomElement(['zoom', 'teams', 'direct', 'youtube']),
            'tracking_enabled' => $this->faker->boolean(90),
            'coin_reward' => $this->faker->numberBetween(15, 75),
            'status' => 'scheduled',
            'metadata' => [],
        ];
    }

    /**
     * Indicate that the live class is in progress.
     */
    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'live',
        ]);
    }

    /**
     * Indicate that the live class is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }

    /**
     * Indicate that the live class is cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
        ]);
    }
}