<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserCoinBalance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaderboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_leaderboard_endpoint_returns_data()
    {
        // Create some users with coin balances
        /** @var User $user1 */
        $user1 = User::factory()->create(['name' => 'Student One', 'role' => 'student']);
        /** @var User $user2 */
        $user2 = User::factory()->create(['name' => 'Student Two', 'role' => 'student']);

        UserCoinBalance::create([
            'user_id' => $user1->id,
            'total_balance' => 1000,
            'lifetime_earned' => 1000
        ]);

        UserCoinBalance::create([
            'user_id' => $user2->id,
            'total_balance' => 500,
            'lifetime_earned' => 500
        ]);

        $response = $this->actingAs($user1)->getJson('/api/leaderboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'leaderboard',
                    'user_rank',
                    'current_user_id'
                ]
            ]);

        $this->assertEquals(2, count($response->json('data.leaderboard')));
        $this->assertEquals(1, $response->json('data.user_rank'));
    }

    public function test_leaderboard_is_sorted_by_balance()
    {
        /** @var User $user1 */
        $user1 = User::factory()->create(['name' => 'Low', 'role' => 'student']);
        /** @var User $user2 */
        $user2 = User::factory()->create(['name' => 'High', 'role' => 'student']);

        UserCoinBalance::create(['user_id' => $user1->id, 'total_balance' => 100]);
        UserCoinBalance::create(['user_id' => $user2->id, 'total_balance' => 1000]);

        $response = $this->actingAs($user1)->getJson('/api/leaderboard');

        $this->assertEquals('High', $response->json('data.leaderboard.0.user.name'));
        $this->assertEquals(2, $response->json('data.user_rank'));
    }

    public function test_leaderboard_can_be_filtered_by_class()
    {
        /** @var User $user1 */
        $user1 = User::factory()->create(['name' => 'Class A Student', 'role' => 'student']);
        /** @var User $user2 */
        $user2 = User::factory()->create(['name' => 'Class B Student', 'role' => 'student']);
        $cohort = \App\Models\Cohort::factory()->create();

        $user1->enrollments()->attach($cohort->id, ['enrolled_at' => now(), 'status' => 'active']);

        UserCoinBalance::create(['user_id' => $user1->id, 'total_balance' => 1000, 'lifetime_earned' => 1000]);
        UserCoinBalance::create(['user_id' => $user2->id, 'total_balance' => 2000, 'lifetime_earned' => 2000]);

        // Global shows both
        $response = $this->actingAs($user1)->getJson('/api/leaderboard?scope=global');
        $response->assertStatus(200);
        $this->assertEquals(2, count($response->json('data.leaderboard')));

        // Class shows only user1
        $response = $this->actingAs($user1)->getJson('/api/leaderboard?scope=class');
        $response->assertStatus(200);
        $this->assertEquals(1, count($response->json('data.leaderboard')));
        $this->assertEquals('Class A Student', $response->json('data.leaderboard.0.user.name'));
    }
}
