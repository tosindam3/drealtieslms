<?php

namespace App\Events;

use App\Models\User;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AssignmentApprovedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public User $user,
        public Assignment $assignment,
        public AssignmentSubmission $submission,
        public User $instructor
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->user->id}"),
            new PrivateChannel("cohort.{$this->assignment->week->cohort_id}"),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => 'assignment_approved',
            'user_id' => $this->user->id,
            'assignment' => [
                'id' => $this->assignment->id,
                'title' => $this->assignment->title,
                'week_id' => $this->assignment->week_id,
                'coin_reward' => $this->assignment->coin_reward,
            ],
            'submission' => [
                'id' => $this->submission->id,
                'status' => $this->submission->status,
                'reviewed_at' => $this->submission->reviewed_at->toISOString(),
                'feedback' => $this->submission->feedback,
            ],
            'instructor' => [
                'id' => $this->instructor->id,
                'name' => $this->instructor->name,
            ],
            'message' => "🎉 Assignment '{$this->assignment->title}' has been approved! You earned {$this->assignment->coin_reward} Dreal Coins!",
            'show_confetti' => true,
            'coins_awarded' => $this->assignment->coin_reward,
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'assignment.approved';
    }
}