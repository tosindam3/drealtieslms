<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Week;
use App\Models\Module;
use App\Models\Lesson;
use App\Models\LiveClass;
use App\Models\UserProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class LiveSessionSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_live_session_block_syncs_to_live_class_record()
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role' => 'administrator'
        ]);

        $week = Week::factory()->create(['week_number' => 1]);
        $module = Module::factory()->create(['week_id' => $week->id]);
        $lesson = Lesson::factory()->create(['module_id' => $module->id]);

        $liveBlock = [
            'id' => 'block-1',
            'type' => 'live',
            'title' => 'Test Live Session',
            'payload' => [
                'joinUrl' => 'https://zoom.us/j/123',
                'startAt' => '2026-03-01 10:00:00',
                'duration' => 90,
                'platform' => 'zoom',
                'trackingEnabled' => true,
            ],
            'coinReward' => 100,
            'required' => true
        ];

        $response = $this->actingAs($admin)
            ->patchJson("/api/admin/lessons/{$lesson->id}", [
                'lesson_blocks' => [$liveBlock]
            ]);

        $response->assertStatus(200);

        // Verify LiveClass record exists
        $this->assertDatabaseHas('live_classes', [
            'title' => 'Test Live Session',
            'join_url' => 'https://zoom.us/j/123',
            'duration' => 90,
            'platform' => 'zoom'
        ]);

        $liveClass = LiveClass::where('title', 'Test Live Session')->first();

        // Verify lesson block payload was updated with liveClassId
        $updatedLesson = $lesson->fresh();
        $blocks = $updatedLesson->lesson_blocks;
        $this->assertEquals($liveClass->id, $blocks[0]['payload']['liveClassId']);
    }

    public function test_updating_live_session_block_updates_live_class_record()
    {
        $admin = User::create([
            'name' => 'Admin User 2',
            'email' => 'admin2@example.com',
            'password' => bcrypt('password'),
            'role' => 'administrator'
        ]);

        $week = Week::factory()->create(['week_number' => 1]);
        $module = Module::factory()->create(['week_id' => $week->id]);
        $lesson = Lesson::factory()->create(['module_id' => $module->id]);

        // First create the block
        $liveClass = LiveClass::create([
            'week_id' => $week->id,
            'title' => 'Original Title',
            'scheduled_at' => now(),
            'duration' => 60,
            'join_url' => 'http://old.url',
            'platform' => 'zoom'
        ]);

        $updatedBlock = [
            'id' => 'block-1',
            'type' => 'live',
            'title' => 'Updated Title',
            'payload' => [
                'liveClassId' => $liveClass->id,
                'joinUrl' => 'https://new.url',
                'startAt' => '2026-04-01 15:00:00',
                'duration' => 45,
                'platform' => 'teams',
            ]
        ];

        $response = $this->actingAs($admin)
            ->patchJson("/api/admin/lessons/{$lesson->id}", [
                'lesson_blocks' => [$updatedBlock]
            ]);

        $response->assertStatus(200);

        // Verify LiveClass record was updated
        $this->assertDatabaseHas('live_classes', [
            'id' => $liveClass->id,
            'title' => 'Updated Title',
            'join_url' => 'https://new.url',
            'duration' => 45,
            'platform' => 'teams'
        ]);
    }

    public function test_student_can_attend_live_class()
    {
        Event::fake();

        $student = User::create([
            'name' => 'Student User',
            'email' => 'student@example.com',
            'password' => bcrypt('password'),
            'role' => 'student'
        ]);

        $week = Week::factory()->create();

        // Setup UserProgress to unlock the week
        UserProgress::create([
            'user_id' => $student->id,
            'cohort_id' => $week->cohort_id,
            'week_id' => $week->id,
            'is_unlocked' => true,
            'completion_percentage' => 0.0,
            'completion_data' => []
        ]);

        $liveClass = LiveClass::create([
            'week_id' => $week->id,
            'title' => 'Live Now Session',
            'scheduled_at' => now()->subMinutes(10),
            'duration' => 60,
            'join_url' => 'http://live.url',
            'platform' => 'zoom',
            'status' => 'live'
        ]);

        $response = $this->actingAs($student)
            ->postJson("/api/live-classes/{$liveClass->id}/attend", [
                'join_time' => now()->toIso8601String()
            ]);

        if ($response->status() !== 200) {
            dump($response->getContent());
        }

        $response->assertStatus(200);

        $this->assertDatabaseHas('live_attendance', [
            'user_id' => $student->id,
            'live_class_id' => $liveClass->id
        ]);
    }
}
