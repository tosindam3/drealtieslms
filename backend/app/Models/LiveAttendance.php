<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiveAttendance extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'live_attendance';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'live_class_id',
        'attended',
        'joined_at',
        'left_at',
        'absence_reason',
        'duration_minutes',
        'attendance_percentage',
        'coins_awarded',
        'attendance_data',
        'metadata',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'attended' => 'boolean',
            'joined_at' => 'datetime',
            'left_at' => 'datetime',
            'attendance_percentage' => 'decimal:2',
            'attendance_data' => 'array',
            'metadata' => 'array',
        ];
    }

    /**
     * Get the user for this attendance record
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the live class for this attendance record
     */
    public function liveClass(): BelongsTo
    {
        return $this->belongsTo(LiveClass::class);
    }

    /**
     * Calculate attendance duration and percentage
     */
    public function calculateAttendance(): void
    {
        if (!$this->joined_at || !$this->left_at) {
            return;
        }

        $durationMinutes = $this->joined_at->diffInMinutes($this->left_at);
        $classDuration = $this->liveClass->duration;
        
        $attendancePercentage = $classDuration > 0 ? 
            min(100, ($durationMinutes / $classDuration) * 100) : 0;

        $this->update([
            'duration_minutes' => $durationMinutes,
            'attendance_percentage' => $attendancePercentage,
        ]);
    }

    /**
     * Mark user as left
     */
    public function markAsLeft(): void
    {
        if (!$this->left_at) {
            $this->update(['left_at' => now()]);
            $this->calculateAttendance();
        }
    }

    /**
     * Check if attendance qualifies for coins
     */
    public function qualifiesForCoins(float $minimumPercentage = 75.0): bool
    {
        return $this->attendance_percentage >= $minimumPercentage;
    }

    /**
     * Get formatted duration
     */
    public function getFormattedDurationAttribute(): string
    {
        if ($this->duration_minutes >= 60) {
            $hours = intval($this->duration_minutes / 60);
            $minutes = $this->duration_minutes % 60;
            
            if ($minutes > 0) {
                return $hours . 'h ' . $minutes . 'm';
            }
            
            return $hours . 'h';
        }

        return $this->duration_minutes . 'm';
    }

    /**
     * Get attendance status
     */
    public function getAttendanceStatusAttribute(): string
    {
        if ($this->attendance_percentage >= 90) {
            return 'excellent';
        } elseif ($this->attendance_percentage >= 75) {
            return 'good';
        } elseif ($this->attendance_percentage >= 50) {
            return 'partial';
        } else {
            return 'minimal';
        }
    }

    /**
     * Scope for attendance by user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for attendance by live class
     */
    public function scopeForLiveClass($query, int $liveClassId)
    {
        return $query->where('live_class_id', $liveClassId);
    }

    /**
     * Scope for qualifying attendance (above minimum percentage)
     */
    public function scopeQualifying($query, float $minimumPercentage = 75.0)
    {
        return $query->where('attendance_percentage', '>=', $minimumPercentage);
    }
}