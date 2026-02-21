<?php

namespace Database\Factories;

use App\Models\Assignment;
use App\Models\Week;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Assignment>
 */
class AssignmentFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = Assignment::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'week_id' => Week::factory(),
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->paragraphs(3, true),
            'instructions_html' => $this->faker->optional()->paragraphs(2, true),
            'max_points' => $this->faker->numberBetween(50, 100),
            'submission_type' => $this->faker->randomElement(['file', 'link', 'text']),
            'allowed_extensions' => ['pdf', 'doc', 'docx', 'txt'],
            'max_file_size' => $this->faker->numberBetween(5, 20), // 5-20 MB
            'allow_resubmission' => $this->faker->boolean(80),
            'coin_reward' => $this->faker->numberBetween(20, 100),
            'deadline' => $this->faker->optional()->dateTimeBetween('now', '+2 weeks'),
            'reference_assets' => [],
        ];
    }

    /**
     * Indicate that the assignment has no deadline.
     */
    public function noDeadline(): static
    {
        return $this->state(fn (array $attributes) => [
            'deadline' => null,
        ]);
    }

    /**
     * Indicate that the assignment is overdue.
     */
    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'deadline' => $this->faker->dateTimeBetween('-1 week', '-1 day'),
        ]);
    }
}