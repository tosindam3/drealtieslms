<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EmailTemplate;
use App\Models\User;
use App\Services\Mail\EmailTemplateService;
use Illuminate\Http\JsonResponse;

class EmailTemplateController extends Controller
{
    protected $emailService;

    public function __construct(EmailTemplateService $emailService)
    {
        $this->emailService = $emailService;
    }

    /**
     * Display a listing of the email templates.
     */
    public function index(): JsonResponse
    {
        $templates = EmailTemplate::all();
        return response()->json([
            'templates' => $templates,
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Display the specified email template.
     */
    public function show(EmailTemplate $emailTemplate): JsonResponse
    {
        return response()->json([
            'template' => $emailTemplate,
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Store a newly created email template in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slug' => 'required|string|unique:email_templates,slug|max:255',
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'placeholders' => 'sometimes|array',
            'settings' => 'sometimes|array',
        ]);

        $template = EmailTemplate::create($validated);

        return response()->json([
            'message' => 'Email template created successfully',
            'template' => $template,
            'timestamp' => now()->toISOString()
        ], 201);
    }

    /**
     * Update the specified email template in storage.
     */
    public function update(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $validated = $request->validate([
            'slug' => 'sometimes|string|unique:email_templates,slug,' . $emailTemplate->id . '|max:255',
            'name' => 'sometimes|string|max:255',
            'subject' => 'sometimes|string|max:255',
            'body' => 'sometimes|string',
            'placeholders' => 'sometimes|array',
            'settings' => 'sometimes|array',
        ]);

        $emailTemplate->update($validated);

        return response()->json([
            'message' => 'Email template updated successfully',
            'template' => $emailTemplate,
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Remove the specified email template from storage.
     */
    public function destroy(EmailTemplate $emailTemplate): JsonResponse
    {
        $emailTemplate->delete();

        return response()->json([
            'message' => 'Email template deleted successfully',
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Send a test email for a template
     */
    public function test(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'placeholders' => 'sometimes|array',
        ]);

        // Merge provided placeholders with some defaults for testing
        $testPlaceholders = array_merge([
            'user_name' => 'Test User',
            'module_name' => 'Sample Module',
            'cohort_name' => 'Sample Cohort',
            'plan_name' => 'Sample Plan',
            'amount' => '99.99',
            'currency' => 'USD',
            'reference' => 'TEST-REF-123',
            'reset_url' => 'https://example.com/reset',
            'ends_at' => now()->addMonth()->toDateString(),
        ], $request->input('placeholders', []));

        try {
            $this->emailService->sendTemplateMail($emailTemplate->slug, $request->email, $testPlaceholders);
            return response()->json(['message' => 'Test email sent successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send test email: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Broadcast an update to students
     */
    public function broadcast(Request $request): JsonResponse
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'cohort_id' => 'sometimes|exists:cohorts,id',
        ]);

        $query = User::where('role', 'student');

        if ($request->has('cohort_id')) {
            $query->whereHas('enrollments', function ($q) use ($request) {
                $q->where('cohort_id', $request->cohort_id)->where('status', 'active');
            });
        }

        $students = $query->get();
        $count = 0;

        foreach ($students as $student) {
            try {
                $this->emailService->sendTemplateMail('new-update', $student->email, [
                    'user_name' => $student->name,
                    'update_content' => $request->body,
                ]);
                $count++;
            } catch (\Exception $e) {
                // Log or handle individual failures
            }
        }

        return response()->json([
            'message' => "Update broadcasted to {$count} students successfully.",
            'timestamp' => now()->toISOString()
        ]);
    }
}
