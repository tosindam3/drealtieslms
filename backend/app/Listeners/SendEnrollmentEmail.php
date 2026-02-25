<?php

namespace App\Listeners;

use App\Events\CourseEnrolledEvent;
use App\Services\Mail\EmailTemplateService;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendEnrollmentEmail implements ShouldQueue
{
    public function __construct(protected EmailTemplateService $emailService) {}

    public function handle(CourseEnrolledEvent $event): void
    {
        $this->emailService->sendTemplateMail('enrollment-confirmed', $event->user->email, [
            'user_name' => $event->user->name,
            'cohort_name' => $event->course->name ?? 'Course'
        ]);
    }
}
