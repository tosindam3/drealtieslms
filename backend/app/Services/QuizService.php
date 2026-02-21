<?php

namespace App\Services;

use App\Models\User;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\UserProgress;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Events\QuizCompletedEvent;
use App\Events\QuizPassedEvent;
use App\Exceptions\QuizException;

class QuizService
{
    public function __construct(
        private CoinService $coinService,
        private WeekUnlockService $weekUnlockService
    ) {}

    /**
     * Start a new quiz attempt
     */
    public function startAttempt(User $user, Quiz $quiz): QuizAttempt
    {
        // Validate attempt eligibility
        $this->validateAttemptEligibility($user, $quiz);

        return DB::transaction(function () use ($user, $quiz) {
            $attemptNumber = $this->getNextAttemptNumber($user, $quiz);

            $attempt = QuizAttempt::create([
                'user_id' => $user->id,
                'quiz_id' => $quiz->id,
                'attempt_number' => $attemptNumber,
                'started_at' => now(),
                'status' => QuizAttempt::STATUS_IN_PROGRESS,
                'answers' => [],
                'results' => [],
            ]);

            // Clear relevant caches
            $this->clearQuizCaches($user->id, $quiz->id);

            return $attempt;
        });
    }

    /**
     * Submit quiz attempt with answers
     */
    public function submitAttempt(User $user, Quiz $quiz, array $answers): QuizAttempt
    {
        $attempt = $this->getCurrentAttempt($user, $quiz);
        
        if (!$attempt) {
            throw new QuizException('No active quiz attempt found');
        }

        return DB::transaction(function () use ($attempt, $answers, $user, $quiz) {
            // Calculate score
            $scoreData = $this->calculateScore($quiz, $answers);
            
            // Update attempt
            $attempt->update([
                'answers' => $answers,
                'score_points' => $scoreData['score'],
                'total_points' => $scoreData['max_score'],
                'score_percentage' => $scoreData['percentage'],
                'passed' => $scoreData['percentage'] >= $quiz->passing_score,
                'completed_at' => now(),
                'status' => QuizAttempt::STATUS_COMPLETED,
                'results' => $this->generateFeedback($quiz, $answers, $scoreData),
            ]);

            // Award coins if passed
            if ($attempt->passed) {
                $this->awardQuizCoins($user, $quiz, $attempt);
            }

            // Update week progress
            $this->updateWeekProgress($user, $quiz);

            // Clear caches
            $this->clearQuizCaches($user->id, $quiz->id);

            // Dispatch events
            event(new QuizCompletedEvent($user, $quiz, $attempt));
            
            if ($attempt->passed) {
                event(new QuizPassedEvent($user, $quiz, $attempt));
            }

            return $attempt;
        });
    }

    /**
     * Get user's quiz attempts
     */
    public function getUserAttempts(User $user, Quiz $quiz): \Illuminate\Database\Eloquent\Collection
    {
        return QuizAttempt::where('user_id', $user->id)
                         ->where('quiz_id', $quiz->id)
                         ->orderBy('attempt_number')
                         ->get();
    }

    /**
     * Get user's best attempt
     */
    public function getBestAttempt(User $user, Quiz $quiz): ?QuizAttempt
    {
        return QuizAttempt::where('user_id', $user->id)
                         ->where('quiz_id', $quiz->id)
                         ->where('status', QuizAttempt::STATUS_COMPLETED)
                         ->orderBy('score_percentage', 'desc')
                         ->orderBy('completed_at', 'asc') // Earlier attempt wins in case of tie
                         ->first();
    }

    /**
     * Check if user has passed the quiz
     */
    public function hasUserPassed(User $user, Quiz $quiz): bool
    {
        $bestAttempt = $this->getBestAttempt($user, $quiz);
        return $bestAttempt && $bestAttempt->passed;
    }

    /**
     * Get remaining attempts for user
     */
    public function getRemainingAttempts(User $user, Quiz $quiz): int
    {
        if ($quiz->max_attempts === null) {
            return PHP_INT_MAX; // Unlimited attempts
        }

        $usedAttempts = QuizAttempt::where('user_id', $user->id)
                                  ->where('quiz_id', $quiz->id)
                                  ->count();

        return max(0, $quiz->max_attempts - $usedAttempts);
    }

    /**
     * Validate if user can start a new attempt
     */
    private function validateAttemptEligibility(User $user, Quiz $quiz): void
    {
        // Check if user has access to the week
        $weekProgress = UserProgress::where('user_id', $user->id)
                                   ->where('week_id', $quiz->week_id)
                                   ->first();

        if (!$weekProgress || !$weekProgress->is_unlocked) {
            throw new QuizException('Week must be unlocked to access this quiz');
        }

        // Check if user has already passed
        if ($this->hasUserPassed($user, $quiz)) {
            throw new QuizException('Quiz already passed');
        }

        // Check remaining attempts
        if ($this->getRemainingAttempts($user, $quiz) <= 0) {
            throw new QuizException('Maximum attempts exceeded');
        }

        // Check if there's an active attempt
        $activeAttempt = $this->getCurrentAttempt($user, $quiz);
        if ($activeAttempt) {
            throw new QuizException('Complete current attempt before starting a new one');
        }
    }

    /**
     * Get current active attempt
     */
    private function getCurrentAttempt(User $user, Quiz $quiz): ?QuizAttempt
    {
        return QuizAttempt::where('user_id', $user->id)
                         ->where('quiz_id', $quiz->id)
                         ->where('status', QuizAttempt::STATUS_IN_PROGRESS)
                         ->first();
    }

    /**
     * Get next attempt number
     */
    private function getNextAttemptNumber(User $user, Quiz $quiz): int
    {
        $lastAttempt = QuizAttempt::where('user_id', $user->id)
                                 ->where('quiz_id', $quiz->id)
                                 ->orderBy('attempt_number', 'desc')
                                 ->first();

        return $lastAttempt ? $lastAttempt->attempt_number + 1 : 1;
    }

    /**
     * Prepare questions data for attempt
     */
    private function prepareQuestionsData(Quiz $quiz): array
    {
        $questions = $quiz->questions()->orderBy('order')->get();
        $questionsData = [];

        foreach ($questions as $question) {
            $questionData = [
                'id' => $question->id,
                'question' => $question->question_text,
                'type' => $question->type,
                'points' => $question->points,
                'order' => $question->order,
            ];

            // Add options for multiple choice questions
            if (in_array($question->type, ['multiple_choice'])) {
                $options = $question->options ?? [];
                // Shuffle options if configured
                if ($quiz->shuffle_options) {
                    shuffle($options);
                }
                $questionData['options'] = $options;
            }

            $questionsData[] = $questionData;
        }

        // Shuffle questions if configured
        if ($quiz->shuffle_questions) {
            shuffle($questionsData);
        }

        return $questionsData;
    }

    /**
     * Calculate quiz score
     */
    private function calculateScore(Quiz $quiz, array $answers): array
    {
        $questions = $quiz->questions()->get()->keyBy('id');
        $totalScore = 0;
        $maxScore = 0;
        $correctAnswers = 0;
        $totalQuestions = $questions->count();

        foreach ($answers as $questionId => $userAnswer) {
            $question = $questions->get($questionId);
            if (!$question) {
                continue;
            }

            $maxScore += $question->points;
            $isCorrect = $this->checkAnswer($question, $userAnswer);

            if ($isCorrect) {
                $totalScore += $question->points;
                $correctAnswers++;
            }
        }

        $percentage = $maxScore > 0 ? ($totalScore / $maxScore) * 100 : 0;

        return [
            'score' => $totalScore,
            'max_score' => $maxScore,
            'percentage' => round($percentage, 2),
            'correct_answers' => $correctAnswers,
            'total_questions' => $totalQuestions,
        ];
    }

    /**
     * Check if an answer is correct
     */
    private function checkAnswer(QuizQuestion $question, $userAnswer): bool
    {
        $correctAnswers = $question->correct_answers;

        return match($question->type) {
            'multiple_choice' => is_array($userAnswer) && 
                                is_array($correctAnswers) && 
                                empty(array_diff($userAnswer, $correctAnswers)) && 
                                empty(array_diff($correctAnswers, $userAnswer)),
            
            'true_false' => in_array((bool)$userAnswer, $correctAnswers),
            
            'short_answer' => $this->checkTextAnswer($correctAnswers, $userAnswer),
            
            default => false,
        };
    }

    /**
     * Check text answer (case-insensitive, trimmed)
     */
    private function checkTextAnswer($correct, $user): bool
    {
        if (is_array($correct)) {
            // Multiple acceptable answers
            return in_array(strtolower(trim($user)), array_map('strtolower', array_map('trim', $correct)));
        }
        
        return strtolower(trim($user)) === strtolower(trim($correct));
    }

    /**
     * Check number answer (with tolerance)
     */
    private function checkNumberAnswer($correct, $user): bool
    {
        $tolerance = 0.01; // Allow small floating point differences
        return abs((float)$user - (float)$correct) <= $tolerance;
    }

    /**
     * Generate feedback for attempt
     */
    private function generateFeedback(Quiz $quiz, array $answers, array $scoreData): array
    {
        $feedback = [
            'overall' => $this->getOverallFeedback($scoreData['percentage'], $quiz->passing_score),
            'score_breakdown' => $scoreData,
            'questions' => [],
        ];

        if ($quiz->show_correct_answers) {
            $questions = $quiz->questions()->get()->keyBy('id');
            
            foreach ($answers as $questionId => $userAnswer) {
                $question = $questions->get($questionId);
                if (!$question) {
                    continue;
                }

                $isCorrect = $this->checkAnswer($question, $userAnswer);
                
                $feedback['questions'][$questionId] = [
                    'correct' => $isCorrect,
                    'user_answer' => $userAnswer,
                    'correct_answer' => $question->correct_answers,
                    'explanation' => $question->explanation,
                    'points_earned' => $isCorrect ? $question->points : 0,
                ];
            }
        }

        return $feedback;
    }

    /**
     * Get overall feedback message
     */
    private function getOverallFeedback(float $percentage, float $passingScore): string
    {
        if ($percentage >= $passingScore) {
            return match(true) {
                $percentage >= 95 => 'Excellent work! You have mastered this material.',
                $percentage >= 85 => 'Great job! You have a strong understanding of the content.',
                $percentage >= $passingScore => 'Well done! You have passed the quiz.',
                default => 'You passed! Keep up the good work.',
            };
        }

        return match(true) {
            $percentage >= 70 => 'Close! Review the material and try again.',
            $percentage >= 50 => 'You\'re getting there. Focus on the areas you missed.',
            default => 'Keep studying and try again. You can do this!',
        };
    }

    /**
     * Award coins for passing quiz
     */
    private function awardQuizCoins(User $user, Quiz $quiz, QuizAttempt $attempt): void
    {
        if ($quiz->coin_reward <= 0) {
            return;
        }

        // Check if user has already been awarded coins for this quiz
        $existingAward = $user->coinTransactions()
                             ->where('source_type', 'quiz')
                             ->where('source_id', $quiz->id)
                             ->where('transaction_type', 'earned')
                             ->exists();

        if ($existingAward) {
            return; // Already awarded
        }

        $this->coinService->awardCoins(
            $user,
            $quiz->coin_reward,
            'quiz',
            $quiz->id,
            "Passed quiz: {$quiz->title} (Score: {$attempt->score_percentage}%)"
        );
    }

    /**
     * Update week progress after quiz completion
     */
    private function updateWeekProgress(User $user, Quiz $quiz): void
    {
        try {
            $this->weekUnlockService->recalculateWeekProgress($user, $quiz->week);
        } catch (\Exception $e) {
            // Log error but don't fail the quiz submission
            logger()->error("Failed to update week progress after quiz completion: " . $e->getMessage());
        }
    }

    /**
     * Get quiz statistics for admin
     */
    public function getQuizStatistics(Quiz $quiz): array
    {
        return Cache::remember(
            "quiz_stats_{$quiz->id}",
            now()->addMinutes(30),
            function () use ($quiz) {
                $totalAttempts = QuizAttempt::where('quiz_id', $quiz->id)
                                          ->where('status', QuizAttempt::STATUS_COMPLETED)
                                          ->count();
                
                $passedAttempts = QuizAttempt::where('quiz_id', $quiz->id)
                                            ->where('status', QuizAttempt::STATUS_COMPLETED)
                                            ->where('passed', true)
                                            ->count();
                
                $averageScore = QuizAttempt::where('quiz_id', $quiz->id)
                                          ->where('status', QuizAttempt::STATUS_COMPLETED)
                                          ->avg('score_percentage');
                
                $uniqueUsers = QuizAttempt::where('quiz_id', $quiz->id)
                                         ->where('status', QuizAttempt::STATUS_COMPLETED)
                                         ->distinct('user_id')
                                         ->count();

                return [
                    'total_attempts' => $totalAttempts,
                    'passed_attempts' => $passedAttempts,
                    'pass_rate' => $totalAttempts > 0 ? round(($passedAttempts / $totalAttempts) * 100, 2) : 0,
                    'average_score' => round($averageScore ?? 0, 2),
                    'unique_users' => $uniqueUsers,
                    'score_distribution' => $this->getScoreDistribution($quiz),
                ];
            }
        );
    }

    /**
     * Get score distribution for quiz
     */
    private function getScoreDistribution(Quiz $quiz): array
    {
        $attempts = QuizAttempt::where('quiz_id', $quiz->id)
                              ->where('status', QuizAttempt::STATUS_COMPLETED)
                              ->get();

        $distribution = [
            '0-20' => 0,
            '21-40' => 0,
            '41-60' => 0,
            '61-80' => 0,
            '81-100' => 0,
        ];

        foreach ($attempts as $attempt) {
            $percentage = $attempt->score_percentage;
            
            if ($percentage <= 20) {
                $distribution['0-20']++;
            } elseif ($percentage <= 40) {
                $distribution['21-40']++;
            } elseif ($percentage <= 60) {
                $distribution['41-60']++;
            } elseif ($percentage <= 80) {
                $distribution['61-80']++;
            } else {
                $distribution['81-100']++;
            }
        }

        return $distribution;
    }

    /**
     * Clear quiz-related caches
     */
    private function clearQuizCaches(int $userId, int $quizId): void
    {
        Cache::forget("quiz_stats_{$quizId}");
        Cache::forget("user_quiz_attempts_{$userId}_{$quizId}");
    }

    /**
     * Reset quiz attempts for user (admin function)
     */
    public function resetUserAttempts(User $user, Quiz $quiz): void
    {
        DB::transaction(function () use ($user, $quiz) {
            QuizAttempt::where('user_id', $user->id)
                      ->where('quiz_id', $quiz->id)
                      ->delete();

            $this->clearQuizCaches($user->id, $quiz->id);
        });
    }
}