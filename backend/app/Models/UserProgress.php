<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProgress extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'cohort_id',
        'week_id',
        'completion_percentage',
        'is_unlocked',
        'unlocked_at',
        'completed_at',
        'completion_data',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'completion_percentage' => 'decimal:2',
            'is_unlocked' => 'boolean',
            'unlocked_at' => 'datetime',
            'completed_at' => 'datetime',
            'completion_data' => 'array',
        ];
    }

    /**
     * Get the user for this progress record
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the cohort for this progress record
     */
    public function cohort(): BelongsTo
    {
        return $this->belongsTo(Cohort::class);
    }

    /**
     * Get the week for this progress record
     */
    public function week(): BelongsTo
    {
        return $this->belongsTo(Week::class);
    }

    /**
     * Check if week is completed
     */
    public function isCompleted(): bool
    {
        return $this->completion_percentage >= 100;
    }

    /**
     * Mark week as unlocked
     */
    public function unlock(): void
    {
        if (!$this->is_unlocked) {
            $this->update([
                'is_unlocked' => true,
                'unlocked_at' => now(),
            ]);
        }
    }

    /**
     * Update completion percentage
     */
    public function updateCompletion(float $percentage): void
    {
        $this->update([
            'completion_percentage' => min(100, max(0, $percentage)),
            'completed_at' => $percentage >= 100 ? now() : null,
        ]);
    }

    /**
     * Get completion data for specific item type
     */
    public function getCompletionDataFor(string $type): array
    {
        return $this->completion_data[$type] ?? [];
    }

    /**
     * Update completion data for specific item
     */
    public function updateCompletionData(string $type, string $itemId, array $data): void
    {
        $completionData = $this->completion_data ?? [];
        $completionData[$type][$itemId] = $data;
        
        $this->update(['completion_data' => $completionData]);
    }

    /**
     * Get default completion data structure
     */
    public static function getDefaultCompletionData(): array
    {
        return [
            'topics' => [],
            'quizzes' => [],
            'assignments' => [],
            'live_classes' => [],
        ];
    }

    /**
     * Scope for progress by user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for progress by cohort
     */
    public function scopeForCohort($query, int $cohortId)
    {
        return $query->where('cohort_id', $cohortId);
    }

    /**
     * Scope for unlocked weeks
     */
    public function scopeUnlocked($query)
    {
        return $query->where('is_unlocked', true);
    }

    /**
     * Scope for completed weeks
     */
    public function scopeCompleted($query)
    {
        return $query->where('completion_percentage', '>=', 100);
    }
}