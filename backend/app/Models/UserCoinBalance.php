<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCoinBalance extends Model
{
    use HasFactory;

    /**
     * The primary key for the model.
     */
    protected $primaryKey = 'user_id';

    /**
     * Indicates if the model's ID is auto-incrementing.
     */
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'total_balance',
        'lifetime_earned',
        'lifetime_spent',
        'last_updated',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'last_updated' => 'datetime',
        ];
    }

    /**
     * Get the user that owns this coin balance
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Add coins to the balance
     */
    public function addCoins(int $amount): void
    {
        $this->increment('total_balance', $amount);
        $this->increment('lifetime_earned', $amount);
        $this->touch('last_updated');
    }

    /**
     * Subtract coins from the balance
     */
    public function subtractCoins(int $amount): bool
    {
        if ($this->total_balance < $amount) {
            return false;
        }

        $this->decrement('total_balance', $amount);
        $this->increment('lifetime_spent', $amount);
        $this->touch('last_updated');

        return true;
    }

    /**
     * Check if user has sufficient balance
     */
    public function hasSufficientBalance(int $amount): bool
    {
        return $this->total_balance >= $amount;
    }

    /**
     * Get formatted balance for display
     */
    public function getFormattedBalanceAttribute(): string
    {
        return number_format($this->total_balance) . ' Dreal Coins';
    }
}