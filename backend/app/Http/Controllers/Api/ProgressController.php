<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cohort;
use App\Models\Week;
use App\Models\User;
use App\Models\UserProgress;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ProgressController extends Controller
{
    /**
     * Get user's progress for a specific cohort
     */
    public function cohortProgress(Request $request, Cohort $cohort): JsonResponse
    {
        $user = $request->user();

        // Check if user is enrolled in this cohort
        if ($user->isStudent() && !$this->isUserEnrolledInCohort($user, $cohort)) {
            return $this->forbiddenResponse('You are not enrolled in this cohort');
        }

        try {
            // For students, show their own progress
            if ($user->isStudent()) {
                return $this->getStudentCohortProgress($user, $cohort);
            }

            // For instructors/admins, show overall cohort progress
            if ($user->isInstructor() || $user->isAdmin()) {
                return $this->getCohortOverallProgress($cohort);
            }

            return $this->forbiddenResponse('Access denied');
        } catch (\Exception $e) {
            return $this->errorResponse(
                'progress_fetch_failed',
                'Failed to fetch cohort progress',
                500
            );
        }
    }

    /**
     * Get user's progress for a specific week
     */
    public function weekProgress(Request $request, Week $week): JsonResponse
    {
        $user = $request->user();

        // Check if user is enrolled in the cohort containing this week
        if ($user->isStudent() && !$this->isUserEnrolledInCohort($user, $week->cohort)) {
            return $this->forbiddenResponse('You are not enrolled in this cohort');
        }

        try {
            // For students, show their own week progress
            if ($user->isStudent()) {
                return $this->getStudentWeekProgress($user, $week);
            }

            // For instructors/admins, show overall week progress
            if ($user->isInstructor() || $user->isAdmin()) {
                return $this->getWeekOverallProgress($week);
            }

            return $this->forbiddenResponse('Access denied');
        } catch (\Exception $e) {
            return $this->errorResponse(
                'week_progress_fetch_failed',
                'Failed to fetch week progress',
                500
            );
        }
    }

    /**
     * Get student's progress for a cohort
     */
    private function getStudentCohortProgress(User $student, Cohort $cohort): JsonResponse
    {
        // Get enrollment info
        $enrollment = $student->enrollments()
            ->where('cohort_id', $cohort->id)
            ->first();

        if (!$enrollment) {
            return $this->notFoundResponse('Enrollment not found');
        }

        // Get week progress
        $weekProgress = UserProgress::where('user_id', $student->id)
            ->where('cohort_id', $cohort->id)
            ->with(['week' => function ($query) {
                $query->with(['lessons.topics', 'quizzes', 'assignments', 'liveClasses']);
            }])
            ->orderBy('week_id')
            ->get();

        // Calculate overall statistics
        $totalWeeks = $weekProgress->count();
        $unlockedWeeks = $weekProgress->where('is_unlocked', true)->count();
        $completedWeeks = $weekProgress->where('completion_percentage', 100)->count();
        $overallProgress = $weekProgress->avg('completion_percentage') ?? 0;

        // Get coin balance
        $coinBalance = $student->getCurrentCoinBalance();

        // Transform week progress data
        $weeks = $weekProgress->map(function ($progress) use ($student) {
            $week = $progress->week;

            return [
                'week_id' => $week->id,
                'week_number' => $week->week_number,
                'title' => $week->title,
                'description' => $week->description,
                'is_unlocked' => $progress->is_unlocked,
                'unlocked_at' => $progress->unlocked_at?->toISOString(),
                'completion_percentage' => $progress->completion_percentage,
                'completed_at' => $progress->completed_at?->toISOString(),
                'content_summary' => [
                    'lessons' => $week->lessons->count(),
                    'topics' => $week->lessons->sum(fn($lesson) => $lesson->topics->count()),
                    'quizzes' => $week->quizzes->count(),
                    'assignments' => $week->assignments->count(),
                    'live_classes' => $week->liveClasses->count(),
                ],
                'completion_details' => $this->getWeekCompletionDetails($student, $week),
            ];
        });

        return response()->json([
            'cohort' => [
                'id' => $cohort->id,
                'name' => $cohort->name,
                'start_date' => $cohort->start_date->toDateString(),
                'end_date' => $cohort->end_date->toDateString(),
            ],
            'enrollment' => [
                'enrolled_at' => $enrollment->pivot->enrolled_at,
                'status' => $enrollment->pivot->status,
                'completion_percentage' => $enrollment->pivot->completion_percentage,
            ],
            'progress_summary' => [
                'total_weeks' => $totalWeeks,
                'unlocked_weeks' => $unlockedWeeks,
                'completed_weeks' => $completedWeeks,
                'overall_progress' => round($overallProgress, 2),
                'coin_balance' => $coinBalance,
            ],
            'weeks' => $weeks,
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Get overall cohort progress (for instructors/admins)
     */
    private function getCohortOverallProgress(Cohort $cohort): JsonResponse
    {
        // Get enrollment statistics
        $totalStudents = $cohort->enrollments()->where('status', 'active')->count();
        $completedStudents = $cohort->enrollments()->where('status', 'completed')->count();
        $averageProgress = $cohort->enrollments()
            ->where('status', 'active')
            ->avg('completion_percentage') ?? 0;

        // Get week-by-week progress
        $weeks = $cohort->weeks()->with(['lessons.topics', 'quizzes', 'assignments', 'liveClasses'])
            ->orderBy('week_number')
            ->get();

        $weekProgressData = $weeks->map(function ($week) use ($cohort) {
            $weekProgress = UserProgress::where('cohort_id', $cohort->id)
                ->where('week_id', $week->id)
                ->get();

            $unlockedCount = $weekProgress->where('is_unlocked', true)->count();
            $completedCount = $weekProgress->where('completion_percentage', 100)->count();
            $averageCompletion = $weekProgress->avg('completion_percentage') ?? 0;

            return [
                'week_id' => $week->id,
                'week_number' => $week->week_number,
                'title' => $week->title,
                'students_unlocked' => $unlockedCount,
                'students_completed' => $completedCount,
                'average_completion' => round($averageCompletion, 2),
                'content_count' => [
                    'lessons' => $week->lessons->count(),
                    'topics' => $week->lessons->sum(fn($lesson) => $lesson->topics->count()),
                    'quizzes' => $week->quizzes->count(),
                    'assignments' => $week->assignments->count(),
                    'live_classes' => $week->liveClasses->count(),
                ],
            ];
        });

        return response()->json([
            'cohort' => [
                'id' => $cohort->id,
                'name' => $cohort->name,
                'status' => $cohort->status,
                'start_date' => $cohort->start_date->toDateString(),
                'end_date' => $cohort->end_date->toDateString(),
            ],
            'overall_statistics' => [
                'total_students' => $totalStudents,
                'completed_students' => $completedStudents,
                'completion_rate' => $totalStudents > 0 ? round(($completedStudents / $totalStudents) * 100, 2) : 0,
                'average_progress' => round($averageProgress, 2),
            ],
            'week_progress' => $weekProgressData,
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Get student's progress for a specific week
     */
    private function getStudentWeekProgress(User $student, Week $week): JsonResponse
    {
        $progress = UserProgress::where('user_id', $student->id)
            ->where('week_id', $week->id)
            ->first();

        if (!$progress) {
            return $this->notFoundResponse('Week progress not found');
        }

        // Load week content
        $week->load(['lessons.topics', 'quizzes', 'assignments', 'liveClasses']);

        // Get detailed completion status
        $completionDetails = $this->getWeekCompletionDetails($student, $week);

        return response()->json([
            'week' => [
                'id' => $week->id,
                'week_number' => $week->week_number,
                'title' => $week->title,
                'description' => $week->description,
                'cohort_id' => $week->cohort_id,
            ],
            'progress' => [
                'is_unlocked' => $progress->is_unlocked,
                'unlocked_at' => $progress->unlocked_at?->toISOString(),
                'completion_percentage' => $progress->completion_percentage,
                'completed_at' => $progress->completed_at?->toISOString(),
            ],
            'completion_details' => $completionDetails,
            'content_summary' => [
                'lessons' => $week->lessons->count(),
                'topics' => $week->lessons->sum(fn($lesson) => $lesson->topics->count()),
                'quizzes' => $week->quizzes->count(),
                'assignments' => $week->assignments->count(),
                'live_classes' => $week->liveClasses->count(),
            ],
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Get overall week progress (for instructors/admins)
     */
    private function getWeekOverallProgress(Week $week): JsonResponse
    {
        $cohort = $week->cohort;
        $totalStudents = $cohort->enrollments()->where('status', 'active')->count();

        $weekProgress = UserProgress::where('week_id', $week->id)
            ->with('user')
            ->get();

        $unlockedCount = $weekProgress->where('is_unlocked', true)->count();
        $completedCount = $weekProgress->where('completion_percentage', 100)->count();
        $averageCompletion = $weekProgress->avg('completion_percentage') ?? 0;

        // Get individual student progress
        $studentProgress = $weekProgress->map(function ($progress) {
            return [
                'user_id' => $progress->user->id,
                'name' => $progress->user->name,
                'email' => $progress->user->email,
                'is_unlocked' => $progress->is_unlocked,
                'completion_percentage' => $progress->completion_percentage,
                'unlocked_at' => $progress->unlocked_at?->toISOString(),
                'completed_at' => $progress->completed_at?->toISOString(),
            ];
        });

        return response()->json([
            'week' => [
                'id' => $week->id,
                'week_number' => $week->week_number,
                'title' => $week->title,
                'cohort_id' => $week->cohort_id,
                'cohort_name' => $cohort->name,
            ],
            'overall_statistics' => [
                'total_students' => $totalStudents,
                'students_unlocked' => $unlockedCount,
                'students_completed' => $completedCount,
                'unlock_rate' => $totalStudents > 0 ? round(($unlockedCount / $totalStudents) * 100, 2) : 0,
                'completion_rate' => $totalStudents > 0 ? round(($completedCount / $totalStudents) * 100, 2) : 0,
                'average_completion' => round($averageCompletion, 2),
            ],
            'student_progress' => $studentProgress,
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Get detailed completion status for a week
     */
    private function getWeekCompletionDetails(User $student, Week $week): array
    {
        // Get topic completions
        $topicIds = $week->lessons->flatMap(fn($lesson) => $lesson->topics->pluck('id'));
        $completedTopics = $student->topicCompletions()
            ->whereIn('topic_id', $topicIds)
            ->count();

        // Get quiz attempts
        $quizIds = $week->quizzes->pluck('id');
        $passedQuizzes = $student->quizAttempts()
            ->whereIn('quiz_id', $quizIds)
            ->where('passed', true)
            ->distinct('quiz_id')
            ->count();

        // Get assignment submissions
        $assignmentIds = $week->assignments->pluck('id');
        $approvedAssignments = $student->assignmentSubmissions()
            ->whereIn('assignment_id', $assignmentIds)
            ->where('status', 'approved')
            ->distinct('assignment_id')
            ->count();

        // Get live class attendance
        $liveClassIds = $week->liveClasses->pluck('id');
        $attendedClasses = $student->liveAttendance()
            ->whereIn('live_class_id', $liveClassIds)
            ->count();

        return [
            'topics' => [
                'total' => $topicIds->count(),
                'completed' => $completedTopics,
                'percentage' => $topicIds->count() > 0 ? round(($completedTopics / $topicIds->count()) * 100, 2) : 0,
            ],
            'quizzes' => [
                'total' => $quizIds->count(),
                'passed' => $passedQuizzes,
                'percentage' => $quizIds->count() > 0 ? round(($passedQuizzes / $quizIds->count()) * 100, 2) : 0,
            ],
            'assignments' => [
                'total' => $assignmentIds->count(),
                'approved' => $approvedAssignments,
                'percentage' => $assignmentIds->count() > 0 ? round(($approvedAssignments / $assignmentIds->count()) * 100, 2) : 0,
            ],
            'live_classes' => [
                'total' => $liveClassIds->count(),
                'attended' => $attendedClasses,
                'percentage' => $liveClassIds->count() > 0 ? round(($attendedClasses / $liveClassIds->count()) * 100, 2) : 0,
            ],
        ];
    }

    /**
     * Sync progress (placeholder for frontend compatibility)
     */
    public function sync(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStudent()) {
            return $this->forbiddenResponse('Only students can sync progress');
        }

        try {
            // Get user's active enrollment (returns Cohort with pivot)
            $enrollment = $user->enrollments()
                ->wherePivot('status', 'active')
                ->first();

            if (!$enrollment) {
                return response()->json([
                    'message' => 'No active enrollment found',
                    'synced' => false,
                    'timestamp' => now()->toISOString()
                ]);
            }

            // Return current progress state
            return response()->json([
                'message' => 'Progress synced successfully',
                'synced' => true,
                'cohort_id' => $enrollment->id,
                'completion_percentage' => (float) $enrollment->pivot->completion_percentage,
                'coin_balance' => $user->getCurrentCoinBalance(),
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'sync_failed',
                'Failed to sync progress',
                500
            );
        }
    }

    /**
     * Track time spent on a topic
     */
    public function trackTopicTime(Request $request, $topicId): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'time_spent' => 'required|integer|min:0|max:86400', // Max 24 hours
            'progress_percentage' => 'nullable|numeric|min:0|max:100',
            'last_position' => 'nullable|integer|min:0',
        ]);

        try {
            $topic = \App\Models\Topic::findOrFail($topicId);

            // Check if user has access to this topic's week (for students only)
            if ($user->isStudent()) {
                $weekProgress = UserProgress::where('user_id', $user->id)
                    ->where('week_id', $topic->lesson->module->week_id)
                    ->first();

                if (!$weekProgress || !$weekProgress->is_unlocked) {
                    return $this->forbiddenResponse('Week must be unlocked to access this topic');
                }

                // For time tracking, we allow viewing but warn about sequence
                // Only enforce strict sequencing on completion, not on time tracking
                $previousLesson = \App\Models\Lesson::where('module_id', $topic->lesson->module_id)
                    ->where('order', '<', $topic->lesson->order)
                    ->orderBy('order', 'desc')
                    ->first();

                // Log warning but don't block time tracking
                if ($previousLesson && !$previousLesson->isCompletedByUser($user)) {
                    \Log::info("User {$user->id} tracking time on topic {$topicId} without completing previous lesson: {$previousLesson->title}");
                    // Don't return error - allow time tracking for preview/review purposes
                }
            }

            // Get TopicCompletionService
            $topicService = app(\App\Services\TopicCompletionService::class);

            // Start or get existing completion
            $topicCompletion = $topicService->startTopic($user, $topic);

            // Update time spent (only if not already completed)
            if (!$topicCompletion->completed_at) {
                $topicCompletion->update([
                    'time_spent_seconds' => $validated['time_spent'],
                ]);

                // Update progress if provided
                if (isset($validated['progress_percentage'])) {
                    $topicService->updateTopicProgress(
                        $user,
                        $topic,
                        $validated['progress_percentage'],
                        $validated['last_position'] ?? 0
                    );
                    $topicCompletion = $topicCompletion->fresh();
                }
            }

            // Check eligibility
            $isEligible = $topicCompletion->isEligibleForCompletion();
            $timeRemaining = $topicCompletion->getTimeRemainingForEligibility();

            return response()->json([
                'success' => true,
                'time_spent_seconds' => $topicCompletion->time_spent_seconds,
                'progress_percentage' => $topicCompletion->completion_percentage,
                'last_position_seconds' => $topicCompletion->last_position_seconds,
                'is_eligible_for_completion' => $isEligible,
                'time_remaining_seconds' => $timeRemaining,
                'min_time_required_seconds' => $topic->min_time_required_seconds ?? 120,
                'is_completed' => (bool) $topicCompletion->completed_at,
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'time_tracking_failed',
                'Failed to track topic time: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Track time spent on a lesson
     */
    public function trackLessonTime(Request $request, $lessonId): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'time_spent' => 'required|integer|min:0|max:86400',
        ]);

        try {
            $lesson = \App\Models\Lesson::findOrFail($lessonId);

            // Check access
            if ($user->isStudent()) {
                $weekProgress = UserProgress::where('user_id', $user->id)
                    ->where('week_id', $lesson->module->week_id)
                    ->first();

                if (!$weekProgress || !$weekProgress->is_unlocked) {
                    return $this->forbiddenResponse('Week must be unlocked to access this lesson');
                }

                // Check lesson sequencing
                $previousLesson = \App\Models\Lesson::where('module_id', $lesson->module_id)
                    ->where('order', '<', $lesson->order)
                    ->orderBy('order', 'desc')
                    ->first();

                if ($previousLesson && !$previousLesson->isCompletedByUser($user)) {
                    return $this->forbiddenResponse("Please complete '{$previousLesson->title}' first.");
                }
            }

            $lessonService = app(\App\Services\LessonCompletionService::class);
            $lessonCompletion = $lessonService->updateLessonProgress($user, $lesson, $validated['time_spent']);

            $progress = $lessonService->calculateLessonProgress($user, $lesson);

            return response()->json([
                'success' => true,
                'time_spent_seconds' => $lessonCompletion->time_spent_seconds,
                'completion_percentage' => $lessonCompletion->completion_percentage,
                'is_eligible_for_completion' => $progress['can_complete'],
                'time_requirement_met' => $progress['time_requirement_met'],
                'min_time_required_seconds' => $lesson->min_time_required_seconds ?? 300,
                'is_completed' => (bool) $lessonCompletion->completed_at,
                'topics_progress' => $progress,
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'time_tracking_failed',
                'Failed to track lesson time: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Get module progress
     */
    public function moduleProgress(Request $request, $moduleId): JsonResponse
    {
        $user = $request->user();

        try {
            $module = \App\Models\Module::with(['lessons.topics', 'week'])->findOrFail($moduleId);

            // Check access
            if ($user->isStudent()) {
                $weekProgress = UserProgress::where('user_id', $user->id)
                    ->where('week_id', $module->week_id)
                    ->first();

                if (!$weekProgress || !$weekProgress->is_unlocked) {
                    return $this->forbiddenResponse('Week must be unlocked to access this module');
                }
            }

            $moduleService = app(\App\Services\ModuleCompletionService::class);
            $lessonService = app(\App\Services\LessonCompletionService::class);

            $moduleCompletion = $moduleService->getUserCompletion($user, $module);
            $progress = $moduleService->calculateModuleProgress($user, $module);

            // Get detailed lesson progress
            $lessonsWithProgress = $module->lessons->map(function ($lesson) use ($user, $lessonService) {
                $lessonProgress = $lessonService->calculateLessonProgress($user, $lesson);
                $lessonCompletion = $lessonService->getUserCompletion($user, $lesson);

                return [
                    'id' => $lesson->id,
                    'title' => $lesson->title,
                    'order' => $lesson->order,
                    'is_completed' => $lessonCompletion && $lessonCompletion->completed_at,
                    'completion_percentage' => $lessonProgress['percentage'],
                    'topics_completed' => $lessonProgress['completed'],
                    'topics_total' => $lessonProgress['total'],
                    'time_spent' => $lessonCompletion?->time_spent_seconds ?? 0,
                    'can_complete' => $lessonProgress['can_complete'],
                ];
            });

            return response()->json([
                'module' => [
                    'id' => $module->id,
                    'title' => $module->title,
                    'week_id' => $module->week_id,
                ],
                'progress' => [
                    'is_completed' => $moduleCompletion && $moduleCompletion->completed_at,
                    'completion_percentage' => $progress['percentage'],
                    'lessons_completed' => $progress['completed'],
                    'lessons_total' => $progress['total'],
                    'total_time_spent' => $progress['total_time_spent'],
                    'started_at' => $moduleCompletion?->started_at?->toISOString(),
                    'completed_at' => $moduleCompletion?->completed_at?->toISOString(),
                ],
                'lessons' => $lessonsWithProgress,
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'module_progress_fetch_failed',
                'Failed to fetch module progress: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Get lesson progress
     */
    public function lessonProgress(Request $request, $lessonId): JsonResponse
    {
        $user = $request->user();

        try {
            $lesson = \App\Models\Lesson::with(['topics', 'module.week'])->findOrFail($lessonId);

            // Check access
            if ($user->isStudent()) {
                $weekProgress = UserProgress::where('user_id', $user->id)
                    ->where('week_id', $lesson->module->week_id)
                    ->first();

                if (!$weekProgress || !$weekProgress->is_unlocked) {
                    return $this->forbiddenResponse('Week must be unlocked to access this lesson');
                }

                // Check lesson sequencing
                $previousLesson = \App\Models\Lesson::where('module_id', $lesson->module_id)
                    ->where('order', '<', $lesson->order)
                    ->orderBy('order', 'desc')
                    ->first();

                if ($previousLesson && !$previousLesson->isCompletedByUser($user)) {
                    return $this->forbiddenResponse("Please complete '{$previousLesson->title}' first.");
                }
            }

            $lessonService = app(\App\Services\LessonCompletionService::class);
            $topicService = app(\App\Services\TopicCompletionService::class);

            $lessonCompletion = $lessonService->getUserCompletion($user, $lesson);
            $progress = $lessonService->calculateLessonProgress($user, $lesson);

            // Get detailed topic progress
            $topicsWithProgress = $lesson->topics->map(function ($topic) use ($user, $topicService) {
                $topicCompletion = $topicService->getUserCompletion($user, $topic);

                return [
                    'id' => $topic->id,
                    'title' => $topic->title,
                    'order' => $topic->order,
                    'is_completed' => $topicCompletion && $topicCompletion->completed_at,
                    'completion_percentage' => $topicCompletion?->completion_percentage ?? 0,
                    'time_spent' => $topicCompletion?->time_spent_seconds ?? 0,
                    'last_position' => $topicCompletion?->last_position_seconds ?? 0,
                    'coin_reward' => $topic->coin_reward ?? 0,
                ];
            });

            return response()->json([
                'lesson' => [
                    'id' => $lesson->id,
                    'title' => $lesson->title,
                    'module_id' => $lesson->module_id,
                ],
                'progress' => [
                    'is_completed' => $lessonCompletion && $lessonCompletion->completed_at,
                    'completion_percentage' => $progress['percentage'],
                    'topics_completed' => $progress['completed'],
                    'topics_total' => $progress['total'],
                    'time_spent' => $progress['time_spent'],
                    'min_time_required' => $progress['min_time_required'],
                    'time_requirement_met' => $progress['time_requirement_met'],
                    'can_complete' => $progress['can_complete'],
                    'started_at' => $lessonCompletion?->started_at?->toISOString(),
                    'completed_at' => $lessonCompletion?->completed_at?->toISOString(),
                ],
                'topics' => $topicsWithProgress,
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'lesson_progress_fetch_failed',
                'Failed to fetch lesson progress: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Check if user is enrolled in cohort
     */
    private function isUserEnrolledInCohort(User $user, Cohort $cohort): bool
    {
        return $user->enrollments()
            ->where('cohort_id', $cohort->id)
            ->where('status', 'active')
            ->exists();
    }
}
