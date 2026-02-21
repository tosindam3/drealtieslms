<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserCoinBalance;
use App\Models\CoinTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Events\CoinAwardedEvent;

class CoinService
{
    /**
     * Award coins to a user
     */
    public function awardCoins(
        User $user,
        int $amount,
        string $sourceType,
        ?int $sourceId = null,
        ?string $description = null,
        ?array $metadata = null,
        ?User $createdBy = null
    ): CoinTransaction {
        return DB::transaction(function () use ($user, $amount, $sourceType, $sourceId, $description, $metadata, $createdBy) {
            // Create transaction record
            $transaction = CoinTransaction::create([
                'user_id' => $user->id,
                'transaction_type' => CoinTransaction::TYPE_EARNED,
                'amount' => $amount,
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'description' => $description,
                'metadata' => $metadata,
                'created_by' => $createdBy?->id,
            ]);

            // Update or create coin balance
            $balance = UserCoinBalance::firstOrCreate(
                ['user_id' => $user->id],
                ['total_balance' => 0, 'lifetime_earned' => 0, 'lifetime_spent' => 0]
            );

            $balance->addCoins($amount);

            // Clear cache
            $this->clearUserCoinCache($user->id);

            // Dispatch event for real-time updates
            event(new CoinAwardedEvent($user, $amount, $sourceType, $transaction));

            return $transaction;
        });
    }

    /**
     * Spend coins from a user's balance
     */
    public function spendCoins(
        User $user,
        int $amount,
        string $sourceType,
        ?int $sourceId = null,
        ?string $description = null,
        ?array $metadata = null
    ): ?CoinTransaction {
        return DB::transaction(function () use ($user, $amount, $sourceType, $sourceId, $description, $metadata) {
            $balance = $this->getUserCoinBalance($user);

            if (!$balance->hasSufficientBalance($amount)) {
                return null; // Insufficient balance
            }

            // Create transaction record
            $transaction = CoinTransaction::create([
                'user_id' => $user->id,
                'transaction_type' => CoinTransaction::TYPE_SPENT,
                'amount' => -$amount, // Negative for spent
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'description' => $description,
                'metadata' => $metadata,
            ]);

            // Update balance
            $balance->subtractCoins($amount);

            // Clear cache
            $this->clearUserCoinCache($user->id);

            return $transaction;
        });
    }

    /**
     * Award bonus coins
     */
    public function awardBonus(
        User $user,
        int $amount,
        string $reason,
        ?User $awardedBy = null
    ): CoinTransaction {
        return DB::transaction(function () use ($user, $amount, $reason, $awardedBy) {
            // Create transaction record with bonus type
            $transaction = CoinTransaction::create([
                'user_id' => $user->id,
                'transaction_type' => CoinTransaction::TYPE_BONUS,
                'amount' => $amount,
                'source_type' => CoinTransaction::SOURCE_BONUS,
                'source_id' => null,
                'description' => $reason,
                'metadata' => ['bonus_reason' => $reason],
                'created_by' => $awardedBy?->id,
            ]);

            // Update or create coin balance
            $balance = UserCoinBalance::firstOrCreate(
                ['user_id' => $user->id],
                ['total_balance' => 0, 'lifetime_earned' => 0, 'lifetime_spent' => 0]
            );

            $balance->addCoins($amount);

            // Clear cache
            $this->clearUserCoinCache($user->id);

            // Dispatch event for real-time updates
            event(new CoinAwardedEvent($user, $amount, CoinTransaction::SOURCE_BONUS, $transaction));

            return $transaction;
        });
    }

    /**
     * Apply penalty (remove coins)
     */
    public function applyPenalty(
        User $user,
        int $amount,
        string $reason,
        ?User $appliedBy = null
    ): CoinTransaction {
        return DB::transaction(function () use ($user, $amount, $reason, $appliedBy) {
            // Create transaction record
            $transaction = CoinTransaction::create([
                'user_id' => $user->id,
                'transaction_type' => CoinTransaction::TYPE_PENALTY,
                'amount' => -$amount, // Negative for penalty
                'source_type' => CoinTransaction::SOURCE_MANUAL,
                'description' => $reason,
                'metadata' => ['penalty_reason' => $reason],
                'created_by' => $appliedBy?->id,
            ]);

            // Update balance (ensure it doesn't go below 0)
            $balance = $this->getUserCoinBalance($user);
            $actualAmount = min($amount, $balance->total_balance);

            if ($actualAmount > 0) {
                $balance->subtractCoins($actualAmount);
            }

            // Clear cache
            $this->clearUserCoinCache($user->id);

            return $transaction;
        });
    }

    /**
     * Manual adjustment (admin only)
     */
    public function adjustBalance(
        User $user,
        int $amount,
        string $reason,
        User $adjustedBy
    ): CoinTransaction {
        return DB::transaction(function () use ($user, $amount, $reason, $adjustedBy) {
            $transactionType = $amount >= 0 ? CoinTransaction::TYPE_EARNED : CoinTransaction::TYPE_SPENT;

            // Create transaction record
            $transaction = CoinTransaction::create([
                'user_id' => $user->id,
                'transaction_type' => CoinTransaction::TYPE_ADJUSTMENT,
                'amount' => $amount,
                'source_type' => CoinTransaction::SOURCE_MANUAL,
                'description' => $reason,
                'metadata' => ['adjustment_reason' => $reason],
                'created_by' => $adjustedBy->id,
            ]);

            // Update balance
            $balance = $this->getUserCoinBalance($user);

            if ($amount > 0) {
                $balance->addCoins($amount);
            } else {
                $balance->subtractCoins(abs($amount));
            }

            // Clear cache
            $this->clearUserCoinCache($user->id);

            return $transaction;
        });
    }

    /**
     * Get user's current coin balance
     */
    public function getUserCoinBalance(User $user): UserCoinBalance
    {
        return UserCoinBalance::firstOrCreate(
            ['user_id' => $user->id],
            ['total_balance' => 0, 'lifetime_earned' => 0, 'lifetime_spent' => 0]
        );
    }

    /**
     * Get cached coin balance
     */
    public function getCachedCoinBalance(User $user): int
    {
        return Cache::remember(
            "user_coin_balance_{$user->id}",
            now()->addMinutes(30),
            fn() => $this->getUserCoinBalance($user)->total_balance
        );
    }

    /**
     * Get user's transaction history
     */
    public function getUserTransactionHistory(User $user, int $limit = 50): \Illuminate\Database\Eloquent\Collection
    {
        return CoinTransaction::forUser($user->id)
            ->with(['creator'])
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Get user's earnings by source type
     */
    public function getUserEarningsBySource(User $user): array
    {
        return CoinTransaction::forUser($user->id)
            ->positive()
            ->selectRaw('source_type, SUM(amount) as total_earned, COUNT(*) as transaction_count')
            ->groupBy('source_type')
            ->get()
            ->pluck('total_earned', 'source_type')
            ->toArray();
    }

    /**
     * Get leaderboard data
     */
    public function getLeaderboard(int $limit = 10, ?int $cohortId = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = UserCoinBalance::whereHas('user', function ($query) {
            $query->where('role', User::ROLE_STUDENT);
        });

        if ($cohortId) {
            $query->whereHas('user.enrollments', function ($q) use ($cohortId) {
                $q->where('cohort_id', $cohortId);
            });
        }

        return $query->with(['user' => function ($query) {
            $query->select('id', 'name', 'avatar_url')
                ->withCount('topicCompletions');
        }])
            ->select('user_id', 'total_balance', 'lifetime_earned')
            ->orderBy('total_balance', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get the rank of a specific user
     */
    public function getUserRank(User $user, ?int $cohortId = null): int
    {
        $balance = $this->getUserCoinBalance($user)->total_balance;

        $query = UserCoinBalance::whereHas('user', function ($q) {
            $q->where('role', User::ROLE_STUDENT);
        })
            ->where('total_balance', '>', $balance);

        if ($cohortId) {
            $query->whereHas('user.enrollments', function ($q) use ($cohortId) {
                $q->where('cohort_id', $cohortId);
            });
        }

        return $query->count() + 1;
    }

    /**
     * Check if user has sufficient balance
     */
    public function hasSufficientBalance(User $user, int $amount): bool
    {
        return $this->getCachedCoinBalance($user) >= $amount;
    }

    /**
     * Clear user's coin cache
     */
    public function clearUserCoinCache(int $userId): void
    {
        Cache::forget("user_coin_balance_{$userId}");
    }

    /**
     * Recalculate user's balance from transactions (for data integrity)
     */
    public function recalculateUserBalance(User $user): UserCoinBalance
    {
        return DB::transaction(function () use ($user) {
            $transactions = CoinTransaction::forUser($user->id)->get();

            $totalBalance = $transactions->sum('amount');
            $lifetimeEarned = $transactions->where('amount', '>', 0)->sum('amount');
            $lifetimeSpent = abs($transactions->where('amount', '<', 0)->sum('amount'));

            $balance = $this->getUserCoinBalance($user);
            $balance->update([
                'total_balance' => max(0, $totalBalance), // Ensure non-negative
                'lifetime_earned' => $lifetimeEarned,
                'lifetime_spent' => $lifetimeSpent,
            ]);

            $this->clearUserCoinCache($user->id);

            return $balance;
        });
    }

    /**
     * Get coin statistics for admin dashboard
     */
    public function getCoinStatistics(): array
    {
        return [
            'total_coins_in_circulation' => UserCoinBalance::sum('total_balance'),
            'total_coins_earned' => UserCoinBalance::sum('lifetime_earned'),
            'total_coins_spent' => UserCoinBalance::sum('lifetime_spent'),
            'total_transactions' => CoinTransaction::count(),
            'active_users_with_coins' => UserCoinBalance::where('total_balance', '>', 0)->count(),
            'top_earners' => $this->getLeaderboard(5),
            'recent_transactions' => CoinTransaction::with(['user', 'creator'])
                ->latest()
                ->limit(10)
                ->get(),
        ];
    }
}
