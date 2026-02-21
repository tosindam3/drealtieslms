<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Cohort;
use App\Models\Week;
use App\Models\Lesson;
use App\Models\Enrollment;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class CourseApiTest extends TestCase
{
    use DatabaseMigrations;

    protected function setUp(): void
    {
        parent::setUp();
    }

    /** @test */
    public function it_can_fetch_authorized_course_for_enrolled_student()
    {
        $student = User::factory()->create(['role' => 'student']);
        $cohort = Cohort::factory()->create(['status' => 'active']);
        $week = Week::factory()->create(['cohort_id' => $cohort->id, 'week_number' => 1]);
        $lesson = Lesson::factory()->create(['week_id' => $week->id]);
        
        Enrollment::create([
            'user_id' => $student->id,
            'cohort_id' => $cohort->id,
            'status' => Enrollment::STATUS_ACTIVE,
            'enrolled_at' => now(),
        ]);

        Sanctum::actingAs($student);

        $response = $this->getJson('/api/student/courses/authorized');

        $response->assertStatus(200);
        $response->assertJsonPath('id', (string) $cohort->id);
        $response->assertJsonStructure([
            'id', 'title', 'program', 'weeks' => [
                '*' => [
                    'id', 'title', 'modules' => [
                        '*' => [
                            'lessons' => [
                                '*' => ['id', 'title', 'topics']
                            ]
                        ]
                    ]
                ]
            ]
        ]);
    }

    /** @test */
    public function it_returns_default_structure_when_student_not_enrolled()
    {
        $student = User::factory()->create(['role' => 'student']);
        
        Sanctum::actingAs($student);

        $response = $this->getJson('/api/student/courses/authorized');

        $response->assertStatus(200);
        $response->assertJsonPath('id', 'no-active-course');
    }

    /** @test */
    public function admin_can_create_cohort()
    {
        $admin = User::factory()->create(['role' => 'administrator']);
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/admin/cohorts', [
            'name' => 'New Test Cohort',
            'description' => 'Test Description',
            'start_date' => now()->addDays(1)->toDateString(),
            'end_date' => now()->addDays(30)->toDateString(),
            'capacity' => 50,
            'status' => 'draft'
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('cohorts', ['name' => 'New Test Cohort']);
    }

    /** @test */
    public function admin_can_create_week()
    {
        $admin = User::factory()->create(['role' => 'administrator']);
        $cohort = Cohort::factory()->create();
        Sanctum::actingAs($admin);

        $response = $this->postJson("/api/admin/cohorts/{$cohort->id}/weeks", [
            'week_number' => 1,
            'title' => 'Introduction',
            'description' => 'Week 1 description'
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('weeks', ['title' => 'Introduction', 'cohort_id' => $cohort->id]);
    }
}
