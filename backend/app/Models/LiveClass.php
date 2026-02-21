<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class LiveClass extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'week_id',
        'title',
        'description',
        'scheduled_at',
        'duration',
        'join_url',
        'platform',
        'tracking_enabled',
        'coin_reward',
        'status',
        'started_at',
        'ended_at',
        'started_by',
        'ended_by',
        'metadata',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'tracking_enabled' => 'boolean',
            'metadata' => 'array',
        ];
    }

    /**
     * Platform constants
     */
    public const PLATFORM_ZOOM = 'zoom';
    public const PLATFORM_TEAMS = 'teams';
    public const PLATFORM_DIRECT = 'direct';
    public const PLATFORM_YOUTUBE = 'youtube';

    public static function getPlatforms(): array
    {
        return [
            self::PLATFORM_ZOOM,
            self::PLATFORM_TEAMS,
            self::PLATFORM_DIRECT,
            self::PLATFORM_YOUTUBE,
        ];
    }

    /**
     * Status constants
     */
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_LIVE = 'live';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    public static function getStatuses(): array
    {
        return [
            self::STATUS_SCHEDULED,
            self::STATUS_LIVE,
            self::STATUS_COMPLETED,
            self::STATUS_CANCELLED,
        ];
    }

    /**
     * Get the week this live class belongs to
     */
    public function week(): BelongsTo
    {
        return $this->belongsTo(Week::class);
    }

    /**
     * Get attendance records
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(LiveAttendance::class);
    }

    /**
     * Get end time
     */
    public function getEndTimeAttribute(): Carbon
    {
        return $this->scheduled_at->addMinutes($this->duration);
    }

    /**
     * Check if class is currently live
     */
    public function isCurrentlyLive(): bool
    {
        $now = Carbon::now();
        return $now->gte($this->scheduled_at) &&
            $now->lte($this->end_time) &&
            $this->status === self::STATUS_LIVE;
    }

    /**
     * Check if class has started
     */
    public function hasStarted(): bool
    {
        return Carbon::now()->gte($this->scheduled_at);
    }

    /**
     * Check if class has ended
     */
    public function hasEnded(): bool
    {
        return Carbon::now()->gt($this->end_time);
    }

    /**
     * Check if user attended this class
     */
    public function isAttendedByUser(User $user): bool
    {
        return $this->attendance()
            ->where('user_id', $user->id)
            ->exists();
    }

    /**
     * Get attendance record for user
     */
    public function getAttendanceForUser(User $user): ?LiveAttendance
    {
        return $this->attendance()
            ->where('user_id', $user->id)
            ->first();
    }

    /**
     * Get total attendees count
     */
    public function getAttendeesCountAttribute(): int
    {
        return $this->attendance()->count();
    }

    /**
     * Get formatted duration
     */
    public function getFormattedDurationAttribute(): string
    {
        if ($this->duration >= 60) {
            $hours = intval($this->duration / 60);
            $minutes = $this->duration % 60;

            if ($minutes > 0) {
                return $hours . 'h ' . $minutes . 'm';
            }

            return $hours . 'h';
        }

        return $this->duration . 'm';
    }

    /**
     * Get time until class starts
     */
    public function getTimeUntilStartAttribute(): ?string
    {
        if ($this->hasStarted()) {
            return null;
        }

        return Carbon::now()->diffForHumans($this->scheduled_at, true);
    }

    /**
     * Auto-update status based on time
     */
    public function updateStatusBasedOnTime(): void
    {
        if ($this->status === self::STATUS_CANCELLED) {
            return;
        }

        if ($this->hasEnded() && $this->status !== self::STATUS_COMPLETED) {
            $this->update(['status' => self::STATUS_COMPLETED]);
        } elseif ($this->isCurrentlyLive() && $this->status === self::STATUS_SCHEDULED) {
            $this->update(['status' => self::STATUS_LIVE]);
        }
    }

    /**
     * Scope for live classes by week
     */
    public function scopeForWeek($query, int $weekId)
    {
        return $query->where('week_id', $weekId);
    }

    /**
     * Scope for upcoming classes
     */
    public function scopeUpcoming($query)
    {
        return $query->where('scheduled_at', '>', now())
            ->where('status', self::STATUS_SCHEDULED);
    }

    /**
     * Scope for live classes
     */
    public function scopeLive($query)
    {
        return $query->where('status', self::STATUS_LIVE);
    }

    /**
     * Scope for completed classes
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }
}
