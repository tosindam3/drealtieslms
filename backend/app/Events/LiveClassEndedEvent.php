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

class LiveClassEndedEvent implements ShouldBroadcast
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
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => 'live_class_ended',
            'live_class' => [
                'id' => $this->liveClass->id,
                'title' => $this->liveClass->title,
                'week_id' => $this->liveClass->week_id,
                'ended_at' => $this->liveClass->ended_at->toISOString(),
                'duration' => $this->liveClass->started_at && $this->liveClass->ended_at 
                    ? $this->liveClass->started_at->diffInMinutes($this->liveClass->ended_at) 
                    : null,
            ],
            'instructor' => [
                'id' => $this->instructor->id,
                'name' => $this->instructor->name,
            ],
            'message' => "Live class '{$this->liveClass->title}' has ended. Thank you for attending!",
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'live-class.ended';
    }
}