<?php

namespace App\Events;

use App\Models\User;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QuizPassedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public User $user,
        public Quiz $quiz,
        public QuizAttempt $attempt
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->user->id}"),
            new PrivateChannel("cohort.{$this->quiz->week->cohort_id}"),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => 'quiz_passed',
            'user_id' => $this->user->id,
            'quiz' => [
                'id' => $this->quiz->id,
                'title' => $this->quiz->title,
                'week_id' => $this->quiz->week_id,
                'coin_reward' => $this->quiz->coin_reward,
            ],
            'attempt' => [
                'id' => $this->attempt->id,
                'attempt_number' => $this->attempt->attempt_number,
                'percentage' => $this->attempt->score_percentage,
                'completed_at' => $this->attempt->completed_at->toISOString(),
            ],
            'message' => "🎉 Quiz passed! You earned {$this->quiz->coin_reward} Dreal Coins!",
            'show_confetti' => true,
            'coins_awarded' => $this->quiz->coin_reward,
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'quiz.passed';
    }
}