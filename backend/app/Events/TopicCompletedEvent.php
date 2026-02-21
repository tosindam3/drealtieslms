<?php

namespace App\Events;

use App\Models\User;
use App\Models\Topic;
use App\Models\TopicCompletion;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TopicCompletedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public User $user,
        public Topic $topic,
        public TopicCompletion $completion
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->user->id}"),
            new PrivateChannel("cohort.{$this->topic->lesson->module->week->cohort_id}"),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->user->id,
            'topic_id' => $this->topic->id,
            'topic_title' => $this->topic->title,
            'week_number' => $this->topic->lesson->module->week->week_number,
            'topic' => [
                'id' => $this->topic->id,
                'title' => $this->topic->title,
                'lesson_id' => $this->topic->lesson_id,
                'coin_reward' => $this->topic->coin_reward,
            ],
            'completion' => [
                'id' => $this->completion->id,
                'completed_at' => $this->completion->completed_at->toISOString(),
                'coins_awarded' => $this->completion->coins_awarded,
            ],
            'lesson' => [
                'id' => $this->topic->lesson->id,
                'title' => $this->topic->lesson->title,
                'week_number' => $this->topic->lesson->module->week->week_number,
            ],
            'message' => "Topic '{$this->topic->title}' completed! You earned {$this->topic->coin_reward} Dreal Coins!",
            'coins_awarded' => $this->topic->coin_reward,
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'topic.completed';
    }
}
