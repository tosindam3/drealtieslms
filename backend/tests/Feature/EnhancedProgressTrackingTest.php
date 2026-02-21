<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Cohort;
use App\Models\Week;
use App\Models\Module;
use App\Models\Lesson;
use App\Models\Topic;
use App\Models\Enrollment;
use App\Models\UserProgress;
use App\Services\TopicCompletionService;
use App\Services\LessonCompletionService;
use App\Services\ModuleCompletionService;
use App\Services\WeekUnlockService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class EnhancedProgressTrackingTest extends TestCase
{
    use RefreshDatabase;

    private User $student;
    private Cohort $cohort;
    private Week $week;
    private Module $module;
    private Lesson $lesson;
    private Topic $topic;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test data
        $this->student = User::factory()->create(['role' => 'student']);
        $this->cohort = Cohort::factory()->create(['status' => 'active']);
        $this->week = Week::factory()->create([
            'cohort_id' => $this->cohort->id,
            'week_number' => 1,
        ]);
        $this->module = Module::create([
            'week_id' => $this->week->id,
            'title' => 'Test Module',
            'order' => 1,
        ]);
        $this->lesson = Lesson::factory()->create([
            'module_id' => $this->module->id,
            'min_time_required_seconds' => 300,
        ]);
        $this->topic = Topic::factory()->create([
            'lesson_id' => $this->lesson->id,
            'coin_reward' => 10,
            'min_time_required_seconds' => 120,
        ]);

        // Enroll student
        $this->cohort->students()->attach($this->student->id, [
            'enrolled_at' => now(),
            'status' => 'active',
        ]);

        // Create user progress
        UserProgress::create([
            'user_id' => $this->student->id,
            'cohort_id' => $this->cohort->id,
            'week_id' => $this->week->id,
            'is_unlocked' => true,
            'unlocked_at' => now(),
        ]);
    }

    public function test_topic_completion_creates_records()
    {
        $topicService = app(TopicCompletionService::class);

        // Start topic
        $completion = $topicService->startTopic($this->student, $this->topic);
        
        $this->assertNotNull($completion);
        $this->assertNotNull($completion->started_at);
        $this->assertNull($completion->completed_at);
        $this->assertEquals(0, $completion->completion_percentage);
    }

    public function test_topic_progress_updates()
    {
        $topicService = app(TopicCompletionService::class);

        // Start topic first
        $topicService->startTopic($this->student, $this->topic);

        // Update progress
        $completion = $topicService->updateTopicProgress($this->student, $this->topic, 50.0, 60);
        
        $this->assertEquals(50.0, $completion->completion_percentage);
        $this->assertEquals(60, $completion->last_position_seconds);
    }

    public function test_topic_completion_updates_lesson_progress()
    {
        $topicService = app(TopicCompletionService::class);
        $lessonService = app(LessonCompletionService::class);

        // Complete topic
        $topicService->completeTopic($this->student, $this->topic);

        // Check lesson progress
        $lessonProgress = $lessonService->calculateLessonProgress($this->student, $this->lesson);
        
        $this->assertEquals(100.0, $lessonProgress['percentage']);
        $this->assertEquals(1, $lessonProgress['completed']);
        $this->assertEquals(1, $lessonProgress['total']);
    }

    public function test_lesson_completion_updates_module_progress()
    {
        $topicService = app(TopicCompletionService::class);
        $lessonService = app(LessonCompletionService::class);
        $moduleService = app(ModuleCompletionService::class);

        // Complete topic (which should trigger lesson completion)
        $topicService->completeTopic($this->student, $this->topic);

        // Manually complete lesson
        $lessonService->completeLesson($this->student, $this->lesson);

        // Check module progress
        $moduleProgress = $moduleService->calculateModuleProgress($this->student, $this->module);
        
        $this->assertEquals(100.0, $moduleProgress['percentage']);
        $this->assertEquals(1, $moduleProgress['completed']);
        $this->assertEquals(1, $moduleProgress['total']);
    }

    public function test_module_completion_updates_week_progress()
    {
        $topicService = app(TopicCompletionService::class);
        $lessonService = app(LessonCompletionService::class);
        $moduleService = app(ModuleCompletionService::class);
        $weekService = app(WeekUnlockService::class);

        // Complete the chain
        $topicService->completeTopic($this->student, $this->topic);
        $lessonService->completeLesson($this->student, $this->lesson);
        $moduleService->completeModule($this->student, $this->module);

        // Recalculate week progress
        $weekService->recalculateWeekProgress($this->student, $this->week);

        // Check week progress
        $weekProgress = UserProgress::where('user_id', $this->student->id)
            ->where('week_id', $this->week->id)
            ->first();
        
        $this->assertEquals(100.0, $weekProgress->completion_percentage);
        $this->assertNotNull($weekProgress->completed_at);
    }

    public function test_api_track_topic_time()
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson("/api/topics/{$this->topic->id}/track-time", [
                'time_spent' => 150,
                'progress_percentage' => 75.5,
                'last_position' => 90,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'time_spent_seconds' => 150,
                'progress_percentage' => 75.5,
                'last_position_seconds' => 90,
            ]);
    }

    public function test_api_track_lesson_time()
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson("/api/lessons/{$this->lesson->id}/track-time", [
                'time_spent' => 350,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'time_spent_seconds' => 350,
            ]);
    }

    public function test_api_get_module_progress()
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/modules/{$this->module->id}/progress");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'module' => ['id', 'title', 'week_id'],
                'progress' => [
                    'is_completed',
                    'completion_percentage',
                    'lessons_completed',
                    'lessons_total',
                ],
                'lessons',
            ]);
    }

    public function test_api_get_lesson_progress()
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/lessons/{$this->lesson->id}/progress");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'lesson' => ['id', 'title', 'module_id'],
                'progress' => [
                    'is_completed',
                    'completion_percentage',
                    'topics_completed',
                    'topics_total',
                    'can_complete',
                ],
                'topics',
            ]);
    }

    public function test_complete_flow_with_multiple_topics()
    {
        // Create additional topics
        $topic2 = Topic::factory()->create([
            'lesson_id' => $this->lesson->id,
            'coin_reward' => 10,
        ]);
        $topic3 = Topic::factory()->create([
            'lesson_id' => $this->lesson->id,
            'coin_reward' => 10,
        ]);

        $topicService = app(TopicCompletionService::class);
        $lessonService = app(LessonCompletionService::class);

        // Complete first topic
        $topicService->completeTopic($this->student, $this->topic);
        $progress1 = $lessonService->calculateLessonProgress($this->student, $this->lesson);
        $this->assertEqualsWithDelta(33.33, $progress1['percentage'], 0.1);

        // Complete second topic
        $topicService->completeTopic($this->student, $topic2);
        $progress2 = $lessonService->calculateLessonProgress($this->student, $this->lesson);
        $this->assertEqualsWithDelta(66.67, $progress2['percentage'], 0.1);

        // Complete third topic
        $topicService->completeTopic($this->student, $topic3);
        $progress3 = $lessonService->calculateLessonProgress($this->student, $this->lesson);
        $this->assertEquals(100.0, $progress3['percentage']);
    }

    public function test_time_requirement_prevents_completion()
    {
        $lessonService = app(LessonCompletionService::class);
        $topicService = app(TopicCompletionService::class);

        // Complete topic
        $topicService->completeTopic($this->student, $this->topic);

        // Try to complete lesson without meeting time requirement
        $lessonCompletion = $lessonService->startLesson($this->student, $this->lesson);
        $lessonCompletion->update(['time_spent_seconds' => 100]); // Less than required 300

        $progress = $lessonService->calculateLessonProgress($this->student, $this->lesson);
        
        $this->assertFalse($progress['can_complete']);
        $this->assertFalse($progress['time_requirement_met']);
    }

    public function test_time_requirement_allows_completion()
    {
        $lessonService = app(LessonCompletionService::class);
        $topicService = app(TopicCompletionService::class);

        // Complete topic
        $topicService->completeTopic($this->student, $this->topic);

        // Meet time requirement
        $lessonCompletion = $lessonService->startLesson($this->student, $this->lesson);
        $lessonCompletion->update(['time_spent_seconds' => 350]); // More than required 300

        $progress = $lessonService->calculateLessonProgress($this->student, $this->lesson);
        
        $this->assertTrue($progress['can_complete']);
        $this->assertTrue($progress['time_requirement_met']);
    }
}
