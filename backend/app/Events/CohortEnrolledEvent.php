<?php

namespace App\Events;

use App\Models\User;
use App\Models\Cohort;
use App\Models\Enrollment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CohortEnrolledEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public User $student,
        public Cohort $cohort,
        public Enrollment $enrollment
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->student->id}"),
            new PrivateChannel("cohort.{$this->cohort->id}"),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => 'cohort_enrolled',
            'student' => [
                'id' => $this->student->id,
                'name' => $this->student->name,
            ],
            'cohort' => [
                'id' => $this->cohort->id,
                'name' => $this->cohort->name,
            ],
            'enrollment' => [
                'id' => $this->enrollment->id,
                'enrolled_at' => $this->enrollment->enrolled_at->toISOString(),
            ],
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'cohort.enrolled';
    }
}