<?php

namespace App\Events;

use App\Models\User;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LessonCompletedEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public User $user,
        public Lesson $lesson,
        public LessonCompletion $completion
    ) {}
}
