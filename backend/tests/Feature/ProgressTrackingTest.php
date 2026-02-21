<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Cohort;
use App\Models\Week;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\Topic;
use App\Models\UserProgress;
use App\Models\TopicCompletion;
use App\Models\UserCoinBalance;
use App\Services\CoinService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ProgressTrackingTest extends TestCase
{
    use RefreshDatabase;

    private User $student;
    private Cohort $cohort;
    private Week $week;
    private Lesson $lesson;
    private Topic $topic;
    private CoinService $coinService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->coinService = app(CoinService::class);

        // Create test data
        $this->student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $this->cohort = Cohort::factory()->create();
        $this->week = Week::factory()->create(['cohort_id' => $this->cohort->id, 'week_number' => 1]);
        $module = Module::factory()->create(['week_id' => $this->week->id]);
        $this->lesson = Lesson::factory()->create(['module_id' => $module->id]);
        $this->topic = Topic::factory()->create([
            'lesson_id' => $this->lesson->id,
            'coin_reward' => 50
        ]);
    }

    public function test_user_progress_model_creates_properly()
    {
        $progress = UserProgress::create([
            'user_id' => $this->student->id,
            'cohort_id' => $this->cohort->id,
            'week_id' => $this->week->id,
            'completion_percentage' => 0.00,
            'is_unlocked' => true,
        ]);

        $this->assertDatabaseHas('user_progress', [
            'user_id' => $this->student->id,
            'week_id' => $this->week->id,
            'completion_percentage' => 0.00,
            'is_unlocked' => true,
        ]);

        $this->assertFalse($progress->isCompleted());
    }

    public function test_user_progress_completion_calculations()
    {
        $progress = UserProgress::create([
            'user_id' => $this->student->id,
            'cohort_id' => $this->cohort->id,
            'week_id' => $this->week->id,
            'completion_percentage' => 50.00,
            'is_unlocked' => true,
        ]);

        // Test partial completion
        $this->assertFalse($progress->isCompleted());

        // Test full completion
        $progress->updateCompletion(100.00);
        $this->assertTrue($progress->isCompleted());
        $this->assertNotNull($progress->completed_at);

        // Test over 100% gets capped
        $progress->updateCompletion(150.00);
        $this->assertEquals(100.00, $progress->completion_percentage);
    }

    public function test_user_progress_unlock_functionality()
    {
        $progress = UserProgress::create([
            'user_id' => $this->student->id,
            'cohort_id' => $this->cohort->id,
            'week_id' => $this->week->id,
            'is_unlocked' => false,
        ]);

        $this->assertFalse($progress->is_unlocked);
        $this->assertNull($progress->unlocked_at);

        $progress->unlock();
        $progress->refresh();

        $this->assertTrue($progress->is_unlocked);
        $this->assertNotNull($progress->unlocked_at);

        // Test that unlocking again doesn't change the timestamp
        $originalUnlockedAt = $progress->unlocked_at;
        $progress->unlock();
        $progress->refresh();

        $this->assertEquals($originalUnlockedAt, $progress->unlocked_at);
    }

    public function test_topic_completion_creates_properly()
    {
        $completion = TopicCompletion::create([
            'user_id' => $this->student->id,
            'topic_id' => $this->topic->id,
            'completed_at' => now(),
            'coins_awarded' => 50,
            'completion_data' => ['method' => 'video_watched', 'watch_time_seconds' => 300]
        ]);

        $this->assertDatabaseHas('topic_completions', [
            'user_id' => $this->student->id,
            'topic_id' => $this->topic->id,
            'coins_awarded' => 50,
        ]);

        $this->assertEquals('video_watched', $completion->completion_method);
        $this->assertEquals(300, $completion->watch_time);
    }

    public function test_coin_service_awards_coins_correctly()
    {
        $initialBalance = $this->student->getCurrentCoinBalance();
        $this->assertEquals(0, $initialBalance);

        // Award coins for topic completion
        $transaction = $this->coinService->awardCoins(
            $this->student,
            50,
            'topic',
            $this->topic->id,
            'Topic completion reward'
        );

        $this->assertDatabaseHas('coin_transactions', [
            'user_id' => $this->student->id,
            'amount' => 50,
            'source_type' => 'topic',
            'source_id' => $this->topic->id,
        ]);

        $this->assertDatabaseHas('user_coin_balances', [
            'user_id' => $this->student->id,
            'total_balance' => 50,
            'lifetime_earned' => 50,
        ]);

        $newBalance = $this->student->fresh()->getCurrentCoinBalance();
        $this->assertEquals(50, $newBalance);
    }

    public function test_coin_service_spending_works_correctly()
    {
        // First award some coins
        $this->coinService->awardCoins($this->student, 100, 'topic', $this->topic->id);

        // Try to spend coins
        $transaction = $this->coinService->spendCoins(
            $this->student,
            30,
            'purchase',
            null,
            'Test purchase'
        );

        $this->assertNotNull($transaction);
        $this->assertEquals(-30, $transaction->amount);

        $balance = $this->student->fresh()->getCurrentCoinBalance();
        $this->assertEquals(70, $balance);

        // Try to spend more than available
        $failedTransaction = $this->coinService->spendCoins($this->student, 100, 'purchase');
        $this->assertNull($failedTransaction);

        // Balance should remain unchanged
        $balance = $this->student->fresh()->getCurrentCoinBalance();
        $this->assertEquals(70, $balance);
    }

    public function test_coin_balance_calculations_are_accurate()
    {
        // Award multiple transactions
        $this->coinService->awardCoins($this->student, 50, 'topic', 1);
        $this->coinService->awardCoins($this->student, 75, 'quiz', 1);
        $this->coinService->awardCoins($this->student, 25, 'assignment', 1);

        // Spend some coins
        $this->coinService->spendCoins($this->student, 40, 'purchase');

        $balance = $this->coinService->getUserCoinBalance($this->student);

        $this->assertEquals(110, $balance->total_balance); // 150 - 40
        $this->assertEquals(150, $balance->lifetime_earned);
        $this->assertEquals(40, $balance->lifetime_spent);
    }

    public function test_coin_balance_recalculation_works()
    {
        // Create some transactions manually to simulate data inconsistency
        $this->coinService->awardCoins($this->student, 100, 'topic', 1);

        // Manually corrupt the balance
        $balance = $this->coinService->getUserCoinBalance($this->student);
        $balance->update(['total_balance' => 999, 'lifetime_earned' => 999]);

        // Recalculate should fix it
        $correctedBalance = $this->coinService->recalculateUserBalance($this->student);

        $this->assertEquals(100, $correctedBalance->total_balance);
        $this->assertEquals(100, $correctedBalance->lifetime_earned);
        $this->assertEquals(0, $correctedBalance->lifetime_spent);
    }

    public function test_progress_completion_data_management()
    {
        $progress = UserProgress::create([
            'user_id' => $this->student->id,
            'cohort_id' => $this->cohort->id,
            'week_id' => $this->week->id,
            'completion_data' => UserProgress::getDefaultCompletionData(),
        ]);

        // Test updating completion data
        $progress->updateCompletionData('topics', '1', ['completed_at' => now(), 'coins_earned' => 50]);

        $topicData = $progress->getCompletionDataFor('topics');
        $this->assertArrayHasKey('1', $topicData);
        $this->assertEquals(50, $topicData['1']['coins_earned']);

        // Test getting non-existent data
        $quizData = $progress->getCompletionDataFor('quizzes');
        $this->assertEmpty($quizData);
    }

    public function test_user_relationships_work_correctly()
    {
        // Create coin balance and transactions
        $this->coinService->awardCoins($this->student, 100, 'topic', $this->topic->id);

        // Create topic completion
        TopicCompletion::create([
            'user_id' => $this->student->id,
            'topic_id' => $this->topic->id,
            'completed_at' => now(),
            'coins_awarded' => 100,
        ]);

        // Create progress record
        UserProgress::create([
            'user_id' => $this->student->id,
            'cohort_id' => $this->cohort->id,
            'week_id' => $this->week->id,
        ]);

        // Test relationships
        $this->assertNotNull($this->student->coinBalance);
        $this->assertCount(1, $this->student->coinTransactions);
        $this->assertCount(1, $this->student->topicCompletions);
        $this->assertCount(1, $this->student->progress);

        $this->assertEquals(100, $this->student->getCurrentCoinBalance());
    }
}
