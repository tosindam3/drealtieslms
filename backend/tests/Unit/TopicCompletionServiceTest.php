<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Topic;
use App\Models\TopicCompletion;
use App\Models\Lesson;
use App\Models\Week;
use App\Models\Cohort;
use App\Models\UserProgress;
use App\Services\TopicCompletionService;
use App\Services\CoinService;
use App\Services\WeekUnlockService;
use App\Exceptions\TopicCompletionException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use App\Events\TopicCompletedEvent;

class TopicCompletionServiceTest extends TestCase
{
    use RefreshDatabase;

    private TopicCompletionService $topicCompletionService;
    private User $student;
    private Topic $topic;
    private Lesson $lesson;
    private Week $week;
    private Cohort $cohort;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->topicCompletionService = app(TopicCompletionService::class);
        
        // Create test data
        $this->cohort = Cohort::factory()->create(['status' => 'active']);
        $this->week = Week::factory()->create(['cohort_id' => $this->cohort->id]);
        $this->lesson = Lesson::factory()->create(['week_id' => $this->week->id]);
        $this->student = User::factory()->create(['role' => 'student']);
        $this->topic = Topic::factory()->create([
            'lesson_id' => $this->lesson->id,
            'coin_reward' => 25,
        ]);

        // Unlock week for student
        UserProgress::factory()->create([
            'user_id' => $this->student->id,
            'week_id' => $this->week->id,
            'is_unlocked' => true,
        ]);
    }

    public function test_it_completes_topic_successfully()
    {
        Event::fake();

        $completionData = ['time_spent' => 300]; // 5 minutes

        $completion = $this->topicCompletionService->completeTopic($this->student, $this->topic, $completionData);

        $this->assertInstanceOf(TopicCompletion::class, $completion);
        $this->assertEquals($this->student->id, $completion->user_id);
        $this->assertEquals($this->topic->id, $completion->topic_id);
        $this->assertEquals(25, $completion->coins_awarded);
        $this->assertNotNull($completion->completed_at);

        Event::assertDispatched(TopicCompletedEvent::class);
    }

    public function test_it_prevents_completion_when_week_not_unlocked()
    {
        // Lock the week
        UserProgress::where('user_id', $this->student->id)
                   ->where('week_id', $this->week->id)
                   ->update(['is_unlocked' => false]);

        $this->expectException(TopicCompletionException::class);
        $this->expectExceptionMessage('Week must be unlocked to access this topic');

        $this->topicCompletionService->completeTopic($this->student, $this->topic);
    }

    public function test_it_returns_existing_completion_if_already_completed()
    {
        // First completion
        $completion1 = $this->topicCompletionService->completeTopic($this->student, $this->topic);

        // Second completion attempt
        $completion2 = $this->topicCompletionService->completeTopic($this->student, $this->topic);

        $this->assertEquals($completion1->id, $completion2->id);
    }

    public function test_it_checks_if_user_has_completed_topic()
    {
        $this->assertFalse($this->topicCompletionService->hasUserCompleted($this->student, $this->topic));

        $this->topicCompletionService->completeTopic($this->student, $this->topic);

        $this->assertTrue($this->topicCompletionService->hasUserCompleted($this->student, $this->topic));
    }

    public function test_it_gets_user_completion()
    {
        $this->assertNull($this->topicCompletionService->getUserCompletion($this->student, $this->topic));

        $completion = $this->topicCompletionService->completeTopic($this->student, $this->topic);

        $retrievedCompletion = $this->topicCompletionService->getUserCompletion($this->student, $this->topic);
        $this->assertEquals($completion->id, $retrievedCompletion->id);
    }

    public function test_it_awards_coins_for_topic_completion()
    {
        $this->topicCompletionService->completeTopic($this->student, $this->topic);

        // Check that coins were awarded
        $this->assertDatabaseHas('coin_transactions', [
            'user_id' => $this->student->id,
            'source_type' => 'topic',
            'source_id' => $this->topic->id,
            'amount' => 25,
            'transaction_type' => 'earned',
        ]);
    }

    public function test_it_calculates_lesson_completion_percentage()
    {
        // Create additional topics in the lesson
        $topic2 = Topic::factory()->create(['lesson_id' => $this->lesson->id]);
        $topic3 = Topic::factory()->create(['lesson_id' => $this->lesson->id]);

        // No completions yet
        $percentage = $this->topicCompletionService->getLessonCompletionPercentage($this->student, $this->lesson->id);
        $this->assertEquals(0.0, $percentage);

        // Complete one topic (33.33%)
        $this->topicCompletionService->completeTopic($this->student, $this->topic);
        $percentage = $this->topicCompletionService->getLessonCompletionPercentage($this->student, $this->lesson->id);
        $this->assertEquals(33.33, $percentage);

        // Complete all topics (100%)
        $this->topicCompletionService->completeTopic($this->student, $topic2);
        $this->topicCompletionService->completeTopic($this->student, $topic3);
        $percentage = $this->topicCompletionService->getLessonCompletionPercentage($this->student, $this->lesson->id);
        $this->assertEquals(100.0, $percentage);
    }

    public function test_it_gets_completed_topics_for_lesson()
    {
        $topic2 = Topic::factory()->create(['lesson_id' => $this->lesson->id]);
        
        $this->topicCompletionService->completeTopic($this->student, $this->topic);

        $completedTopics = $this->topicCompletionService->getUserCompletedTopicsForLesson($this->student, $this->lesson->id);
        
        $this->assertCount(1, $completedTopics);
        $this->assertEquals($this->topic->id, $completedTopics->first()->topic_id);
    }

    public function test_it_gets_completed_topics_for_week()
    {
        $lesson2 = Lesson::factory()->create(['week_id' => $this->week->id]);
        $topic2 = Topic::factory()->create(['lesson_id' => $lesson2->id]);
        
        $this->topicCompletionService->completeTopic($this->student, $this->topic);
        $this->topicCompletionService->completeTopic($this->student, $topic2);

        $completedTopics = $this->topicCompletionService->getUserCompletedTopicsForWeek($this->student, $this->week->id);
        
        $this->assertCount(2, $completedTopics);
    }

    public function test_it_generates_topic_statistics()
    {
        // Enroll another student
        $student2 = User::factory()->create(['role' => 'student']);
        $this->cohort->students()->attach($student2->id, [
            'status' => 'active',
            'enrolled_at' => now()
        ]);
        UserProgress::factory()->create([
            'user_id' => $student2->id,
            'week_id' => $this->week->id,
            'is_unlocked' => true,
        ]);

        // Complete topic for first student
        $this->topicCompletionService->completeTopic($this->student, $this->topic);

        $stats = $this->topicCompletionService->getTopicStatistics($this->topic);

        $this->assertEquals(1, $stats['total_completions']);
        $this->assertEquals(2, $stats['total_students']); // Both students enrolled
        $this->assertEquals(50.0, $stats['completion_rate']); // 1 out of 2 completed
        $this->assertEquals(25, $stats['coins_distributed']); // 1 completion * 25 coins
    }

    public function test_it_bulk_completes_topics()
    {
        $topic2 = Topic::factory()->create(['lesson_id' => $this->lesson->id]);
        $topic3 = Topic::factory()->create(['lesson_id' => $this->lesson->id]);

        $topicIds = [$this->topic->id, $topic2->id, $topic3->id];
        $results = $this->topicCompletionService->bulkCompleteTopics($this->student, $topicIds);

        $this->assertCount(3, $results);
        foreach ($results as $result) {
            $this->assertTrue($result['success']);
            $this->assertArrayHasKey('completion', $result);
        }

        // Verify all topics are completed
        $this->assertTrue($this->topicCompletionService->hasUserCompleted($this->student, $this->topic));
        $this->assertTrue($this->topicCompletionService->hasUserCompleted($this->student, $topic2));
        $this->assertTrue($this->topicCompletionService->hasUserCompleted($this->student, $topic3));
    }

    public function test_it_resets_topic_completion()
    {
        $this->topicCompletionService->completeTopic($this->student, $this->topic);
        $this->assertTrue($this->topicCompletionService->hasUserCompleted($this->student, $this->topic));

        $this->topicCompletionService->resetTopicCompletion($this->student, $this->topic);
        $this->assertFalse($this->topicCompletionService->hasUserCompleted($this->student, $this->topic));
    }

    public function test_it_gets_cohort_topic_progress()
    {
        // Enroll student in cohort
        $this->cohort->students()->attach($this->student->id, [
            'status' => 'active',
            'enrolled_at' => now()
        ]);
        
        // Complete topic
        $this->topicCompletionService->completeTopic($this->student, $this->topic);

        $progress = $this->topicCompletionService->getCohortTopicProgress($this->cohort->id);

        $this->assertIsArray($progress);
        $this->assertNotEmpty($progress);
        
        $topicProgress = collect($progress)->firstWhere('topic_id', $this->topic->id);
        $this->assertNotNull($topicProgress);
        $this->assertEquals($this->topic->title, $topicProgress['topic_title']);
        $this->assertEquals(1, $topicProgress['completions']);
    }

    public function test_backward_compatibility_method()
    {
        // Test the completeTopicForUser method (backward compatibility)
        $completion = $this->topicCompletionService->completeTopicForUser($this->student, $this->topic);

        $this->assertInstanceOf(TopicCompletion::class, $completion);
        $this->assertEquals($this->student->id, $completion->user_id);
        $this->assertEquals($this->topic->id, $completion->topic_id);
    }
}