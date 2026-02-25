<?php

namespace App\Listeners;

use App\Events\PasswordChangedEvent;
use App\Services\Mail\EmailTemplateService;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendPasswordChangedEmail implements ShouldQueue
{
    public function __construct(protected EmailTemplateService $emailService) {}

    public function handle(PasswordChangedEvent $event): void
    {
        $this->emailService->sendTemplateMail('password-changed', $event->user->email, [
            'user_name' => $event->user->name
        ]);
    }
}
