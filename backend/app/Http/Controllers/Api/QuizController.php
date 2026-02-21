<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\UserProgress;
use App\Services\QuizService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Exceptions\QuizException;

class QuizController extends Controller
{
    public function __construct(
        private QuizService $quizService
    ) {}

    /**
     * Get quiz details with questions
     */
    public function show(Request $request, Quiz $quiz): JsonResponse
    {
        $user = $request->user();

        try {
            // Check if user has access to this quiz's week
            if ($user->isStudent()) {
                $progress = UserProgress::where('user_id', $user->id)
                    ->where('week_id', $quiz->week_id)
                    ->first();

                if (!$progress || !$progress->is_unlocked) {
                    return $this->forbiddenResponse('The week containing this quiz is not yet unlocked');
                }
            }

            // Load quiz with relationships
            $quiz->load([
                'questions' => function ($query) {
                    $query->orderBy('order');
                },
                'week' => function ($query) {
                    $query->with('cohort:id,name');
                }
            ]);

            $quizData = [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'instructions' => $quiz->instructions,
                'passing_score' => $quiz->passing_score,
                'max_attempts' => $quiz->max_attempts,
                'time_limit' => $quiz->time_limit,
                'coin_reward' => $quiz->coin_reward,
                'is_randomized' => $quiz->is_randomized,
                'show_results_immediately' => $quiz->show_results_immediately,
                'allow_review' => $quiz->allow_review,
                'week' => [
                    'id' => $quiz->week->id,
                    'week_number' => $quiz->week->week_number,
                    'title' => $quiz->week->title,
                    'cohort' => [
                        'id' => $quiz->week->cohort->id,
                        'name' => $quiz->week->cohort->name,
                    ],
                ],
                'question_count' => $quiz->questions->count(),
                'total_points' => $quiz->questions->sum('points'),
            ];

            // Add attempt information for students
            if ($user && $user->isStudent()) {
                $attempts = $user->quizAttempts()
                    ->where('quiz_id', $quiz->id)
                    ->orderBy('created_at', 'desc')
                    ->get();

                $bestAttempt = $attempts->where('passed', true)->sortByDesc('score')->first();
                $latestAttempt = $attempts->first();

                $quizData['attempt_info'] = [
                    'attempts_used' => $attempts->count(),
                    'attempts_remaining' => max(0, $quiz->max_attempts - $attempts->count()),
                    'can_attempt' => $attempts->count() < $quiz->max_attempts,
                    'best_score' => $bestAttempt?->score,
                    'best_percentage' => $bestAttempt?->percentage,
                    'is_passed' => !is_null($bestAttempt),
                    'latest_attempt' => $latestAttempt ? [
                        'id' => $latestAttempt->id,
                        'score' => $latestAttempt->score,
                        'percentage' => $latestAttempt->percentage,
                        'passed' => $latestAttempt->passed,
                        'completed_at' => $latestAttempt->completed_at?->toISOString(),
                        'time_taken' => $latestAttempt->time_taken,
                    ] : null,
                ];

                // Only include questions if user can attempt or review
                if ($quizData['attempt_info']['can_attempt'] || ($quiz->allow_review && $bestAttempt)) {
                    $quizData['questions'] = $quiz->questions->map(function ($question) {
                        return [
                            'id' => $question->id,
                            'question' => $question->question,
                            'type' => $question->type,
                            'points' => $question->points,
                            'order' => $question->order,
                            'options' => $question->options,
                            'explanation' => $question->explanation,
                            // Don't include correct_answer for security
                        ];
                    });
                }
            }

            // Add quiz statistics for instructors/admins
            if ($user && ($user->isInstructor() || $user->isAdmin())) {
                $quizData['statistics'] = $this->quizService->getQuizStatistics($quiz);
                
                // Include all questions with answers for instructors/admins
                $quizData['questions'] = $quiz->questions->map(function ($question) {
                    return [
                        'id' => $question->id,
                        'question' => $question->question,
                        'type' => $question->type,
                        'points' => $question->points,
                        'order' => $question->order,
                        'options' => $question->options,
                        'correct_answer' => $question->correct_answer,
                        'explanation' => $question->explanation,
                    ];
                });
            }

            return response()->json([
                'quiz' => $quizData,
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse(
                'quiz_fetch_failed',
                'Failed to fetch quiz details',
                500
            );
        }
    }

    /**
     * Start a new quiz attempt
     */
    public function startAttempt(Request $request, Quiz $quiz): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStudent()) {
            return $this->forbiddenResponse('Only students can attempt quizzes');
        }

        try {
            // Check if user can attempt this quiz
            if (!$this->quizService->canUserAttemptQuiz($user, $quiz)) {
                return $this->errorResponse(
                    'attempt_not_allowed',
                    'You have reached the maximum number of attempts for this quiz',
                    400
                );
            }

            $attempt = $this->quizService->startQuizAttempt($user, $quiz);

            // Get questions for the attempt (randomized if needed)
            $questions = $this->quizService->getQuestionsForAttempt($attempt);

            return response()->json([
                'message' => 'Quiz attempt started successfully',
                'attempt' => [
                    'id' => $attempt->id,
                    'quiz_id' => $quiz->id,
                    'started_at' => $attempt->started_at->toISOString(),
                    'time_limit' => $quiz->time_limit,
                    'expires_at' => $attempt->expires_at?->toISOString(),
                ],
                'quiz' => [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'instructions' => $quiz->instructions,
                    'time_limit' => $quiz->time_limit,
                    'total_points' => $questions->sum('points'),
                ],
                'questions' => $questions->map(function ($question) {
                    return [
                        'id' => $question->id,
                        'question' => $question->question,
                        'type' => $question->type,
                        'points' => $question->points,
                        'options' => $question->options,
                        // Don't include correct_answer or explanation during attempt
                    ];
                }),
                'timestamp' => now()->toISOString()
            ], 201);

        } catch (QuizException $e) {
            return $this->errorResponse(
                'quiz_attempt_failed',
                $e->getMessage(),
                400
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'quiz_attempt_error',
                'An error occurred while starting the quiz attempt',
                500
            );
        }
    }

    /**
     * Submit quiz attempt answers
     */
    public function submitAttempt(Request $request, Quiz $quiz): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStudent()) {
            return $this->forbiddenResponse('Only students can submit quiz attempts');
        }

        $validator = Validator::make($request->all(), [
            'attempt_id' => 'required|integer|exists:quiz_attempts,id',
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|integer|exists:quiz_questions,id',
            'answers.*.answer' => 'required',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors()->toArray());
        }

        try {
            $attemptId = $request->get('attempt_id');
            $answers = $request->get('answers');

            // Verify the attempt belongs to the user and quiz
            $attempt = QuizAttempt::where('id', $attemptId)
                ->where('user_id', $user->id)
                ->where('quiz_id', $quiz->id)
                ->where('completed_at', null)
                ->first();

            if (!$attempt) {
                return $this->errorResponse(
                    'attempt_not_found',
                    'Quiz attempt not found or already completed',
                    404
                );
            }

            $result = $this->quizService->submitQuizAttempt($attempt, $answers);

            $responseData = [
                'message' => 'Quiz submitted successfully',
                'attempt' => [
                    'id' => $attempt->id,
                    'score' => $result['score'],
                    'percentage' => $result['percentage'],
                    'passed' => $result['passed'],
                    'completed_at' => $attempt->fresh()->completed_at->toISOString(),
                    'time_taken' => $attempt->fresh()->time_taken,
                ],
                'quiz' => [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'passing_score' => $quiz->passing_score,
                    'coin_reward' => $quiz->coin_reward,
                ],
                'results' => [
                    'total_questions' => $result['total_questions'],
                    'correct_answers' => $result['correct_answers'],
                    'score' => $result['score'],
                    'percentage' => $result['percentage'],
                    'passed' => $result['passed'],
                    'coins_earned' => $result['coins_earned'],
                ],
                'user_stats' => [
                    'new_coin_balance' => $user->fresh()->getCurrentCoinBalance(),
                    'attempts_remaining' => max(0, $quiz->max_attempts - $user->quizAttempts()->where('quiz_id', $quiz->id)->count()),
                ],
                'timestamp' => now()->toISOString()
            ];

            // Include detailed results if quiz allows immediate results
            if ($quiz->show_results_immediately) {
                $responseData['detailed_results'] = $result['question_results'];
            }

            return response()->json($responseData);

        } catch (QuizException $e) {
            return $this->errorResponse(
                'quiz_submission_failed',
                $e->getMessage(),
                400
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'quiz_submission_error',
                'An error occurred while submitting the quiz',
                500
            );
        }
    }

    /**
     * Get quiz attempt results (for review)
     */
    public function getAttemptResults(Request $request, Quiz $quiz, QuizAttempt $attempt): JsonResponse
    {
        $user = $request->user();

        // Verify access
        if ($user->isStudent() && $attempt->user_id !== $user->id) {
            return $this->forbiddenResponse('You can only view your own quiz attempts');
        }

        if (!$quiz->allow_review && $user->isStudent()) {
            return $this->forbiddenResponse('Review is not allowed for this quiz');
        }

        try {
            $attempt->load(['quiz.questions', 'user']);

            $attemptData = [
                'id' => $attempt->id,
                'quiz' => [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'passing_score' => $quiz->passing_score,
                ],
                'user' => [
                    'id' => $attempt->user->id,
                    'name' => $attempt->user->name,
                ],
                'started_at' => $attempt->started_at->toISOString(),
                'completed_at' => $attempt->completed_at?->toISOString(),
                'time_taken' => $attempt->time_taken,
                'score' => $attempt->score,
                'percentage' => $attempt->percentage,
                'passed' => $attempt->passed,
                'coins_awarded' => $attempt->coins_awarded,
                'answers' => $attempt->answers,
                'question_results' => $attempt->question_results,
            ];

            // Include questions with explanations for review
            if ($quiz->allow_review || !$user->isStudent()) {
                $attemptData['questions'] = $quiz->questions->map(function ($question) use ($attempt) {
                    $userAnswer = collect($attempt->answers)->firstWhere('question_id', $question->id);
                    $questionResult = collect($attempt->question_results)->firstWhere('question_id', $question->id);

                    return [
                        'id' => $question->id,
                        'question' => $question->question,
                        'type' => $question->type,
                        'points' => $question->points,
                        'options' => $question->options,
                        'correct_answer' => $question->correct_answer,
                        'explanation' => $question->explanation,
                        'user_answer' => $userAnswer['answer'] ?? null,
                        'is_correct' => $questionResult['is_correct'] ?? false,
                        'points_earned' => $questionResult['points_earned'] ?? 0,
                    ];
                });
            }

            return response()->json([
                'attempt' => $attemptData,
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse(
                'attempt_results_fetch_failed',
                'Failed to fetch attempt results',
                500
            );
        }
    }

    /**
     * Get quiz statistics (for instructors/admins)
     */
    public function statistics(Request $request, Quiz $quiz): JsonResponse
    {
        $user = $request->user();

        if (!$user->isInstructor() && !$user->isAdmin()) {
            return $this->forbiddenResponse('Access denied');
        }

        try {
            $statistics = $this->quizService->getQuizStatistics($quiz);
            
            // Get detailed attempt data
            $attempts = $quiz->attempts()
                ->with(['user:id,name,email'])
                ->whereNotNull('completed_at')
                ->orderBy('completed_at', 'desc')
                ->get();

            $attemptDetails = $attempts->map(function ($attempt) {
                return [
                    'id' => $attempt->id,
                    'user' => [
                        'id' => $attempt->user->id,
                        'name' => $attempt->user->name,
                        'email' => $attempt->user->email,
                    ],
                    'started_at' => $attempt->started_at->toISOString(),
                    'completed_at' => $attempt->completed_at->toISOString(),
                    'time_taken' => $attempt->time_taken,
                    'score' => $attempt->score,
                    'percentage' => $attempt->percentage,
                    'passed' => $attempt->passed,
                    'coins_awarded' => $attempt->coins_awarded,
                ];
            });

            return response()->json([
                'quiz' => [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'week_number' => $quiz->week->week_number,
                    'passing_score' => $quiz->passing_score,
                    'max_attempts' => $quiz->max_attempts,
                    'coin_reward' => $quiz->coin_reward,
                ],
                'statistics' => $statistics,
                'attempts' => $attemptDetails,
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse(
                'quiz_statistics_fetch_failed',
                'Failed to fetch quiz statistics',
                500
            );
        }
    }
}