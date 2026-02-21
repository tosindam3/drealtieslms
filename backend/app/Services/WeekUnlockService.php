<?php

namespace App\Services;

use App\Models\User;
use App\Models\Week;
use App\Models\Cohort;
use App\Models\UserProgress;
use App\Models\TopicCompletion;
use App\Models\QuizAttempt;
use App\Models\AssignmentSubmission;
use App\Models\LiveAttendance;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Events\WeekUnlockedEvent;
use App\Exceptions\WeekProgressionException;

class WeekUnlockService
{
    public function __construct(
        private CoinService $coinService
    ) {}

    /**
     * Check if a user can unlock a specific week
     */
    public function canUnlockWeek(User $user, Week $week): bool
    {
        // Week 1 is always unlocked on enrollment
        if ($week->week_number === 1) {
            return true;
        }

        // Check if previous week is completed
        $previousWeek = $this->getPreviousWeek($week);
        if (!$previousWeek) {
            return false;
        }

        $previousProgress = $this->getUserWeekProgress($user, $previousWeek);
        if (!$previousProgress || !$previousProgress->isCompleted()) {
            return false;
        }

        // Check unlock requirements
        return $this->meetsUnlockRequirements($user, $week);
    }

    /**
     * Attempt to unlock a week for a user
     */
    public function unlockWeek(User $user, Week $week): UserProgress
    {
        return DB::transaction(function () use ($user, $week) {
            $progress = $this->getUserWeekProgress($user, $week);

            if (!$progress) {
                throw new WeekProgressionException("Progress record not found for user and week");
            }

            if ($progress->is_unlocked) {
                return $progress; // Already unlocked
            }

            // Check if week can be unlocked
            if (!$this->canUnlockWeek($user, $week)) {
                throw new WeekProgressionException(
                    "Cannot unlock week {$week->week_number}. Requirements not met."
                );
            }

            // Unlock the week
            $progress->update([
                'is_unlocked' => true,
                'unlocked_at' => now(),
            ]);

            // Clear caches
            $this->clearProgressCaches($user->id, $week->cohort_id);

            // Dispatch event
            event(new WeekUnlockedEvent($user, $week, $progress));

            return $progress;
        });
    }

    /**
     * Evaluate and unlock next week if requirements are met
     */
    public function evaluateAndUnlockNext(User $user, Week $currentWeek): ?UserProgress
    {
        $nextWeek = $this->getNextWeek($currentWeek);

        if (!$nextWeek) {
            return null; // No next week
        }

        if ($this->canUnlockWeek($user, $nextWeek)) {
            return $this->unlockWeek($user, $nextWeek);
        }

        return null;
    }

    /**
     * Check if user meets unlock requirements for a week
     */
    public function meetsUnlockRequirements(User $user, Week $week): bool
    {
        $unlockRules = $week->unlock_rules ?? [];

        // Check coin threshold
        if (isset($unlockRules['min_coins'])) {
            $userBalance = $this->coinService->getCachedCoinBalance($user);
            if ($userBalance < $unlockRules['min_coins']) {
                return false;
            }
        }

        // Check required completions from previous weeks
        if (isset($unlockRules['required_completions'])) {
            foreach ($unlockRules['required_completions'] as $requirement) {
                if (!$this->checkCompletionRequirement($user, $requirement)) {
                    return false;
                }
            }
        }

        // Check minimum progress percentage on previous week
        if (isset($unlockRules['min_previous_week_progress'])) {
            $previousWeek = $this->getPreviousWeek($week);
            if ($previousWeek) {
                $progress = $this->getUserWeekProgress($user, $previousWeek);
                if (!$progress || $progress->completion_percentage < $unlockRules['min_previous_week_progress']) {
                    return false;
                }
            }
        }

        // Check drip days
        if ($week->drip_days > 0) {
            $cohort = $week->cohort;
            $enrollment = $user->enrollments()->where('cohort_id', $cohort->id)->first();

            if ($enrollment) {
                // Use cohort start date or enrollment date, whichever is later (or just cohort start)
                // For cohorts, we usually use the cohort start date as the baseline
                $startDate = $cohort->start_date;
                if ($startDate && now()->lt($startDate->copy()->addDays($week->drip_days))) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Check a specific completion requirement
     */
    private function checkCompletionRequirement(User $user, array $requirement): bool
    {
        $type = $requirement['type'] ?? '';
        $count = $requirement['count'] ?? 1;
        $weekNumber = $requirement['week_number'] ?? null;

        switch ($type) {
            case 'topics':
                return $this->checkTopicCompletions($user, $count, $weekNumber);

            case 'quizzes':
                return $this->checkQuizCompletions($user, $count, $weekNumber);

            case 'assignments':
                return $this->checkAssignmentCompletions($user, $count, $weekNumber);

            case 'live_classes':
                return $this->checkLiveClassAttendance($user, $count, $weekNumber);

            default:
                return true; // Unknown requirement type, assume met
        }
    }

    /**
     * Check topic completion requirements
     */
    private function checkTopicCompletions(User $user, int $requiredCount, ?int $weekNumber = null): bool
    {
        $query = TopicCompletion::where('user_id', $user->id);

        if ($weekNumber) {
            $query->whereHas('topic.lesson.module.week', function ($q) use ($weekNumber) {
                $q->where('week_number', $weekNumber);
            });
        }

        return $query->count() >= $requiredCount;
    }

    /**
     * Check quiz completion requirements
     */
    private function checkQuizCompletions(User $user, int $requiredCount, ?int $weekNumber = null): bool
    {
        $query = QuizAttempt::where('user_id', $user->id)
            ->where('passed', true);

        if ($weekNumber) {
            $query->whereHas('quiz.week', function ($q) use ($weekNumber) {
                $q->where('week_number', $weekNumber);
            });
        }

        return $query->distinct('quiz_id')->count() >= $requiredCount;
    }

    /**
     * Check assignment completion requirements
     */
    private function checkAssignmentCompletions(User $user, int $requiredCount, ?int $weekNumber = null): bool
    {
        $query = AssignmentSubmission::where('user_id', $user->id)
            ->where('status', AssignmentSubmission::STATUS_APPROVED);

        if ($weekNumber) {
            $query->whereHas('assignment.week', function ($q) use ($weekNumber) {
                $q->where('week_number', $weekNumber);
            });
        }

        return $query->count() >= $requiredCount;
    }

    /**
     * Check live class attendance requirements
     */
    private function checkLiveClassAttendance(User $user, int $requiredCount, ?int $weekNumber = null): bool
    {
        $query = LiveAttendance::where('user_id', $user->id)
            ->whereNotNull('joined_at'); // Attendance is determined by joined_at being not null

        if ($weekNumber) {
            $query->whereHas('liveClass.week', function ($q) use ($weekNumber) {
                $q->where('week_number', $weekNumber);
            });
        }

        return $query->count() >= $requiredCount;
    }

    /**
     * Get unlock requirements summary for a week
     */
    public function getUnlockRequirementsSummary(User $user, Week $week): array
    {
        if ($week->week_number === 1) {
            return [
                'can_unlock' => true,
                'requirements' => [],
                'message' => 'Week 1 is automatically unlocked'
            ];
        }

        $unlockRules = $week->unlock_rules ?? [];
        $requirements = [];
        $canUnlock = true;

        // Check previous week completion
        $previousWeek = $this->getPreviousWeek($week);
        if ($previousWeek) {
            $previousProgress = $this->getUserWeekProgress($user, $previousWeek);
            $previousCompleted = $previousProgress && $previousProgress->isCompleted();

            $requirements[] = [
                'type' => 'previous_week',
                'description' => "Complete Week {$previousWeek->week_number}",
                'met' => $previousCompleted,
                'current_progress' => $previousProgress?->completion_percentage ?? 0,
            ];

            if (!$previousCompleted) {
                $canUnlock = false;
            }
        }

        // Check coin requirements
        if (isset($unlockRules['min_coins'])) {
            $userBalance = $this->coinService->getCachedCoinBalance($user);
            $coinRequirementMet = $userBalance >= $unlockRules['min_coins'];

            $requirements[] = [
                'type' => 'coins',
                'description' => "Earn {$unlockRules['min_coins']} Dreal Coins",
                'met' => $coinRequirementMet,
                'current_balance' => $userBalance,
                'required_balance' => $unlockRules['min_coins'],
            ];

            if (!$coinRequirementMet) {
                $canUnlock = false;
            }
        }

        // Check completion requirements
        if (isset($unlockRules['required_completions'])) {
            foreach ($unlockRules['required_completions'] as $requirement) {
                $requirementMet = $this->checkCompletionRequirement($user, $requirement);

                $requirements[] = [
                    'type' => $requirement['type'],
                    'description' => $this->getRequirementDescription($requirement),
                    'met' => $requirementMet,
                ];

                if (!$requirementMet) {
                    $canUnlock = false;
                }
            }
        }

        // Check drip days
        if ($week->drip_days > 0) {
            $startDate = $week->cohort->start_date;
            if ($startDate) {
                $unlockDate = $startDate->copy()->addDays($week->drip_days);
                $dripMet = now()->gte($unlockDate);

                $requirements[] = [
                    'type' => 'drip',
                    'description' => "Available on {$unlockDate->toFormattedDateString()}",
                    'met' => $dripMet,
                    'unlock_date' => $unlockDate->toISOString(),
                ];

                if (!$dripMet) {
                    $canUnlock = false;
                }
            }
        }

        return [
            'can_unlock' => $canUnlock,
            'requirements' => $requirements,
            'message' => $canUnlock ? 'All requirements met' : 'Some requirements not yet met'
        ];
    }

    /**
     * Get human-readable description for a requirement
     */
    private function getRequirementDescription(array $requirement): string
    {
        $type = $requirement['type'] ?? '';
        $count = $requirement['count'] ?? 1;
        $weekNumber = $requirement['week_number'] ?? null;

        $weekText = $weekNumber ? " in Week {$weekNumber}" : '';

        return match ($type) {
            'topics' => "Complete {$count} topic(s){$weekText}",
            'quizzes' => "Pass {$count} quiz(zes){$weekText}",
            'assignments' => "Complete {$count} assignment(s){$weekText}",
            'live_classes' => "Attend {$count} live class(es){$weekText}",
            default => "Complete {$count} {$type}{$weekText}",
        };
    }

    /**
     * Get previous week
     */
    private function getPreviousWeek(Week $week): ?Week
    {
        return Week::where('cohort_id', $week->cohort_id)
            ->where('week_number', $week->week_number - 1)
            ->first();
    }

    /**
     * Get next week
     */
    private function getNextWeek(Week $week): ?Week
    {
        return Week::where('cohort_id', $week->cohort_id)
            ->where('week_number', $week->week_number + 1)
            ->first();
    }

    /**
     * Get user's progress for a specific week
     */
    private function getUserWeekProgress(User $user, Week $week): ?UserProgress
    {
        return UserProgress::where('user_id', $user->id)
            ->where('week_id', $week->id)
            ->first();
    }

    /**
     * Recalculate and update week completion percentage
     */
    public function recalculateWeekProgress(User $user, Week $week): UserProgress
    {
        $progress = $this->getUserWeekProgress($user, $week);

        if (!$progress) {
            throw new WeekProgressionException("Progress record not found");
        }

        return DB::transaction(function () use ($user, $week, $progress) {
            $completionData = $this->calculateWeekCompletion($user, $week);

            $progress->update([
                'completion_percentage' => $completionData['percentage'],
                'completed_at' => $completionData['percentage'] >= 100 ? now() : null,
            ]);

            // Try to unlock next week if this week is completed
            if ($completionData['percentage'] >= 100) {
                $this->evaluateAndUnlockNext($user, $week);
            }

            return $progress;
        });
    }

    /**
     * Calculate week completion percentage
     */
    private function calculateWeekCompletion(User $user, Week $week): array
    {
        $totalItems = 0;
        $completedItems = 0;

        // Count modules
        $moduleCount = $week->modules()->count();
        $completedModules = \App\Models\ModuleCompletion::where('user_id', $user->id)
            ->whereHas('module', function ($q) use ($week) {
                $q->where('week_id', $week->id);
            })
            ->whereNotNull('completed_at')
            ->count();

        $totalItems += $moduleCount;
        $completedItems += $completedModules;

        // Count quizzes
        $quizCount = $week->quizzes()->count();
        $passedQuizzes = QuizAttempt::where('user_id', $user->id)
            ->where('passed', true)
            ->whereHas('quiz', function ($q) use ($week) {
                $q->where('week_id', $week->id);
            })->distinct('quiz_id')->count();

        $totalItems += $quizCount;
        $completedItems += $passedQuizzes;

        // Count assignments
        $assignmentCount = $week->assignments()->count();
        $approvedAssignments = AssignmentSubmission::where('user_id', $user->id)
            ->where('status', AssignmentSubmission::STATUS_APPROVED)
            ->whereHas('assignment', function ($q) use ($week) {
                $q->where('week_id', $week->id);
            })->count();

        $totalItems += $assignmentCount;
        $completedItems += $approvedAssignments;

        // Count live classes
        $liveClassCount = $week->liveClasses()->count();
        $attendedClasses = LiveAttendance::where('user_id', $user->id)
            ->whereNotNull('joined_at')
            ->whereHas('liveClass', function ($q) use ($week) {
                $q->where('week_id', $week->id);
            })->count();

        $totalItems += $liveClassCount;
        $completedItems += $attendedClasses;

        $percentage = $totalItems > 0 ? ($completedItems / $totalItems) * 100 : 0;

        return [
            'percentage' => round($percentage, 2),
            'completed_items' => $completedItems,
            'total_items' => $totalItems,
            'breakdown' => [
                'modules' => ['completed' => $completedModules, 'total' => $moduleCount],
                'quizzes' => ['completed' => $passedQuizzes, 'total' => $quizCount],
                'assignments' => ['completed' => $approvedAssignments, 'total' => $assignmentCount],
                'live_classes' => ['completed' => $attendedClasses, 'total' => $liveClassCount],
            ]
        ];
    }

    /**
     * Clear progress-related caches
     */
    private function clearProgressCaches(int $userId, int $cohortId): void
    {
        Cache::forget("user_progress_{$userId}_{$cohortId}");
        Cache::forget("cohort_progress_{$cohortId}");
        Cache::forget("week_unlock_status_{$userId}");
    }

    /**
     * Bulk unlock weeks for multiple users (admin function)
     */
    public function bulkUnlockWeek(Week $week, array $userIds): array
    {
        $results = [];

        foreach ($userIds as $userId) {
            try {
                $user = User::findOrFail($userId);
                $progress = $this->unlockWeek($user, $week);
                $results[$userId] = ['success' => true, 'progress' => $progress];
            } catch (\Exception $e) {
                $results[$userId] = ['success' => false, 'error' => $e->getMessage()];
            }
        }

        return $results;
    }
}
