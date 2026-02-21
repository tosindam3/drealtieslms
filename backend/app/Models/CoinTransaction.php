<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class CoinTransaction extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'transaction_type',
        'amount',
        'source_type',
        'source_id',
        'description',
        'metadata',
        'created_by',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    /**
     * Transaction type constants
     */
    public const TYPE_EARNED = 'earned';
    public const TYPE_SPENT = 'spent';
    public const TYPE_BONUS = 'bonus';
    public const TYPE_PENALTY = 'penalty';
    public const TYPE_ADJUSTMENT = 'adjustment';

    public static function getTypes(): array
    {
        return [
            self::TYPE_EARNED,
            self::TYPE_SPENT,
            self::TYPE_BONUS,
            self::TYPE_PENALTY,
            self::TYPE_ADJUSTMENT,
        ];
    }

    /**
     * Source type constants
     */
    public const SOURCE_TOPIC = 'topic';
    public const SOURCE_QUIZ = 'quiz';
    public const SOURCE_ASSIGNMENT = 'assignment';
    public const SOURCE_WEEK_COMPLETION = 'week_completion';
    public const SOURCE_LIVE_CLASS = 'live_class';
    public const SOURCE_MANUAL = 'manual';
    public const SOURCE_BONUS = 'bonus';

    public static function getSourceTypes(): array
    {
        return [
            self::SOURCE_TOPIC,
            self::SOURCE_QUIZ,
            self::SOURCE_ASSIGNMENT,
            self::SOURCE_WEEK_COMPLETION,
            self::SOURCE_LIVE_CLASS,
            self::SOURCE_MANUAL,
            self::SOURCE_BONUS,
        ];
    }

    /**
     * Get the user for this transaction
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who created this transaction (for manual adjustments)
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the source model (polymorphic relationship)
     */
    public function source(): MorphTo
    {
        return $this->morphTo('source', 'source_type', 'source_id');
    }

    /**
     * Check if transaction is positive (adds coins)
     */
    public function isPositive(): bool
    {
        return $this->amount > 0;
    }

    /**
     * Check if transaction is negative (removes coins)
     */
    public function isNegative(): bool
    {
        return $this->amount < 0;
    }

    /**
     * Get formatted amount with sign
     */
    public function getFormattedAmountAttribute(): string
    {
        $sign = $this->amount >= 0 ? '+' : '';
        return $sign . number_format($this->amount);
    }

    /**
     * Get transaction icon based on type
     */
    public function getIconAttribute(): string
    {
        return match($this->transaction_type) {
            self::TYPE_EARNED => '🎯',
            self::TYPE_SPENT => '💰',
            self::TYPE_BONUS => '🎁',
            self::TYPE_PENALTY => '⚠️',
            self::TYPE_ADJUSTMENT => '⚙️',
            default => '💎',
        };
    }

    /**
     * Get transaction color based on type
     */
    public function getColorAttribute(): string
    {
        return match($this->transaction_type) {
            self::TYPE_EARNED => 'text-emerald-500',
            self::TYPE_SPENT => 'text-red-500',
            self::TYPE_BONUS => 'text-purple-500',
            self::TYPE_PENALTY => 'text-orange-500',
            self::TYPE_ADJUSTMENT => 'text-blue-500',
            default => 'text-gray-500',
        };
    }

    /**
     * Get source description
     */
    public function getSourceDescriptionAttribute(): string
    {
        if ($this->description) {
            return $this->description;
        }

        return match($this->source_type) {
            self::SOURCE_TOPIC => 'Topic Completion',
            self::SOURCE_QUIZ => 'Quiz Passed',
            self::SOURCE_ASSIGNMENT => 'Assignment Approved',
            self::SOURCE_WEEK_COMPLETION => 'Week Completed',
            self::SOURCE_LIVE_CLASS => 'Live Class Attendance',
            self::SOURCE_MANUAL => 'Manual Adjustment',
            self::SOURCE_BONUS => 'Bonus Reward',
            default => 'Unknown Source',
        };
    }

    /**
     * Scope for transactions by user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for transactions by type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('transaction_type', $type);
    }

    /**
     * Scope for earned transactions
     */
    public function scopeEarned($query)
    {
        return $query->where('transaction_type', self::TYPE_EARNED);
    }

    /**
     * Scope for spent transactions
     */
    public function scopeSpent($query)
    {
        return $query->where('transaction_type', self::TYPE_SPENT);
    }

    /**
     * Scope for positive transactions
     */
    public function scopePositive($query)
    {
        return $query->where('amount', '>', 0);
    }

    /**
     * Scope for negative transactions
     */
    public function scopeNegative($query)
    {
        return $query->where('amount', '<', 0);
    }

    /**
     * Scope for transactions by source type
     */
    public function scopeFromSource($query, string $sourceType)
    {
        return $query->where('source_type', $sourceType);
    }

    /**
     * Scope for recent transactions
     */
    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }
}