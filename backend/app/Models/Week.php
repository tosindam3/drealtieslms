<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Week extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'cohort_id',
        'week_number',
        'title',
        'description',
        'thumbnail_url',
        'unlock_rules',
        'is_free',
        'drip_days',
        'min_completion_percentage',
        'min_coins_to_unlock_next',
        'deadline_at',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'unlock_rules' => 'array',
            'is_free' => 'boolean',
            'drip_days' => 'integer',
            'deadline_at' => 'date',
        ];
    }

    /**
     * Get the cohort this week belongs to
     */
    public function cohort(): BelongsTo
    {
        return $this->belongsTo(Cohort::class);
    }

    /**
     * Get the modules for this week
     */
    public function modules(): HasMany
    {
        return $this->hasMany(Module::class)->orderBy('order');
    }

    /**
     * Get the lessons for this week through modules
     */
    public function lessons()
    {
        return $this->hasManyThrough(Lesson::class, Module::class);
    }

    /**
     * Get the quizzes for this week
     */
    public function quizzes(): HasMany
    {
        return $this->hasMany(Quiz::class);
    }

    /**
     * Get the assignments for this week
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    /**
     * Get the live classes for this week
     */
    public function liveClasses(): HasMany
    {
        return $this->hasMany(LiveClass::class);
    }

    /**
     * Get user progress for this week
     */
    public function userProgress(): HasMany
    {
        return $this->hasMany(UserProgress::class);
    }

    /**
     * Check if this is the first week
     */
    public function isFirstWeek(): bool
    {
        return $this->week_number === 0;
    }

    /**
     * Get the previous week
     */
    public function getPreviousWeek(): ?Week
    {
        if ($this->isFirstWeek()) {
            return null;
        }

        return $this->cohort->weeks()
                    ->where('week_number', $this->week_number - 1)
                    ->first();
    }

    /**
     * Get the next week
     */
    public function getNextWeek(): ?Week
    {
        return $this->cohort->weeks()
                    ->where('week_number', $this->week_number + 1)
                    ->first();
    }

    /**
     * Get default unlock rules structure
     */
    public static function getDefaultUnlockRules(): array
    {
        return [
            'required_completions' => [
                'topics' => 'all',
                'quizzes' => 'all',
                'assignments' => 'all',
                'live_classes' => 'optional'
            ],
            'min_coins' => 0,
            'custom_conditions' => []
        ];
    }

    /**
     * Check if week has deadline
     */
    public function hasDeadline(): bool
    {
        return !is_null($this->deadline_at);
    }

    /**
     * Check if deadline has passed
     */
    public function isDeadlinePassed(): bool
    {
        return $this->hasDeadline() && now()->gt($this->deadline_at);
    }

    /**
     * Get total required items count
     */
    public function getTotalRequiredItemsCount(): int
    {
        $count = 0;
        
        // Count required lessons/topics via modules
        $count += $this->lessons()->count();
        
        // Count required quizzes
        $count += $this->quizzes()->count();
        
        // Count required assignments
        $count += $this->assignments()->count();
        
        // Live classes are optional by default
        if (isset($this->unlock_rules['required_completions']['live_classes']) && 
            $this->unlock_rules['required_completions']['live_classes'] === 'all') {
            $count += $this->liveClasses()->count();
        }
        
        return $count;
    }

    /**
     * Scope for free weeks
     */
    public function scopeFree($query)
    {
        return $query->where('is_free', true);
    }

    /**
     * Scope for weeks by cohort
     */
    public function scopeForCohort($query, int $cohortId)
    {
        return $query->where('cohort_id', $cohortId);
    }
}