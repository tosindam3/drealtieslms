<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Carbon\Carbon;

class Cohort extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'description',
        'start_date',
        'end_date',
        'enrollment_deadline',
        'capacity',
        'enrolled_count',
        'status',
        'thumbnail_url',
        'completion_bonus_coins',
        'started_at',
        'settings',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'enrollment_deadline' => 'datetime',
            'started_at' => 'datetime',
            'settings' => 'array',
        ];
    }

    /**
     * Cohort status constants
     */
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_ARCHIVED = 'archived';

    public static function getStatuses(): array
    {
        return [
            self::STATUS_DRAFT,
            self::STATUS_PUBLISHED,
            self::STATUS_ACTIVE,
            self::STATUS_COMPLETED,
            self::STATUS_ARCHIVED,
        ];
    }

    /**
     * Get the weeks for this cohort
     */
    public function weeks(): HasMany
    {
        return $this->hasMany(Week::class)->orderBy('week_number');
    }

    /**
     * Get enrolled students
     */
    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'enrollments')
                    ->withPivot(['enrolled_at', 'status', 'completion_percentage'])
                    ->withTimestamps();
    }

    /**
     * Get active enrollments
     */
    public function activeEnrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class)->where('status', 'active');
    }

    /**
     * Get all enrollments
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * Check if cohort is full
     */
    public function isFull(): bool
    {
        return $this->enrolled_count >= $this->capacity;
    }

    /**
     * Check if cohort has started
     */
    public function hasStarted(): bool
    {
        return Carbon::now()->gte($this->start_date);
    }

    /**
     * Check if cohort has ended
     */
    public function hasEnded(): bool
    {
        return Carbon::now()->gt($this->end_date);
    }

    /**
     * Check if cohort is currently active
     */
    public function isCurrentlyActive(): bool
    {
        return $this->hasStarted() && !$this->hasEnded() && $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Check if enrollment is allowed
     */
    public function canEnroll(): bool
    {
        return !$this->isFull() && 
               !$this->hasStarted() && 
               in_array($this->status, [self::STATUS_PUBLISHED, self::STATUS_ACTIVE]);
    }

    /**
     * Get available spots
     */
    public function getAvailableSpotsAttribute(): int
    {
        return max(0, $this->capacity - $this->enrolled_count);
    }

    /**
     * Get enrollment percentage
     */
    public function getEnrollmentPercentageAttribute(): float
    {
        return $this->capacity > 0 ? ($this->enrolled_count / $this->capacity) * 100 : 0;
    }

    /**
     * Increment enrolled count
     */
    public function incrementEnrolledCount(): void
    {
        $this->increment('enrolled_count');
    }

    /**
     * Decrement enrolled count
     */
    public function decrementEnrolledCount(): void
    {
        $this->decrement('enrolled_count');
    }

    /**
     * Scope for published cohorts
     */
    public function scopePublished($query)
    {
        return $query->whereIn('status', [self::STATUS_PUBLISHED, self::STATUS_ACTIVE]);
    }

    /**
     * Scope for active cohorts
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope for enrollable cohorts
     */
    public function scopeEnrollable($query)
    {
        return $query->published()
                    ->where('start_date', '>', now())
                    ->whereRaw('enrolled_count < capacity');
    }

    /**
     * Auto-activate cohort if start date has arrived
     */
    public function checkAndActivate(): void
    {
        if ($this->status === self::STATUS_PUBLISHED && $this->hasStarted()) {
            $this->update(['status' => self::STATUS_ACTIVE]);
        }
    }
}