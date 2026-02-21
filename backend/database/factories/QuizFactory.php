<?php

namespace Database\Factories;

use App\Models\Quiz;
use App\Models\Week;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Quiz>
 */
class QuizFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = Quiz::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'week_id' => Week::factory(),
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'passing_score' => $this->faker->numberBetween(60, 90),
            'max_attempts' => $this->faker->numberBetween(1, 5),
            'duration' => $this->faker->optional()->numberBetween(5, 60), // 5 minutes to 1 hour
            'coin_reward' => $this->faker->numberBetween(10, 50),
            'randomize_questions' => $this->faker->boolean(),
            'show_results_immediately' => $this->faker->boolean(80),
        ];
    }

    /**
     * Indicate that the quiz has unlimited attempts.
     */
    public function unlimitedAttempts(): static
    {
        return $this->state(fn (array $attributes) => [
            'max_attempts' => null,
        ]);
    }

    /**
     * Indicate that the quiz has no time limit.
     */
    public function noTimeLimit(): static
    {
        return $this->state(fn (array $attributes) => [
            'duration' => null,
        ]);
    }
}