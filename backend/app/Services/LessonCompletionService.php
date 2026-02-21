<?php

namespace App\Services;

use App\Models\User;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\TopicCompletion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Exceptions\TopicCompletionException;

class LessonCompletionService
{
    public function __construct(
        private CoinService $coinService
    ) {}

    /**
     * Start tracking a lesson for a user
     */
    public function startLesson(User $user, Lesson $lesson): LessonCompletion
    {
        return LessonCompletion::firstOrCreate(
            [
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
            ],
            [
                'started_at' => now(),
                'time_spent_seconds' => 0,
                'completion_percentage' => 0.00,
            ]
        );
    }

    /**
     * Update lesson progress
     */
    public function updateLessonProgress(User $user, Lesson $lesson, int $timeSpent): LessonCompletion
    {
        $completion = $this->startLesson($user, $lesson);

        if (!$completion->completed_at) {
            $completion->update([
                'time_spent_seconds' => $timeSpent,
                'completion_percentage' => $this->calculateLessonProgress($user, $lesson)['percentage'],
            ]);
        }

        return $completion->fresh();
    }

    /**
     * Mark a lesson as completed for a user
     */
    public function completeLesson(User $user, Lesson $lesson, array $completionData = []): LessonCompletion
    {
        // Validate completion eligibility
        $this->validateCompletionEligibility($user, $lesson);

        return DB::transaction(function () use ($user, $lesson, $completionData) {
            $completion = LessonCompletion::where('user_id', $user->id)
                ->where('lesson_id', $lesson->id)
                ->first();

            if (!$completion) {
                $completion = $this->startLesson($user, $lesson);
            }

            if ($completion->completed_at) {
                return $completion; // Already completed
            }

            // Update completion record
            $completion->update([
                'completed_at' => now(),
                'completion_percentage' => 100.00,
                'completion_data' => array_merge($completion->completion_data ?? [], $completionData),
                'coins_awarded' => 0, // Lessons don't award coins directly
            ]);

            // Clear caches
            $this->clearLessonCaches($user->id, $lesson->id);

            // Dispatch event
            event(new \App\Events\LessonCompletedEvent($user, $lesson, $completion));

            return $completion;
        });
    }

    /**
     * Check if user can complete a lesson
     */
    public function canCompleteLesson(User $user, Lesson $lesson): bool
    {
        // Check if all topics are completed
        $progress = $this->calculateLessonProgress($user, $lesson);

        if ($progress['percentage'] < 100) {
            return false;
        }

        // Check time requirement
        $completion = LessonCompletion::where('user_id', $user->id)
            ->where('lesson_id', $lesson->id)
            ->first();

        if ($completion && $lesson->min_time_required_seconds) {
            return $completion->time_spent_seconds >= $lesson->min_time_required_seconds;
        }

        return true;
    }

    /**
     * Check if user has completed a lesson
     */
    public function hasUserCompleted(User $user, Lesson $lesson): bool
    {
        return LessonCompletion::where('user_id', $user->id)
            ->where('lesson_id', $lesson->id)
            ->whereNotNull('completed_at')
            ->exists();
    }

    /**
     * Get user's completion for a lesson
     */
    public function getUserCompletion(User $user, Lesson $lesson): ?LessonCompletion
    {
        return LessonCompletion::where('user_id', $user->id)
            ->where('lesson_id', $lesson->id)
            ->first();
    }

    /**
     * Calculate lesson completion percentage for user
     */
    public function calculateLessonProgress(User $user, Lesson $lesson): array
    {
        $topics = $lesson->topics;
        $totalItems = $topics->count();

        $quizzes = $lesson->getBlocksByType('quiz');
        $assignments = $lesson->getBlocksByType('assignment');
        $liveClasses = $lesson->getBlocksByType('live');

        $totalItems += count($quizzes);
        $totalItems += count($assignments);
        $totalItems += count($liveClasses);

        if ($totalItems === 0) {
            return [
                'percentage' => 100.0,
                'completed' => 0,
                'total' => 0,
                'time_requirement_met' => true,
                'can_complete' => true
            ];
        }

        // Count completed topics
        $completedTopics = TopicCompletion::where('user_id', $user->id)
            ->whereIn('topic_id', $topics->pluck('id'))
            ->whereNotNull('completed_at')
            ->count();

        // Count passed quizzes
        $passedQuizzes = 0;
        foreach ($quizzes as $quiz) {
            $quizId = $quiz['id'] ?? null;
            if ($quizId && \App\Models\LessonBlockCompletion::hasPassed($user->id, $lesson->id, (string)$quizId)) {
                $passedQuizzes++;
            }
        }

        // Count passed assignments
        $passedAssignments = 0;
        foreach ($assignments as $assignment) {
            $assignmentId = $assignment['id'] ?? null;
            if ($assignmentId && \App\Models\LessonBlockCompletion::hasPassed($user->id, $lesson->id, (string)$assignmentId)) {
                $passedAssignments++;
            }
        }

        // Count attended live classes
        $attendedLiveClasses = 0;
        foreach ($liveClasses as $liveClass) {
            $liveClassId = $liveClass['payload']['liveClassId'] ?? null;
            if (
                $liveClassId && \App\Models\LiveAttendance::where('user_id', $user->id)
                ->where('live_class_id', $liveClassId)
                ->where('attended', true)
                ->exists()
            ) {
                $attendedLiveClasses++;
            }
        }

        $completedItems = $completedTopics + $passedQuizzes + $passedAssignments + $attendedLiveClasses;
        $percentage = ($completedItems / $totalItems) * 100;

        // Check time requirement
        $lessonCompletion = LessonCompletion::where('user_id', $user->id)
            ->where('lesson_id', $lesson->id)
            ->first();

        $timeRequirementMet = true;
        if ($lessonCompletion && $lesson->min_time_required_seconds) {
            $timeRequirementMet = $lessonCompletion->time_spent_seconds >= $lesson->min_time_required_seconds;
        }

        return [
            'percentage' => round($percentage, 2),
            'completed' => $completedItems,
            'total' => $totalItems,
            'time_requirement_met' => $timeRequirementMet,
            'time_spent' => $lessonCompletion?->time_spent_seconds ?? 0,
            'min_time_required' => $lesson->min_time_required_seconds ?? 300,
            'can_complete' => $percentage >= 100 && $timeRequirementMet
        ];
    }

    /**
     * Get user's completed lessons for a module
     */
    public function getUserCompletedLessonsForModule(User $user, int $moduleId): \Illuminate\Database\Eloquent\Collection
    {
        return LessonCompletion::where('user_id', $user->id)
            ->whereHas('lesson', function ($query) use ($moduleId) {
                $query->where('module_id', $moduleId);
            })
            ->whereNotNull('completed_at')
            ->with('lesson')
            ->get();
    }

    /**
     * Recalculate lesson progress when a topic is completed
     */
    public function recalculateLessonProgress(User $user, Lesson $lesson): void
    {
        $completion = LessonCompletion::where('user_id', $user->id)
            ->where('lesson_id', $lesson->id)
            ->first();

        if (!$completion || $completion->completed_at) {
            return; // No completion record or already completed
        }

        $progress = $this->calculateLessonProgress($user, $lesson);

        $completion->update([
            'completion_percentage' => $progress['percentage'],
        ]);

        // Auto-complete if all requirements met
        if ($progress['can_complete']) {
            $this->completeLesson($user, $lesson);
        }

        $this->clearLessonCaches($user->id, $lesson->id);
    }

    /**
     * Validate completion eligibility
     */
    private function validateCompletionEligibility(User $user, Lesson $lesson): void
    {
        if (!$this->canCompleteLesson($user, $lesson)) {
            throw new TopicCompletionException('Lesson requirements not met');
        }
    }

    /**
     * Clear lesson-related caches
     */
    private function clearLessonCaches(int $userId, int $lessonId): void
    {
        Cache::forget("user:{$userId}:lesson:{$lessonId}:progress");
        Cache::forget("lesson_stats_{$lessonId}");
    }

    /**
     * Get lesson completion statistics
     */
    public function getLessonStatistics(Lesson $lesson): array
    {
        return Cache::remember(
            "lesson_stats_{$lesson->id}",
            now()->addMinutes(30),
            function () use ($lesson) {
                $totalCompletions = LessonCompletion::where('lesson_id', $lesson->id)
                    ->whereNotNull('completed_at')
                    ->count();

                $totalStudents = $lesson->module->week->cohort->students()->count();
                $completionRate = $totalStudents > 0 ? round(($totalCompletions / $totalStudents) * 100, 2) : 0;

                $avgTime = LessonCompletion::where('lesson_id', $lesson->id)
                    ->whereNotNull('completed_at')
                    ->avg('time_spent_seconds');

                return [
                    'total_completions' => $totalCompletions,
                    'total_students' => $totalStudents,
                    'completion_rate' => $completionRate,
                    'average_time_spent' => $avgTime ? round($avgTime) : null,
                ];
            }
        );
    }
}
