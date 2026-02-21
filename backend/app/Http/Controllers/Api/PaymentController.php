<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\Enrollment;
use App\Models\Contact;
use App\Models\Cohort;
use App\Mail\PaymentReceivedMail;
use App\Mail\SubscriptionStartedMail;
use App\Mail\EnrollmentConfirmedMail;
use App\Services\Mail\EmailTemplateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    protected $emailService;

    public function __construct(EmailTemplateService $emailService)
    {
        $this->emailService = $emailService;
    }

    /**
     * Handle payment verification and post-payment actions
     */
    public function verifyPayment(Request $request)
    {
        $user = $request->user();
        $reference = $request->input('reference');
        $channel = $request->input('channel', 'paystack');
        $amount = $request->input('amount');
        $cohortId = $request->input('cohort_id');
        $planName = $request->input('plan_name', 'Premium Access');

        return DB::transaction(function () use ($user, $reference, $channel, $amount, $cohortId, $planName) {
            // Log the payment
            $payment = Payment::create([
                'user_id' => $user->id,
                'amount' => $amount,
                'currency' => 'USD',
                'status' => 'completed',
                'channel' => $channel,
                'reference' => $reference,
                'metadata' => [
                    'cohort_id' => $cohortId,
                    'plan_name' => $planName
                ]
            ]);

            // 1. Send Payment Received Mail
            $this->emailService->sendTemplateMail('payment-confirmed', $user->email, [
                'user_name' => $user->name,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'reference' => $payment->reference,
                'plan_name' => $planName,
            ]);

            // 2. Create/Update Subscription
            $subscription = Subscription::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'plan_name' => $planName,
                    'status' => 'active',
                    'starts_at' => now(),
                    'ends_at' => now()->addYear() // Default to 1 year for now
                ]
            );

            $this->emailService->sendTemplateMail('subscription-started', $user->email, [
                'user_name' => $user->name,
                'plan_name' => $subscription->plan_name,
                'ends_at' => $subscription->ends_at->toDateString(),
            ]);

            // 3. Handle Enrollment if cohort_id is provided
            if ($cohortId) {
                $cohort = Cohort::find($cohortId);
                if ($cohort) {
                    $enrollment = Enrollment::updateOrCreate(
                        ['user_id' => $user->id, 'cohort_id' => $cohortId],
                        [
                            'enrolled_at' => now(),
                            'status' => Enrollment::STATUS_ACTIVE,
                            'completion_percentage' => 0
                        ]
                    );

                    $this->emailService->sendTemplateMail('enrollment-confirmed', $user->email, [
                        'user_name' => $user->name,
                        'cohort_name' => $cohort->name,
                    ]);
                }
            }

            return response()->json([
                'message' => 'Payment verified and access granted.',
                'payment' => $payment,
                'subscription' => $subscription
            ]);
        });
    }

    /**
     * Log manual bank transfer submission
     */
    public function logBankTransfer(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'amount' => 'required|numeric',
            'reference' => 'required|string|unique:payments',
        ]);

        $payment = Payment::create([
            'user_id' => $user->id,
            'amount' => $request->amount,
            'currency' => 'NGN', // Often NGN for local bank transfers
            'status' => 'pending',
            'channel' => 'bank',
            'reference' => $request->reference,
            'metadata' => ['note' => 'Awaiting manual verification']
        ]);

        return response()->json([
            'message' => 'Transfer receipt logged. Our finance team will verify and activate your access.',
            'payment' => $payment
        ]);
    }

    /**
     * Handle contact form submission
     */
    public function contactSubmit(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
            'message' => 'required|string',
            'subject' => 'sometimes|string'
        ]);

        $contact = Contact::create($request->all());

        return response()->json([
            'message' => 'Your message has been transmitted. We will respond shortly.',
            'contact' => $contact
        ]);
    }

    /**
     * Check if the current user has an active subscription
     */
    public function checkSubscription(Request $request)
    {
        $user = $request->user();
        $subscription = Subscription::where('user_id', $user->id)
            ->where('status', 'active')
            ->where('ends_at', '>', now())
            ->first();

        return response()->json([
            'has_active_subscription' => !!$subscription,
            'subscription' => $subscription
        ]);
    }
}
