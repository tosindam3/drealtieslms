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

class AssignmentRejectedEvent implements ShouldBroadcast
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
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => 'assignment_rejected',
            'user_id' => $this->user->id,
            'assignment' => [
                'id' => $this->assignment->id,
                'title' => $this->assignment->title,
                'week_id' => $this->assignment->week_id,
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
            'message' => "Assignment '{$this->assignment->title}' needs revision. Please review the feedback and resubmit.",
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'assignment.rejected';
    }
}