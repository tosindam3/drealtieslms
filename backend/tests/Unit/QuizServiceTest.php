<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\Week;
use App\Models\Cohort;
use App\Models\UserProgress;
use App\Services\QuizService;
use App\Services\CoinService;
use App\Services\WeekUnlockService;
use App\Exceptions\QuizException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use App\Events\QuizCompletedEvent;
use App\Events\QuizPassedEvent;

class QuizServiceTest extends TestCase
{
    use RefreshDatabase;

    private QuizService $quizService;
    private User $student;
    private Quiz $quiz;
    private Week $week;
    private Cohort $cohort;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->quizService = app(QuizService::class);
        
        // Create test data
        $this->cohort = Cohort::factory()->create(['status' => 'active']);
        $this->week = Week::factory()->create(['cohort_id' => $this->cohort->id]);
        $this->student = User::factory()->create(['role' => 'student']);
        $this->quiz = Quiz::factory()->create([
            'week_id' => $this->week->id,
            'passing_score' => 70,
            'max_attempts' => 3,
            'coin_reward' => 50,
        ]);

        // Create quiz questions
        QuizQuestion::factory()->create([
            'quiz_id' => $this->quiz->id,
            'question_text' => 'What is 2+2?',
            'type' => 'multiple_choice',
            'options' => ['2', '3', '4', '5'],
            'correct_answers' => ['4'],
            'points' => 10,
            'order' => 1,
        ]);

        QuizQuestion::factory()->create([
            'quiz_id' => $this->quiz->id,
            'question_text' => 'Is the sky blue?',
            'type' => 'true_false',
            'correct_answers' => [true],
            'points' => 10,
            'order' => 2,
        ]);

        // Unlock week for student
        UserProgress::factory()->create([
            'user_id' => $this->student->id,
            'week_id' => $this->week->id,
            'is_unlocked' => true,
        ]);
    }

    /** @test */
    public function it_starts_quiz_attempt_successfully()
    {
        $attempt = $this->quizService->startAttempt($this->student, $this->quiz);

        $this->assertInstanceOf(QuizAttempt::class, $attempt);
        $this->assertEquals($this->student->id, $attempt->user_id);
        $this->assertEquals($this->quiz->id, $attempt->quiz_id);
        $this->assertEquals(1, $attempt->attempt_number);
        $this->assertEquals(QuizAttempt::STATUS_IN_PROGRESS, $attempt->status);
        $this->assertNotNull($attempt->started_at);
        $this->assertIsArray($attempt->results);
    }

    /** @test */
    public function it_prevents_quiz_attempt_when_week_not_unlocked()
    {
        // Lock the week
        UserProgress::where('user_id', $this->student->id)
                   ->where('week_id', $this->week->id)
                   ->update(['is_unlocked' => false]);

        $this->expectException(QuizException::class);
        $this->expectExceptionMessage('Week must be unlocked to access this quiz');

        $this->quizService->startAttempt($this->student, $this->quiz);
    }

    /** @test */
    public function it_prevents_quiz_attempt_when_already_passed()
    {
        // Create a passed attempt
        QuizAttempt::factory()->create([
            'user_id' => $this->student->id,
            'quiz_id' => $this->quiz->id,
            'status' => QuizAttempt::STATUS_COMPLETED,
            'passed' => true,
            'score_percentage' => 85,
        ]);

        $this->expectException(QuizException::class);
        $this->expectExceptionMessage('Quiz already passed');

        $this->quizService->startAttempt($this->student, $this->quiz);
    }

    /** @test */
    public function it_prevents_quiz_attempt_when_max_attempts_exceeded()
    {
        // Create 3 failed attempts (max_attempts = 3)
        for ($i = 1; $i <= 3; $i++) {
            QuizAttempt::factory()->create([
                'user_id' => $this->student->id,
                'quiz_id' => $this->quiz->id,
                'attempt_number' => $i,
                'status' => QuizAttempt::STATUS_COMPLETED,
                'passed' => false,
            ]);
        }

        $this->expectException(QuizException::class);
        $this->expectExceptionMessage('Maximum attempts exceeded');

        $this->quizService->startAttempt($this->student, $this->quiz);
    }

    /** @test */
    public function it_prevents_new_attempt_when_one_is_in_progress()
    {
        // Create an in-progress attempt
        QuizAttempt::factory()->create([
            'user_id' => $this->student->id,
            'quiz_id' => $this->quiz->id,
            'status' => QuizAttempt::STATUS_IN_PROGRESS,
        ]);

        $this->expectException(QuizException::class);
        $this->expectExceptionMessage('Complete current attempt before starting a new one');

        $this->quizService->startAttempt($this->student, $this->quiz);
    }

    /** @test */
    public function it_submits_quiz_attempt_with_correct_answers()
    {
        Event::fake();

        $attempt = $this->quizService->startAttempt($this->student, $this->quiz);
        
        $answers = [
            $this->quiz->questions[0]->id => ['4'], // Multiple choice answer as array
            $this->quiz->questions[1]->id => true,
        ];

        $submittedAttempt = $this->quizService->submitAttempt($this->student, $this->quiz, $answers);

        $this->assertEquals(QuizAttempt::STATUS_COMPLETED, $submittedAttempt->status);
        $this->assertEquals(20, $submittedAttempt->score_points); // Both questions correct (10+10)
        $this->assertEquals(20, $submittedAttempt->total_points);
        $this->assertEquals(100, $submittedAttempt->score_percentage);
        $this->assertTrue($submittedAttempt->passed);
        $this->assertNotNull($submittedAttempt->completed_at);

        Event::assertDispatched(QuizCompletedEvent::class);
        Event::assertDispatched(QuizPassedEvent::class);
    }

    /** @test */
    public function it_submits_quiz_attempt_with_incorrect_answers()
    {
        Event::fake();

        $attempt = $this->quizService->startAttempt($this->student, $this->quiz);
        
        $answers = [
            $this->quiz->questions[0]->id => ['5'], // Wrong answer - multiple choice needs array
            $this->quiz->questions[1]->id => false, // Wrong answer
        ];

        $submittedAttempt = $this->quizService->submitAttempt($this->student, $this->quiz, $answers);

        $this->assertEquals(QuizAttempt::STATUS_COMPLETED, $submittedAttempt->status);
        $this->assertEquals(0, $submittedAttempt->score_points);
        $this->assertEquals(20, $submittedAttempt->total_points);
        $this->assertEquals(0, $submittedAttempt->score_percentage);
        $this->assertFalse($submittedAttempt->passed);

        Event::assertDispatched(QuizCompletedEvent::class);
        Event::assertNotDispatched(QuizPassedEvent::class);
    }

    /** @test */
    public function it_tracks_highest_score_across_attempts()
    {
        // First attempt - 50% score
        $attempt1 = $this->quizService->startAttempt($this->student, $this->quiz);
        $answers1 = [
            $this->quiz->questions[0]->id => ['4'], // Correct - multiple choice needs array
            $this->quiz->questions[1]->id => false, // Wrong
        ];
        $this->quizService->submitAttempt($this->student, $this->quiz, $answers1);

        // Second attempt - 100% score
        $attempt2 = $this->quizService->startAttempt($this->student, $this->quiz);
        $answers2 = [
            $this->quiz->questions[0]->id => ['4'], // Correct - multiple choice needs array
            $this->quiz->questions[1]->id => true, // Correct
        ];
        $this->quizService->submitAttempt($this->student, $this->quiz, $answers2);

        $bestAttempt = $this->quizService->getBestAttempt($this->student, $this->quiz);
        
        $this->assertEquals(100, $bestAttempt->score_percentage);
        $this->assertTrue($bestAttempt->passed);
    }

    /** @test */
    public function it_calculates_remaining_attempts_correctly()
    {
        // No attempts yet
        $remaining = $this->quizService->getRemainingAttempts($this->student, $this->quiz);
        $this->assertEquals(3, $remaining);

        // After 1 attempt
        QuizAttempt::factory()->create([
            'user_id' => $this->student->id,
            'quiz_id' => $this->quiz->id,
        ]);
        
        $remaining = $this->quizService->getRemainingAttempts($this->student, $this->quiz);
        $this->assertEquals(2, $remaining);

        // After 3 attempts
        QuizAttempt::factory()->count(2)->create([
            'user_id' => $this->student->id,
            'quiz_id' => $this->quiz->id,
        ]);
        
        $remaining = $this->quizService->getRemainingAttempts($this->student, $this->quiz);
        $this->assertEquals(0, $remaining);
    }

    /** @test */
    public function it_handles_unlimited_attempts()
    {
        $this->quiz->update(['max_attempts' => null]);

        // Create many attempts
        QuizAttempt::factory()->count(10)->create([
            'user_id' => $this->student->id,
            'quiz_id' => $this->quiz->id,
        ]);

        $remaining = $this->quizService->getRemainingAttempts($this->student, $this->quiz);
        $this->assertEquals(PHP_INT_MAX, $remaining);
    }

    /** @test */
    public function it_checks_if_user_has_passed_quiz()
    {
        $this->assertFalse($this->quizService->hasUserPassed($this->student, $this->quiz));

        // Create a failed attempt
        QuizAttempt::factory()->create([
            'user_id' => $this->student->id,
            'quiz_id' => $this->quiz->id,
            'status' => QuizAttempt::STATUS_COMPLETED,
            'passed' => false,
            'score_percentage' => 45.0,
            'completed_at' => now(),
        ]);

        $this->assertFalse($this->quizService->hasUserPassed($this->student, $this->quiz));

        // Create a passed attempt
        QuizAttempt::factory()->create([
            'user_id' => $this->student->id,
            'quiz_id' => $this->quiz->id,
            'status' => QuizAttempt::STATUS_COMPLETED,
            'passed' => true,
            'score_percentage' => 85.0,
            'completed_at' => now(),
        ]);

        $this->assertTrue($this->quizService->hasUserPassed($this->student, $this->quiz));
    }

    /** @test */
    public function it_gets_user_attempts()
    {
        // Create multiple attempts
        QuizAttempt::factory()->count(3)->create([
            'user_id' => $this->student->id,
            'quiz_id' => $this->quiz->id,
        ]);

        $attempts = $this->quizService->getUserAttempts($this->student, $this->quiz);
        
        $this->assertCount(3, $attempts);
        $this->assertEquals($this->student->id, $attempts->first()->user_id);
        $this->assertEquals($this->quiz->id, $attempts->first()->quiz_id);
    }

    /** @test */
    public function it_awards_coins_for_passing_quiz()
    {
        $attempt = $this->quizService->startAttempt($this->student, $this->quiz);
        
        $answers = [
            $this->quiz->questions[0]->id => ['4'], // Multiple choice needs array
            $this->quiz->questions[1]->id => true,
        ];

        $this->quizService->submitAttempt($this->student, $this->quiz, $answers);

        // Check that coins were awarded
        $this->assertDatabaseHas('coin_transactions', [
            'user_id' => $this->student->id,
            'source_type' => 'quiz',
            'source_id' => $this->quiz->id,
            'amount' => 50,
            'transaction_type' => 'earned',
        ]);
    }

    /** @test */
    public function it_does_not_award_coins_for_failing_quiz()
    {
        $attempt = $this->quizService->startAttempt($this->student, $this->quiz);
        
        $answers = [
            $this->quiz->questions[0]->id => '5', // Wrong
            $this->quiz->questions[1]->id => false, // Wrong
        ];

        $this->quizService->submitAttempt($this->student, $this->quiz, $answers);

        // Check that no coins were awarded
        $this->assertDatabaseMissing('coin_transactions', [
            'user_id' => $this->student->id,
            'source_type' => 'quiz',
            'source_id' => $this->quiz->id,
        ]);
    }

    /** @test */
    public function it_does_not_award_coins_multiple_times()
    {
        // First passing attempt
        $attempt1 = $this->quizService->startAttempt($this->student, $this->quiz);
        $answers = [
            $this->quiz->questions[0]->id => ['4'], // Multiple choice needs array
            $this->quiz->questions[1]->id => true,
        ];
        $this->quizService->submitAttempt($this->student, $this->quiz, $answers);

        // Reset quiz to allow another attempt (for testing)
        $this->quizService->resetUserAttempts($this->student, $this->quiz);

        // Second passing attempt
        $attempt2 = $this->quizService->startAttempt($this->student, $this->quiz);
        $this->quizService->submitAttempt($this->student, $this->quiz, $answers);

        // Should only have one coin transaction
        $coinTransactions = $this->student->coinTransactions()
                                         ->where('source_type', 'quiz')
                                         ->where('source_id', $this->quiz->id)
                                         ->count();
        
        $this->assertEquals(1, $coinTransactions);
    }

    /** @test */
    public function it_generates_quiz_statistics()
    {
        // Create some attempts
        QuizAttempt::factory()->create([
            'quiz_id' => $this->quiz->id,
            'status' => QuizAttempt::STATUS_COMPLETED,
            'passed' => true,
            'score_percentage' => 85,
        ]);

        QuizAttempt::factory()->create([
            'quiz_id' => $this->quiz->id,
            'status' => QuizAttempt::STATUS_COMPLETED,
            'passed' => false,
            'score_percentage' => 45,
        ]);

        $stats = $this->quizService->getQuizStatistics($this->quiz);

        $this->assertEquals(2, $stats['total_attempts']);
        $this->assertEquals(1, $stats['passed_attempts']);
        $this->assertEquals(50, $stats['pass_rate']);
        $this->assertEquals(65, $stats['average_score']);
        $this->assertArrayHasKey('score_distribution', $stats);
    }

    /** @test */
    public function it_resets_user_attempts()
    {
        // Create some attempts
        QuizAttempt::factory()->count(2)->create([
            'user_id' => $this->student->id,
            'quiz_id' => $this->quiz->id,
        ]);

        $this->assertEquals(2, $this->quizService->getUserAttempts($this->student, $this->quiz)->count());

        $this->quizService->resetUserAttempts($this->student, $this->quiz);

        $this->assertEquals(0, $this->quizService->getUserAttempts($this->student, $this->quiz)->count());
    }

    /** @test */
    public function it_throws_exception_for_no_active_attempt()
    {
        $this->expectException(QuizException::class);
        $this->expectExceptionMessage('No active quiz attempt found');

        $answers = [
            $this->quiz->questions[0]->id => '4',
        ];

        $this->quizService->submitAttempt($this->student, $this->quiz, $answers);
    }
}