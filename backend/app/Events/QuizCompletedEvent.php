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

class QuizCompletedEvent implements ShouldBroadcast
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
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => 'quiz_completed',
            'user_id' => $this->user->id,
            'quiz' => [
                'id' => $this->quiz->id,
                'title' => $this->quiz->title,
                'week_id' => $this->quiz->week_id,
            ],
            'attempt' => [
                'id' => $this->attempt->id,
                'attempt_number' => $this->attempt->attempt_number,
                'score' => $this->attempt->score_points,
                'max_score' => $this->attempt->total_points,
                'percentage' => $this->attempt->score_percentage,
                'is_passed' => $this->attempt->passed,
                'completed_at' => $this->attempt->completed_at->toISOString(),
            ],
            'message' => $this->attempt->passed 
                ? "Congratulations! You passed '{$this->quiz->title}'" 
                : "Quiz '{$this->quiz->title}' completed. Keep trying!",
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'quiz.completed';
    }
}