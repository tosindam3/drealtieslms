<?php

namespace Database\Factories;

use App\Models\QuizAttempt;
use App\Models\User;
use App\Models\Quiz;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuizAttempt>
 */
class QuizAttemptFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = QuizAttempt::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        $scorePoints = $this->faker->numberBetween(0, 100);
        $totalPoints = 100;
        $scorePercentage = ($scorePoints / $totalPoints) * 100;
        $passingScore = $this->faker->numberBetween(60, 80);
        $passed = $scorePercentage >= $passingScore;
        
        return [
            'user_id' => User::factory(),
            'quiz_id' => Quiz::factory(),
            'attempt_number' => $this->faker->numberBetween(1, 3),
            'status' => $this->faker->randomElement(['in_progress', 'completed']),
            'score_points' => $scorePoints,
            'total_points' => $totalPoints,
            'score_percentage' => $scorePercentage,
            'passed' => $passed,
            'started_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'completed_at' => $this->faker->optional(0.9)->dateTimeBetween('-1 month', 'now'),
            'coins_awarded' => $passed ? $this->faker->numberBetween(10, 50) : 0,
            'answers' => [],
            'results' => [],
        ];
    }

    /**
     * Indicate that the attempt passed.
     */
    public function passed(): static
    {
        return $this->state(fn (array $attributes) => [
            'score_points' => $this->faker->numberBetween(80, 100),
            'score_percentage' => $this->faker->numberBetween(80, 100),
            'passed' => true,
            'status' => 'completed',
            'coins_awarded' => $this->faker->numberBetween(20, 50),
        ]);
    }

    /**
     * Indicate that the attempt failed.
     */
    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'score_points' => $this->faker->numberBetween(0, 59),
            'score_percentage' => $this->faker->numberBetween(0, 59),
            'passed' => false,
            'status' => 'completed',
            'coins_awarded' => 0,
        ]);
    }

    /**
     * Indicate that the attempt is incomplete.
     */
    public function incomplete(): static
    {
        return $this->state(fn (array $attributes) => [
            'completed_at' => null,
            'score_points' => 0,
            'score_percentage' => 0,
            'passed' => false,
            'status' => 'in_progress',
            'coins_awarded' => 0,
        ]);
    }
}