<?php

namespace App\Events;

use App\Models\User;
use App\Models\Subscription;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SubscriptionStartedEvent
{
    use Dispatchable, SerializesModels;

    public function __construct(public User $user, public Subscription $subscription) {}
}
