<?php

namespace Database\Factories;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class SubscriptionFactory extends Factory
{
    protected $model = Subscription::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'plan_name' => $this->faker->randomElement(['Basic', 'Pro', 'Premium']),
            'plan_code' => $this->faker->randomElement(['basic_monthly', 'pro_monthly', 'premium_monthly']),
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
            'canceled_at' => null,
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
        ]);
    }

    public function canceled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'canceled',
            'canceled_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'expired',
            'ends_at' => now()->subDay(),
        ]);
    }
}