<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\UserProgress;
use App\Services\TopicCompletionService;
use App\Services\LessonCompletionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LessonController extends Controller
{
    public function __construct(
        private TopicCompletionService $topicCompletionService,
        private LessonCompletionService $lessonCompletionService
    ) {}

    /**
     * Get lesson details with topics
     */
    public function show(Request $request, Lesson $lesson): JsonResponse
    {
        $user = $request->user();

        try {
            // Check if user has access to this lesson's week
            if ($user->isStudent()) {
                $progress = UserProgress::where('user_id', $user->id)
                    ->where('week_id', $lesson->module->week_id)
                    ->first();

                if (!$progress || !$progress->is_unlocked) {
                    return $this->forbiddenResponse('The week containing this lesson is not yet unlocked');
                }
            }

            // Load lesson with topics
            $lesson->load([
                'topics' => function ($query) {
                    $query->orderBy('order');
                },
                'module.week' => function ($query) {
                    $query->with('cohort:id,name');
                }
            ]);

            $lessonData = [
                'id' => $lesson->id,
                'number' => $lesson->number,
                'title' => $lesson->title,
                'description' => $lesson->description,
                'thumbnail_url' => $lesson->thumbnail_url,
                'estimated_duration' => $lesson->estimated_duration,
                'formatted_duration' => $lesson->formatted_duration,
                'order' => $lesson->order,
                'status' => $lesson->status,
                'is_free' => $lesson->is_free,
                'lessonBlocks' => (function () use ($user, $lesson) {
                    $blocks = $lesson->lesson_blocks ?? [];
                    if ($user && $user->isStudent()) {
                        return array_map(function ($block) use ($user, $lesson) {
                            $completion = \App\Models\LessonBlockCompletion::getLatestAttempt($user->id, $lesson->id, (string)$block['id']);
                            if ($completion) {
                                $block['isCompleted'] = $completion->is_completed;
                                $block['attemptNumber'] = $completion->attempt_number;
                                $block['scorePercentage'] = $completion->score_percentage;
                                $block['passed'] = $completion->passed;
                                $block['completedAt'] = $completion->completed_at?->toISOString();
                                $block['coinsEarned'] = $completion->coins_awarded;
                            } else {
                                $block['isCompleted'] = false;
                            }
                            $block['lessonId'] = (string) $lesson->id;
                            return $block;
                        }, $blocks);
                    }
                    return $blocks;
                })(),
                'week' => [
                    'id' => $lesson->module->week->id,
                    'week_number' => $lesson->module->week->week_number,
                    'title' => $lesson->module->week->title,
                    'cohort' => [
                        'id' => $lesson->module->week->cohort->id,
                        'name' => $lesson->module->week->cohort->name,
                    ],
                ],
                'module' => [
                    'id' => $lesson->module->id,
                    'title' => $lesson->module->title,
                ],
                'topic_count' => $lesson->topics->count(),
                'topics' => $lesson->topics->map(function ($topic) use ($user) {
                    $topicData = [
                        'id' => $topic->id,
                        'title' => $topic->title,
                        'description' => $topic->description,
                        'thumbnail_url' => $topic->thumbnail_url,
                        'order' => $topic->order,
                        'blocks' => $topic->blocks,
                        'coin_reward' => $topic->coin_reward,
                        'completion_rule' => $topic->completion_rule,
                        'block_summary' => [
                            'total_blocks' => count($topic->blocks ?? []),
                            'has_video' => $topic->hasVideoBlocks(),
                            'has_text' => $topic->hasTextBlocks(),
                            'has_photos' => $topic->hasPhotoBlocks(),
                            'video_blocks' => count($topic->getBlocksByType('video')),
                            'text_blocks' => count($topic->getBlocksByType('text')),
                            'photo_blocks' => count($topic->getBlocksByType('photo')),
                        ],
                    ];

                    // Add completion status for students
                    if ($user && $user->isStudent()) {
                        $completion = $topic->getCompletionForUser($user);
                        $topicData['completion'] = [
                            'is_completed' => !is_null($completion),
                            'completed_at' => $completion?->completed_at?->toISOString(),
                            'coins_earned' => $completion?->coins_awarded ?? 0,
                            'completion_data' => $completion?->completion_data ?? [],
                        ];
                    }

                    return $topicData;
                }),
            ];

            // Add lesson progress for students
            if ($user && $user->isStudent()) {
                $completionPercentage = $this->topicCompletionService->getLessonCompletionPercentage($user, $lesson->id);
                $completedTopics = $this->topicCompletionService->getUserCompletedTopicsForLesson($user, $lesson->id);

                $lessonData['progress'] = [
                    'completion_percentage' => $completionPercentage,
                    'completed_topics' => $completedTopics->count(),
                    'total_topics' => $lesson->topics->count(),
                    'is_completed' => $completionPercentage >= 100,
                    'coins_earned' => $completedTopics->sum('coins_awarded'),
                ];
            }

            // Add lesson statistics for instructors/admins
            if ($user && ($user->isInstructor() || $user->isAdmin())) {
                $lessonData['statistics'] = $this->getLessonStatistics($lesson);
            }

            return response()->json([
                'lesson' => $lessonData,
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'lesson_fetch_failed',
                'Failed to fetch lesson details',
                500
            );
        }
    }

    /**
     * Get lesson statistics for instructors/admins
     */
    private function getLessonStatistics(Lesson $lesson): array
    {
        $cohort = $lesson->module->week->cohort;
        $totalStudents = $cohort->enrollments()->where('status', 'active')->count();

        if ($totalStudents === 0) {
            return [
                'total_students' => 0,
                'students_started' => 0,
                'students_completed' => 0,
                'average_completion' => 0,
                'topic_statistics' => [],
            ];
        }

        // Get students who have completed at least one topic in this lesson
        $studentsStarted = \App\Models\TopicCompletion::whereHas('topic', function ($query) use ($lesson) {
            $query->where('lesson_id', $lesson->id);
        })->distinct('user_id')->count();

        // Get students who have completed all topics in this lesson
        $studentsCompleted = 0;
        $totalCompletionPercentage = 0;

        foreach ($cohort->students as $student) {
            $completionPercentage = $this->topicCompletionService->getLessonCompletionPercentage($student, $lesson->id);
            $totalCompletionPercentage += $completionPercentage;

            if ($completionPercentage >= 100) {
                $studentsCompleted++;
            }
        }

        $averageCompletion = $totalStudents > 0 ? round($totalCompletionPercentage / $totalStudents, 2) : 0;

        // Get topic-level statistics
        $topicStatistics = $lesson->topics->map(function ($topic) use ($totalStudents) {
            $completions = \App\Models\TopicCompletion::where('topic_id', $topic->id)->count();
            $completionRate = $totalStudents > 0 ? round(($completions / $totalStudents) * 100, 2) : 0;

            return [
                'topic_id' => $topic->id,
                'title' => $topic->title,
                'completions' => $completions,
                'completion_rate' => $completionRate,
                'coins_distributed' => $completions * ($topic->coin_reward ?? 0),
            ];
        });

        return [
            'total_students' => $totalStudents,
            'students_started' => $studentsStarted,
            'students_completed' => $studentsCompleted,
            'start_rate' => round(($studentsStarted / $totalStudents) * 100, 2),
            'completion_rate' => round(($studentsCompleted / $totalStudents) * 100, 2),
            'average_completion' => $averageCompletion,
            'topic_statistics' => $topicStatistics,
        ];
    }

    /**
     * Complete a lesson block (quiz, assignment, etc.)
     */
    public function completeBlock(Request $request, Lesson $lesson, string $blockId): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStudent()) {
            return $this->forbiddenResponse('Only students can complete lesson blocks');
        }

        $validated = $request->validate([
            'block_type' => 'required|in:quiz,assignment,live,video,text,image',
            'score_percentage' => 'nullable|numeric|min:0|max:100',
            'score_points' => 'nullable|integer|min:0',
            'total_points' => 'nullable|integer|min:0',
            'passed' => 'nullable|boolean',
            'coins_awarded' => 'nullable|integer|min:0',
            'completion_data' => 'nullable|array',
        ]);

        try {
            // Check if user has access to this lesson's week
            $progress = UserProgress::where('user_id', $user->id)
                ->where('week_id', $lesson->module->week_id)
                ->first();

            if (!$progress || !$progress->is_unlocked) {
                return $this->forbiddenResponse('The week containing this lesson is not yet unlocked');
            }

            // Get the next attempt number
            $attemptNumber = \App\Models\LessonBlockCompletion::getNextAttemptNumber(
                $user->id,
                $lesson->id,
                $blockId
            );

            // Create the completion record
            $completion = \App\Models\LessonBlockCompletion::create([
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
                'block_id' => $blockId,
                'block_type' => $validated['block_type'],
                'is_completed' => true,
                'attempt_number' => $attemptNumber,
                'score_percentage' => $validated['score_percentage'] ?? null,
                'score_points' => $validated['score_points'] ?? null,
                'total_points' => $validated['total_points'] ?? null,
                'passed' => $validated['passed'] ?? null,
                'coins_awarded' => $validated['coins_awarded'] ?? 0,
                'completion_data' => $validated['completion_data'] ?? null,
                'started_at' => now(),
                'completed_at' => now(),
            ]);

            // Award coins if applicable
            if ($completion->coins_awarded > 0) {
                app(\App\Services\CoinService::class)->awardCoins(
                    $user,
                    $completion->coins_awarded,
                    'lesson_block_completion',
                    $completion->id,
                    "Completed {$validated['block_type']} in lesson: {$lesson->title}",
                    ['lesson_id' => $lesson->id, 'block_id' => $blockId]
                );
            }

            // Recalculate progress for lesson, module, and week
            $this->lessonCompletionService->recalculateLessonProgress($user, $lesson);

            if ($lesson->module) {
                app(\App\Services\ModuleCompletionService::class)->recalculateModuleProgress($user, $lesson->module);
                if ($lesson->module->week) {
                    app(\App\Services\WeekUnlockService::class)->recalculateWeekProgress($user, $lesson->module->week);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Block completed successfully',
                'completion' => [
                    'id' => $completion->id,
                    'attempt_number' => $completion->attempt_number,
                    'is_completed' => $completion->is_completed,
                    'score_percentage' => $completion->score_percentage,
                    'passed' => $completion->passed,
                    'coins_awarded' => $completion->coins_awarded,
                    'completed_at' => $completion->completed_at->toISOString(),
                ],
                'coin_balance' => $user->getCurrentCoinBalance(),
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'block_completion_failed',
                'Failed to complete block: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Get all attempts for a lesson block
     */
    public function getBlockAttempts(Request $request, Lesson $lesson, string $blockId): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStudent()) {
            return $this->forbiddenResponse('Only students can view their attempts');
        }

        try {
            $attempts = \App\Models\LessonBlockCompletion::getAttempts(
                $user->id,
                $lesson->id,
                $blockId
            );

            $hasPassed = \App\Models\LessonBlockCompletion::hasPassed(
                $user->id,
                $lesson->id,
                $blockId
            );

            return response()->json([
                'block_id' => $blockId,
                'lesson_id' => $lesson->id,
                'total_attempts' => $attempts->count(),
                'has_passed' => $hasPassed,
                'best_score' => $attempts->max('score_percentage'),
                'latest_attempt' => $attempts->last(),
                'attempts' => $attempts->map(function ($attempt) {
                    return [
                        'id' => $attempt->id,
                        'attempt_number' => $attempt->attempt_number,
                        'score_percentage' => $attempt->score_percentage,
                        'score_points' => $attempt->score_points,
                        'total_points' => $attempt->total_points,
                        'passed' => $attempt->passed,
                        'coins_awarded' => $attempt->coins_awarded,
                        'completed_at' => $attempt->completed_at?->toISOString(),
                    ];
                }),
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'attempts_fetch_failed',
                'Failed to fetch attempts: ' . $e->getMessage(),
                500
            );
        }
    }
}
