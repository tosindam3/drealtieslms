<?php

namespace Database\Factories;

use App\Models\LiveAttendance;
use App\Models\User;
use App\Models\LiveClass;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LiveAttendance>
 */
class LiveAttendanceFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = LiveAttendance::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        $joinedAt = $this->faker->dateTimeBetween('-1 week', 'now');
        $leftAt = $this->faker->optional(0.8)->dateTimeBetween($joinedAt, 'now');
        
        return [
            'user_id' => User::factory(),
            'live_class_id' => LiveClass::factory(),
            'joined_at' => $joinedAt,
            'left_at' => $leftAt,
            'attended' => $this->faker->boolean(85), // 85% attendance rate
            'attendance_duration' => $leftAt ? $this->faker->numberBetween(300, 7200) : null, // 5 minutes to 2 hours
            'coins_awarded' => $this->faker->numberBetween(0, 75),
            'metadata' => [],
        ];
    }

    /**
     * Indicate that the user attended the full class.
     */
    public function fullAttendance(): static
    {
        return $this->state(fn (array $attributes) => [
            'attended' => true,
            'attendance_duration' => $this->faker->numberBetween(1800, 7200), // 30 minutes to 2 hours
            'coins_awarded' => $this->faker->numberBetween(30, 75),
        ]);
    }

    /**
     * Indicate that the user did not attend.
     */
    public function noAttendance(): static
    {
        return $this->state(fn (array $attributes) => [
            'attended' => false,
            'joined_at' => null,
            'left_at' => null,
            'attendance_duration' => null,
            'coins_awarded' => 0,
        ]);
    }

    /**
     * Indicate that the user attended briefly.
     */
    public function briefAttendance(): static
    {
        return $this->state(fn (array $attributes) => [
            'attended' => true,
            'attendance_duration' => $this->faker->numberBetween(60, 600), // 1 to 10 minutes
            'coins_awarded' => $this->faker->numberBetween(5, 20),
        ]);
    }
}