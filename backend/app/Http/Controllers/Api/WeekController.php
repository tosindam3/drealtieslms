<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Week;
use App\Models\User;
use App\Models\UserProgress;
use App\Services\WeekUnlockService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class WeekController extends Controller
{
    public function __construct(
        private WeekUnlockService $weekUnlockService
    ) {}

    /**
     * Get week details with content
     */
    public function show(Request $request, Week $week): JsonResponse
    {
        $user = $request->user();

        try {
            // Check if user has access to this week
            if ($user->isStudent()) {
                $progress = UserProgress::where('user_id', $user->id)
                    ->where('week_id', $week->id)
                    ->first();

                if (!$progress || !$progress->is_unlocked) {
                    return $this->forbiddenResponse('This week is not yet unlocked');
                }
            }

            // Load week content
            $week->load([
                'modules' => function ($query) {
                    $query->orderBy('order')
                        ->with(['lessons' => function ($lessonQuery) {
                            $lessonQuery->published()->orderBy('order')
                                ->with(['topics' => function ($topicQuery) {
                                    $topicQuery->orderBy('order');
                                }]);
                        }]);
                },
                'quizzes' => function ($query) {
                    $query->orderBy('created_at');
                },
                'assignments' => function ($query) {
                    $query->orderBy('created_at');
                },
                'liveClasses' => function ($query) {
                    $query->orderBy('scheduled_at');
                }
            ]);

            $weekData = [
                'id' => $week->id,
                'week_number' => $week->week_number,
                'title' => $week->title,
                'description' => $week->description,
                'thumbnail_url' => $week->thumbnail_url,
                'is_free' => $week->is_free,
                'min_completion_percentage' => $week->min_completion_percentage,
                'min_coins_to_unlock_next' => $week->min_coins_to_unlock_next,
                'deadline_at' => $week->deadline_at?->toDateString(),
                'unlock_rules' => $week->unlock_rules,
                'cohort' => [
                    'id' => $week->cohort->id,
                    'name' => $week->cohort->name,
                ],
                'content_summary' => [
                    'modules' => $week->modules->count(),
                    'lessons' => $week->lessons()->count(),
                    'topics' => $week->lessons->sum(fn($lesson) => $lesson->topics->count()),
                    'quizzes' => $week->quizzes->count(),
                    'assignments' => $week->assignments->count(),
                    'live_classes' => $week->liveClasses->count(),
                ],
                'modules' => $week->modules->map(function ($module) use ($user) {
                    return [
                        'id' => $module->id,
                        'title' => $module->title,
                        'order' => $module->order,
                        'lessons' => $module->lessons->map(function ($lesson) use ($user) {
                            return [
                                'id' => $lesson->id,
                                'number' => $lesson->number,
                                'title' => $lesson->title,
                                'description' => $lesson->description,
                                'thumbnail_url' => $lesson->thumbnail_url,
                                'estimated_duration' => $lesson->estimated_duration,
                                'formatted_duration' => $lesson->formatted_duration,
                                'order' => $lesson->order,
                                'is_free' => $lesson->is_free,
                                'topic_count' => $lesson->topics->count(),
                                'topics' => $lesson->topics->map(function ($topic) use ($user) {
                                    $topicData = [
                                        'id' => $topic->id,
                                        'title' => $topic->title,
                                        'description' => $topic->description,
                                        'thumbnail_url' => $topic->thumbnail_url,
                                        'order' => $topic->order,
                                        'coin_reward' => $topic->coin_reward,
                                        'block_count' => count($topic->blocks ?? []),
                                        'has_video' => $topic->hasVideoBlocks(),
                                        'has_text' => $topic->hasTextBlocks(),
                                        'has_photos' => $topic->hasPhotoBlocks(),
                                    ];

                                    // Add completion status for students
                                    if ($user && $user->isStudent()) {
                                        $completion = $topic->getCompletionForUser($user);
                                        $topicData['is_completed'] = !is_null($completion);
                                        $topicData['completed_at'] = $completion?->completed_at?->toISOString();
                                        $topicData['coins_earned'] = $completion?->coins_awarded ?? 0;
                                    }

                                    return $topicData;
                                }),
                            ];
                        }),
                    ];
                }),
                'lessons' => [], // Fallback
                'quizzes' => $week->quizzes->map(function ($quiz) use ($user) {
                    $quizData = [
                        'id' => $quiz->id,
                        'title' => $quiz->title,
                        'description' => $quiz->description,
                        'passing_score' => $quiz->passing_score,
                        'max_attempts' => $quiz->max_attempts,
                        'time_limit' => $quiz->time_limit,
                        'coin_reward' => $quiz->coin_reward,
                        'question_count' => $quiz->questions->count(),
                    ];

                    // Add attempt info for students
                    if ($user && $user->isStudent()) {
                        $attempts = $user->quizAttempts()->where('quiz_id', $quiz->id)->get();
                        $bestAttempt = $attempts->where('passed', true)->sortByDesc('score')->first();

                        $quizData['attempts_used'] = $attempts->count();
                        $quizData['attempts_remaining'] = max(0, $quiz->max_attempts - $attempts->count());
                        $quizData['best_score'] = $bestAttempt?->score;
                        $quizData['is_passed'] = !is_null($bestAttempt);
                        $quizData['can_attempt'] = $attempts->count() < $quiz->max_attempts;
                    }

                    return $quizData;
                }),
                'assignments' => $week->assignments->map(function ($assignment) use ($user) {
                    $assignmentData = [
                        'id' => $assignment->id,
                        'title' => $assignment->title,
                        'description' => $assignment->description,
                        'instructions' => $assignment->instructions,
                        'coin_reward' => $assignment->coin_reward,
                        'due_date' => $assignment->due_date?->toDateString(),
                        'max_file_size' => $assignment->max_file_size,
                        'allowed_file_types' => $assignment->allowed_file_types,
                    ];

                    // Add submission info for students
                    if ($user && $user->isStudent()) {
                        $submission = $user->assignmentSubmissions()
                            ->where('assignment_id', $assignment->id)
                            ->latest()
                            ->first();

                        $assignmentData['has_submission'] = !is_null($submission);
                        $assignmentData['submission_status'] = $submission?->status;
                        $assignmentData['submitted_at'] = $submission?->submitted_at?->toISOString();
                        $assignmentData['feedback'] = $submission?->feedback;
                        $assignmentData['is_approved'] = $submission?->status === 'approved';
                    }

                    return $assignmentData;
                }),
                'live_classes' => $week->liveClasses->map(function ($liveClass) use ($user) {
                    $classData = [
                        'id' => $liveClass->id,
                        'title' => $liveClass->title,
                        'description' => $liveClass->description,
                        'scheduled_at' => $liveClass->scheduled_at->toISOString(),
                        'duration_minutes' => $liveClass->duration_minutes,
                        'meeting_url' => $liveClass->meeting_url,
                        'coin_reward' => $liveClass->coin_reward,
                        'status' => $liveClass->status,
                        'is_upcoming' => $liveClass->scheduled_at->isFuture(),
                        'is_live' => $liveClass->status === 'live',
                        'has_ended' => $liveClass->status === 'ended',
                    ];

                    // Add attendance info for students
                    if ($user && $user->isStudent()) {
                        $attendance = $user->liveAttendance()
                            ->where('live_class_id', $liveClass->id)
                            ->first();

                        $classData['has_attended'] = !is_null($attendance);
                        $classData['attended_at'] = $attendance?->attended_at?->toISOString();
                        $classData['coins_earned'] = $attendance?->coins_awarded ?? 0;
                    }

                    return $classData;
                }),
            ];

            // Add progress info for students
            if ($user && $user->isStudent()) {
                $progress = UserProgress::where('user_id', $user->id)
                    ->where('week_id', $week->id)
                    ->first();

                $weekData['progress'] = [
                    'is_unlocked' => $progress?->is_unlocked ?? false,
                    'unlocked_at' => $progress?->unlocked_at?->toISOString(),
                    'completion_percentage' => $progress?->completion_percentage ?? 0,
                    'completed_at' => $progress?->completed_at?->toISOString(),
                ];

                // Check if next week can be unlocked
                $nextWeek = $week->getNextWeek();
                if ($nextWeek) {
                    $weekData['next_week'] = [
                        'id' => $nextWeek->id,
                        'week_number' => $nextWeek->week_number,
                        'title' => $nextWeek->title,
                        'can_unlock' => $this->weekUnlockService->canUnlockWeek($user, $nextWeek),
                        'unlock_requirements' => $this->getUnlockRequirements($user, $nextWeek),
                    ];
                }
            }

            return response()->json([
                'week' => $weekData,
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'week_fetch_failed',
                'Failed to fetch week details',
                500
            );
        }
    }

    /**
     * Evaluate if a week can be unlocked for the current user
     */
    public function evaluateUnlock(Request $request, Week $week): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStudent()) {
            return $this->forbiddenResponse('Only students can unlock weeks');
        }

        try {
            $canUnlock = $this->weekUnlockService->canUnlockWeek($user, $week);
            $requirements = $this->getUnlockRequirements($user, $week);

            if ($canUnlock) {
                // Attempt to unlock the week
                $unlocked = $this->weekUnlockService->unlockWeek($user, $week);

                if ($unlocked) {
                    return response()->json([
                        'message' => 'Week unlocked successfully',
                        'week' => [
                            'id' => $week->id,
                            'week_number' => $week->week_number,
                            'title' => $week->title,
                        ],
                        'unlocked_at' => now()->toISOString(),
                        'timestamp' => now()->toISOString()
                    ]);
                }
            }

            return response()->json([
                'message' => 'Week cannot be unlocked yet',
                'can_unlock' => $canUnlock,
                'requirements' => $requirements,
                'timestamp' => now()->toISOString()
            ], 400);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'unlock_evaluation_failed',
                'Failed to evaluate week unlock',
                500
            );
        }
    }

    /**
     * Get unlock requirements for a week
     */
    private function getUnlockRequirements(User $user, Week $week): array
    {
        return $this->weekUnlockService->getUnlockRequirementsSummary($user, $week);
    }
}
