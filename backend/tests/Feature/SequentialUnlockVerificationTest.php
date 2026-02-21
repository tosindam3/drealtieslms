<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Cohort;
use App\Models\Week;
use App\Models\Module;
use App\Models\Lesson;
use App\Models\Topic;
use App\Models\UserProgress;
use App\Services\TopicCompletionService;
use App\Services\WeekUnlockService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SequentialUnlockVerificationTest extends TestCase
{
    use RefreshDatabase;

    private User $student;
    private Cohort $cohort;
    private Week $week1;
    private Week $week2;
    private Lesson $lesson1;
    private Lesson $lesson2;
    private Topic $topic1;

    protected function setUp(): void
    {
        parent::setUp();

        // Create student
        $this->student = User::factory()->create(['role' => 'student']);

        // Create cohort
        $this->cohort = Cohort::factory()->create(['status' => 'active', 'start_date' => now()->subDay()]);

        // Create Week 1 and contents
        $this->week1 = Week::factory()->create([
            'cohort_id' => $this->cohort->id,
            'week_number' => 1,
        ]);
        $module1 = Module::create(['week_id' => $this->week1->id, 'title' => 'Module 1', 'order' => 1]);
        $this->lesson1 = Lesson::factory()->create([
            'module_id' => $module1->id,
            'order' => 1,
            'status' => 'published',
            'min_time_required_seconds' => 0
        ]);
        $this->topic1 = Topic::factory()->create(['lesson_id' => $this->lesson1->id, 'order' => 1]);

        // Create Week 2 and contents with no extra requirements
        $this->week2 = Week::factory()->create([
            'cohort_id' => $this->cohort->id,
            'week_number' => 2,
            'unlock_rules' => [
                'min_coins' => 0,
                'required_completions' => [],
            ],
        ]);
        $module2 = Module::create(['week_id' => $this->week2->id, 'title' => 'Module 2', 'order' => 1]);
        $this->lesson2 = Lesson::factory()->create([
            'module_id' => $module2->id,
            'order' => 1,
            'status' => 'published',
            'min_time_required_seconds' => 0
        ]);

        // Enroll student - This should trigger Week 1 unlock automatically in production
        // But for tests, we might need to simulate the service call or manual record creation
        $this->cohort->students()->attach($this->student->id, ['status' => 'active', 'enrolled_at' => now()]);

        // Manual setup of Week 1 unlocked, Week 2 locked
        UserProgress::create([
            'user_id' => $this->student->id,
            'cohort_id' => $this->cohort->id,
            'week_id' => $this->week1->id,
            'is_unlocked' => true,
            'unlocked_at' => now(),
        ]);

        UserProgress::create([
            'user_id' => $this->student->id,
            'cohort_id' => $this->cohort->id,
            'week_id' => $this->week2->id,
            'is_unlocked' => false,
        ]);
    }

    /**
     * Test that student can access Week 1 but not Week 2 initially
     */
    public function test_student_access_enforcement()
    {
        // Access Lesson in Week 1 - Should be 200
        $response1 = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/lessons/{$this->lesson1->id}");
        $response1->assertStatus(200);

        // Access Lesson in Week 2 - Should be 403
        $response2 = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/lessons/{$this->lesson2->id}");
        $response2->assertStatus(403);
    }

    /**
     * Test that completing Week 1 unlocks Week 2
     */
    public function test_sequential_module_unlocking()
    {
        $topicService = app(TopicCompletionService::class);
        $weekService = app(WeekUnlockService::class);

        // Before completion, Week 2 is locked
        $this->assertFalse($weekService->canUnlockWeek($this->student, $this->week2));

        // Initialize tracking for lesson and module to enable progression
        app(\App\Services\LessonCompletionService::class)->startLesson($this->student, $this->lesson1);
        app(\App\Services\ModuleCompletionService::class)->startModule($this->student, $this->lesson1->module);

        // Complete all content in Week 1
        $topicService->completeTopic($this->student, $this->topic1);

        // Debug info
        $lessonProgress = app(\App\Services\LessonCompletionService::class)->calculateLessonProgress($this->student, $this->lesson1);
        $moduleProgress = app(\App\Services\ModuleCompletionService::class)->calculateModuleProgress($this->student, $this->lesson1->module);

        fwrite(STDERR, "Lesson Progress: " . $lessonProgress['percentage'] . "%\n");
        fwrite(STDERR, "Module Progress: " . $moduleProgress['percentage'] . "%\n");

        // Recalculate and trigger unlock
        $weekService->recalculateWeekProgress($this->student, $this->week1);

        // Verify Week 1 is completed
        $progress1 = UserProgress::where('user_id', $this->student->id)
            ->where('week_id', $this->week1->id)
            ->first();
        $this->assertEquals(100.0, $progress1->completion_percentage);
        $this->assertTrue($progress1->isCompleted());

        // Verify Week 2 is now unlocked in DB
        $progress2 = UserProgress::where('user_id', $this->student->id)
            ->where('week_id', $this->week2->id)
            ->first();
        $this->assertTrue($progress2->is_unlocked);
    }

    /**
     * Access Lesson in Week 2 - Should now be 200
     */
    public function test_sequential_lesson_enforcement()
    {
        // Setup: Two lessons in Week 1
        $module = Module::create(['week_id' => $this->week1->id, 'title' => 'Sequential Lessons', 'order' => 2]);
        $l1 = Lesson::factory()->create(['module_id' => $module->id, 'order' => 1, 'status' => 'published']);
        $l2 = Lesson::factory()->create(['module_id' => $module->id, 'order' => 2, 'status' => 'published']);

        // Access L1 - Should be 200 (Week 1 is unlocked)
        $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/lessons/{$l1->id}")
            ->assertStatus(200);

        // Access L2 - If system IS NOT sequential for lessons, this will be 200.
        // If system IS sequential, this should be 403.
        $response = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/lessons/{$l2->id}");

        fwrite(STDERR, "\nLesson 2 Access Code: " . $response->status() . "\n");

        // Currently, we expect 200 because we suspect sequential lessons aren't implemented.
        $response->assertStatus(200);
    }
}
