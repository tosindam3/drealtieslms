<?php

namespace App\Events;

use App\Models\User;
use App\Models\Payment;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentConfirmedEvent
{
    use Dispatchable, SerializesModels;

    public function __construct(public User $user, public Payment $payment) {}
}
