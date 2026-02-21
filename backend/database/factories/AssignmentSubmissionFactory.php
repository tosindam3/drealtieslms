<?php

namespace Database\Factories;

use App\Models\AssignmentSubmission;
use App\Models\User;
use App\Models\Assignment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AssignmentSubmission>
 */
class AssignmentSubmissionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = AssignmentSubmission::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'assignment_id' => Assignment::factory(),
            'submission_text' => $this->faker->paragraphs(3, true),
            'file_path' => $this->faker->optional()->filePath(),
            'file_name' => $this->faker->optional()->word() . '.pdf',
            'file_size' => $this->faker->optional()->numberBetween(1024, 10240), // 1KB to 10MB
            'status' => $this->faker->randomElement(['submitted', 'approved', 'rejected', 'revision_requested']),
            'submitted_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'reviewed_at' => $this->faker->optional(0.7)->dateTimeBetween('-1 month', 'now'),
            'reviewer_feedback' => $this->faker->optional()->paragraph(),
            'coins_awarded' => 0,
            'metadata' => [],
        ];
    }

    /**
     * Indicate that the submission is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AssignmentSubmission::STATUS_APPROVED,
            'reviewed_at' => now(),
            'reviewer_feedback' => $this->faker->sentence(),
            'coins_awarded' => $this->faker->numberBetween(20, 100),
        ]);
    }

    /**
     * Indicate that the submission is rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AssignmentSubmission::STATUS_REJECTED,
            'reviewed_at' => now(),
            'reviewer_feedback' => $this->faker->paragraph(),
            'coins_awarded' => 0,
        ]);
    }

    /**
     * Indicate that the submission needs revision.
     */
    public function revisionRequested(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AssignmentSubmission::STATUS_REVISION_REQUESTED,
            'reviewed_at' => now(),
            'reviewer_feedback' => $this->faker->paragraph(),
            'coins_awarded' => 0,
        ]);
    }

    /**
     * Indicate that the submission is pending review.
     */
    public function submitted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AssignmentSubmission::STATUS_SUBMITTED,
            'reviewed_at' => null,
            'reviewer_feedback' => null,
            'coins_awarded' => 0,
        ]);
    }
}