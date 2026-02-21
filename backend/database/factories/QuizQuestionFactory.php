<?php

namespace Database\Factories;

use App\Models\QuizQuestion;
use App\Models\Quiz;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuizQuestion>
 */
class QuizQuestionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     */
    protected $model = QuizQuestion::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        $type = $this->faker->randomElement(['multiple_choice', 'true_false', 'short_answer']);
        
        return [
            'quiz_id' => Quiz::factory(),
            'question_text' => $this->faker->sentence() . '?',
            'type' => $type,
            'options' => $this->generateOptions($type),
            'correct_answers' => $this->generateCorrectAnswer($type),
            'explanation' => $this->faker->optional()->paragraph(),
            'points' => $this->faker->numberBetween(1, 10),
            'order' => $this->faker->numberBetween(1, 20),
        ];
    }

    /**
     * Generate options based on question type
     */
    private function generateOptions(string $type): ?array
    {
        return match($type) {
            'multiple_choice' => [
                $this->faker->word(),
                $this->faker->word(),
                $this->faker->word(),
                $this->faker->word(),
            ],
            default => null,
        };
    }

    /**
     * Generate correct answer based on question type
     */
    private function generateCorrectAnswer(string $type): mixed
    {
        return match($type) {
            'multiple_choice' => [$this->faker->word(), $this->faker->word()],
            'true_false' => [$this->faker->boolean()],
            'short_answer' => [$this->faker->word()],
            default => [$this->faker->word()],
        };
    }

    /**
     * Create a single choice question
     */
    public function singleChoice(): static
    {
        return $this->state(function (array $attributes) {
            $options = ['Option A', 'Option B', 'Option C', 'Option D'];
            $correctAnswer = $this->faker->randomElement($options);
            
            return [
                'type' => 'single_choice',
                'options' => $options,
                'correct_answers' => [$correctAnswer],
            ];
        });
    }

    /**
     * Create a multiple choice question
     */
    public function multipleChoice(): static
    {
        return $this->state(function (array $attributes) {
            $options = ['Option A', 'Option B', 'Option C', 'Option D'];
            $correctAnswers = $this->faker->randomElements($options, $this->faker->numberBetween(2, 3));
            
            return [
                'type' => 'multiple_choice',
                'options' => $options,
                'correct_answers' => $correctAnswers,
            ];
        });
    }

    /**
     * Create a true/false question
     */
    public function trueFalse(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'type' => 'true_false',
                'options' => null,
                'correct_answers' => [$this->faker->boolean()],
            ];
        });
    }

    /**
     * Create a text question
     */
    public function text(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'type' => 'text',
                'options' => null,
                'correct_answers' => [$this->faker->word()],
            ];
        });
    }

    /**
     * Create a number question
     */
    public function number(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'type' => 'number',
                'options' => null,
                'correct_answers' => [$this->faker->numberBetween(1, 100)],
            ];
        });
    }

    /**
     * Create a question with specific points
     */
    public function withPoints(int $points): static
    {
        return $this->state(function (array $attributes) use ($points) {
            return [
                'points' => $points,
            ];
        });
    }

    /**
     * Create a question with specific order
     */
    public function withOrder(int $order): static
    {
        return $this->state(function (array $attributes) use ($order) {
            return [
                'order' => $order,
            ];
        });
    }
}