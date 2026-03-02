<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\User;
use App\Models\Enrollment;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'enrollment_id' => null,
            'amount' => $this->faker->randomFloat(2, 50, 500),
            'currency' => 'USD',
            'status' => 'pending',
            'channel' => $this->faker->randomElement(['bank_transfer', 'card', 'paypal']),
            'reference' => 'PAY-' . strtoupper($this->faker->unique()->bothify('???###???')),
            'metadata' => [],
            'proof_path' => null,
            'confirmed_by' => null,
            'confirmed_at' => null,
            'rejection_reason' => null,
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'confirmed',
            'confirmed_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'rejection_reason' => $this->faker->sentence(),
        ]);
    }
}
