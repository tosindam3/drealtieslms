<?php

namespace App\Services;

use App\Models\User;
use App\Models\Cohort;
use App\Models\Enrollment;
use App\Models\UserProgress;
use App\Models\Week;
use App\Models\CoinTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Events\CohortEnrolledEvent;
use App\Events\CohortStartedEvent;
use App\Exceptions\EnrollmentException;
use App\Services\Mail\EmailTemplateService;

class CohortService
{
    public function __construct(
        private CoinService $coinService,
        private EmailTemplateService $emailService
    ) {}

    /**
     * Enroll a student in a cohort
     */
    public function enrollStudent(User $student, Cohort $cohort): Enrollment
    {
        // Validate enrollment eligibility
        $this->validateEnrollmentEligibility($student, $cohort);

        return DB::transaction(function () use ($student, $cohort) {
            // Create enrollment record
            $enrollment = Enrollment::create([
                'user_id' => $student->id,
                'cohort_id' => $cohort->id,
                'enrolled_at' => now(),
                'status' => Enrollment::STATUS_ACTIVE,
                'completion_percentage' => 0.00,
            ]);

            // Initialize progress for all weeks (Week 1 unlocked, others locked)
            $this->initializeStudentProgress($student, $cohort);

            // Update cohort enrollment count
            $cohort->increment('enrolled_count');

            // Clear relevant caches
            $this->clearCohortCaches($cohort->id);

            // Dispatch enrollment event
            event(new CohortEnrolledEvent($student, $cohort, $enrollment));

            return $enrollment;
        });
    }

    /**
     * Validate if student can enroll in cohort
     */
    private function validateEnrollmentEligibility(User $student, Cohort $cohort): void
    {
        // Check if student role
        if (!$student->isStudent()) {
            throw new EnrollmentException('Only students can enroll in cohorts');
        }

        // Check cohort status
        if ($cohort->status !== Cohort::STATUS_PUBLISHED && $cohort->status !== Cohort::STATUS_ACTIVE) {
            throw new EnrollmentException('Cohort is not available for enrollment');
        }

        // Check capacity
        if ($cohort->enrolled_count >= $cohort->capacity) {
            throw new EnrollmentException('Cohort has reached maximum capacity');
        }

        // Check if already enrolled in this cohort
        if ($this->isStudentEnrolled($student, $cohort)) {
            throw new EnrollmentException('Student is already enrolled in this cohort');
        }

        // Check enrollment deadline (if set)
        // Note: enrollment_deadline column not implemented in current schema
        // if ($cohort->enrollment_deadline && now()->isAfter($cohort->enrollment_deadline)) {
        //     throw new EnrollmentException('Enrollment deadline has passed');
        // }
    }

    /**
     * Initialize student progress for all weeks in cohort
     */
    private function initializeStudentProgress(User $student, Cohort $cohort): void
    {
        $weeks = $cohort->weeks()->orderBy('week_number')->get();

        foreach ($weeks as $week) {
            UserProgress::create([
                'user_id' => $student->id,
                'cohort_id' => $cohort->id,
                'week_id' => $week->id,
                'completion_percentage' => 0.00,
                'is_unlocked' => $week->week_number === 1, // Only Week 1 unlocked initially
                'unlocked_at' => $week->week_number === 1 ? now() : null,
            ]);
        }
    }

    /**
     * Check if student is enrolled in cohort
     */
    public function isStudentEnrolled(User $student, Cohort $cohort): bool
    {
        return Enrollment::where('user_id', $student->id)
            ->where('cohort_id', $cohort->id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->exists();
    }

    /**
     * Check if student has any active enrollment
     */
    public function hasActiveEnrollment(User $student): bool
    {
        return Enrollment::where('user_id', $student->id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->whereHas('cohort', function ($query) {
                $query->whereIn('status', [Cohort::STATUS_ACTIVE, Cohort::STATUS_PUBLISHED]);
            })
            ->exists();
    }

    /**
     * Get student's active enrollment
     */
    public function getActiveEnrollment(User $student): ?Enrollment
    {
        return Enrollment::where('user_id', $student->id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->whereHas('cohort', function ($query) {
                $query->whereIn('status', [Cohort::STATUS_ACTIVE, Cohort::STATUS_PUBLISHED]);
            })
            ->with('cohort')
            ->first();
    }

    /**
     * Start a cohort (unlock Week 1 for all enrolled students)
     */
    public function startCohort(Cohort $cohort): void
    {
        if ($cohort->status !== Cohort::STATUS_PUBLISHED) {
            throw new \InvalidArgumentException('Only published cohorts can be started');
        }

        DB::transaction(function () use ($cohort) {
            // Update cohort status
            $cohort->update([
                'status' => Cohort::STATUS_ACTIVE,
                // Note: started_at column not implemented in current schema
                // 'started_at' => now(),
            ]);

            // Ensure Week 1 is unlocked for all enrolled students
            $this->unlockWeekOneForAllStudents($cohort);

            // Clear caches
            $this->clearCohortCaches($cohort->id);

            // Dispatch cohort started event
            event(new CohortStartedEvent($cohort));
        });
    }

    /**
     * Unlock Week 1 for all enrolled students
     */
    private function unlockWeekOneForAllStudents(Cohort $cohort): void
    {
        $weekOne = $cohort->weeks()->where('week_number', 1)->first();

        if (!$weekOne) {
            return;
        }

        UserProgress::where('cohort_id', $cohort->id)
            ->where('week_id', $weekOne->id)
            ->where('is_unlocked', false)
            ->update([
                'is_unlocked' => true,
                'unlocked_at' => now(),
            ]);
    }

    /**
     * Complete student enrollment (mark as completed)
     */
    public function completeEnrollment(User $student, Cohort $cohort): void
    {
        $enrollment = Enrollment::where('user_id', $student->id)
            ->where('cohort_id', $cohort->id)
            ->first();

        if (!$enrollment) {
            throw new EnrollmentException('Student is not enrolled in this cohort');
        }

        DB::transaction(function () use ($enrollment, $student, $cohort) {
            $enrollment->update([
                'status' => Enrollment::STATUS_COMPLETED,
                'completed_at' => now(),
                'completion_percentage' => 100.00,
            ]);

            // Award completion bonus coins (using default value since column doesn't exist)
            $bonusCoins = 500; // Default bonus coins
            $this->coinService->awardCoins(
                $student,
                $bonusCoins,
                CoinTransaction::SOURCE_WEEK_COMPLETION,
                $cohort->id,
                "Completed cohort: {$cohort->name}"
            );

            // Clear caches
            $this->clearCohortCaches($cohort->id);

            // Send completion email from the new template
            \Illuminate\Support\Facades\Mail::to($student->email)->queue(
                new \App\Mail\CourseCompletedMail($student, $cohort->name)
            );
        });
    }

    /**
     * Withdraw student from cohort
     */
    public function withdrawStudent(User $student, Cohort $cohort, string $reason = null): void
    {
        $enrollment = Enrollment::where('user_id', $student->id)
            ->where('cohort_id', $cohort->id)
            ->first();

        if (!$enrollment) {
            throw new EnrollmentException('Student is not enrolled in this cohort');
        }

        DB::transaction(function () use ($enrollment, $cohort, $student, $reason) {
            $enrollment->update([
                'status' => Enrollment::STATUS_DROPPED, // Use 'dropped' instead of 'withdrawn'
                // Note: withdrawn_at and withdrawal_reason columns don't exist in current schema
                // 'withdrawn_at' => now(),
                // 'withdrawal_reason' => $reason,
            ]);

            // Decrement enrollment count
            $cohort->decrement('enrolled_count');

            // Clear caches
            $this->clearCohortCaches($cohort->id);

            // Send unenrollment email
            \Illuminate\Support\Facades\Mail::to($student->email)->queue(
                new \App\Mail\UserUnenrolledMail($student, $cohort->name)
            );
        });
    }

    /**
     * Get cohort enrollment statistics
     */
    public function getCohortStats(Cohort $cohort): array
    {
        return Cache::remember(
            "cohort_stats_{$cohort->id}",
            now()->addMinutes(15),
            function () use ($cohort) {
                $totalEnrollments = Enrollment::where('cohort_id', $cohort->id)->count();
                $activeStudents = Enrollment::where('cohort_id', $cohort->id)->where('status', Enrollment::STATUS_ACTIVE)->count();
                $completedStudents = Enrollment::where('cohort_id', $cohort->id)->where('status', Enrollment::STATUS_COMPLETED)->count();
                $droppedStudents = Enrollment::where('cohort_id', $cohort->id)->where('status', Enrollment::STATUS_DROPPED)->count();

                return [
                    'total_enrolled' => $totalEnrollments,
                    'active_students' => $activeStudents,
                    'completed_students' => $completedStudents,
                    'dropped_students' => $droppedStudents,
                    'capacity_remaining' => max(0, $cohort->capacity - $cohort->enrolled_count),
                    'completion_rate' => $this->calculateCompletionRate($cohort),
                    'average_progress' => $this->calculateAverageProgress($cohort),
                ];
            }
        );
    }

    /**
     * Calculate cohort completion rate
     */
    private function calculateCompletionRate(Cohort $cohort): float
    {
        $totalEnrollments = Enrollment::where('cohort_id', $cohort->id)->count();

        if ($totalEnrollments === 0) {
            return 0.0;
        }

        $completedEnrollments = Enrollment::where('cohort_id', $cohort->id)
            ->where('status', Enrollment::STATUS_COMPLETED)
            ->count();

        return round(($completedEnrollments / $totalEnrollments) * 100, 2);
    }

    /**
     * Calculate average progress across all students
     */
    private function calculateAverageProgress(Cohort $cohort): float
    {
        $averageProgress = Enrollment::where('cohort_id', $cohort->id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->avg('completion_percentage');

        return round($averageProgress ?? 0, 2);
    }

    /**
     * Get students enrolled in cohort
     */
    public function getCohortStudents(Cohort $cohort, ?string $status = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = Enrollment::where('cohort_id', $cohort->id)
            ->with(['user', 'progress']);

        if ($status) {
            $query->where('status', $status);
        }

        return $query->get();
    }

    /**
     * Check if cohort can be started
     */
    public function canStartCohort(Cohort $cohort): bool
    {
        return $cohort->status === Cohort::STATUS_PUBLISHED &&
            $cohort->enrolled_count > 0 &&
            $cohort->start_date <= now();
    }

    /**
     * Auto-start cohorts that are ready
     */
    public function autoStartReadyCohorts(): int
    {
        $readyCohorts = Cohort::where('status', Cohort::STATUS_PUBLISHED)
            ->where('start_date', '<=', now())
            ->where('enrolled_count', '>', 0)
            ->get();

        $startedCount = 0;

        foreach ($readyCohorts as $cohort) {
            try {
                $this->startCohort($cohort);
                $startedCount++;
            } catch (\Exception $e) {
                // Log error but continue with other cohorts
                logger()->error("Failed to auto-start cohort {$cohort->id}: " . $e->getMessage());
            }
        }

        return $startedCount;
    }

    /**
     * Clear cohort-related caches
     */
    private function clearCohortCaches(int $cohortId): void
    {
        Cache::forget("cohort_stats_{$cohortId}");
        Cache::forget("cohort_students_{$cohortId}");
        Cache::forget("cohort_progress_{$cohortId}");
    }
}
