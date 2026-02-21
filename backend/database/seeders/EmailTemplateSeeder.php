<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

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
                'name' => 'Registration Welcome Email',
                'subject' => 'Welcome to DrealtiesFX Academy!',
                'body' => '<p>Hello {{user_name}},</p><p>Welcome to DrealtiesFX Academy! We are excited to have you on board.</p><p>You can now access your dashboard and start your learning journey.</p><p>Best regards,<br>The DrealtiesFX Team</p>',
                'placeholders' => ['user_name', 'app_name']
            ],
            [
                'slug' => 'password-changed',
                'name' => 'Password Change Notification',
                'subject' => 'Your password has been changed',
                'body' => '<p>Hello {{user_name}},</p><p>This is to confirm that your password for DrealtiesFX Academy has been successfully changed.</p><p>If you did not perform this action, please contact support immediately.</p>',
                'placeholders' => ['user_name']
            ],
            [
                'slug' => 'payment-confirmed',
                'name' => 'Payment Confirmation',
                'subject' => 'Payment Confirmed - {{plan_name}}',
                'body' => '<p>Hello {{user_name}},</p><p>Your payment of <strong>{{amount}} {{currency}}</strong> has been confirmed.</p><p>Reference: {{reference}}</p><p>Your access to {{plan_name}} is now active.</p>',
                'placeholders' => ['user_name', 'amount', 'currency', 'reference', 'plan_name']
            ],
            [
                'slug' => 'module-concluded',
                'name' => 'Module Completion Notification',
                'subject' => 'Congratulations on completing {{module_name}}!',
                'body' => '<p>Well done {{user_name}}!</p><p>You have successfully completed the <strong>{{module_name}}</strong> module.</p><p>Keep up the great work!</p>',
                'placeholders' => ['user_name', 'module_name']
            ],
            [
                'slug' => 'password-reset-link',
                'name' => 'Password Reset Link',
                'subject' => 'Reset your DrealtiesFX Academy password',
                'body' => '<p>Hello,</p><p>You are receiving this email because we received a password reset request for your account.</p><p>Click the link below to reset your password:</p><p><a href="{{reset_url}}">Reset Password</a></p><p>This password reset link will expire in 60 minutes.</p><p>If you did not request a password reset, no further action is required.</p>',
                'placeholders' => ['reset_url']
            ],
            [
                'slug' => 'subscription-started',
                'name' => 'Subscription Started',
                'subject' => 'Your subscription is now active!',
                'body' => '<p>Hello {{user_name}},</p><p>Your <strong>{{plan_name}}</strong> subscription has been successfully activated.</p><p>It will remain active until {{ends_at}}.</p>',
                'placeholders' => ['user_name', 'plan_name', 'ends_at']
            ],
            [
                'slug' => 'enrollment-confirmed',
                'name' => 'Enrollment Confirmed',
                'subject' => 'Enrollment Confirmed: {{cohort_name}}',
                'body' => '<p>Hello {{user_name}},</p><p>You have been successfully enrolled in the <strong>{{cohort_name}}</strong> cohort.</p><p>We look forward to seeing your progress!</p>',
                'placeholders' => ['user_name', 'cohort_name']
            ],
            [
                'slug' => 'new-update',
                'name' => 'New Update/Announcement',
                'subject' => 'New Update from DrealtiesFX Academy',
                'body' => '<p>Hello {{user_name}},</p><p>We have a new update for you:</p><div>{{update_content}}</div>',
                'placeholders' => ['user_name', 'update_content']
            ],
            [
                'slug' => 'cohort-concluded',
                'name' => 'Cohort Completion Notification',
                'subject' => 'Congratulations on finishing your Cohort!',
                'body' => '<p>Hello {{user_name}},</p><p>Congratulations on completing the <strong>{{cohort_name}}</strong> cohort! We are proud of your progress.</p>',
                'placeholders' => ['user_name', 'cohort_name']
            ],
            [
                'slug' => 'new-update',
                'name' => 'General Academy Update',
                'subject' => 'New Update from DrealtiesFX Academy',
                'body' => '<p>Hello {{user_name}},</p><p>We have a new update for you: {{update_content}}</p>',
                'placeholders' => ['user_name', 'update_content']
            ]
        ];

        foreach ($templates as $template) {
            \App\Models\EmailTemplate::updateOrCreate(
                ['slug' => $template['slug']],
                $template
            );
        }
    }
}
