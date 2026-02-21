<?php

namespace App\Services;

use App\Models\User;
use App\Models\Module;
use App\Models\ModuleCompletion;
use App\Models\LessonCompletion;
use App\Services\Mail\EmailTemplateService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Exceptions\TopicCompletionException;

class ModuleCompletionService
{
    public function __construct(
        private CoinService $coinService,
        private EmailTemplateService $emailService
    ) {}

    /**
     * Start tracking a module for a user
     */
    public function startModule(User $user, Module $module): ModuleCompletion
    {
        return ModuleCompletion::firstOrCreate(
            [
                'user_id' => $user->id,
                'module_id' => $module->id,
            ],
            [
                'started_at' => now(),
                'time_spent_seconds' => 0,
                'completion_percentage' => 0.00,
            ]
        );
    }

    /**
     * Update module progress
     */
    public function updateModuleProgress(User $user, Module $module): ModuleCompletion
    {
        $completion = $this->startModule($user, $module);

        if (!$completion->completed_at) {
            $progress = $this->calculateModuleProgress($user, $module);

            $completion->update([
                'completion_percentage' => $progress['percentage'],
                'time_spent_seconds' => $progress['total_time_spent'],
            ]);
        }

        return $completion->fresh();
    }

    /**
     * Mark a module as completed for a user
     */
    public function completeModule(User $user, Module $module, array $completionData = []): ModuleCompletion
    {
        // Validate completion eligibility
        $this->validateCompletionEligibility($user, $module);

        return DB::transaction(function () use ($user, $module, $completionData) {
            $completion = ModuleCompletion::where('user_id', $user->id)
                ->where('module_id', $module->id)
                ->first();

            if (!$completion) {
                $completion = $this->startModule($user, $module);
            }

            if ($completion->completed_at) {
                return $completion; // Already completed
            }

            // Update completion record
            $completion->update([
                'completed_at' => now(),
                'completion_percentage' => 100.00,
                'completion_data' => array_merge($completion->completion_data ?? [], $completionData),
                'coins_awarded' => 0, // Modules don't award coins directly
            ]);

            // Clear caches
            $this->clearModuleCaches($user->id, $module->id);

            // Dispatch event
            event(new \App\Events\ModuleCompletedEvent($user, $module, $completion));

            // Send completion email
            $this->emailService->sendTemplateMail('module-concluded', $user->email, [
                'user_name' => $user->name,
                'module_name' => $module->title,
            ]);

            return $completion;
        });
    }

    /**
     * Check if user can complete a module
     */
    public function canCompleteModule(User $user, Module $module): bool
    {
        $progress = $this->calculateModuleProgress($user, $module);
        return $progress['percentage'] >= 100;
    }

    /**
     * Check if user has completed a module
     */
    public function hasUserCompleted(User $user, Module $module): bool
    {
        return ModuleCompletion::where('user_id', $user->id)
            ->where('module_id', $module->id)
            ->whereNotNull('completed_at')
            ->exists();
    }

    /**
     * Get user's completion for a module
     */
    public function getUserCompletion(User $user, Module $module): ?ModuleCompletion
    {
        return ModuleCompletion::where('user_id', $user->id)
            ->where('module_id', $module->id)
            ->first();
    }

    /**
     * Calculate module completion percentage for user
     */
    public function calculateModuleProgress(User $user, Module $module): array
    {
        $lessons = $module->lessons;
        $totalLessons = $lessons->count();

        if ($totalLessons === 0) {
            return [
                'percentage' => 100.0,
                'completed' => 0,
                'total' => 0,
                'total_time_spent' => 0,
                'lessons' => []
            ];
        }

        $completedLessons = LessonCompletion::where('user_id', $user->id)
            ->whereIn('lesson_id', $lessons->pluck('id'))
            ->whereNotNull('completed_at')
            ->count();

        $totalTimeSpent = LessonCompletion::where('user_id', $user->id)
            ->whereIn('lesson_id', $lessons->pluck('id'))
            ->sum('time_spent_seconds');

        $percentage = ($completedLessons / $totalLessons) * 100;

        return [
            'percentage' => round($percentage, 2),
            'completed' => $completedLessons,
            'total' => $totalLessons,
            'total_time_spent' => $totalTimeSpent,
            'lessons' => $lessons->map(function ($lesson) use ($user) {
                $lessonCompletion = LessonCompletion::where('user_id', $user->id)
                    ->where('lesson_id', $lesson->id)
                    ->first();

                return [
                    'id' => $lesson->id,
                    'title' => $lesson->title,
                    'is_completed' => $lessonCompletion && $lessonCompletion->completed_at,
                    'completion_percentage' => $lessonCompletion?->completion_percentage ?? 0,
                ];
            })
        ];
    }

    /**
     * Get user's completed modules for a week
     */
    public function getUserCompletedModulesForWeek(User $user, int $weekId): \Illuminate\Database\Eloquent\Collection
    {
        return ModuleCompletion::where('user_id', $user->id)
            ->whereHas('module', function ($query) use ($weekId) {
                $query->where('week_id', $weekId);
            })
            ->whereNotNull('completed_at')
            ->with('module')
            ->get();
    }

    /**
     * Recalculate module progress when a lesson is completed
     */
    public function recalculateModuleProgress(User $user, Module $module): void
    {
        $completion = ModuleCompletion::where('user_id', $user->id)
            ->where('module_id', $module->id)
            ->first();

        if (!$completion) {
            $completion = $this->startModule($user, $module);
        }

        if ($completion->completed_at) {
            return; // Already completed
        }

        $progress = $this->calculateModuleProgress($user, $module);

        $completion->update([
            'completion_percentage' => $progress['percentage'],
            'time_spent_seconds' => $progress['total_time_spent'],
        ]);

        // Auto-complete if all requirements met
        if ($progress['percentage'] >= 100) {
            $this->completeModule($user, $module);
        }

        $this->clearModuleCaches($user->id, $module->id);
    }

    /**
     * Validate completion eligibility
     */
    private function validateCompletionEligibility(User $user, Module $module): void
    {
        if (!$this->canCompleteModule($user, $module)) {
            throw new TopicCompletionException('Module requirements not met');
        }
    }

    /**
     * Clear module-related caches
     */
    private function clearModuleCaches(int $userId, int $moduleId): void
    {
        Cache::forget("user:{$userId}:module:{$moduleId}:progress");
        Cache::forget("module_stats_{$moduleId}");
    }

    /**
     * Get module completion statistics
     */
    public function getModuleStatistics(Module $module): array
    {
        return Cache::remember(
            "module_stats_{$module->id}",
            now()->addMinutes(30),
            function () use ($module) {
                $totalCompletions = ModuleCompletion::where('module_id', $module->id)
                    ->whereNotNull('completed_at')
                    ->count();

                $totalStudents = $module->week->cohort->students()->count();
                $completionRate = $totalStudents > 0 ? round(($totalCompletions / $totalStudents) * 100, 2) : 0;

                $avgTime = ModuleCompletion::where('module_id', $module->id)
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
