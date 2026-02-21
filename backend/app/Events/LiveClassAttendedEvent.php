<?php

namespace App\Events;

use App\Models\User;
use App\Models\LiveClass;
use App\Models\LiveAttendance;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LiveClassAttendedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public User $user,
        public LiveClass $liveClass,
        public LiveAttendance $attendance
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->user->id}"),
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
            'type' => 'live_class_attended',
            'user_id' => $this->user->id,
            'live_class' => [
                'id' => $this->liveClass->id,
                'title' => $this->liveClass->title,
                'week_id' => $this->liveClass->week_id,
                'coin_reward' => $this->liveClass->coin_reward,
            ],
            'attendance' => [
                'id' => $this->attendance->id,
                'joined_at' => $this->attendance->joined_at->toISOString(),
                'attended' => $this->attendance->attended,
            ],
            'message' => "Attendance marked for '{$this->liveClass->title}'! You earned {$this->liveClass->coin_reward} Dreal Coins!",
            'coins_awarded' => $this->liveClass->coin_reward,
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'live-class.attended';
    }
}