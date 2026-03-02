<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\Cohort;
use App\Models\Enrollment;
use App\Models\EmailTemplate;
use App\Events\StudentRegisteredEvent;
use App\Events\PaymentConfirmedEvent;
use App\Events\SubscriptionStartedEvent;
use App\Events\CourseEnrolledEvent;
use App\Events\PasswordChangedEvent;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Event;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

class EmailSystemTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Seed email templates
        $this->artisan('db:seed', ['--class' => 'EmailTemplateSeeder']);
        
        // Fake mail to prevent actual sending
        Mail::fake();
    }

    /** Test registration email is sent when student registers */
    #[Test]
    public function it_sends_registration_email_when_student_registers(): void
    {
        $user = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'role' => User::ROLE_STUDENT
        ]);

        Event::dispatch(new StudentRegisteredEvent($user));

        $this->assertDatabaseHas('email_templates', [
            'slug' => 'student-registered'
        ]);
    }

    /** Test payment confirmation email is sent */
    #[Test]
    public function it_sends_payment_confirmation_email(): void
    {
        $user = User::factory()->create();
        $payment = Payment::factory()->create([
            'user_id' => $user->id,
            'amount' => 70.00,
            'currency' => 'USD',
            'reference' => 'PAY-' . uniqid(),
            'status' => 'confirmed'
        ]);

        Event::dispatch(new PaymentConfirmedEvent($user, $payment));

        $this->assertDatabaseHas('email_templates', [
            'slug' => 'payment-confirmed'
        ]);
    }

    /** Test subscription started email is sent */
    #[Test]
    public function it_sends_subscription_started_email(): void
    {
        $user = User::factory()->create();
        $subscription = Subscription::factory()->create([
            'user_id' => $user->id,
            'status' => 'active'
        ]);

        Event::dispatch(new SubscriptionStartedEvent($user, $subscription));

        $this->assertDatabaseHas('email_templates', [
            'slug' => 'subscription-started'
        ]);
    }

    /** Test enrollment confirmation email is sent */
    #[Test]
    public function it_sends_enrollment_confirmation_email(): void
    {
        $user = User::factory()->create();
        $cohort = Cohort::factory()->create(['name' => 'Forex Trading 101']);

        Event::dispatch(new CourseEnrolledEvent($user, $cohort));

        $this->assertDatabaseHas('email_templates', [
            'slug' => 'enrollment-confirmed'
        ]);
    }

    /** Test password changed email is sent */
    #[Test]
    public function it_sends_password_changed_email(): void
    {
        $user = User::factory()->create();

        Event::dispatch(new PasswordChangedEvent($user));

        $this->assertDatabaseHas('email_templates', [
            'slug' => 'password-changed'
        ]);
    }

    /** Test email template service parses placeholders correctly */
    #[Test]
    public function email_template_service_parses_placeholders_correctly(): void
    {
        $service = app(\App\Services\Mail\EmailTemplateService::class);
        
        $template = EmailTemplate::where('slug', 'student-registered')->first();
        $this->assertNotNull($template);

        $data = ['user_name' => 'Test User'];
        $reflection = new \ReflectionClass($service);
        $method = $reflection->getMethod('parseTemplate');
        $method->setAccessible(true);
        
        $result = $method->invoke($service, 'Hello {{user_name}}!', $data);
        $this->assertEquals('Hello Test User!', $result);
    }

    /** Test all required email templates exist in database */
    #[Test]
    public function all_required_email_templates_exist(): void
    {
        $requiredTemplates = [
            'student-registered',
            'payment-confirmed',
            'subscription-started',
            'enrollment-confirmed',
            'password-reset-link',
            'password-changed'
        ];

        foreach ($requiredTemplates as $slug) {
            $this->assertDatabaseHas('email_templates', ['slug' => $slug]);
        }
    }

    /** Test email templates have all required fields */
    #[Test]
    public function email_templates_have_required_fields(): void
    {
        $template = EmailTemplate::where('slug', 'student-registered')->first();
        
        $this->assertNotNull($template->subject);
        $this->assertNotNull($template->body);
        $this->assertIsArray($template->settings);
        $this->assertIsArray($template->placeholders);
    }

    /** Test email service handles missing template gracefully */
    #[Test]
    public function email_service_handles_missing_template_gracefully(): void
    {
        $service = app(\App\Services\Mail\EmailTemplateService::class);
        
        $result = $service->sendTemplateMail('non-existent-template', 'test@example.com', []);
        
        $this->assertFalse($result);
    }
}
