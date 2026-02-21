<?php

namespace App\Services;

use App\Models\User;
use App\Models\LiveClass;
use App\Models\LiveAttendance;
use App\Models\UserProgress;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Events\LiveClassAttendedEvent;
use App\Events\LiveClassStartedEvent;
use App\Events\LiveClassEndedEvent;
use App\Exceptions\LiveClassException;

class LiveClassService
{
    public function __construct(
        private CoinService $coinService,
        private WeekUnlockService $weekUnlockService,
        private LessonCompletionService $lessonCompletionService
    ) {}

    /**
     * Mark attendance for a live class
     */
    public function markAttendance(User $user, LiveClass $liveClass, array $attendanceData = []): LiveAttendance
    {
        // Validate attendance eligibility
        $this->validateAttendanceEligibility($user, $liveClass);

        return DB::transaction(function () use ($user, $liveClass, $attendanceData) {
            // Check if already marked attendance
            $existingAttendance = LiveAttendance::where('user_id', $user->id)
                ->where('live_class_id', $liveClass->id)
                ->first();

            if ($existingAttendance) {
                // Update existing attendance if needed
                $existingAttendance->update([
                    'attended' => true,
                    'joined_at' => $attendanceData['joined_at'] ?? $existingAttendance->joined_at ?? now(),
                    'left_at' => $attendanceData['left_at'] ?? null,
                    'attendance_data' => array_merge($existingAttendance->attendance_data ?? [], $attendanceData),
                ]);
                return $existingAttendance;
            }

            // Create new attendance record
            $attendance = LiveAttendance::create([
                'user_id' => $user->id,
                'live_class_id' => $liveClass->id,
                'attended' => true,
                'joined_at' => $attendanceData['joined_at'] ?? now(),
                'left_at' => $attendanceData['left_at'] ?? null,
                'attendance_data' => $attendanceData,
            ]);

            // Award coins for attendance
            $this->awardAttendanceCoins($user, $liveClass, $attendance);

            // Update week progress
            $this->updateLessonAndWeekProgress($user, $liveClass);

            // Clear caches
            $this->clearLiveClassCaches($user->id, $liveClass->id);

            // Dispatch event
            event(new LiveClassAttendedEvent($user, $liveClass, $attendance));

            return $attendance;
        });
    }

    /**
     * Mark user as absent (for tracking purposes)
     */
    public function markAbsent(User $user, LiveClass $liveClass, string $reason = null): LiveAttendance
    {
        return DB::transaction(function () use ($user, $liveClass, $reason) {
            $attendance = LiveAttendance::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'live_class_id' => $liveClass->id,
                ],
                [
                    'attended' => false,
                    'absence_reason' => $reason,
                    'attendance_data' => ['marked_absent_at' => now()->toISOString()],
                ]
            );

            // Clear caches
            $this->clearLiveClassCaches($user->id, $liveClass->id);

            return $attendance;
        });
    }

    /**
     * Start a live class
     */
    public function startLiveClass(LiveClass $liveClass, User $instructor): LiveClass
    {
        if ($liveClass->status !== LiveClass::STATUS_SCHEDULED) {
            throw new LiveClassException('Only scheduled classes can be started');
        }

        return DB::transaction(function () use ($liveClass, $instructor) {
            $liveClass->update([
                'status' => LiveClass::STATUS_LIVE,
                'started_at' => now(),
                'started_by' => $instructor->id,
            ]);

            // Clear caches
            $this->clearLiveClassCaches(null, $liveClass->id);

            // Dispatch event
            event(new LiveClassStartedEvent($liveClass, $instructor));

            return $liveClass;
        });
    }

    /**
     * End a live class
     */
    public function endLiveClass(LiveClass $liveClass, User $instructor): LiveClass
    {
        if ($liveClass->status !== LiveClass::STATUS_LIVE) {
            throw new LiveClassException('Only live classes can be ended');
        }

        return DB::transaction(function () use ($liveClass, $instructor) {
            $liveClass->update([
                'status' => LiveClass::STATUS_COMPLETED,
                'ended_at' => now(),
                'ended_by' => $instructor->id,
            ]);

            // Award coins to all attendees
            $this->awardBulkAttendanceCoins($liveClass);

            // Clear caches
            $this->clearLiveClassCaches(null, $liveClass->id);

            // Dispatch event
            event(new LiveClassEndedEvent($liveClass, $instructor));

            return $liveClass;
        });
    }

    /**
     * Check if user attended a live class
     */
    public function hasUserAttended(User $user, LiveClass $liveClass): bool
    {
        return LiveAttendance::where('user_id', $user->id)
            ->where('live_class_id', $liveClass->id)
            ->where('attended', true)
            ->exists();
    }

    /**
     * Get user's attendance record
     */
    public function getUserAttendance(User $user, LiveClass $liveClass): ?LiveAttendance
    {
        return LiveAttendance::where('user_id', $user->id)
            ->where('live_class_id', $liveClass->id)
            ->first();
    }

    /**
     * Join/record attendance for a live class (used by controller)
     */
    public function recordAttendance(User $user, LiveClass $liveClass, $joinTime = null): LiveAttendance
    {
        return $this->markAttendance($user, $liveClass, ['joined_at' => $joinTime ?? now()]);
    }

    /**
     * Check if user can attend a live class
     */
    public function canUserAttend(User $user, LiveClass $liveClass): bool
    {
        try {
            $this->validateAttendanceEligibility($user, $liveClass);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get attendance list for a live class
     */
    public function getAttendanceList(LiveClass $liveClass): \Illuminate\Database\Eloquent\Collection
    {
        return LiveAttendance::where('live_class_id', $liveClass->id)
            ->with('user')
            ->orderBy('joined_at')
            ->get();
    }

    /**
     * Get live class statistics
     */
    public function getLiveClassStatistics(LiveClass $liveClass): array
    {
        return Cache::remember(
            "live_class_stats_{$liveClass->id}",
            now()->addMinutes(15),
            function () use ($liveClass) {
                $totalAttendance = LiveAttendance::where('live_class_id', $liveClass->id)->count();
                $actualAttendees = LiveAttendance::where('live_class_id', $liveClass->id)
                    ->where('attended', true)
                    ->count();

                // Get total enrolled students in the cohort
                $totalStudents = $liveClass->week->cohort->students()->count();

                $attendanceRate = $totalStudents > 0 ? round(($actualAttendees / $totalStudents) * 100, 2) : 0;

                return [
                    'total_students' => $totalStudents,
                    'total_attendance_records' => $totalAttendance,
                    'actual_attendees' => $actualAttendees,
                    'absentees' => $totalAttendance - $actualAttendees,
                    'attendance_rate' => $attendanceRate,
                    'average_duration' => $this->getAverageAttendanceDuration($liveClass),
                    'coins_distributed' => $actualAttendees * ($liveClass->coin_reward ?? 0),
                ];
            }
        );
    }

    /**
     * Get average attendance duration
     */
    private function getAverageAttendanceDuration(LiveClass $liveClass): ?float
    {
        $attendances = LiveAttendance::where('live_class_id', $liveClass->id)
            ->where('attended', true)
            ->whereNotNull('joined_at')
            ->whereNotNull('left_at')
            ->get();

        if ($attendances->isEmpty()) {
            return null;
        }

        $totalDuration = 0;
        $count = 0;

        foreach ($attendances as $attendance) {
            if ($attendance->joined_at && $attendance->left_at) {
                $duration = $attendance->joined_at->diffInMinutes($attendance->left_at);
                $totalDuration += $duration;
                $count++;
            }
        }

        return $count > 0 ? round($totalDuration / $count, 2) : null;
    }

    /**
     * Get user's attendance history for a cohort
     */
    public function getUserAttendanceHistory(User $user, int $cohortId): \Illuminate\Database\Eloquent\Collection
    {
        return LiveAttendance::where('user_id', $user->id)
            ->whereHas('liveClass.week', function ($query) use ($cohortId) {
                $query->where('cohort_id', $cohortId);
            })
            ->with(['liveClass', 'liveClass.week'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Calculate attendance rate for user in cohort
     */
    public function getUserAttendanceRate(User $user, int $cohortId): float
    {
        $totalClasses = LiveClass::whereHas('week', function ($query) use ($cohortId) {
            $query->where('cohort_id', $cohortId);
        })->where('status', LiveClass::STATUS_COMPLETED)->count();

        if ($totalClasses === 0) {
            return 0.0;
        }

        $attendedClasses = LiveAttendance::where('user_id', $user->id)
            ->where('attended', true)
            ->whereHas('liveClass.week', function ($query) use ($cohortId) {
                $query->where('cohort_id', $cohortId);
            })
            ->whereHas('liveClass', function ($query) {
                $query->where('status', LiveClass::STATUS_COMPLETED);
            })
            ->count();

        return round(($attendedClasses / $totalClasses) * 100, 2);
    }

    /**
     * Validate attendance eligibility
     */
    private function validateAttendanceEligibility(User $user, LiveClass $liveClass): void
    {
        // Check if user has access to the week
        $weekProgress = UserProgress::where('user_id', $user->id)
            ->where('week_id', $liveClass->week_id)
            ->first();

        if (!$weekProgress || !$weekProgress->is_unlocked) {
            throw new LiveClassException('Week must be unlocked to attend this live class');
        }

        // Check if class is currently live or recently ended (allow late joins)
        if (!in_array($liveClass->status, [LiveClass::STATUS_LIVE, LiveClass::STATUS_COMPLETED])) {
            throw new LiveClassException('Live class is not currently active');
        }

        // Allow attendance marking up to 1 hour after class ends
        if (
            $liveClass->status === LiveClass::STATUS_COMPLETED &&
            $liveClass->ended_at &&
            $liveClass->ended_at->diffInMinutes(now()) > 60
        ) {
            throw new LiveClassException('Attendance marking period has expired');
        }
    }

    /**
     * Award coins for live class attendance
     */
    private function awardAttendanceCoins(User $user, LiveClass $liveClass, LiveAttendance $attendance): void
    {
        if (!$liveClass->coin_reward || $liveClass->coin_reward <= 0) {
            return;
        }

        // Check if user has already been awarded coins for this class
        $existingAward = $user->coinTransactions()
            ->where('source_type', 'live_class')
            ->where('source_id', $liveClass->id)
            ->where('transaction_type', 'earned')
            ->exists();

        if ($existingAward) {
            return; // Already awarded
        }

        $this->coinService->awardCoins(
            $user,
            $liveClass->coin_reward,
            'live_class',
            $liveClass->id,
            "Attended live class: {$liveClass->title}"
        );
    }

    /**
     * Award coins to all attendees when class ends
     */
    private function awardBulkAttendanceCoins(LiveClass $liveClass): void
    {
        if (!$liveClass->coin_reward || $liveClass->coin_reward <= 0) {
            return;
        }

        $attendees = LiveAttendance::where('live_class_id', $liveClass->id)
            ->where('attended', true)
            ->with('user')
            ->get();

        foreach ($attendees as $attendance) {
            try {
                $this->awardAttendanceCoins($attendance->user, $liveClass, $attendance);
            } catch (\Exception $e) {
                // Log error but continue with other attendees
                logger()->error("Failed to award coins to user {$attendance->user_id} for live class {$liveClass->id}: " . $e->getMessage());
            }
        }
    }

    /**
     * Update lesson, module and week progress after live class attendance
     */
    private function updateLessonAndWeekProgress(User $user, LiveClass $liveClass): void
    {
        try {
            // Find lessons that contain this live class in their blocks
            $lessons = \App\Models\Lesson::where('lesson_blocks', 'like', '%' . $liveClass->id . '%')
                ->get();

            foreach ($lessons as $lesson) {
                // Check if the block actually matches this live class ID
                $blocks = $lesson->lesson_blocks ?? [];
                $hasLiveBlock = false;
                foreach ($blocks as $block) {
                    if (
                        isset($block['type']) && $block['type'] === 'live' &&
                        isset($block['payload']['liveClassId']) &&
                        (string)$block['payload']['liveClassId'] === (string)$liveClass->id
                    ) {
                        $hasLiveBlock = true;
                        break;
                    }
                }

                if ($hasLiveBlock) {
                    // Recalculate progress for lesson, module, and week
                    $this->lessonCompletionService->recalculateLessonProgress($user, $lesson);

                    if ($lesson->module) {
                        app(\App\Services\ModuleCompletionService::class)->recalculateModuleProgress($user, $lesson->module);
                    }
                }
            }

            // Always recalculate week progress as well
            $this->weekUnlockService->recalculateWeekProgress($user, $liveClass->week);
        } catch (\Exception $e) {
            // Log error but don't fail the attendance marking
            logger()->error("Failed to update progress after live class attendance: " . $e->getMessage());
        }
    }

    /**
     * Clear live class-related caches
     */
    private function clearLiveClassCaches(?int $userId, int $liveClassId): void
    {
        Cache::forget("live_class_stats_{$liveClassId}");

        if ($userId) {
            Cache::forget("user_live_class_attendance_{$userId}_{$liveClassId}");
        }
    }

    /**
     * Get upcoming live classes for user
     */
    public function getUpcomingLiveClasses(User $user, int $days = 7): \Illuminate\Database\Eloquent\Collection
    {
        return LiveClass::whereHas('week.cohort.students', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->where('scheduled_at', '>', now())
            ->where('scheduled_at', '<=', now()->addDays($days))
            ->where('status', LiveClass::STATUS_SCHEDULED)
            ->with(['week', 'week.cohort'])
            ->orderBy('scheduled_at')
            ->get();
    }

    /**
     * Send reminders for upcoming live classes
     */
    public function sendLiveClassReminders(): int
    {
        $upcomingClasses = LiveClass::where('scheduled_at', '>', now())
            ->where('scheduled_at', '<=', now()->addHours(24))
            ->where('status', LiveClass::STATUS_SCHEDULED)
            ->with(['week.cohort.students'])
            ->get();

        $remindersSent = 0;

        foreach ($upcomingClasses as $liveClass) {
            foreach ($liveClass->week->cohort->students as $student) {
                // Send reminder notification (implement notification logic)
                $remindersSent++;
            }
        }

        return $remindersSent;
    }

    /**
     * Generate attendance report for cohort
     */
    public function generateAttendanceReport(int $cohortId): array
    {
        $liveClasses = LiveClass::whereHas('week', function ($query) use ($cohortId) {
            $query->where('cohort_id', $cohortId);
        })->with(['week', 'attendances.user'])->get();

        $students = User::whereHas('enrollments', function ($query) use ($cohortId) {
            $query->where('cohort_id', $cohortId)->where('enrollments.status', 'active');
        })->get();

        $report = [];

        foreach ($students as $student) {
            $studentReport = [
                'student_id' => $student->id,
                'student_name' => $student->name,
                'total_classes' => $liveClasses->count(),
                'attended_classes' => 0,
                'attendance_rate' => 0,
                'classes' => [],
            ];

            foreach ($liveClasses as $liveClass) {
                $attendance = $liveClass->attendances->firstWhere('user_id', $student->id);
                $attended = $attendance && $attendance->attended;

                if ($attended) {
                    $studentReport['attended_classes']++;
                }

                $studentReport['classes'][] = [
                    'class_id' => $liveClass->id,
                    'class_title' => $liveClass->title,
                    'week_number' => $liveClass->week->week_number,
                    'scheduled_at' => $liveClass->scheduled_at->toISOString(),
                    'attended' => $attended,
                    'joined_at' => $attendance?->joined_at?->toISOString(),
                    'left_at' => $attendance?->left_at?->toISOString(),
                ];
            }

            $studentReport['attendance_rate'] = $liveClasses->count() > 0
                ? round(($studentReport['attended_classes'] / $liveClasses->count()) * 100, 2)
                : 0;

            $report[] = $studentReport;
        }

        return $report;
    }
}
