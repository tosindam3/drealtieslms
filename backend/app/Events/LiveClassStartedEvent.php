<?php

namespace App\Events;

use App\Models\User;
use App\Models\LiveClass;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LiveClassStartedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public LiveClass $liveClass,
        public User $instructor
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("live-class.{$this->liveClass->id}"),
            new PrivateChannel("cohort.{$this->liveClass->week->cohort_id}"),
            new Channel('live-classes'), // Public channel for general notifications
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => 'live_class_started',
            'live_class' => [
                'id' => $this->liveClass->id,
                'title' => $this->liveClass->title,
                'week_id' => $this->liveClass->week_id,
                'started_at' => $this->liveClass->started_at->toISOString(),
                'meeting_url' => $this->liveClass->meeting_url,
            ],
            'instructor' => [
                'id' => $this->instructor->id,
                'name' => $this->instructor->name,
            ],
            'message' => "Live class '{$this->liveClass->title}' has started! Join now.",
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'live-class.started';
    }
}