<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Topic;
use App\Models\UserProgress;
use App\Services\TopicCompletionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Exceptions\TopicCompletionException;

class TopicController extends Controller
{
    public function __construct(
        private TopicCompletionService $topicCompletionService
    ) {}

    /**
     * Get topic details with blocks
     */
    public function show(Request $request, Topic $topic): JsonResponse
    {
        $user = $request->user();

        try {
            // Check if user has access to this topic's week
            if ($user->isStudent()) {
                $progress = UserProgress::where('user_id', $user->id)
                    ->where('week_id', $topic->lesson->module->week_id)
                    ->first();

                if (!$progress || !$progress->is_unlocked) {
                    return $this->forbiddenResponse('The week containing this topic is not yet unlocked');
                }
            }

            // Load topic with relationships
            $topic->load([
                'lesson' => function ($query) {
                    $query->with(['week' => function ($weekQuery) {
                        $weekQuery->with('cohort:id,name');
                    }]);
                }
            ]);

            $topicData = [
                'id' => $topic->id,
                'title' => $topic->title,
                'description' => $topic->description,
                'thumbnail_url' => $topic->thumbnail_url,
                'order' => $topic->order,
                'blocks' => $topic->blocks,
                'coin_reward' => $topic->coin_reward,
                'completion_rule' => $topic->completion_rule ?? Topic::getDefaultCompletionRule(),
                'lesson' => [
                    'id' => $topic->lesson->id,
                    'number' => $topic->lesson->number,
                    'title' => $topic->lesson->title,
                    'week' => [
                        'id' => $topic->lesson->module->week->id,
                        'week_number' => $topic->lesson->module->week->week_number,
                        'title' => $topic->lesson->module->week->title,
                        'cohort' => [
                            'id' => $topic->lesson->module->week->cohort->id,
                            'name' => $topic->lesson->module->week->cohort->name,
                        ],
                    ],
                ],
                'block_summary' => [
                    'total_blocks' => count($topic->blocks ?? []),
                    'has_video' => $topic->hasVideoBlocks(),
                    'has_text' => $topic->hasTextBlocks(),
                    'has_photos' => $topic->hasPhotoBlocks(),
                    'blocks_by_type' => [
                        'video' => count($topic->getBlocksByType('video')),
                        'text' => count($topic->getBlocksByType('text')),
                        'photo' => count($topic->getBlocksByType('photo')),
                        'quiz' => count($topic->getBlocksByType('quiz')),
                        'assignment' => count($topic->getBlocksByType('assignment')),
                    ],
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
                    'can_complete' => is_null($completion), // Can only complete once
                ];
            }

            // Add topic statistics for instructors/admins
            if ($user && ($user->isInstructor() || $user->isAdmin())) {
                $topicData['statistics'] = $this->topicCompletionService->getTopicStatistics($topic);
            }

            return response()->json([
                'topic' => $topicData,
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'topic_fetch_failed',
                'Failed to fetch topic details',
                500
            );
        }
    }

    /**
     * Mark topic as completed
     */
    public function complete(Request $request, Topic $topic): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStudent()) {
            return $this->forbiddenResponse('Only students can complete topics');
        }

        $validator = Validator::make($request->all(), [
            'completion_data' => 'sometimes|array',
            'completion_data.watch_time' => 'sometimes|integer|min:0',
            'completion_data.interaction_data' => 'sometimes|array',
            'completion_data.notes' => 'sometimes|string|max:1000',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors()->toArray());
        }

        try {
            // Check if already completed
            if ($this->topicCompletionService->hasUserCompleted($user, $topic)) {
                return response()->json([
                    'message' => 'Topic already completed',
                    'topic' => [
                        'id' => $topic->id,
                        'title' => $topic->title,
                    ],
                    'completion' => $topic->getCompletionForUser($user)->only([
                        'completed_at',
                        'coins_awarded',
                        'completion_data'
                    ]),
                    'timestamp' => now()->toISOString()
                ]);
            }

            $completionData = $request->get('completion_data', []);
            $completion = $this->topicCompletionService->completeTopic($user, $topic, $completionData);

            return response()->json([
                'message' => 'Topic completed successfully',
                'topic' => [
                    'id' => $topic->id,
                    'title' => $topic->title,
                    'coin_reward' => $topic->coin_reward,
                ],
                'completion' => [
                    'id' => $completion->id,
                    'completed_at' => $completion->completed_at->toISOString(),
                    'coins_awarded' => $completion->coins_awarded,
                    'completion_data' => $completion->completion_data,
                    'next_item' => $completion->next_item ?? null,
                ],
                'user_stats' => [
                    'new_coin_balance' => $user->fresh()->getCurrentCoinBalance(),
                    'lesson_completion' => $this->topicCompletionService->getLessonCompletionPercentage($user, $topic->lesson_id),
                ],
                'timestamp' => now()->toISOString()
            ], 201);
        } catch (TopicCompletionException $e) {
            return $this->errorResponse(
                'topic_completion_failed',
                $e->getMessage(),
                400
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'topic_completion_error',
                'An error occurred while completing the topic',
                500
            );
        }
    }

    /**
     * Get topic completion progress (for instructors/admins)
     */
    public function progress(Request $request, Topic $topic): JsonResponse
    {
        $user = $request->user();

        if (!$user->isInstructor() && !$user->isAdmin()) {
            return $this->forbiddenResponse('Access denied');
        }

        try {
            $statistics = $this->topicCompletionService->getTopicStatistics($topic);

            // Get detailed completion data
            $completions = $topic->completions()
                ->with(['user:id,name,email'])
                ->orderBy('completed_at', 'desc')
                ->get();

            $completionDetails = $completions->map(function ($completion) {
                return [
                    'user' => [
                        'id' => $completion->user->id,
                        'name' => $completion->user->name,
                        'email' => $completion->user->email,
                    ],
                    'completed_at' => $completion->completed_at->toISOString(),
                    'coins_awarded' => $completion->coins_awarded,
                    'completion_data' => $completion->completion_data,
                ];
            });

            return response()->json([
                'topic' => [
                    'id' => $topic->id,
                    'title' => $topic->title,
                    'lesson_title' => $topic->lesson->title,
                    'week_number' => $topic->lesson->module->week->week_number,
                    'lesson_id' => $topic->lesson_id,
                    'coin_reward' => $topic->coin_reward,
                ],
                'statistics' => $statistics,
                'completions' => $completionDetails,
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'topic_progress_fetch_failed',
                'Failed to fetch topic progress',
                500
            );
        }
    }

    /**
     * Reset topic completion (admin only)
     */
    public function resetCompletion(Request $request, Topic $topic): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return $this->forbiddenResponse('Only administrators can reset topic completions');
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
            'reason' => 'sometimes|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors()->toArray());
        }

        try {
            $targetUser = \App\Models\User::findOrFail($request->user_id);

            if (!$this->topicCompletionService->hasUserCompleted($targetUser, $topic)) {
                return $this->errorResponse(
                    'completion_not_found',
                    'User has not completed this topic',
                    404
                );
            }

            $this->topicCompletionService->resetTopicCompletion($targetUser, $topic);

            return response()->json([
                'message' => 'Topic completion reset successfully',
                'topic' => [
                    'id' => $topic->id,
                    'title' => $topic->title,
                ],
                'user' => [
                    'id' => $targetUser->id,
                    'name' => $targetUser->name,
                ],
                'reason' => $request->get('reason'),
                'reset_by' => [
                    'id' => $user->id,
                    'name' => $user->name,
                ],
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'completion_reset_failed',
                'Failed to reset topic completion',
                500
            );
        }
    }
}
