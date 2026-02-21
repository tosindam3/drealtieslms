<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizQuestion extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'quiz_id',
        'type',
        'question_text',
        'options',
        'correct_answers',
        'points',
        'explanation',
        'order',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'options' => 'array',
            'correct_answers' => 'json',
        ];
    }

    /**
     * Question type constants
     */
    public const TYPE_MULTIPLE_CHOICE = 'multiple_choice';
    public const TYPE_SINGLE_CHOICE = 'single_choice';
    public const TYPE_TRUE_FALSE = 'true_false';
    public const TYPE_TEXT = 'text';
    public const TYPE_NUMBER = 'number';

    public static function getTypes(): array
    {
        return [
            self::TYPE_MULTIPLE_CHOICE,
            self::TYPE_SINGLE_CHOICE,
            self::TYPE_TRUE_FALSE,
            self::TYPE_TEXT,
            self::TYPE_NUMBER,
        ];
    }

    /**
     * Get the quiz this question belongs to
     */
    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    /**
     * Check if answer is correct
     */
    public function isAnswerCorrect($answer): bool
    {
        if ($this->type === self::TYPE_MULTIPLE_CHOICE || $this->type === self::TYPE_SINGLE_CHOICE) {
            return in_array($answer, $this->correct_answers);
        }

        if ($this->type === self::TYPE_TRUE_FALSE) {
            return in_array($answer, $this->correct_answers);
        }

        if ($this->type === self::TYPE_TEXT || $this->type === self::TYPE_NUMBER) {
            // For text/number answer, we'll do case-insensitive comparison
            $correctAnswers = array_map('strtolower', $this->correct_answers);
            return in_array(strtolower(trim($answer)), $correctAnswers);
        }

        return false;
    }

    /**
     * Get formatted correct answers for display
     */
    public function getFormattedCorrectAnswersAttribute(): string
    {
        if ($this->type === self::TYPE_MULTIPLE_CHOICE) {
            $correctOptions = [];
            foreach ($this->correct_answers as $correctId) {
                $option = collect($this->options)->firstWhere('id', $correctId);
                if ($option) {
                    $correctOptions[] = $option['text'];
                }
            }
            return implode(', ', $correctOptions);
        }

        return implode(', ', $this->correct_answers);
    }

    /**
     * Scope for questions by quiz
     */
    public function scopeForQuiz($query, int $quizId)
    {
        return $query->where('quiz_id', $quizId);
    }

    /**
     * Scope for questions by type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}