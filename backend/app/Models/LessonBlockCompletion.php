<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonBlockCompletion extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'lesson_id',
        'block_id',
        'block_type',
        'is_completed',
        'attempt_number',
        'score_percentage',
        'score_points',
        'total_points',
        'passed',
        'coins_awarded',
        'completion_data',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'passed' => 'boolean',
        'score_percentage' => 'decimal:2',
        'completion_data' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Get the user that owns the completion
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the lesson that owns the completion
     */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * Get the latest attempt for a user and block
     */
    public static function getLatestAttempt(int $userId, int $lessonId, string $blockId)
    {
        return static::where('user_id', $userId)
            ->where('lesson_id', $lessonId)
            ->where('block_id', $blockId)
            ->orderBy('attempt_number', 'desc')
            ->first();
    }

    /**
     * Get all attempts for a user and block
     */
    public static function getAttempts(int $userId, int $lessonId, string $blockId)
    {
        return static::where('user_id', $userId)
            ->where('lesson_id', $lessonId)
            ->where('block_id', $blockId)
            ->orderBy('attempt_number', 'asc')
            ->get();
    }

    /**
     * Check if user has passed this block
     */
    public static function hasPassed(int $userId, int $lessonId, string $blockId): bool
    {
        return static::where('user_id', $userId)
            ->where('lesson_id', $lessonId)
            ->where('block_id', $blockId)
            ->where('passed', true)
            ->exists();
    }

    /**
     * Get next attempt number
     */
    public static function getNextAttemptNumber(int $userId, int $lessonId, string $blockId): int
    {
        $lastAttempt = static::where('user_id', $userId)
            ->where('lesson_id', $lessonId)
            ->where('block_id', $blockId)
            ->max('attempt_number');

        return ($lastAttempt ?? 0) + 1;
    }
}
