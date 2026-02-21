<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\UserProgress;
use App\Services\AssignmentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use App\Exceptions\AssignmentException;

class AssignmentController extends Controller
{
    public function __construct(
        private AssignmentService $assignmentService
    ) {}

    /**
     * Get assignment details
     */
    public function show(Request $request, Assignment $assignment): JsonResponse
    {
        $user = $request->user();

        try {
            // Check if user has access to this assignment's week
            if ($user->isStudent()) {
                $progress = UserProgress::where('user_id', $user->id)
                    ->where('week_id', $assignment->week_id)
                    ->first();

                if (!$progress || !$progress->is_unlocked) {
                    return $this->forbiddenResponse('The week containing this assignment is not yet unlocked');
                }
            }

            // Load assignment with relationships
            $assignment->load([
                'week' => function ($query) {
                    $query->with('cohort:id,name');
                }
            ]);

            $assignmentData = [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'description' => $assignment->description,
                'instructions' => $assignment->instructions,
                'coin_reward' => $assignment->coin_reward,
                'due_date' => $assignment->due_date?->toDateString(),
                'max_file_size' => $assignment->max_file_size,
                'max_file_size_mb' => $assignment->max_file_size ? round($assignment->max_file_size / 1024 / 1024, 2) : null,
                'allowed_file_types' => $assignment->allowed_file_types,
                'submission_type' => $assignment->submission_type,
                'is_group_assignment' => $assignment->is_group_assignment,
                'max_group_size' => $assignment->max_group_size,
                'rubric' => $assignment->rubric,
                'week' => [
                    'id' => $assignment->week->id,
                    'week_number' => $assignment->week->week_number,
                    'title' => $assignment->week->title,
                    'cohort' => [
                        'id' => $assignment->week->cohort->id,
                        'name' => $assignment->week->cohort->name,
                    ],
                ],
                'is_overdue' => $assignment->due_date && $assignment->due_date->isPast(),
                'days_until_due' => $assignment->due_date ? now()->diffInDays($assignment->due_date, false) : null,
            ];

            // Add submission information for students
            if ($user && $user->isStudent()) {
                $submission = $user->assignmentSubmissions()
                    ->where('assignment_id', $assignment->id)
                    ->latest()
                    ->first();

                $assignmentData['submission'] = $submission ? [
                    'id' => $submission->id,
                    'status' => $submission->status,
                    'submitted_at' => $submission->submitted_at->toISOString(),
                    'file_path' => $submission->file_path,
                    'file_name' => $submission->file_name,
                    'file_size' => $submission->file_size,
                    'content' => $submission->content,
                    'feedback' => $submission->feedback,
                    'grade' => $submission->grade,
                    'coins_awarded' => $submission->coins_awarded,
                    'reviewed_at' => $submission->reviewed_at?->toISOString(),
                    'reviewed_by' => $submission->reviewedBy ? [
                        'id' => $submission->reviewedBy->id,
                        'name' => $submission->reviewedBy->name,
                    ] : null,
                    'can_resubmit' => $submission->status === 'revision_requested',
                ] : null;

                $assignmentData['can_submit'] = !$submission || $submission->status === 'revision_requested';
                $assignmentData['has_submission'] = !is_null($submission);
            }

            // Add assignment statistics for instructors/admins
            if ($user && ($user->isInstructor() || $user->isAdmin())) {
                $assignmentData['statistics'] = $this->assignmentService->getAssignmentStatistics($assignment);
            }

            return response()->json([
                'assignment' => $assignmentData,
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse(
                'assignment_fetch_failed',
                'Failed to fetch assignment details',
                500
            );
        }
    }

    /**
     * Submit assignment
     */
    public function submit(Request $request, Assignment $assignment): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStudent()) {
            return $this->forbiddenResponse('Only students can submit assignments');
        }

        $validator = Validator::make($request->all(), [
            'content' => 'required_without:file|string',
            'file' => 'required_without:content|file|max:' . ($assignment->max_file_size ? $assignment->max_file_size / 1024 : 10240),
            'notes' => 'sometimes|string|max:1000',
        ]);

        // Add file type validation if specified
        if ($assignment->allowed_file_types) {
            $allowedTypes = implode(',', $assignment->allowed_file_types);
            $validator->addRules([
                'file' => 'mimes:' . $allowedTypes,
            ]);
        }

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors()->toArray());
        }

        try {
            // Check if user can submit
            if (!$this->assignmentService->canUserSubmit($user, $assignment)) {
                return $this->errorResponse(
                    'submission_not_allowed',
                    'You cannot submit this assignment at this time',
                    400
                );
            }

            $submissionData = [
                'content' => $request->get('content'),
                'notes' => $request->get('notes'),
            ];

            // Handle file upload if present
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $submissionData['file'] = $file;
            }

            $submission = $this->assignmentService->submitAssignment($user, $assignment, $submissionData);

            return response()->json([
                'message' => 'Assignment submitted successfully',
                'assignment' => [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                ],
                'submission' => [
                    'id' => $submission->id,
                    'status' => $submission->status,
                    'submitted_at' => $submission->submitted_at->toISOString(),
                    'file_name' => $submission->file_name,
                    'file_size' => $submission->file_size,
                    'content' => $submission->content,
                    'notes' => $submission->notes,
                ],
                'timestamp' => now()->toISOString()
            ], 201);

        } catch (AssignmentException $e) {
            return $this->errorResponse(
                'assignment_submission_failed',
                $e->getMessage(),
                400
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'assignment_submission_error',
                'An error occurred while submitting the assignment',
                500
            );
        }
    }

    /**
     * Download assignment submission file
     */
    public function downloadSubmission(Request $request, AssignmentSubmission $submission): JsonResponse
    {
        $user = $request->user();

        // Check access permissions
        if ($user->isStudent() && $submission->user_id !== $user->id) {
            return $this->forbiddenResponse('You can only download your own submissions');
        }

        if (!$user->isStudent() && !$user->isInstructor() && !$user->isAdmin()) {
            return $this->forbiddenResponse('Access denied');
        }

        try {
            if (!$submission->file_path || !Storage::exists($submission->file_path)) {
                return $this->errorResponse(
                    'file_not_found',
                    'Submission file not found',
                    404
                );
            }

            return Storage::download($submission->file_path, $submission->file_name);

        } catch (\Exception $e) {
            return $this->errorResponse(
                'download_failed',
                'Failed to download submission file',
                500
            );
        }
    }

    /**
     * Review assignment submission (for instructors/admins)
     */
    public function review(Request $request, AssignmentSubmission $submission): JsonResponse
    {
        $user = $request->user();

        if (!$user->isInstructor() && !$user->isAdmin()) {
            return $this->forbiddenResponse('Only instructors and admins can review submissions');
        }

        $validator = Validator::make($request->all(), [
            'action' => 'required|string|in:approve,reject,request_revision',
            'feedback' => 'required|string|max:2000',
            'grade' => 'sometimes|numeric|min:0|max:100',
            'private_notes' => 'sometimes|string|max:1000',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors()->toArray());
        }

        try {
            $reviewData = [
                'action' => $request->get('action'),
                'feedback' => $request->get('feedback'),
                'grade' => $request->get('grade'),
                'private_notes' => $request->get('private_notes'),
            ];

            $result = $this->assignmentService->reviewSubmission($submission, $user, $reviewData);

            return response()->json([
                'message' => 'Submission reviewed successfully',
                'submission' => [
                    'id' => $submission->id,
                    'status' => $submission->fresh()->status,
                    'feedback' => $submission->fresh()->feedback,
                    'grade' => $submission->fresh()->grade,
                    'coins_awarded' => $submission->fresh()->coins_awarded,
                    'reviewed_at' => $submission->fresh()->reviewed_at->toISOString(),
                ],
                'student' => [
                    'id' => $submission->user->id,
                    'name' => $submission->user->name,
                    'new_coin_balance' => $result['coins_awarded'] > 0 ? $submission->user->fresh()->getCurrentCoinBalance() : null,
                ],
                'coins_awarded' => $result['coins_awarded'],
                'timestamp' => now()->toISOString()
            ]);

        } catch (AssignmentException $e) {
            return $this->errorResponse(
                'review_failed',
                $e->getMessage(),
                400
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'review_error',
                'An error occurred while reviewing the submission',
                500
            );
        }
    }

    /**
     * Get assignment submissions (for instructors/admins)
     */
    public function submissions(Request $request, Assignment $assignment): JsonResponse
    {
        $user = $request->user();

        if (!$user->isInstructor() && !$user->isAdmin()) {
            return $this->forbiddenResponse('Access denied');
        }

        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|string|in:' . implode(',', AssignmentSubmission::getStatuses()),
            'per_page' => 'sometimes|integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors()->toArray());
        }

        try {
            $query = $assignment->submissions()
                ->with(['user:id,name,email', 'reviewedBy:id,name'])
                ->orderBy('submitted_at', 'desc');

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $perPage = $request->get('per_page', 20);
            $submissions = $query->paginate($perPage);

            $submissionData = $submissions->getCollection()->map(function ($submission) {
                return [
                    'id' => $submission->id,
                    'user' => [
                        'id' => $submission->user->id,
                        'name' => $submission->user->name,
                        'email' => $submission->user->email,
                    ],
                    'status' => $submission->status,
                    'submitted_at' => $submission->submitted_at->toISOString(),
                    'file_name' => $submission->file_name,
                    'file_size' => $submission->file_size,
                    'has_content' => !empty($submission->content),
                    'feedback' => $submission->feedback,
                    'grade' => $submission->grade,
                    'coins_awarded' => $submission->coins_awarded,
                    'reviewed_at' => $submission->reviewed_at?->toISOString(),
                    'reviewed_by' => $submission->reviewedBy ? [
                        'id' => $submission->reviewedBy->id,
                        'name' => $submission->reviewedBy->name,
                    ] : null,
                    'needs_review' => $submission->status === 'submitted',
                ];
            });

            return response()->json([
                'assignment' => [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'week_number' => $assignment->week->week_number,
                    'due_date' => $assignment->due_date?->toDateString(),
                ],
                'submissions' => $submissionData,
                'pagination' => [
                    'current_page' => $submissions->currentPage(),
                    'last_page' => $submissions->lastPage(),
                    'per_page' => $submissions->perPage(),
                    'total' => $submissions->total(),
                ],
                'statistics' => $this->assignmentService->getAssignmentStatistics($assignment),
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse(
                'submissions_fetch_failed',
                'Failed to fetch assignment submissions',
                500
            );
        }
    }

    /**
     * Get assignment statistics (for instructors/admins)
     */
    public function statistics(Request $request, Assignment $assignment): JsonResponse
    {
        $user = $request->user();

        if (!$user->isInstructor() && !$user->isAdmin()) {
            return $this->forbiddenResponse('Access denied');
        }

        try {
            $statistics = $this->assignmentService->getAssignmentStatistics($assignment);

            return response()->json([
                'assignment' => [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'week_number' => $assignment->week->week_number,
                    'due_date' => $assignment->due_date?->toDateString(),
                    'coin_reward' => $assignment->coin_reward,
                ],
                'statistics' => $statistics,
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse(
                'assignment_statistics_fetch_failed',
                'Failed to fetch assignment statistics',
                500
            );
        }
    }
}