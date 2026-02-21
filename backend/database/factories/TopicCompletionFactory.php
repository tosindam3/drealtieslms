<?php

namespace Database\Factories;

use App\Models\TopicCompletion;
use App\Models\User;
use App\Models\Topic;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TopicCompletion>
 */
class TopicCompletionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = TopicCompletion::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'topic_id' => Topic::factory(),
            'completed_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'coins_awarded' => $this->faker->numberBetween(5, 25),
            'completion_data' => [
                'time_spent' => $this->faker->numberBetween(60, 1800), // 1 minute to 30 minutes
                'progress_percentage' => 100,
            ],
        ];
    }

    /**
     * Indicate that the completion was recent.
     */
    public function recent(): static
    {
        return $this->state(fn (array $attributes) => [
            'completed_at' => $this->faker->dateTimeBetween('-1 day', 'now'),
        ]);
    }

    /**
     * Indicate that no coins were awarded.
     */
    public function noCoins(): static
    {
        return $this->state(fn (array $attributes) => [
            'coins_awarded' => 0,
        ]);
    }
}