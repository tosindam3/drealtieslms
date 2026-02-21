<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssignmentSubmission extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'assignment_id',
        'status',
        'content',
        'file_urls',
        'score',
        'coins_awarded',
        'feedback',
        'reviewed_by',
        'submitted_at',
        'reviewed_at',
        'metadata',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'file_urls' => 'array',
            'metadata' => 'array',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    /**
     * Status constants
     */
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_REVISION_REQUESTED = 'revision_requested';

    public static function getStatuses(): array
    {
        return [
            self::STATUS_SUBMITTED,
            self::STATUS_APPROVED,
            self::STATUS_REJECTED,
            self::STATUS_REVISION_REQUESTED,
        ];
    }

    /**
     * Get the user for this submission
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the assignment for this submission
     */
    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }

    /**
     * Get the instructor who reviewed this submission
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Check if submission is approved
     */
    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    /**
     * Check if submission is rejected
     */
    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    /**
     * Check if submission needs revision
     */
    public function needsRevision(): bool
    {
        return $this->status === self::STATUS_REVISION_REQUESTED;
    }

    /**
     * Check if submission is pending review
     */
    public function isPendingReview(): bool
    {
        return $this->status === self::STATUS_SUBMITTED;
    }

    /**
     * Approve submission
     */
    public function approve(User $reviewer, ?int $score = null, ?string $feedback = null): void
    {
        $this->update([
            'status' => self::STATUS_APPROVED,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'score' => $score ?? $this->assignment->max_points,
            'instructor_feedback' => $feedback,
        ]);
    }

    /**
     * Reject submission
     */
    public function reject(User $reviewer, string $feedback): void
    {
        $this->update([
            'status' => self::STATUS_REJECTED,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'instructor_feedback' => $feedback,
        ]);
    }

    /**
     * Request revision
     */
    public function requestRevision(User $reviewer, string $feedback): void
    {
        $this->update([
            'status' => self::STATUS_REVISION_REQUESTED,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'instructor_feedback' => $feedback,
        ]);
    }

    /**
     * Get submission content based on type
     */
    public function getSubmissionContentAttribute(): ?string
    {
        switch ($this->assignment->submission_type) {
            case Assignment::TYPE_TEXT:
                return $this->attributes['submission_content'];
            case Assignment::TYPE_LINK:
                return $this->submission_url;
            case Assignment::TYPE_FILE:
                return $this->submission_files ? 
                    implode(', ', array_column($this->submission_files, 'name')) : 
                    null;
            default:
                return null;
        }
    }

    /**
     * Get formatted score
     */
    public function getFormattedScoreAttribute(): ?string
    {
        if (is_null($this->score)) {
            return null;
        }

        return $this->score . '/' . $this->assignment->max_points;
    }

    /**
     * Get score percentage
     */
    public function getScorePercentageAttribute(): ?float
    {
        if (is_null($this->score) || $this->assignment->max_points === 0) {
            return null;
        }

        return ($this->score / $this->assignment->max_points) * 100;
    }

    /**
     * Scope for submissions by user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for submissions by assignment
     */
    public function scopeForAssignment($query, int $assignmentId)
    {
        return $query->where('assignment_id', $assignmentId);
    }

    /**
     * Scope for pending submissions
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_SUBMITTED);
    }

    /**
     * Scope for approved submissions
     */
    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    /**
     * Scope for submissions needing revision
     */
    public function scopeNeedsRevision($query)
    {
        return $query->where('status', self::STATUS_REVISION_REQUESTED);
    }
}