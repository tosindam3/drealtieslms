<?php

namespace App\Events;

use App\Models\User;
use App\Models\Week;
use App\Models\UserProgress;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WeekUnlockedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public User $user,
        public Week $week,
        public UserProgress $progress
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->user->id}"),
            new PrivateChannel("cohort.{$this->week->cohort_id}"),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => 'week_unlocked',
            'user_id' => $this->user->id,
            'week' => [
                'id' => $this->week->id,
                'week_number' => $this->week->week_number,
                'title' => $this->week->title,
                'cohort_id' => $this->week->cohort_id,
            ],
            'progress' => [
                'id' => $this->progress->id,
                'unlocked_at' => $this->progress->unlocked_at->toISOString(),
                'completion_percentage' => $this->progress->completion_percentage,
            ],
            'message' => "Week {$this->week->week_number} has been unlocked!",
            'show_confetti' => true, // Week unlocks deserve celebration
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'week.unlocked';
    }
}