<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;
use App\Events\StudentRegisteredEvent;
use App\Events\CourseEnrolledEvent;
use App\Events\PaymentConfirmedEvent;
use App\Events\SubscriptionStartedEvent;
use App\Events\PasswordChangedEvent;
use App\Listeners\SendRegistrationEmail;
use App\Listeners\SendEnrollmentEmail;
use App\Listeners\SendPaymentEmail;
use App\Listeners\SendSubscriptionEmail;
use App\Listeners\SendPasswordChangedEmail;
use Illuminate\Support\Facades\Event;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::define('admin-access', function (User $user) {
            return $user->role === User::ROLE_ADMINISTRATOR || $user->role === User::ROLE_INSTRUCTOR;
        });

        Event::listen(StudentRegisteredEvent::class, SendRegistrationEmail::class);
        Event::listen(CourseEnrolledEvent::class, SendEnrollmentEmail::class);
        Event::listen(PaymentConfirmedEvent::class, SendPaymentEmail::class);
        Event::listen(SubscriptionStartedEvent::class, SendSubscriptionEmail::class);
        Event::listen(PasswordChangedEvent::class, SendPasswordChangedEmail::class);
    }
}
