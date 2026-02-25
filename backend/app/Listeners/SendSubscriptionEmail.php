<?php

namespace App\Listeners;

use App\Events\SubscriptionStartedEvent;
use App\Services\Mail\EmailTemplateService;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendSubscriptionEmail implements ShouldQueue
{
    public function __construct(protected EmailTemplateService $emailService) {}

    public function handle(SubscriptionStartedEvent $event): void
    {
        $this->emailService->sendTemplateMail('subscription-started', $event->user->email, [
            'user_name' => $event->user->name,
            'plan_name' => $event->subscription->plan?->name ?? 'Subscription Plan',
            'ends_at' => $event->subscription->expires_at?->toDateString()
        ]);
    }
}
