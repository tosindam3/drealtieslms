<?php

namespace App\Listeners;

use App\Events\StudentRegisteredEvent;
use App\Services\Mail\EmailTemplateService;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendRegistrationEmail implements ShouldQueue
{
    public function __construct(protected EmailTemplateService $emailService) {}

    public function handle(StudentRegisteredEvent $event): void
    {
        $this->emailService->sendTemplateMail('student-registered', $event->user->email, [
            'user_name' => $event->user->name
        ]);
    }
}
