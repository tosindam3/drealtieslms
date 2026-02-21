<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lesson extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'module_id',
        'number',
        'title',
        'description',
        'thumbnail_url',
        'estimated_duration',
        'order',
        'status',
        'is_free',
        'lesson_blocks',
        'min_time_required_seconds',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'is_free' => 'boolean',
            'lesson_blocks' => 'array',
        ];
    }

    /**
     * Lesson status constants
     */
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_ARCHIVED = 'archived';

    public static function getStatuses(): array
    {
        return [
            self::STATUS_DRAFT,
            self::STATUS_PUBLISHED,
            self::STATUS_ARCHIVED,
        ];
    }

    /**
     * Get the module this lesson belongs to
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    /**
     * Get the topics for this lesson
     */
    public function topics(): HasMany
    {
        return $this->hasMany(Topic::class)->orderBy('order');
    }

    /**
     * Get lesson completions
     */
    public function completions(): HasMany
    {
        return $this->hasMany(LessonCompletion::class);
    }

    /**
     * Check if user has completed this lesson
     */
    public function isCompletedByUser(User $user): bool
    {
        return $this->completions()
                    ->where('user_id', $user->id)
                    ->whereNotNull('completed_at')
                    ->exists();
    }

    /**
     * Get completion for specific user
     */
    public function getCompletionForUser(User $user): ?LessonCompletion
    {
        return $this->completions()
                    ->where('user_id', $user->id)
                    ->first();
    }

    /**
     * Check if lesson is published
     */
    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    /**
     * Check if lesson is free
     */
    public function isFree(): bool
    {
        return $this->is_free || $this->module->week->is_free;
    }

    /**
     * Get formatted duration
     */
    public function getFormattedDurationAttribute(): ?string
    {
        if (!$this->estimated_duration) {
            return null;
        }

        $hours = intval($this->estimated_duration / 60);
        $minutes = $this->estimated_duration % 60;

        if ($hours > 0) {
            return $hours . 'h ' . $minutes . 'm';
        }

        return $minutes . 'm';
    }

    /**
     * Get lesson blocks by type
     */
    public function getBlocksByType(string $type): array
    {
        if (!$this->lesson_blocks) {
            return [];
        }

        return array_filter($this->lesson_blocks, function ($block) use ($type) {
            return isset($block['type']) && $block['type'] === $type;
        });
    }

    /**
     * Check if lesson has quiz blocks
     */
    public function hasQuizBlocks(): bool
    {
        return !empty($this->getBlocksByType('quiz'));
    }

    /**
     * Check if lesson has assignment blocks
     */
    public function hasAssignmentBlocks(): bool
    {
        return !empty($this->getBlocksByType('assignment'));
    }

    /**
     * Check if lesson has live blocks
     */
    public function hasLiveBlocks(): bool
    {
        return !empty($this->getBlocksByType('live'));
    }

    /**
     * Scope for published lessons
     */
    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    /**
     * Scope for free lessons
     */
    public function scopeFree($query)
    {
        return $query->where('is_free', true);
    }

    /**
     * Scope for lessons by week (through module)
     */
    public function scopeForWeek($query, int $weekId)
    {
        return $query->whereHas('module', function ($q) use ($weekId) {
            $q->where('week_id', $weekId);
        });
    }
}