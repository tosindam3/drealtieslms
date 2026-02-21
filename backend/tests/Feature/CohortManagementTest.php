<?php

namespace Tests\Feature;

use App\Models\Cohort;
use App\Models\Enrollment;
use App\Models\User;
use App\Models\Week;
use App\Models\Module;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CohortManagementTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_admin_can_duplicate_cohort()
    {
        $cohort = Cohort::factory()->create(['name' => 'Original Cohort']);
        $week = Week::factory()->create(['cohort_id' => $cohort->id]);
        $module = Module::factory()->create(['week_id' => $week->id]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/admin/cohorts/{$cohort->id}/duplicate", []);

        $response->assertStatus(201);
        $this->assertDatabaseHas('cohorts', ['name' => 'Original Cohort (Clone)']);
        
        $newCohort = Cohort::where('name', 'Original Cohort (Clone)')->first();
        $this->assertCount(1, $newCohort->weeks);
        $this->assertCount(1, $newCohort->weeks->first()->modules);
    }

    public function test_admin_can_enroll_user_manually()
    {
        $cohort = Cohort::factory()->create();
        $student = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/admin/cohorts/{$cohort->id}/enroll", [
                'user_id' => $student->id
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('enrollments', [
            'cohort_id' => $cohort->id,
            'user_id' => $student->id,
            'status' => Enrollment::STATUS_ACTIVE
        ]);
        $this->assertEquals(1, $cohort->fresh()->enrolled_count);
    }

    public function test_admin_can_remove_user_from_cohort()
    {
        $cohort = Cohort::factory()->create(['enrolled_count' => 1]);
        $student = User::factory()->create(['role' => 'student']);
        Enrollment::create([
            'user_id' => $student->id,
            'cohort_id' => $cohort->id,
            'status' => Enrollment::STATUS_ACTIVE,
            'enrolled_at' => now(),
            'completion_percentage' => 0
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/admin/cohorts/{$cohort->id}/users/{$student->id}");

        $response->assertStatus(200);
        $this->assertDatabaseHas('enrollments', [
            'cohort_id' => $cohort->id,
            'user_id' => $student->id,
            'status' => 'dropped' // The service might set it to dropped or withdrawn
        ]);
    }
}
