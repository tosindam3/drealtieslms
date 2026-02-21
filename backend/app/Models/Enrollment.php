<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'cohort_id',
        'enrolled_at',
        'status',
        'completion_percentage',
        'completed_at',
        'withdrawn_at',
        'withdrawal_reason',
        'metadata',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'enrolled_at' => 'datetime',
            'completed_at' => 'datetime',
            'withdrawn_at' => 'datetime',
            'completion_percentage' => 'decimal:2',
            'metadata' => 'array',
        ];
    }

    /**
     * Enrollment status constants
     */
    public const STATUS_ACTIVE = 'active';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_DROPPED = 'dropped';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_WITHDRAWN = 'withdrawn';

    public static function getStatuses(): array
    {
        return [
            self::STATUS_ACTIVE,
            self::STATUS_COMPLETED,
            self::STATUS_DROPPED,
            self::STATUS_SUSPENDED,
            // Note: STATUS_WITHDRAWN not included in database schema
        ];
    }

    /**
     * Get the user for this enrollment
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the cohort for this enrollment
     */
    public function cohort(): BelongsTo
    {
        return $this->belongsTo(Cohort::class);
    }

    /**
     * Get the user's progress records for this enrollment
     */
    public function progress(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(UserProgress::class, 'user_id', 'user_id')
            ->where('cohort_id', $this->cohort_id);
    }

    /**
     * Get all payments for this enrollment
     */
    public function payments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Check if enrollment is active
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Check if enrollment is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Mark enrollment as completed
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'completion_percentage' => 100.00,
            'completed_at' => now(),
        ]);
    }

    /**
     * Update completion percentage
     */
    public function updateCompletionPercentage(float $percentage): void
    {
        $this->update(['completion_percentage' => min(100, max(0, $percentage))]);

        // Auto-complete if 100%
        if ($percentage >= 100 && $this->status === self::STATUS_ACTIVE) {
            $this->markAsCompleted();
        }
    }

    /**
     * Scope for active enrollments
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope for completed enrollments
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Scope for enrollments by user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for enrollments by cohort
     */
    public function scopeForCohort($query, int $cohortId)
    {
        return $query->where('cohort_id', $cohortId);
    }
}
