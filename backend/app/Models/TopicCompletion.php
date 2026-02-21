<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TopicCompletion extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'topic_id',
        'completed_at',
        'coins_awarded',
        'completion_data',
        'started_at',
        'time_spent_seconds',
        'completion_percentage',
        'last_position_seconds',
        'completion_method',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
            'started_at' => 'datetime',
            'completion_data' => 'array',
            'completion_percentage' => 'decimal:2',
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
     * Get the topic for this completion
     */
    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
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
     * Get watch time for video topics
     */
    public function getWatchTimeAttribute(): ?int
    {
        return $this->getCompletionData('watch_time_seconds');
    }

    /**
     * Get completion method
     */
    public function getCompletionMethodAttribute(): string
    {
        return $this->getCompletionData('method', 'manual');
    }

    /**
     * Scope for completions by user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for completions by topic
     */
    public function scopeForTopic($query, int $topicId)
    {
        return $query->where('topic_id', $topicId);
    }

    /**
     * Scope for recent completions
     */
    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('completed_at', '>=', now()->subDays($days));
    }

    /**
     * Check if user is eligible to complete this topic based on time spent
     */
    public function isEligibleForCompletion(): bool
    {
        if (!$this->topic) {
            return false;
        }

        $minTimeRequired = $this->topic->min_time_required_seconds ?? 120; // 2 minutes default
        return $this->time_spent_seconds >= $minTimeRequired;
    }

    /**
     * Get time remaining until eligible for completion (in seconds)
     */
    public function getTimeRemainingForEligibility(): int
    {
        if (!$this->topic) {
            return 0;
        }

        $minTimeRequired = $this->topic->min_time_required_seconds ?? 120;
        $remaining = $minTimeRequired - $this->time_spent_seconds;
        return max(0, $remaining);
    }
}
