<?php

namespace App\Events;

use App\Models\User;
use App\Models\Module;
use App\Models\ModuleCompletion;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ModuleCompletedEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public User $user,
        public Module $module,
        public ModuleCompletion $completion
    ) {}
}
