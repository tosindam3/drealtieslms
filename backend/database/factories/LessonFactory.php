<?php

namespace Database\Factories;

use App\Models\Lesson;
use App\Models\Module;
use App\Models\Week;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Lesson>
 */
class LessonFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'module_id' => Module::factory(),
            'number' => fake()->numberBetween(1, 10),
            'title' => fake()->words(4, true),
            'description' => fake()->paragraph(),
            'thumbnail_url' => fake()->imageUrl(640, 480, 'education'),
            'estimated_duration' => fake()->numberBetween(15, 120),
            'order' => fake()->numberBetween(1, 10),
            'status' => fake()->randomElement(['draft', 'published', 'archived']),
            'is_free' => fake()->boolean(20), // 20% chance of being free
            'lesson_blocks' => [],
        ];
    }

    /**
     * Create a published lesson.
     */
    public function published(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'published',
        ]);
    }

    /**
     * Create a free lesson.
     */
    public function free(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_free' => true,
        ]);
    }
}
