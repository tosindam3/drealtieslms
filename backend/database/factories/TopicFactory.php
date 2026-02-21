<?php

namespace Database\Factories;

use App\Models\Topic;
use App\Models\Lesson;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Topic>
 */
class TopicFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'lesson_id' => Lesson::factory(),
            'title' => fake()->words(5, true),
            'description' => fake()->paragraph(),
            'thumbnail_url' => fake()->imageUrl(640, 480, 'education'),
            'order' => fake()->numberBetween(1, 20),
            'blocks' => $this->generateBlocks(),
            'coin_reward' => fake()->numberBetween(10, 100),
            'completion_rule' => Topic::getDefaultCompletionRule(),
        ];
    }

    /**
     * Generate sample blocks for the topic.
     */
    private function generateBlocks(): array
    {
        $blockTypes = ['video', 'text', 'photo'];
        $numBlocks = fake()->numberBetween(1, 4);
        $blocks = [];

        for ($i = 0; $i < $numBlocks; $i++) {
            $type = fake()->randomElement($blockTypes);
            $blocks[] = $this->generateBlock($type, $i + 1);
        }

        return $blocks;
    }

    /**
     * Generate a block based on type.
     */
    private function generateBlock(string $type, int $order): array
    {
        $baseBlock = [
            'id' => fake()->uuid(),
            'type' => $type,
            'order' => $order,
        ];

        return match($type) {
            'video' => array_merge($baseBlock, [
                'title' => fake()->words(3, true),
                'url' => 'https://example.com/videos/' . fake()->uuid() . '.mp4',
                'duration' => fake()->numberBetween(300, 1800), // 5-30 minutes
                'thumbnail' => fake()->imageUrl(640, 360, 'video'),
            ]),
            'text' => array_merge($baseBlock, [
                'title' => fake()->words(4, true),
                'content' => fake()->paragraphs(3, true),
                'reading_time' => fake()->numberBetween(2, 10),
            ]),
            'photo' => array_merge($baseBlock, [
                'title' => fake()->words(2, true),
                'url' => fake()->imageUrl(800, 600, 'education'),
                'caption' => fake()->sentence(),
            ]),
            default => $baseBlock,
        };
    }

    /**
     * Create a video topic.
     */
    public function video(): static
    {
        return $this->state(fn (array $attributes) => [
            'blocks' => [
                [
                    'id' => fake()->uuid(),
                    'type' => 'video',
                    'order' => 1,
                    'title' => fake()->words(3, true),
                    'url' => 'https://example.com/videos/' . fake()->uuid() . '.mp4',
                    'duration' => fake()->numberBetween(300, 1800),
                    'thumbnail' => fake()->imageUrl(640, 360, 'video'),
                ]
            ],
        ]);
    }

    /**
     * Create a text topic.
     */
    public function text(): static
    {
        return $this->state(fn (array $attributes) => [
            'blocks' => [
                [
                    'id' => fake()->uuid(),
                    'type' => 'text',
                    'order' => 1,
                    'title' => fake()->words(4, true),
                    'content' => fake()->paragraphs(3, true),
                    'reading_time' => fake()->numberBetween(2, 10),
                ]
            ],
        ]);
    }

    /**
     * Create a topic with specific coin reward.
     */
    public function withCoinReward(int $coins): static
    {
        return $this->state(fn (array $attributes) => [
            'coin_reward' => $coins,
        ]);
    }
}