<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\CoinTransaction;
use App\Services\CoinService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Exceptions\CoinException;

class CoinController extends Controller
{
    public function __construct(
        private CoinService $coinService
    ) {}

    /**
     * Get user's current coin balance
     */
    public function balance(Request $request): JsonResponse
    {
        $user = $request->user();

        try {
            $balance = $user->getCurrentCoinBalance();

            return response()->json([
                'success' => true,
                'data' => [
                    'balance' => $balance
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve coin balance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get leaderboard data
     */
    public function leaderboard(Request $request): JsonResponse
    {
        try {
            $limit = $request->query('limit', 50);
            $scope = $request->query('scope', 'global');
            $user = $request->user();
            $cohortId = null;

            if ($scope === 'class') {
                $enrollment = $user->enrollments()->latest('enrolled_at')->first();
                $cohortId = $enrollment ? $enrollment->id : null;
            }

            $leaderboard = $this->coinService->getLeaderboard((int)$limit, $cohortId);
            $userRank = $this->coinService->getUserRank($user, $cohortId);

            return response()->json([
                'success' => true,
                'data' => [
                    'leaderboard' => $leaderboard,
                    'user_rank' => $userRank,
                    'current_user_id' => $user->id,
                    'scope' => $scope,
                    'cohort_id' => $cohortId
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve leaderboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
