<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizAttempt extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'quiz_id',
        'attempt_number',
        'status',
        'started_at',
        'completed_at',
        'score_points',
        'total_points',
        'score_percentage',
        'passed',
        'coins_awarded',
        'answers',
        'results',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'score_percentage' => 'decimal:2',
            'passed' => 'boolean',
            'answers' => 'array',
            'results' => 'array',
        ];
    }

    /**
     * Status constants
     */
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_ABANDONED = 'abandoned';

    public static function getStatuses(): array
    {
        return [
            self::STATUS_IN_PROGRESS,
            self::STATUS_COMPLETED,
            self::STATUS_ABANDONED,
        ];
    }

    /**
     * Get the user for this attempt
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the quiz for this attempt
     */
    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    /**
     * Check if attempt is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Check if attempt is in progress
     */
    public function isInProgress(): bool
    {
        return $this->status === self::STATUS_IN_PROGRESS;
    }

    /**
     * Mark attempt as completed
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);
    }

    /**
     * Calculate and update score
     */
    public function calculateScore(): void
    {
        $totalPoints = 0;
        $earnedPoints = 0;
        $results = [];

        foreach ($this->quiz->questions as $question) {
            $totalPoints += $question->points;
            $userAnswer = $this->answers[$question->id] ?? null;
            
            $isCorrect = $question->isAnswerCorrect($userAnswer);
            $pointsEarned = $isCorrect ? $question->points : 0;
            $earnedPoints += $pointsEarned;

            $results[$question->id] = [
                'user_answer' => $userAnswer,
                'correct_answers' => $question->correct_answers,
                'is_correct' => $isCorrect,
                'points_earned' => $pointsEarned,
                'points_possible' => $question->points,
            ];
        }

        $percentage = $totalPoints > 0 ? ($earnedPoints / $totalPoints) * 100 : 0;
        $passed = $percentage >= $this->quiz->passing_score;

        $this->update([
            'score_points' => $earnedPoints,
            'total_points' => $totalPoints,
            'score_percentage' => $percentage,
            'passed' => $passed,
            'results' => $results,
        ]);
    }

    /**
     * Get duration of attempt
     */
    public function getDurationAttribute(): ?int
    {
        if (!$this->started_at || !$this->completed_at) {
            return null;
        }

        return $this->started_at->diffInMinutes($this->completed_at);
    }

    /**
     * Get formatted score
     */
    public function getFormattedScoreAttribute(): string
    {
        return $this->score_points . '/' . $this->total_points . ' (' . round($this->score_percentage, 1) . '%)';
    }

    /**
     * Scope for attempts by user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for attempts by quiz
     */
    public function scopeForQuiz($query, int $quizId)
    {
        return $query->where('quiz_id', $quizId);
    }

    /**
     * Scope for completed attempts
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Scope for passed attempts
     */
    public function scopePassed($query)
    {
        return $query->where('passed', true);
    }
}