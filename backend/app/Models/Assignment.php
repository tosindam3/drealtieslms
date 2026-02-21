<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Assignment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'week_id',
        'title',
        'description',
        'instructions_html',
        'max_points',
        'submission_type',
        'allowed_extensions',
        'max_file_size',
        'allow_multiple_submissions',
        'allow_late_submissions',
        'coin_reward',
        'due_date',
        'reference_assets',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'allowed_extensions' => 'array',
            'allow_multiple_submissions' => 'boolean',
            'allow_late_submissions' => 'boolean',
            'due_date' => 'datetime',
            'reference_assets' => 'array',
        ];
    }

    /**
     * Submission type constants
     */
    public const TYPE_FILE = 'file';
    public const TYPE_LINK = 'link';
    public const TYPE_TEXT = 'text';

    public static function getSubmissionTypes(): array
    {
        return [
            self::TYPE_FILE,
            self::TYPE_LINK,
            self::TYPE_TEXT,
        ];
    }

    /**
     * Get the week this assignment belongs to
     */
    public function week(): BelongsTo
    {
        return $this->belongsTo(Week::class);
    }

    /**
     * Get assignment submissions
     */
    public function submissions(): HasMany
    {
        return $this->hasMany(AssignmentSubmission::class);
    }

    /**
     * Check if assignment has deadline
     */
    public function hasDeadline(): bool
    {
        return !is_null($this->deadline);
    }

    /**
     * Check if deadline has passed
     */
    public function isDeadlinePassed(): bool
    {
        return $this->hasDeadline() && Carbon::now()->gt($this->deadline);
    }

    /**
     * Get time remaining until deadline
     */
    public function getTimeRemainingAttribute(): ?string
    {
        if (!$this->hasDeadline() || $this->isDeadlinePassed()) {
            return null;
        }

        return Carbon::now()->diffForHumans($this->deadline, true);
    }

    /**
     * Check if user can submit
     */
    public function canUserSubmit(User $user): bool
    {
        if ($this->isDeadlinePassed()) {
            return false;
        }

        if (!$this->allow_resubmission) {
            return !$this->hasUserSubmitted($user);
        }

        return true;
    }

    /**
     * Check if user has submitted
     */
    public function hasUserSubmitted(User $user): bool
    {
        return $this->submissions()
                    ->where('user_id', $user->id)
                    ->exists();
    }

    /**
     * Get user's latest submission
     */
    public function getLatestSubmissionForUser(User $user): ?AssignmentSubmission
    {
        return $this->submissions()
                    ->where('user_id', $user->id)
                    ->latest()
                    ->first();
    }

    /**
     * Get user's approved submission
     */
    public function getApprovedSubmissionForUser(User $user): ?AssignmentSubmission
    {
        return $this->submissions()
                    ->where('user_id', $user->id)
                    ->where('status', 'approved')
                    ->first();
    }

    /**
     * Check if user has approved submission
     */
    public function isCompletedByUser(User $user): bool
    {
        return $this->getApprovedSubmissionForUser($user) !== null;
    }

    /**
     * Get formatted file size limit
     */
    public function getFormattedFileSizeLimitAttribute(): ?string
    {
        if (!$this->max_file_size) {
            return null;
        }

        return $this->max_file_size . ' MB';
    }

    /**
     * Get allowed extensions as string
     */
    public function getAllowedExtensionsStringAttribute(): string
    {
        if (!$this->allowed_extensions) {
            return 'Any file type';
        }

        return implode(', ', $this->allowed_extensions);
    }

    /**
     * Scope for assignments by week
     */
    public function scopeForWeek($query, int $weekId)
    {
        return $query->where('week_id', $weekId);
    }

    /**
     * Scope for assignments with upcoming deadlines
     */
    public function scopeUpcomingDeadlines($query, int $days = 7)
    {
        return $query->whereNotNull('deadline')
                    ->where('deadline', '>', now())
                    ->where('deadline', '<=', now()->addDays($days));
    }
}