<?php

namespace Database\Factories;

use App\Models\Module;
use App\Models\Week;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Module>
 */
class ModuleFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Module::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'week_id' => Week::factory(),
            'title' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'order' => fake()->numberBetween(1, 10),
            'position' => fake()->numberBetween(1, 10),
        ];
    }
}
