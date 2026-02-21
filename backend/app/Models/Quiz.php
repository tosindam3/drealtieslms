<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'week_id',
        'title',
        'description',
        'passing_score',
        'max_attempts',
        'duration',
        'coin_reward',
        'randomize_questions',
        'show_results_immediately',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'randomize_questions' => 'boolean',
            'show_results_immediately' => 'boolean',
        ];
    }

    /**
     * Get the week this quiz belongs to
     */
    public function week(): BelongsTo
    {
        return $this->belongsTo(Week::class);
    }

    /**
     * Get the questions for this quiz
     */
    public function questions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class)->orderBy('order');
    }

    /**
     * Get quiz attempts
     */
    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    /**
     * Get total possible points
     */
    public function getTotalPointsAttribute(): int
    {
        return $this->questions()->sum('points');
    }

    /**
     * Get passing points threshold
     */
    public function getPassingPointsAttribute(): int
    {
        return ceil(($this->passing_score / 100) * $this->total_points);
    }

    /**
     * Check if user has attempts remaining
     */
    public function hasAttemptsRemaining(User $user): bool
    {
        // If max_attempts is null, unlimited attempts are allowed
        if ($this->max_attempts === null) {
            return true;
        }
        
        $attemptCount = $this->attempts()
                            ->where('user_id', $user->id)
                            ->count();
        
        return $attemptCount < $this->max_attempts;
    }

    /**
     * Get user's best score
     */
    public function getBestScoreForUser(User $user): ?int
    {
        return $this->attempts()
                    ->where('user_id', $user->id)
                    ->where('status', 'completed')
                    ->max('score_percentage');
    }

    /**
     * Check if user has passed this quiz
     */
    public function isPassedByUser(User $user): bool
    {
        $bestScore = $this->getBestScoreForUser($user);
        return $bestScore && $bestScore >= $this->passing_score;
    }

    /**
     * Get user's attempts count
     */
    public function getAttemptsCountForUser(User $user): int
    {
        return $this->attempts()
                    ->where('user_id', $user->id)
                    ->count();
    }

    /**
     * Get formatted duration
     */
    public function getFormattedDurationAttribute(): ?string
    {
        if (!$this->duration) {
            return null;
        }

        if ($this->duration >= 60) {
            $hours = intval($this->duration / 60);
            $minutes = $this->duration % 60;
            return $hours . 'h ' . $minutes . 'm';
        }

        return $this->duration . 'm';
    }

    /**
     * Scope for quizzes by week
     */
    public function scopeForWeek($query, int $weekId)
    {
        return $query->where('week_id', $weekId);
    }
}