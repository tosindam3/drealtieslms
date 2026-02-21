<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Topic extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'lesson_id',
        'title',
        'description',
        'thumbnail_url',
        'order',
        'blocks',
        'coin_reward',
        'completion_rule',
        'min_time_required_seconds',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'blocks' => 'array',
            'completion_rule' => 'array',
        ];
    }

    /**
     * Get the lesson this topic belongs to
     */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * Get topic completions
     */
    public function completions(): HasMany
    {
        return $this->hasMany(TopicCompletion::class);
    }

    /**
     * Get blocks by type
     */
    public function getBlocksByType(string $type): array
    {
        if (!$this->blocks) {
            return [];
        }

        return array_filter($this->blocks, function ($block) use ($type) {
            return isset($block['type']) && $block['type'] === $type;
        });
    }

    /**
     * Check if topic has video blocks
     */
    public function hasVideoBlocks(): bool
    {
        return !empty($this->getBlocksByType('video'));
    }

    /**
     * Check if topic has text blocks
     */
    public function hasTextBlocks(): bool
    {
        return !empty($this->getBlocksByType('text'));
    }

    /**
     * Check if topic has photo blocks
     */
    public function hasPhotoBlocks(): bool
    {
        return !empty($this->getBlocksByType('photo'));
    }

    /**
     * Get default completion rule
     */
    public static function getDefaultCompletionRule(): array
    {
        return [
            'type' => 'manual',
            'auto_complete_on_video_end' => false,
            'required_watch_percentage' => 80,
        ];
    }

    /**
     * Check if user has completed this topic
     */
    public function isCompletedByUser(User $user): bool
    {
        return $this->completions()
                    ->where('user_id', $user->id)
                    ->exists();
    }

    /**
     * Get completion for specific user
     */
    public function getCompletionForUser(User $user): ?TopicCompletion
    {
        return $this->completions()
                    ->where('user_id', $user->id)
                    ->first();
    }

    /**
     * Scope for topics by lesson
     */
    public function scopeForLesson($query, int $lessonId)
    {
        return $query->where('lesson_id', $lessonId);
    }
}