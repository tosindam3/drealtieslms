<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'avatar_url',
        'preferences',
        'last_active_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_active_at' => 'datetime',
            'password' => 'hashed',
            'preferences' => 'array',
        ];
    }

    /**
     * User roles enumeration
     */
    public const ROLE_ADMINISTRATOR = 'administrator';
    public const ROLE_INSTRUCTOR = 'instructor';
    public const ROLE_STUDENT = 'student';

    public static function getRoles(): array
    {
        return [
            self::ROLE_ADMINISTRATOR,
            self::ROLE_INSTRUCTOR,
            self::ROLE_STUDENT,
        ];
    }

    /**
     * Check if user has specific role
     */
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Check if user is administrator
     */
    public function isAdmin(): bool
    {
        return $this->hasRole(self::ROLE_ADMINISTRATOR);
    }

    /**
     * Check if user is instructor
     */
    public function isInstructor(): bool
    {
        return $this->hasRole(self::ROLE_INSTRUCTOR);
    }

    /**
     * Check if user is student
     */
    public function isStudent(): bool
    {
        return $this->hasRole(self::ROLE_STUDENT);
    }

    /**
     * Get the user's coin balance
     */
    public function coinBalance(): HasOne
    {
        return $this->hasOne(UserCoinBalance::class);
    }

    /**
     * Get all coin transactions for this user
     */
    public function coinTransactions(): HasMany
    {
        return $this->hasMany(CoinTransaction::class);
    }

    /**
     * Get cohorts this user is enrolled in
     */
    public function enrollments(): BelongsToMany
    {
        return $this->belongsToMany(Cohort::class, 'enrollments')
            ->withPivot(['enrolled_at', 'status', 'completion_percentage'])
            ->withTimestamps();
    }

    /**
     * Get user's progress records
     */
    public function progress(): HasMany
    {
        return $this->hasMany(UserProgress::class);
    }

    /**
     * Get user's topic completions
     */
    public function topicCompletions(): HasMany
    {
        return $this->hasMany(TopicCompletion::class);
    }

    /**
     * Get user's lesson completions
     */
    public function lessonCompletions(): HasMany
    {
        return $this->hasMany(LessonCompletion::class);
    }

    /**
     * Get user's module completions
     */
    public function moduleCompletions(): HasMany
    {
        return $this->hasMany(ModuleCompletion::class);
    }

    /**
     * Get user's quiz attempts
     */
    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    /**
     * Get user's assignment submissions
     */
    public function assignmentSubmissions(): HasMany
    {
        return $this->hasMany(AssignmentSubmission::class);
    }

    /**
     * Get user's live class attendance records
     */
    public function liveAttendance(): HasMany
    {
        return $this->hasMany(LiveAttendance::class);
    }

    /**
     * Get all payments made by this user
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Get all subscriptions for this user
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Get current coin balance
     */
    public function getCurrentCoinBalance(): int
    {
        return $this->coinBalance?->total_balance ?? 0;
    }

    /**
     * Update last active timestamp
     */
    public function updateLastActive(): void
    {
        $this->update(['last_active_at' => now()]);
    }

    /**
     * Scope for filtering by role
     */
    public function scopeWithRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope for active users (logged in within last 30 days)
     */
    public function scopeActive($query)
    {
        return $query->where('last_active_at', '>=', now()->subDays(30));
    }
}
