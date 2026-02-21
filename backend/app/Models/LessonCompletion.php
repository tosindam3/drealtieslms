<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonCompletion extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'lesson_id',
        'started_at',
        'completed_at',
        'time_spent_seconds',
        'completion_percentage',
        'completion_data',
        'coins_awarded',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'completion_percentage' => 'decimal:2',
            'completion_data' => 'array',
        ];
    }

    /**
     * Get the user for this completion
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the lesson for this completion
     */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * Check if lesson is completed
     */
    public function isCompleted(): bool
    {
        return !is_null($this->completed_at);
    }

    /**
     * Check if user is eligible to complete this lesson based on time spent
     */
    public function isEligibleForCompletion(): bool
    {
        if (!$this->lesson) {
            return false;
        }

        $minTimeRequired = $this->lesson->min_time_required_seconds ?? 300; // 5 minutes default
        return $this->time_spent_seconds >= $minTimeRequired;
    }

    /**
     * Get time remaining until eligible for completion (in seconds)
     */
    public function getTimeRemainingForEligibility(): int
    {
        if (!$this->lesson) {
            return 0;
        }

        $minTimeRequired = $this->lesson->min_time_required_seconds ?? 300;
        $remaining = $minTimeRequired - $this->time_spent_seconds;
        return max(0, $remaining);
    }

    /**
     * Get completion data for specific key
     */
    public function getCompletionData(string $key, $default = null)
    {
        return $this->completion_data[$key] ?? $default;
    }

    /**
     * Set completion data for specific key
     */
    public function setCompletionData(string $key, $value): void
    {
        $data = $this->completion_data ?? [];
        $data[$key] = $value;
        $this->update(['completion_data' => $data]);
    }

    /**
     * Scope for completions by user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for completions by lesson
     */
    public function scopeForLesson($query, int $lessonId)
    {
        return $query->where('lesson_id', $lessonId);
    }

    /**
     * Scope for completed lessons
     */
    public function scopeCompleted($query)
    {
        return $query->whereNotNull('completed_at');
    }

    /**
     * Scope for recent completions
     */
    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('completed_at', '>=', now()->subDays($days));
    }
}
