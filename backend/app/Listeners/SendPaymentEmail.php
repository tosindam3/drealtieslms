<?php

namespace App\Listeners;

use App\Events\PaymentConfirmedEvent;
use App\Services\Mail\EmailTemplateService;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendPaymentEmail implements ShouldQueue
{
    public function __construct(protected EmailTemplateService $emailService) {}

    public function handle(PaymentConfirmedEvent $event): void
    {
        $this->emailService->sendTemplateMail('payment-confirmed', $event->user->email, [
            'user_name' => $event->user->name,
            'amount' => $event->payment->amount,
            'currency' => $event->payment->currency ?? 'USD',
            'reference' => $event->payment->reference,
            'plan_name' => $event->payment->plan_name ?? 'Plan'
        ]);
    }
}
