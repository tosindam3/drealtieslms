<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TopicCompletion;
use App\Models\QuizAttempt;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProfileController extends Controller
{
    /**
     * Get aggregated stats for the student profile
     */
    public function getStats(Request $request): JsonResponse
    {
        $user = $request->user();

        // Total Experience (Coin balance)
        $totalExperience = $user->getCurrentCoinBalance();

        // Lessons Completed
        // A lesson is considered completed if all its topics are completed by the user.
        $lessonsCompleted = DB::table('lessons')
            ->join('topics', 'lessons.id', '=', 'topics.lesson_id')
            ->leftJoin('topic_completions', function ($join) use ($user) {
                $join->on('topics.id', '=', 'topic_completions.topic_id')
                    ->where('topic_completions.user_id', '=', $user->id);
            })
            ->select('lessons.id')
            ->groupBy('lessons.id')
            ->havingRaw('COUNT(topics.id) = COUNT(topic_completions.id)')
            ->get()
            ->count();

        // Learning Hours (Sum of watch time in hours)
        $totalWatchTimeSeconds = TopicCompletion::where('user_id', $user->id)
            ->get()
            ->sum(function ($completion) {
                return $completion->getCompletionData('watch_time_seconds', 0);
            });
        $learningHours = round($totalWatchTimeSeconds / 3600, 1);

        // Certifications (Completed Enrollments)
        $certifications = Enrollment::where('user_id', $user->id)
            ->where('status', Enrollment::STATUS_COMPLETED)
            ->count();

        // Level and XP Calculation
        // Formula: Level = floor(Total XP / 1000) + 1
        $level = floor($totalExperience / 1000) + 1;
        $xpInCurrentLevel = $totalExperience % 1000;
        $xpToNextLevel = 1000 - $xpInCurrentLevel;

        // Study Streak
        $streak = $this->calculateStreak($user->id);

        // Avg Grade (Average score percentage of completed quiz attempts)
        $avgGrade = QuizAttempt::where('user_id', $user->id)
            ->where('status', QuizAttempt::STATUS_COMPLETED)
            ->avg('score_percentage') ?? 0;

        return response()->json([
            'stats' => [
                'total_experience' => $totalExperience,
                'lessons_completed' => $lessonsCompleted,
                'learning_hours' => $learningHours,
                'certifications' => $certifications,
                'level' => $level,
                'xp_in_level' => $xpInCurrentLevel,
                'xp_to_next_level' => $xpToNextLevel,
                'xp_total_for_level' => 1000,
                'study_streak' => $streak,
                'avg_grade' => round($avgGrade),
            ],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url,
                'created_at' => $user->created_at->toISOString(),
                'role' => $user->role,
                'member_since' => $user->created_at->format('M Y'),
            ],
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Update basic student profile information
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $user->update([
            'name' => $request->name,
        ]);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'name' => $user->name,
            ],
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Calculate consecutive days of activity
     */
    private function calculateStreak(int $userId): int
    {
        $dates = TopicCompletion::where('user_id', $userId)
            ->select(DB::raw('DATE(completed_at) as completion_date'))
            ->groupBy('completion_date')
            ->orderBy('completion_date', 'desc')
            ->pluck('completion_date')
            ->map(fn($date) => Carbon::parse($date)->startOfDay())
            ->toArray();

        if (empty($dates)) return 0;

        $streak = 0;
        $today = Carbon::today();

        // Check if user has activity today or yesterday to maintain the streak
        $lastActivity = $dates[0];
        if ($today->diffInDays($lastActivity) > 1) {
            return 0;
        }

        foreach ($dates as $index => $date) {
            $expectedDate = Carbon::parse($dates[0])->subDays($index);
            if ($date->equalTo($expectedDate)) {
                $streak++;
            } else {
                break;
            }
        }

        return $streak;
    }
}
