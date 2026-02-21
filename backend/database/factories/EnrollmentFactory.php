<?php

namespace Database\Factories;

use App\Models\Enrollment;
use App\Models\User;
use App\Models\Cohort;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Enrollment>
 */
class EnrollmentFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = Enrollment::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'cohort_id' => Cohort::factory(),
            'enrolled_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'status' => $this->faker->randomElement(['active', 'completed', 'dropped', 'suspended']),
            'completion_percentage' => $this->faker->randomFloat(2, 0, 100),
            'completed_at' => $this->faker->optional(0.3)->dateTime(),
            'metadata' => [],
        ];
    }

    /**
     * Indicate that the enrollment is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Enrollment::STATUS_ACTIVE,
            'completed_at' => null,
        ]);
    }

    /**
     * Indicate that the enrollment is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Enrollment::STATUS_COMPLETED,
            'completion_percentage' => 100.00,
            'completed_at' => now(),
        ]);
    }

    /**
     * Indicate that the enrollment is dropped.
     */
    public function dropped(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Enrollment::STATUS_DROPPED,
        ]);
    }
}