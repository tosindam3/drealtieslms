<?php

namespace App\Events;

use App\Models\Cohort;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CohortStartedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Cohort $cohort
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("cohort.{$this->cohort->id}"),
            new Channel('cohorts'), // Public channel for general cohort updates
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => 'cohort_started',
            'cohort' => [
                'id' => $this->cohort->id,
                'name' => $this->cohort->name,
                'started_at' => now()->toISOString(), // Use current time since started_at column doesn't exist
            ],
            'message' => "Cohort '{$this->cohort->name}' has started!",
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'cohort.started';
    }
}