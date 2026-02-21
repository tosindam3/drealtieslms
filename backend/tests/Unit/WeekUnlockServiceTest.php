<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\WeekUnlockService;
use App\Services\CoinService;
use App\Models\User;
use App\Models\Cohort;
use App\Models\Week;
use App\Models\UserProgress;
use App\Models\Lesson;
use App\Models\Topic;
use App\Models\Quiz;
use App\Models\Assignment;
use App\Models\LiveClass;
use App\Models\TopicCompletion;
use App\Models\QuizAttempt;
use App\Models\AssignmentSubmission;
use App\Models\LiveAttendance;
use App\Models\UserCoinBalance;
use App\Exceptions\WeekProgressionException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\DB;
use App\Events\WeekUnlockedEvent;

class WeekUnlockServiceTest extends TestCase
{
    use RefreshDatabase;

    private WeekUnlockService $weekUnlockService;
    private CoinService $coinService;
    private User $student;
    private Cohort $cohort;
    private Week $week1;
    private Week $week2;
    private Week $week3;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->weekUnlockService = app(WeekUnlockService::class);
        $this->coinService = app(CoinService::class);
        
        // Create test user
        $this->student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        
        // Create test cohort
        $this->cohort = Cohort::factory()->create([
            'status' => Cohort::STATUS_ACTIVE,
        ]);
        
        // Create weeks
        $this->week1 = Week::factory()->create([
            'cohort_id' => $this->cohort->id,
            'week_number' => 1,
            'unlock_rules' => [],
        ]);
        
        $this->week2 = Week::factory()->create([
            'cohort_id' => $this->cohort->id,
            'week_number' => 2,
            'unlock_rules' => [
                'min_coins' => 100,
                'required_completions' => [
                    ['type' => 'topics', 'count' => 2, 'week_number' => 1],
                    ['type' => 'quizzes', 'count' => 1, 'week_number' => 1],
                ]
            ],
        ]);
        
        $this->week3 = Week::factory()->create([
            'cohort_id' => $this->cohort->id,
            'week_number' => 3,
            'unlock_rules' => [
                'min_coins' => 200,
                'min_previous_week_progress' => 100,
            ],
        ]);
        
        // Create progress records
        UserProgress::create([
            'user_id' => $this->student->id,
            'cohort_id' => $this->cohort->id,
            'week_id' => $this->week1->id,
            'is_unlocked' => true,
            'unlocked_at' => now(),
            'completion_percentage' => 0,
        ]);
        
        UserProgress::create([
            'user_id' => $this->student->id,
            'cohort_id' => $this->cohort->id,
            'week_id' => $this->week2->id,
            'is_unlocked' => false,
            'completion_percentage' => 0,
        ]);
        
        UserProgress::create([
            'user_id' => $this->student->id,
            'cohort_id' => $this->cohort->id,
            'week_id' => $this->week3->id,
            'is_unlocked' => false,
            'completion_percentage' => 0,
        ]);
        
        // Initialize coin balance
        UserCoinBalance::create([
            'user_id' => $this->student->id,
            'total_balance' => 0,
        ]);
    }

    /** @test */
    public function it_allows_week_1_unlock_always()
    {
        $this->assertTrue($this->weekUnlockService->canUnlockWeek($this->student, $this->week1));
    }

    /** @test */
    public function it_prevents_week_unlock_when_previous_week_not_completed()
    {
        $this->assertFalse($this->weekUnlockService->canUnlockWeek($this->student, $this->week2));
    }

    /** @test */
    public function it_prevents_week_unlock_when_coin_requirements_not_met()
    {
        // Complete week 1
        $this->completeWeek($this->week1);
        
        // Still can't unlock week 2 because coin requirement not met (needs 100 coins)
        $this->assertFalse($this->weekUnlockService->canUnlockWeek($this->student, $this->week2));
    }

    /** @test */
    public function it_prevents_week_unlock_when_completion_requirements_not_met()
    {
        // Complete week 1 and give enough coins
        $this->completeWeek($this->week1);
        $this->coinService->awardCoins($this->student, 150, 'test', null, 'Test coins');
        
        // Still can't unlock because completion requirements not met
        $this->assertFalse($this->weekUnlockService->canUnlockWeek($this->student, $this->week2));
    }

    /** @test */
    public function it_allows_week_unlock_when_all_requirements_met()
    {
        // Complete week 1
        $this->completeWeek($this->week1);
        
        // Give enough coins
        $this->coinService->awardCoins($this->student, 150, 'test', null, 'Test coins');
        
        // Meet completion requirements
        $this->meetCompletionRequirements($this->week1);
        
        $this->assertTrue($this->weekUnlockService->canUnlockWeek($this->student, $this->week2));
    }

    /** @test */
    public function it_unlocks_week_successfully()
    {
        Event::fake();
        
        // Meet all requirements for week 2
        $this->completeWeek($this->week1);
        $this->coinService->awardCoins($this->student, 150, 'test', null, 'Test coins');
        $this->meetCompletionRequirements($this->week1);

        $progress = $this->weekUnlockService->unlockWeek($this->student, $this->week2);

        $this->assertInstanceOf(UserProgress::class, $progress);
        $this->assertTrue($progress->is_unlocked);
        $this->assertNotNull($progress->unlocked_at);
        
        Event::assertDispatched(WeekUnlockedEvent::class);
    }

    /** @test */
    public function it_throws_exception_when_unlock_requirements_not_met()
    {
        $this->expectException(WeekProgressionException::class);
        $this->expectExceptionMessage('Cannot unlock week 2. Requirements not met.');

        $this->weekUnlockService->unlockWeek($this->student, $this->week2);
    }

    /** @test */
    public function it_returns_existing_progress_if_already_unlocked()
    {
        // Manually unlock week 2
        $progress = UserProgress::where('user_id', $this->student->id)
            ->where('week_id', $this->week2->id)
            ->first();
        $progress->update(['is_unlocked' => true, 'unlocked_at' => now()]);

        $result = $this->weekUnlockService->unlockWeek($this->student, $this->week2);

        $this->assertEquals($progress->id, $result->id);
        $this->assertTrue($result->is_unlocked);
    }

    /** @test */
    public function it_evaluates_and_unlocks_next_week_automatically()
    {
        // Meet all requirements for week 2
        $this->completeWeek($this->week1);
        $this->coinService->awardCoins($this->student, 150, 'test', null, 'Test coins');
        $this->meetCompletionRequirements($this->week1);

        $nextProgress = $this->weekUnlockService->evaluateAndUnlockNext($this->student, $this->week1);

        $this->assertNotNull($nextProgress);
        $this->assertEquals($this->week2->id, $nextProgress->week_id);
        $this->assertTrue($nextProgress->is_unlocked);
    }

    /** @test */
    public function it_returns_null_when_next_week_requirements_not_met()
    {
        $nextProgress = $this->weekUnlockService->evaluateAndUnlockNext($this->student, $this->week1);

        $this->assertNull($nextProgress);
    }

    /** @test */
    public function it_returns_null_when_no_next_week_exists()
    {
        $lastWeek = Week::factory()->create([
            'cohort_id' => $this->cohort->id,
            'week_number' => 8,
        ]);

        $nextProgress = $this->weekUnlockService->evaluateAndUnlockNext($this->student, $lastWeek);

        $this->assertNull($nextProgress);
    }

    /** @test */
    public function it_checks_topic_completion_requirements()
    {
        $lesson = Lesson::factory()->create(['week_id' => $this->week1->id]);
        $topic1 = Topic::factory()->create(['lesson_id' => $lesson->id]);
        $topic2 = Topic::factory()->create(['lesson_id' => $lesson->id]);
        
        // Complete one topic
        TopicCompletion::create([
            'user_id' => $this->student->id,
            'topic_id' => $topic1->id,
            'completed_at' => now(),
            'coins_awarded' => 10,
        ]);
        
        $requirement = ['type' => 'topics', 'count' => 1, 'week_number' => 1];
        $this->assertTrue($this->callPrivateMethod('checkCompletionRequirement', [$this->student, $requirement]));
        
        $requirement = ['type' => 'topics', 'count' => 2, 'week_number' => 1];
        $this->assertFalse($this->callPrivateMethod('checkCompletionRequirement', [$this->student, $requirement]));
    }

    /** @test */
    public function it_checks_quiz_completion_requirements()
    {
        $quiz = Quiz::factory()->create(['week_id' => $this->week1->id]);
        
        // Create a passed quiz attempt
        QuizAttempt::create([
            'user_id' => $this->student->id,
            'quiz_id' => $quiz->id,
            'attempt_number' => 1,
            'status' => 'completed',
            'started_at' => now()->subHour(),
            'completed_at' => now()->subMinutes(30),
            'score_points' => 85,
            'total_points' => 100,
            'score_percentage' => 85.00,
            'passed' => true,
            'coins_awarded' => 25,
            'answers' => [],
        ]);
        
        $requirement = ['type' => 'quizzes', 'count' => 1, 'week_number' => 1];
        $this->assertTrue($this->callPrivateMethod('checkCompletionRequirement', [$this->student, $requirement]));
        
        $requirement = ['type' => 'quizzes', 'count' => 2, 'week_number' => 1];
        $this->assertFalse($this->callPrivateMethod('checkCompletionRequirement', [$this->student, $requirement]));
    }

    /** @test */
    public function it_checks_assignment_completion_requirements()
    {
        $assignment = Assignment::factory()->create(['week_id' => $this->week1->id]);
        
        // Create an approved assignment submission
        AssignmentSubmission::create([
            'user_id' => $this->student->id,
            'assignment_id' => $assignment->id,
            'submission_text' => 'Test submission',
            'status' => AssignmentSubmission::STATUS_APPROVED,
            'submitted_at' => now()->subDay(),
            'reviewed_at' => now()->subHours(12),
            'coins_awarded' => 50,
        ]);
        
        $requirement = ['type' => 'assignments', 'count' => 1, 'week_number' => 1];
        $this->assertTrue($this->callPrivateMethod('checkCompletionRequirement', [$this->student, $requirement]));
    }

    /** @test */
    public function it_checks_live_class_attendance_requirements()
    {
        $liveClass = LiveClass::factory()->create(['week_id' => $this->week1->id]);
        
        // Create attendance record
        DB::table('live_attendance')->insert([
            'user_id' => $this->student->id,
            'live_class_id' => $liveClass->id,
            'joined_at' => now()->subHours(2),
            'left_at' => now()->subHour(),
            'duration_minutes' => 60,
            'attendance_percentage' => 100.00,
            'coins_awarded' => 30,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        $requirement = ['type' => 'live_classes', 'count' => 1, 'week_number' => 1];
        $this->assertTrue($this->callPrivateMethod('checkCompletionRequirement', [$this->student, $requirement]));
    }

    /** @test */
    public function it_provides_unlock_requirements_summary()
    {
        // Ensure coin balance is 0 for this test by deleting and recreating
        $this->student->coinBalance()->delete();
        UserCoinBalance::create([
            'user_id' => $this->student->id,
            'total_balance' => 0,
        ]);
        
        // Clear any caches
        \Illuminate\Support\Facades\Cache::flush();
        
        $summary = $this->weekUnlockService->getUnlockRequirementsSummary($this->student, $this->week2);

        $this->assertFalse($summary['can_unlock']);
        $this->assertCount(4, $summary['requirements']); // previous_week, coins, topics, quizzes
        $this->assertEquals('Some requirements not yet met', $summary['message']);
        
        // Check specific requirements
        $requirements = collect($summary['requirements']);
        
        $previousWeekReq = $requirements->where('type', 'previous_week')->first();
        $this->assertFalse($previousWeekReq['met']);
        $this->assertEquals(0, $previousWeekReq['current_progress']);
        
        $coinReq = $requirements->where('type', 'coins')->first();
        $this->assertFalse($coinReq['met']);
        $this->assertEquals(0, $coinReq['current_balance']);
        $this->assertEquals(100, $coinReq['required_balance']);
    }

    /** @test */
    public function it_provides_week_1_summary_correctly()
    {
        $summary = $this->weekUnlockService->getUnlockRequirementsSummary($this->student, $this->week1);

        $this->assertTrue($summary['can_unlock']);
        $this->assertEmpty($summary['requirements']);
        $this->assertEquals('Week 1 is automatically unlocked', $summary['message']);
    }

    /** @test */
    public function it_recalculates_week_progress_correctly()
    {
        // Create content for week 1
        $lesson = Lesson::factory()->create(['week_id' => $this->week1->id]);
        $topic1 = Topic::factory()->create(['lesson_id' => $lesson->id]);
        $topic2 = Topic::factory()->create(['lesson_id' => $lesson->id]);
        $quiz = Quiz::factory()->create(['week_id' => $this->week1->id]);
        $assignment = Assignment::factory()->create(['week_id' => $this->week1->id]);
        
        // Complete some content
        TopicCompletion::create([
            'user_id' => $this->student->id,
            'topic_id' => $topic1->id,
            'completed_at' => now(),
            'coins_awarded' => 10,
        ]);
        
        QuizAttempt::create([
            'user_id' => $this->student->id,
            'quiz_id' => $quiz->id,
            'attempt_number' => 1,
            'status' => 'completed',
            'started_at' => now()->subHour(),
            'completed_at' => now()->subMinutes(30),
            'score_points' => 85,
            'total_points' => 100,
            'score_percentage' => 85.00,
            'passed' => true,
            'coins_awarded' => 25,
            'answers' => [],
        ]);
        
        $progress = $this->weekUnlockService->recalculateWeekProgress($this->student, $this->week1);
        
        // Should be 50% complete (1 topic + 1 quiz out of 2 topics + 1 quiz + 1 assignment = 2/4)
        $this->assertEquals(50.00, $progress->completion_percentage);
        $this->assertNull($progress->completed_at);
        
        // Complete remaining content
        TopicCompletion::create([
            'user_id' => $this->student->id,
            'topic_id' => $topic2->id,
            'completed_at' => now(),
            'coins_awarded' => 10,
        ]);
        
        AssignmentSubmission::create([
            'user_id' => $this->student->id,
            'assignment_id' => $assignment->id,
            'submission_text' => 'Test submission',
            'status' => AssignmentSubmission::STATUS_APPROVED,
            'submitted_at' => now()->subDay(),
            'reviewed_at' => now()->subHours(12),
            'coins_awarded' => 50,
        ]);
        
        $progress = $this->weekUnlockService->recalculateWeekProgress($this->student, $this->week1);
        
        // Should be 100% complete
        $this->assertEquals(100.00, $progress->completion_percentage);
        $this->assertNotNull($progress->completed_at);
    }

    /** @test */
    public function it_bulk_unlocks_weeks_for_multiple_users()
    {
        $student2 = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $student3 = User::factory()->create(['role' => User::ROLE_STUDENT]);
        
        // Create progress records for other students
        foreach ([$student2, $student3] as $student) {
            UserProgress::create([
                'user_id' => $student->id,
                'cohort_id' => $this->cohort->id,
                'week_id' => $this->week1->id,
                'is_unlocked' => false,
            ]);
            
            UserCoinBalance::create([
                'user_id' => $student->id,
                'total_balance' => 0,
            ]);
        }
        
        $results = $this->weekUnlockService->bulkUnlockWeek($this->week1, [
            $this->student->id,
            $student2->id,
            $student3->id,
        ]);
        
        $this->assertCount(3, $results);
        $this->assertTrue($results[$this->student->id]['success']);
        $this->assertTrue($results[$student2->id]['success']);
        $this->assertTrue($results[$student3->id]['success']);
    }

    /**
     * Helper method to complete a week
     */
    private function completeWeek(Week $week): void
    {
        UserProgress::where('user_id', $this->student->id)
            ->where('week_id', $week->id)
            ->update([
                'completion_percentage' => 100.00,
                'completed_at' => now(),
            ]);
    }

    /**
     * Helper method to meet completion requirements for a week
     */
    private function meetCompletionRequirements(Week $week): void
    {
        $lesson = Lesson::factory()->create(['week_id' => $week->id]);
        $topic1 = Topic::factory()->create(['lesson_id' => $lesson->id]);
        $topic2 = Topic::factory()->create(['lesson_id' => $lesson->id]);
        $quiz = Quiz::factory()->create(['week_id' => $week->id]);
        
        // Complete topics
        TopicCompletion::create([
            'user_id' => $this->student->id,
            'topic_id' => $topic1->id,
            'completed_at' => now(),
            'coins_awarded' => 10,
        ]);
        
        TopicCompletion::create([
            'user_id' => $this->student->id,
            'topic_id' => $topic2->id,
            'completed_at' => now(),
            'coins_awarded' => 10,
        ]);
        
        // Pass quiz
        QuizAttempt::create([
            'user_id' => $this->student->id,
            'quiz_id' => $quiz->id,
            'attempt_number' => 1,
            'status' => 'completed',
            'started_at' => now()->subHour(),
            'completed_at' => now()->subMinutes(30),
            'score_points' => 85,
            'total_points' => 100,
            'score_percentage' => 85.00,
            'passed' => true,
            'coins_awarded' => 25,
            'answers' => [],
        ]);
    }

    /**
     * Helper method to call private methods for testing
     */
    private function callPrivateMethod(string $methodName, array $args = [])
    {
        $reflection = new \ReflectionClass($this->weekUnlockService);
        $method = $reflection->getMethod($methodName);
        $method->setAccessible(true);
        
        return $method->invokeArgs($this->weekUnlockService, $args);
    }
}