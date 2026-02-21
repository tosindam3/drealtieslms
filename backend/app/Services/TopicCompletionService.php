<?php

namespace App\Services;

use App\Models\User;
use App\Models\Topic;
use App\Models\TopicCompletion;
use App\Models\UserProgress;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Events\TopicCompletedEvent;
use App\Exceptions\TopicCompletionException;

class TopicCompletionService
{
    public function __construct(
        private CoinService $coinService,
        private WeekUnlockService $weekUnlockService,
        private LessonCompletionService $lessonCompletionService,
        private ModuleCompletionService $moduleCompletionService
    ) {}

    /**
     * Start tracking a topic for a user
     */
    public function startTopic(User $user, Topic $topic): TopicCompletion
    {
        return TopicCompletion::firstOrCreate(
            [
                'user_id' => $user->id,
                'topic_id' => $topic->id,
            ],
            [
                'started_at' => now(),
                'time_spent_seconds' => 0,
                'completion_percentage' => 0.00,
            ]
        );
    }

    /**
     * Update topic progress (for video progress, etc.)
     */
    public function updateTopicProgress(User $user, Topic $topic, float $percentage, int $lastPosition = 0): TopicCompletion
    {
        $completion = $this->startTopic($user, $topic);

        if (!$completion->completed_at) {
            $completion->update([
                'completion_percentage' => min(100, max(0, $percentage)),
                'last_position_seconds' => $lastPosition,
            ]);

            $completion->refresh();
        }

        return $completion;
    }

    /**
     * Mark a topic as completed for a user
     */
    public function completeTopic(User $user, Topic $topic, array $completionData = []): TopicCompletion
    {
        // Validate completion eligibility
        $this->validateCompletionEligibility($user, $topic);

        return DB::transaction(function () use ($user, $topic, $completionData) {
            // Check if already completed
            $existingCompletion = TopicCompletion::where('user_id', $user->id)
                ->where('topic_id', $topic->id)
                ->first();

            if ($existingCompletion) {
                return $existingCompletion; // Already completed
            }

            // Get or create completion record
            $completion = TopicCompletion::where('user_id', $user->id)
                ->where('topic_id', $topic->id)
                ->first();

            if (!$completion) {
                $completion = TopicCompletion::create([
                    'user_id' => $user->id,
                    'topic_id' => $topic->id,
                    'started_at' => now(),
                    'completed_at' => now(),
                    'completion_percentage' => 100.00,
                    'completion_method' => $completionData['method'] ?? 'manual',
                    'completion_data' => $completionData,
                    'coins_awarded' => $topic->coin_reward ?? 0,
                ]);
            } else {
                $completion->update([
                    'completed_at' => now(),
                    'completion_percentage' => 100.00,
                    'completion_method' => $completionData['method'] ?? 'manual',
                    'completion_data' => array_merge($completion->completion_data ?? [], $completionData),
                    'coins_awarded' => $topic->coin_reward ?? 0,
                ]);
            }

            // Award coins
            $this->awardTopicCoins($user, $topic, $completion);

            // Update week progress
            $this->updateWeekProgress($user, $topic);

            // Clear caches
            $this->clearTopicCaches($user->id, $topic->id);

            // Dispatch event
            event(new TopicCompletedEvent($user, $topic, $completion));

            // Attach next item info to completion (optional metadata)
            $completion->next_item = $this->getNextItem($user, $topic);

            return $completion;
        });
    }

    /**
     * Get the next logical item for the user
     */
    public function getNextItem(User $user, Topic $topic): ?array
    {
        // 1. Next topic in the same lesson
        $nextTopic = Topic::where('lesson_id', $topic->lesson_id)
            ->where('order', '>', $topic->order)
            ->orderBy('order', 'asc')
            ->first();

        if ($nextTopic) {
            return [
                'type' => 'topic',
                'id' => $nextTopic->id,
                'title' => $nextTopic->title,
            ];
        }

        // 2. Next lesson in the same module
        $nextLesson = \App\Models\Lesson::where('module_id', $topic->lesson->module_id)
            ->where('order', '>', $topic->lesson->order)
            ->orderBy('order', 'asc')
            ->first();

        if ($nextLesson) {
            return [
                'type' => 'lesson',
                'id' => $nextLesson->id,
                'title' => $nextLesson->title,
            ];
        }

        // 3. Next module in the same week
        $nextModule = \App\Models\Module::where('week_id', $topic->lesson->module->week_id)
            ->where('order', '>', $topic->lesson->module->order)
            ->orderBy('order', 'asc')
            ->first();

        if ($nextModule) {
            return [
                'type' => 'module',
                'id' => $nextModule->id,
                'title' => $nextModule->title,
            ];
        }

        return null;
    }

    /**
     * Alias for completeTopic method (for backward compatibility)
     */
    public function completeTopicForUser(User $user, Topic $topic, array $completionData = []): TopicCompletion
    {
        return $this->completeTopic($user, $topic, $completionData);
    }

    /**
     * Check if user has completed a topic
     */
    public function hasUserCompleted(User $user, Topic $topic): bool
    {
        return TopicCompletion::where('user_id', $user->id)
            ->where('topic_id', $topic->id)
            ->exists();
    }

    /**
     * Get user's completion for a topic
     */
    public function getUserCompletion(User $user, Topic $topic): ?TopicCompletion
    {
        return TopicCompletion::where('user_id', $user->id)
            ->where('topic_id', $topic->id)
            ->first();
    }

    /**
     * Get user's completed topics for a lesson
     */
    public function getUserCompletedTopicsForLesson(User $user, int $lessonId): \Illuminate\Database\Eloquent\Collection
    {
        return TopicCompletion::where('user_id', $user->id)
            ->whereHas('topic', function ($query) use ($lessonId) {
                $query->where('lesson_id', $lessonId);
            })
            ->with('topic')
            ->get();
    }

    /**
     * Get user's completed topics for a week
     */
    public function getUserCompletedTopicsForWeek(User $user, int $weekId): \Illuminate\Database\Eloquent\Collection
    {
        return TopicCompletion::where('user_id', $user->id)
            ->whereHas('topic.lesson.module', function ($query) use ($weekId) {
                $query->where('week_id', $weekId);
            })
            ->with(['topic', 'topic.lesson.module'])
            ->get();
    }

    /**
     * Calculate lesson completion percentage for user
     */
    public function getLessonCompletionPercentage(User $user, int $lessonId): float
    {
        $totalTopics = Topic::where('lesson_id', $lessonId)->count();

        if ($totalTopics === 0) {
            return 100.0;
        }

        $completedTopics = TopicCompletion::where('user_id', $user->id)
            ->whereHas('topic', function ($query) use ($lessonId) {
                $query->where('lesson_id', $lessonId);
            })
            ->count();

        return round(($completedTopics / $totalTopics) * 100, 2);
    }

    /**
     * Get topic completion statistics
     */
    public function getTopicStatistics(Topic $topic): array
    {
        return Cache::remember(
            "topic_stats_{$topic->id}",
            now()->addMinutes(30),
            function () use ($topic) {
                $totalCompletions = TopicCompletion::where('topic_id', $topic->id)->count();

                // Get total enrolled students in the cohort
                $totalStudents = $topic->lesson->module->week->cohort->students()->count();

                $completionRate = $totalStudents > 0 ? round(($totalCompletions / $totalStudents) * 100, 2) : 0;

                return [
                    'total_completions' => $totalCompletions,
                    'total_students' => $totalStudents,
                    'completion_rate' => $completionRate,
                    'average_completion_time' => $this->getAverageCompletionTime($topic),
                    'coins_distributed' => $totalCompletions * ($topic->coin_reward ?? 0),
                ];
            }
        );
    }

    /**
     * Get average completion time for a topic
     */
    private function getAverageCompletionTime(Topic $topic): ?float
    {
        // This would require tracking when users start viewing a topic
        // For now, return null as we don't have start time tracking
        return null;
    }

    /**
     * Validate completion eligibility
     */
    private function validateCompletionEligibility(User $user, Topic $topic): void
    {
        // Check if user has access to the week
        $weekProgress = UserProgress::where('user_id', $user->id)
            ->where('week_id', $topic->lesson->module->week_id)
            ->first();

        if (!$weekProgress || !$weekProgress->is_unlocked) {
            throw new TopicCompletionException('Week must be unlocked to access this topic');
        }

        // Check if topic has completion requirements
        if ($topic->completion_requirements) {
            $this->validateCompletionRequirements($user, $topic, $topic->completion_requirements);
        }
    }

    /**
     * Validate specific completion requirements
     */
    private function validateCompletionRequirements(User $user, Topic $topic, array $requirements): void
    {
        // Example requirements validation
        if (isset($requirements['min_time_spent'])) {
            // This would require time tracking implementation
            // For now, we'll skip this validation
        }

        if (isset($requirements['prerequisite_topics'])) {
            foreach ($requirements['prerequisite_topics'] as $prerequisiteTopicId) {
                if (!$this->hasUserCompleted($user, Topic::find($prerequisiteTopicId))) {
                    throw new TopicCompletionException('Prerequisite topics must be completed first');
                }
            }
        }
    }

    /**
     * Award coins for topic completion
     */
    private function awardTopicCoins(User $user, Topic $topic, TopicCompletion $completion): void
    {
        if (!$topic->coin_reward || $topic->coin_reward <= 0) {
            return;
        }

        $this->coinService->awardCoins(
            $user,
            $topic->coin_reward,
            'topic',
            $topic->id,
            "Completed topic: {$topic->title}"
        );
    }

    /**
     * Update week progress after topic completion
     */
    private function updateWeekProgress(User $user, Topic $topic): void
    {
        try {
            // Update lesson progress
            $this->lessonCompletionService->recalculateLessonProgress($user, $topic->lesson);

            // Update module progress
            $this->moduleCompletionService->recalculateModuleProgress($user, $topic->lesson->module);

            // Update week progress
            $this->weekUnlockService->recalculateWeekProgress($user, $topic->lesson->module->week);
        } catch (\Exception $e) {
            // Log error but don't fail the topic completion
            logger()->error("Failed to update progress after topic completion: " . $e->getMessage());
        }
    }

    /**
     * Clear topic-related caches
     */
    private function clearTopicCaches(int $userId, int $topicId): void
    {
        Cache::forget("topic_stats_{$topicId}");
        Cache::forget("user_topic_completion_{$userId}_{$topicId}");
        Cache::forget("user_lesson_progress_{$userId}");
    }

    /**
     * Bulk complete topics for user (admin function)
     */
    public function bulkCompleteTopics(User $user, array $topicIds): array
    {
        $results = [];

        foreach ($topicIds as $topicId) {
            try {
                $topic = Topic::findOrFail($topicId);
                $completion = $this->completeTopic($user, $topic);
                $results[$topicId] = ['success' => true, 'completion' => $completion];
            } catch (\Exception $e) {
                $results[$topicId] = ['success' => false, 'error' => $e->getMessage()];
            }
        }

        return $results;
    }

    /**
     * Reset topic completion for user (admin function)
     */
    public function resetTopicCompletion(User $user, Topic $topic): void
    {
        DB::transaction(function () use ($user, $topic) {
            TopicCompletion::where('user_id', $user->id)
                ->where('topic_id', $topic->id)
                ->delete();

            // Recalculate week progress
            $this->updateWeekProgress($user, $topic);

            // Clear caches
            $this->clearTopicCaches($user->id, $topic->id);
        });
    }

    /**
     * Get completion progress for all topics in a cohort
     */
    public function getCohortTopicProgress(int $cohortId): array
    {
        return Cache::remember(
            "cohort_topic_progress_{$cohortId}",
            now()->addMinutes(15),
            function () use ($cohortId) {
                $topics = Topic::whereHas('lesson.module', function ($query) use ($cohortId) {
                    $query->whereHas('week', function ($q) use ($cohortId) {
                        $q->where('cohort_id', $cohortId);
                    });
                })->with(['lesson.module.week'])->get();

                $students = User::whereHas('enrollments', function ($query) use ($cohortId) {
                    $query->where('cohort_id', $cohortId)->where('enrollments.status', 'active');
                })->get();

                $progress = [];

                foreach ($topics as $topic) {
                    $completions = TopicCompletion::where('topic_id', $topic->id)->count();
                    $completionRate = $students->count() > 0 ? ($completions / $students->count()) * 100 : 0;

                    $progress[] = [
                        'topic_id' => $topic->id,
                        'topic_title' => $topic->title,
                        'lesson_title' => $topic->lesson->title,
                        'week_number' => $topic->lesson->module->week->week_number,
                        'completions' => $completions,
                        'total_students' => $students->count(),
                        'completion_rate' => round($completionRate, 2),
                    ];
                }

                return $progress;
            }
        );
    }
}
