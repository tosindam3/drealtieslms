<?php

namespace App\Services;

use App\Models\User;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\UserProgress;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use App\Events\AssignmentSubmittedEvent;
use App\Events\AssignmentApprovedEvent;
use App\Events\AssignmentRejectedEvent;
use App\Exceptions\AssignmentException;

class AssignmentService
{
    public function __construct(
        private CoinService $coinService,
        private WeekUnlockService $weekUnlockService
    ) {}

    /**
     * Submit an assignment
     */
    public function submitAssignment(User $user, Assignment $assignment, array $submissionData): AssignmentSubmission
    {
        // Validate submission eligibility
        $this->validateSubmissionEligibility($user, $assignment);

        return DB::transaction(function () use ($user, $assignment, $submissionData) {
            // Handle file uploads if present
            $fileUrls = $this->handleFileUploads($submissionData['files'] ?? []);

            $submission = AssignmentSubmission::create([
                'user_id' => $user->id,
                'assignment_id' => $assignment->id,
                'content' => $submissionData['content'] ?? '',
                'file_urls' => $fileUrls,
                'status' => AssignmentSubmission::STATUS_SUBMITTED,
                'submitted_at' => now(),
                'metadata' => $submissionData['metadata'] ?? [],
            ]);

            // Clear caches
            $this->clearAssignmentCaches($user->id, $assignment->id);

            // Dispatch event
            event(new AssignmentSubmittedEvent($user, $assignment, $submission));

            return $submission;
        });
    }

    /**
     * Approve an assignment submission
     */
    public function approveSubmission(AssignmentSubmission $submission, User $instructor, ?string $feedback = null): AssignmentSubmission
    {
        if ($submission->status !== AssignmentSubmission::STATUS_SUBMITTED) {
            throw new AssignmentException('Only submitted assignments can be approved');
        }

        return DB::transaction(function () use ($submission, $instructor, $feedback) {
            $submission->update([
                'status' => AssignmentSubmission::STATUS_APPROVED,
                'reviewed_by' => $instructor->id,
                'reviewed_at' => now(),
                'feedback' => $feedback,
            ]);

            // Award coins
            $this->awardAssignmentCoins($submission->user, $submission->assignment, $submission);

            // Update week progress
            $this->updateWeekProgress($submission->user, $submission->assignment);

            // Clear caches
            $this->clearAssignmentCaches($submission->user_id, $submission->assignment_id);

            // Dispatch event
            event(new AssignmentApprovedEvent($submission->user, $submission->assignment, $submission, $instructor));

            return $submission;
        });
    }

    /**
     * Reject an assignment submission
     */
    public function rejectSubmission(AssignmentSubmission $submission, User $instructor, string $feedback): AssignmentSubmission
    {
        if ($submission->status !== AssignmentSubmission::STATUS_SUBMITTED) {
            throw new AssignmentException('Only submitted assignments can be rejected');
        }

        return DB::transaction(function () use ($submission, $instructor, $feedback) {
            $submission->update([
                'status' => AssignmentSubmission::STATUS_REJECTED,
                'reviewed_by' => $instructor->id,
                'reviewed_at' => now(),
                'feedback' => $feedback,
            ]);

            // Clear caches
            $this->clearAssignmentCaches($submission->user_id, $submission->assignment_id);

            // Dispatch event
            event(new AssignmentRejectedEvent($submission->user, $submission->assignment, $submission, $instructor));

            return $submission;
        });
    }

    /**
     * Request revision for an assignment submission
     */
    public function requestRevision(AssignmentSubmission $submission, User $instructor, string $feedback): AssignmentSubmission
    {
        if (!in_array($submission->status, [AssignmentSubmission::STATUS_SUBMITTED, AssignmentSubmission::STATUS_REJECTED])) {
            throw new AssignmentException('Cannot request revision for this submission status');
        }

        return DB::transaction(function () use ($submission, $instructor, $feedback) {
            $submission->update([
                'status' => AssignmentSubmission::STATUS_REVISION_REQUESTED,
                'reviewed_by' => $instructor->id,
                'reviewed_at' => now(),
                'feedback' => $feedback,
            ]);

            // Clear caches
            $this->clearAssignmentCaches($submission->user_id, $submission->assignment_id);

            return $submission;
        });
    }

    /**
     * Resubmit an assignment after revision
     */
    public function resubmitAssignment(AssignmentSubmission $submission, array $submissionData): AssignmentSubmission
    {
        if ($submission->status !== AssignmentSubmission::STATUS_REVISION_REQUESTED) {
            throw new AssignmentException('Can only resubmit assignments that require revision');
        }

        return DB::transaction(function () use ($submission, $submissionData) {
            // Handle new file uploads
            $newFileUrls = $this->handleFileUploads($submissionData['files'] ?? []);
            
            // Merge with existing files if keeping them
            $fileUrls = array_merge($submission->file_urls ?? [], $newFileUrls);

            $submission->update([
                'content' => $submissionData['content'] ?? $submission->content,
                'file_urls' => $fileUrls,
                'status' => AssignmentSubmission::STATUS_SUBMITTED,
                'submitted_at' => now(),
                'metadata' => array_merge($submission->metadata ?? [], $submissionData['metadata'] ?? []),
            ]);

            // Clear caches
            $this->clearAssignmentCaches($submission->user_id, $submission->assignment_id);

            // Dispatch event
            event(new AssignmentSubmittedEvent($submission->user, $submission->assignment, $submission));

            return $submission;
        });
    }

    /**
     * Get user's submission for an assignment
     */
    public function getUserSubmission(User $user, Assignment $assignment): ?AssignmentSubmission
    {
        return AssignmentSubmission::where('user_id', $user->id)
                                  ->where('assignment_id', $assignment->id)
                                  ->latest()
                                  ->first();
    }

    /**
     * Check if user has submitted assignment
     */
    public function hasUserSubmitted(User $user, Assignment $assignment): bool
    {
        return AssignmentSubmission::where('user_id', $user->id)
                                  ->where('assignment_id', $assignment->id)
                                  ->exists();
    }

    /**
     * Check if user has completed assignment (approved submission)
     */
    public function hasUserCompleted(User $user, Assignment $assignment): bool
    {
        return AssignmentSubmission::where('user_id', $user->id)
                                  ->where('assignment_id', $assignment->id)
                                  ->where('status', AssignmentSubmission::STATUS_APPROVED)
                                  ->exists();
    }

    /**
     * Get submissions pending review
     */
    public function getPendingSubmissions(Assignment $assignment = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = AssignmentSubmission::where('status', AssignmentSubmission::STATUS_SUBMITTED)
                                    ->with(['user', 'assignment'])
                                    ->orderBy('submitted_at');

        if ($assignment) {
            $query->where('assignment_id', $assignment->id);
        }

        return $query->get();
    }

    /**
     * Get assignment statistics
     */
    public function getAssignmentStatistics(Assignment $assignment): array
    {
        return Cache::remember(
            "assignment_stats_{$assignment->id}",
            now()->addMinutes(15),
            function () use ($assignment) {
                $submissions = AssignmentSubmission::where('assignment_id', $assignment->id);

                $totalSubmissions = $submissions->count();
                $approvedSubmissions = $submissions->where('status', AssignmentSubmission::STATUS_APPROVED)->count();
                $rejectedSubmissions = $submissions->where('status', AssignmentSubmission::STATUS_REJECTED)->count();
                $pendingSubmissions = $submissions->where('status', AssignmentSubmission::STATUS_SUBMITTED)->count();
                $revisionRequested = $submissions->where('status', AssignmentSubmission::STATUS_REVISION_REQUESTED)->count();

                $uniqueUsers = $submissions->distinct('user_id')->count();

                return [
                    'total_submissions' => $totalSubmissions,
                    'approved_submissions' => $approvedSubmissions,
                    'rejected_submissions' => $rejectedSubmissions,
                    'pending_submissions' => $pendingSubmissions,
                    'revision_requested' => $revisionRequested,
                    'unique_users' => $uniqueUsers,
                    'approval_rate' => $totalSubmissions > 0 ? round(($approvedSubmissions / $totalSubmissions) * 100, 2) : 0,
                    'completion_rate' => $this->calculateCompletionRate($assignment),
                ];
            }
        );
    }

    /**
     * Calculate completion rate for assignment
     */
    private function calculateCompletionRate(Assignment $assignment): float
    {
        // Get total enrolled students in the cohort
        $totalStudents = $assignment->week->cohort->students()->count();
        
        if ($totalStudents === 0) {
            return 0.0;
        }

        $completedStudents = AssignmentSubmission::where('assignment_id', $assignment->id)
                                               ->where('status', AssignmentSubmission::STATUS_APPROVED)
                                               ->distinct('user_id')
                                               ->count();

        return round(($completedStudents / $totalStudents) * 100, 2);
    }

    /**
     * Validate submission eligibility
     */
    private function validateSubmissionEligibility(User $user, Assignment $assignment): void
    {
        // Check if user has access to the week
        $weekProgress = UserProgress::where('user_id', $user->id)
                                   ->where('week_id', $assignment->week_id)
                                   ->first();

        if (!$weekProgress || !$weekProgress->is_unlocked) {
            throw new AssignmentException('Week must be unlocked to access this assignment');
        }

        // Check if assignment allows multiple submissions
        if (!$assignment->allow_multiple_submissions) {
            $existingSubmission = $this->getUserSubmission($user, $assignment);
            if ($existingSubmission && $existingSubmission->status === AssignmentSubmission::STATUS_APPROVED) {
                throw new AssignmentException('Assignment already completed');
            }
        }

        // Check deadline if set
        if ($assignment->due_date && now()->isAfter($assignment->due_date)) {
            if (!$assignment->allow_late_submissions) {
                throw new AssignmentException('Assignment deadline has passed');
            }
        }
    }

    /**
     * Handle file uploads
     */
    private function handleFileUploads(array $files): array
    {
        $fileUrls = [];

        foreach ($files as $file) {
            if (!$file || !$file->isValid()) {
                continue;
            }

            // Validate file type and size
            $this->validateFile($file);

            // Store file
            $path = $file->store('assignments/' . date('Y/m'), 'public');
            $fileUrls[] = [
                'url' => Storage::url($path),
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'uploaded_at' => now()->toISOString(),
            ];
        }

        return $fileUrls;
    }

    /**
     * Validate uploaded file
     */
    private function validateFile($file): void
    {
        $maxSize = 10 * 1024 * 1024; // 10MB
        $allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif',
        ];

        if ($file->getSize() > $maxSize) {
            throw new AssignmentException('File size exceeds maximum allowed size of 10MB');
        }

        if (!in_array($file->getMimeType(), $allowedTypes)) {
            throw new AssignmentException('File type not allowed');
        }
    }

    /**
     * Award coins for assignment completion
     */
    private function awardAssignmentCoins(User $user, Assignment $assignment, AssignmentSubmission $submission): void
    {
        if ($assignment->coin_reward <= 0) {
            return;
        }

        // Check if user has already been awarded coins for this assignment
        $existingAward = $user->coinTransactions()
                             ->where('source_type', 'assignment')
                             ->where('source_id', $assignment->id)
                             ->where('transaction_type', 'earned')
                             ->exists();

        if ($existingAward) {
            return; // Already awarded
        }

        $this->coinService->awardCoins(
            $user,
            $assignment->coin_reward,
            'assignment',
            $assignment->id,
            "Assignment approved: {$assignment->title}"
        );
    }

    /**
     * Update week progress after assignment completion
     */
    private function updateWeekProgress(User $user, Assignment $assignment): void
    {
        try {
            $this->weekUnlockService->recalculateWeekProgress($user, $assignment->week);
        } catch (\Exception $e) {
            // Log error but don't fail the assignment approval
            logger()->error("Failed to update week progress after assignment completion: " . $e->getMessage());
        }
    }

    /**
     * Clear assignment-related caches
     */
    private function clearAssignmentCaches(int $userId, int $assignmentId): void
    {
        Cache::forget("assignment_stats_{$assignmentId}");
        Cache::forget("user_assignment_submission_{$userId}_{$assignmentId}");
    }

    /**
     * Bulk approve submissions (admin function)
     */
    public function bulkApproveSubmissions(array $submissionIds, User $instructor, ?string $feedback = null): array
    {
        $results = [];

        foreach ($submissionIds as $submissionId) {
            try {
                $submission = AssignmentSubmission::findOrFail($submissionId);
                $this->approveSubmission($submission, $instructor, $feedback);
                $results[$submissionId] = ['success' => true];
            } catch (\Exception $e) {
                $results[$submissionId] = ['success' => false, 'error' => $e->getMessage()];
            }
        }

        return $results;
    }

    /**
     * Get overdue assignments
     */
    public function getOverdueAssignments(): \Illuminate\Database\Eloquent\Collection
    {
        return Assignment::where('due_date', '<', now())
                        ->whereHas('week.cohort', function ($query) {
                            $query->where('status', 'active');
                        })
                        ->with(['week.cohort', 'submissions'])
                        ->get();
    }

    /**
     * Send reminder notifications for pending assignments
     */
    public function sendAssignmentReminders(): int
    {
        $upcomingAssignments = Assignment::where('due_date', '>', now())
                                        ->where('due_date', '<=', now()->addDays(2))
                                        ->whereHas('week.cohort', function ($query) {
                                            $query->where('status', 'active');
                                        })
                                        ->with(['week.cohort.students'])
                                        ->get();

        $remindersSent = 0;

        foreach ($upcomingAssignments as $assignment) {
            foreach ($assignment->week->cohort->students as $student) {
                if (!$this->hasUserSubmitted($student, $assignment)) {
                    // Send reminder notification (implement notification logic)
                    $remindersSent++;
                }
            }
        }

        return $remindersSent;
    }
}