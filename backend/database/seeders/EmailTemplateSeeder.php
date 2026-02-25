<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EmailTemplate;

class EmailTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            [
                'slug' => 'student-registered',
                'name' => 'Student Registration Welcome',
                'subject' => 'Welcome to {{app_name}}! 🎉',
                'body' => '
                    <h2>Welcome, {{user_name}}!</h2>
                    <p>Your account has been successfully created on <strong>{{app_name}}</strong>.</p>
                    <p>You can now log in and start exploring your courses.</p>
                    <p>We are excited to have you on board!</p>
                ',
                'settings' => [
                    'show_button' => true,
                    'button_label' => 'Login to Your Account',
                    'button_url' => config('app.url') . '/login',
                    'header_color' => '#0d1117',
                    'button_color' => '#D4AF37',
                    'button_text_color' => '#000000',
                ],
                'placeholders' => ['user_name', 'app_name']
            ],
            [
                'slug' => 'payment-confirmed',
                'name' => 'Payment Confirmation',
                'subject' => 'Payment Confirmed - {{app_name}}',
                'body' => '
                    <h2>Payment Received! ✅</h2>
                    <p>Hi {{user_name}},</p>
                    <p>We have successfully received your payment of <strong>{{currency}} {{amount}}</strong> for <strong>{{plan_name}}</strong>.</p>
                    <p>Transaction Reference: <code>{{reference}}</code></p>
                    <p>Your access has been activated.</p>
                ',
                'settings' => [
                    'show_button' => true,
                    'button_label' => 'Go to Dashboard',
                    'button_url' => config('app.url') . '/dashboard',
                    'header_color' => '#0d1117',
                    'button_color' => '#D4AF37',
                ],
                'placeholders' => ['user_name', 'amount', 'currency', 'reference', 'plan_name']
            ],
            [
                'slug' => 'subscription-started',
                'name' => 'Subscription Activated',
                'subject' => 'Your Subscription is Now Active! 🚀',
                'body' => '
                    <h2>Subscription Active!</h2>
                    <p>Hi {{user_name}},</p>
                    <p>Your <strong>{{plan_name}}</strong> subscription has been successfully activated.</p>
                    <p>It will remain active until <strong>{{ends_at}}</strong>.</p>
                    <p>Enjoy full access to all premium features!</p>
                ',
                'settings' => [
                    'show_button' => true,
                    'button_label' => 'Explore Courses',
                    'button_url' => config('app.url') . '/courses',
                    'header_color' => '#0d1117',
                    'button_color' => '#D4AF37',
                ],
                'placeholders' => ['user_name', 'plan_name', 'ends_at']
            ],
            [
                'slug' => 'enrollment-confirmed',
                'name' => 'Course Enrollment Confirmation',
                'subject' => 'Enrolled Successfully: {{cohort_name}}',
                'body' => '
                    <h2>Enrollment Confirmed! 📚</h2>
                    <p>Hi {{user_name}},</p>
                    <p>You have been successfully enrolled in <strong>{{cohort_name}}</strong>.</p>
                    <p>You can now access all the course materials and join the community discussions.</p>
                ',
                'settings' => [
                    'show_button' => true,
                    'button_label' => 'Go to Course',
                    'button_url' => config('app.url') . '/learn',
                    'header_color' => '#0d1117',
                    'button_color' => '#D4AF37',
                ],
                'placeholders' => ['user_name', 'cohort_name']
            ],
            [
                'slug' => 'password-reset-link',
                'name' => 'Password Reset Link',
                'subject' => 'Reset Your Password - {{app_name}}',
                'body' => '
                    <h2>Reset Your Password</h2>
                    <p>You are receiving this email because we received a password reset request for your account.</p>
                    <p>Click the button below to reset your password. This link will expire in 60 minutes.</p>
                    <p>If you did not request a password reset, no further action is required.</p>
                ',
                'settings' => [
                    'show_button' => true,
                    'button_label' => 'Reset Password',
                    'button_url' => '{{reset_url}}',
                    'header_color' => '#0d1117',
                    'button_color' => '#D4AF37',
                ],
                'placeholders' => ['reset_url', 'app_name']
            ],
            [
                'slug' => 'password-changed',
                'name' => 'Password Changed Notification',
                'subject' => 'Security Alert: Password Changed',
                'body' => '
                    <h2>Password Updated Successfully</h2>
                    <p>Hi {{user_name}},</p>
                    <p>This is a confirmation that your password for <strong>{{app_name}}</strong> has been successfully changed.</p>
                    <p>If you did not perform this action, please contact our support team immediately.</p>
                ',
                'settings' => [
                    'show_button' => false,
                    'header_color' => '#0d1117',
                ],
                'placeholders' => ['user_name', 'app_name']
            ],
            [
                'slug' => 'new_update',
                'name' => 'General Updates Broadcast',
                'subject' => 'New Update from {{app_name}} 📢',
                'body' => '
                    <h2>Hello {{user_name}}!</h2>
                    <p>{{update_content}}</p>
                    <p>Stay tuned for more exciting news!</p>
                ',
                'settings' => [
                    'show_button' => false,
                    'header_color' => '#0d1117',
                ],
                'placeholders' => ['user_name', 'update_content', 'app_name']
            ],
        ];

        foreach ($templates as $template) {
            EmailTemplate::updateOrCreate(
                ['slug' => $template['slug']],
                [
                    'name' => $template['name'],
                    'subject' => $template['subject'],
                    'body' => $template['body'],
                    'settings' => $template['settings'],
                    'placeholders' => $template['placeholders'],
                ]
            );
        }
    }
}
