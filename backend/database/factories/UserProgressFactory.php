<?php

namespace Database\Factories;

use App\Models\UserProgress;
use App\Models\User;
use App\Models\Cohort;
use App\Models\Week;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserProgress>
 */
class UserProgressFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = UserProgress::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'cohort_id' => Cohort::factory(),
            'week_id' => Week::factory(),
            'completion_percentage' => $this->faker->randomFloat(2, 0, 100),
            'is_unlocked' => $this->faker->boolean(),
            'unlocked_at' => $this->faker->optional()->dateTime(),
            'completed_at' => $this->faker->optional()->dateTime(),
            'completion_data' => [],
        ];
    }

    /**
     * Indicate that the week is unlocked.
     */
    public function unlocked(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_unlocked' => true,
            'unlocked_at' => now(),
        ]);
    }

    /**
     * Indicate that the week is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'completion_percentage' => 100.00,
            'completed_at' => now(),
        ]);
    }

    /**
     * Indicate that the week is locked.
     */
    public function locked(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_unlocked' => false,
            'unlocked_at' => null,
            'completion_percentage' => 0.00,
            'completed_at' => null,
        ]);
    }
}