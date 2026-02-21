<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\LiveClass;
use App\Models\LiveAttendance;
use App\Models\Week;
use App\Models\Cohort;
use App\Models\UserProgress;
use App\Services\LiveClassService;
use App\Services\CoinService;
use App\Services\WeekUnlockService;
use App\Exceptions\LiveClassException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use App\Events\LiveClassAttendedEvent;
use App\Events\LiveClassStartedEvent;
use App\Events\LiveClassEndedEvent;

class LiveClassServiceTest extends TestCase
{
    use RefreshDatabase;

    private LiveClassService $liveClassService;
    private User $student;
    private User $instructor;
    private LiveClass $liveClass;
    private Week $week;
    private Cohort $cohort;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->liveClassService = app(LiveClassService::class);
        
        // Create test data
        $this->cohort = Cohort::factory()->create(['status' => 'active']);
        $this->week = Week::factory()->create(['cohort_id' => $this->cohort->id]);
        $this->student = User::factory()->create(['role' => 'student']);
        $this->instructor = User::factory()->create(['role' => 'instructor']);
        $this->liveClass = LiveClass::factory()->create([
            'week_id' => $this->week->id,
            'coin_reward' => 30,
            'status' => LiveClass::STATUS_LIVE,
        ]);

        // Unlock week for student
        UserProgress::factory()->create([
            'user_id' => $this->student->id,
            'week_id' => $this->week->id,
            'is_unlocked' => true,
        ]);
    }

    public function test_it_marks_attendance_successfully()
    {
        Event::fake();

        $attendanceData = [
            'joined_at' => now(),
            'participation_score' => 85,
        ];

        $attendance = $this->liveClassService->markAttendance($this->student, $this->liveClass, $attendanceData);

        $this->assertInstanceOf(LiveAttendance::class, $attendance);
        $this->assertEquals($this->student->id, $attendance->user_id);
        $this->assertEquals($this->liveClass->id, $attendance->live_class_id);
        $this->assertTrue($attendance->attended);
        $this->assertNotNull($attendance->joined_at);

        Event::assertDispatched(LiveClassAttendedEvent::class);
    }

    public function test_it_prevents_attendance_when_week_not_unlocked()
    {
        // Lock the week
        UserProgress::where('user_id', $this->student->id)
                   ->where('week_id', $this->week->id)
                   ->update(['is_unlocked' => false]);

        $this->expectException(LiveClassException::class);
        $this->expectExceptionMessage('Week must be unlocked to attend this live class');

        $this->liveClassService->markAttendance($this->student, $this->liveClass);
    }

    public function test_it_prevents_attendance_when_class_not_active()
    {
        $this->liveClass->update(['status' => LiveClass::STATUS_SCHEDULED]);

        $this->expectException(LiveClassException::class);
        $this->expectExceptionMessage('Live class is not currently active');

        $this->liveClassService->markAttendance($this->student, $this->liveClass);
    }

    public function test_it_updates_existing_attendance()
    {
        // First attendance marking
        $attendance1 = $this->liveClassService->markAttendance($this->student, $this->liveClass);

        // Second attendance marking (should update existing)
        $attendanceData = ['left_at' => now()->addHour()];
        $attendance2 = $this->liveClassService->markAttendance($this->student, $this->liveClass, $attendanceData);

        $this->assertEquals($attendance1->id, $attendance2->id);
        $this->assertNotNull($attendance2->left_at);
    }

    public function test_it_marks_absent_successfully()
    {
        $attendance = $this->liveClassService->markAbsent($this->student, $this->liveClass, 'Technical issues');

        $this->assertInstanceOf(LiveAttendance::class, $attendance);
        $this->assertEquals($this->student->id, $attendance->user_id);
        $this->assertEquals($this->liveClass->id, $attendance->live_class_id);
        $this->assertFalse($attendance->attended);
        $this->assertEquals('Technical issues', $attendance->absence_reason);
    }

    public function test_it_starts_live_class_successfully()
    {
        Event::fake();

        $this->liveClass->update(['status' => LiveClass::STATUS_SCHEDULED]);

        $startedClass = $this->liveClassService->startLiveClass($this->liveClass, $this->instructor);

        $this->assertEquals(LiveClass::STATUS_LIVE, $startedClass->status);
        $this->assertEquals($this->instructor->id, $startedClass->started_by);
        $this->assertNotNull($startedClass->started_at);

        Event::assertDispatched(LiveClassStartedEvent::class);
    }

    public function test_it_prevents_starting_non_scheduled_class()
    {
        $this->liveClass->update(['status' => LiveClass::STATUS_COMPLETED]);

        $this->expectException(LiveClassException::class);
        $this->expectExceptionMessage('Only scheduled classes can be started');

        $this->liveClassService->startLiveClass($this->liveClass, $this->instructor);
    }

    public function test_it_ends_live_class_successfully()
    {
        Event::fake();

        // Create some attendees
        $this->liveClassService->markAttendance($this->student, $this->liveClass);

        $endedClass = $this->liveClassService->endLiveClass($this->liveClass, $this->instructor);

        $this->assertEquals(LiveClass::STATUS_COMPLETED, $endedClass->status);
        $this->assertEquals($this->instructor->id, $endedClass->ended_by);
        $this->assertNotNull($endedClass->ended_at);

        Event::assertDispatched(LiveClassEndedEvent::class);
    }

    public function test_it_prevents_ending_non_live_class()
    {
        $this->liveClass->update(['status' => LiveClass::STATUS_SCHEDULED]);

        $this->expectException(LiveClassException::class);
        $this->expectExceptionMessage('Only live classes can be ended');

        $this->liveClassService->endLiveClass($this->liveClass, $this->instructor);
    }

    public function test_it_checks_user_attendance()
    {
        $this->assertFalse($this->liveClassService->hasUserAttended($this->student, $this->liveClass));

        $this->liveClassService->markAttendance($this->student, $this->liveClass);

        $this->assertTrue($this->liveClassService->hasUserAttended($this->student, $this->liveClass));
    }

    public function test_it_gets_user_attendance()
    {
        $this->assertNull($this->liveClassService->getUserAttendance($this->student, $this->liveClass));

        $attendance = $this->liveClassService->markAttendance($this->student, $this->liveClass);

        $retrievedAttendance = $this->liveClassService->getUserAttendance($this->student, $this->liveClass);
        $this->assertEquals($attendance->id, $retrievedAttendance->id);
    }

    public function test_it_gets_attendance_list()
    {
        $student2 = User::factory()->create(['role' => 'student']);
        UserProgress::factory()->create([
            'user_id' => $student2->id,
            'week_id' => $this->week->id,
            'is_unlocked' => true,
        ]);

        $this->liveClassService->markAttendance($this->student, $this->liveClass);
        $this->liveClassService->markAttendance($student2, $this->liveClass);

        $attendanceList = $this->liveClassService->getAttendanceList($this->liveClass);

        $this->assertCount(2, $attendanceList);
        $this->assertTrue($attendanceList->contains('user_id', $this->student->id));
        $this->assertTrue($attendanceList->contains('user_id', $student2->id));
    }

    public function test_it_awards_coins_for_attendance()
    {
        $this->liveClassService->markAttendance($this->student, $this->liveClass);

        // Check that coins were awarded
        $this->assertDatabaseHas('coin_transactions', [
            'user_id' => $this->student->id,
            'source_type' => 'live_class',
            'source_id' => $this->liveClass->id,
            'amount' => 30,
            'transaction_type' => 'earned',
        ]);
    }

    public function test_it_generates_live_class_statistics()
    {
        // Enroll students in cohort
        $student2 = User::factory()->create(['role' => 'student']);
        $this->cohort->students()->attach([$this->student->id, $student2->id], [
            'status' => 'active',
            'enrolled_at' => now()
        ]);
        UserProgress::factory()->create([
            'user_id' => $student2->id,
            'week_id' => $this->week->id,
            'is_unlocked' => true,
        ]);

        // Mark attendance for one student
        $this->liveClassService->markAttendance($this->student, $this->liveClass);
        $this->liveClassService->markAbsent($student2, $this->liveClass);

        $stats = $this->liveClassService->getLiveClassStatistics($this->liveClass);

        $this->assertEquals(2, $stats['total_students']);
        $this->assertEquals(2, $stats['total_attendance_records']);
        $this->assertEquals(1, $stats['actual_attendees']);
        $this->assertEquals(1, $stats['absentees']);
        $this->assertEquals(50.0, $stats['attendance_rate']); // 1 out of 2 attended
        $this->assertEquals(30, $stats['coins_distributed']); // 1 attendee * 30 coins
    }

    public function test_it_gets_user_attendance_history()
    {
        // Create another live class
        $liveClass2 = LiveClass::factory()->create([
            'week_id' => $this->week->id,
            'status' => LiveClass::STATUS_COMPLETED,
        ]);

        $this->liveClassService->markAttendance($this->student, $this->liveClass);
        $this->liveClassService->markAttendance($this->student, $liveClass2);

        $history = $this->liveClassService->getUserAttendanceHistory($this->student, $this->cohort->id);

        $this->assertCount(2, $history);
        $this->assertTrue($history->contains('live_class_id', $this->liveClass->id));
        $this->assertTrue($history->contains('live_class_id', $liveClass2->id));
    }

    public function test_it_calculates_user_attendance_rate()
    {
        // Create completed live classes
        $liveClass2 = LiveClass::factory()->create([
            'week_id' => $this->week->id,
            'status' => LiveClass::STATUS_COMPLETED,
        ]);
        $this->liveClass->update(['status' => LiveClass::STATUS_COMPLETED]);

        // Attend one out of two classes
        $this->liveClassService->markAttendance($this->student, $this->liveClass);
        $this->liveClassService->markAbsent($this->student, $liveClass2);

        $attendanceRate = $this->liveClassService->getUserAttendanceRate($this->student, $this->cohort->id);

        $this->assertEquals(50.0, $attendanceRate); // 1 out of 2 classes attended
    }

    public function test_it_gets_upcoming_live_classes()
    {
        $upcomingClass = LiveClass::factory()->create([
            'week_id' => $this->week->id,
            'scheduled_at' => now()->addDays(2),
            'status' => LiveClass::STATUS_SCHEDULED,
        ]);

        // Enroll student in cohort
        $this->cohort->students()->attach($this->student->id, [
            'status' => 'active',
            'enrolled_at' => now()
        ]);

        $upcomingClasses = $this->liveClassService->getUpcomingLiveClasses($this->student, 7);

        $this->assertCount(1, $upcomingClasses);
        $this->assertEquals($upcomingClass->id, $upcomingClasses->first()->id);
    }

    public function test_it_generates_attendance_report()
    {
        // Enroll students
        $student2 = User::factory()->create(['role' => 'student']);
        $this->cohort->students()->attach([$this->student->id, $student2->id], [
            'status' => 'active',
            'enrolled_at' => now()
        ]);
        UserProgress::factory()->create([
            'user_id' => $student2->id,
            'week_id' => $this->week->id,
            'is_unlocked' => true,
        ]);

        // Mark attendance
        $this->liveClassService->markAttendance($this->student, $this->liveClass);
        $this->liveClassService->markAbsent($student2, $this->liveClass);

        $report = $this->liveClassService->generateAttendanceReport($this->cohort->id);

        $this->assertCount(2, $report); // Two students
        
        $studentReport = collect($report)->firstWhere('student_id', $this->student->id);
        $this->assertEquals(1, $studentReport['total_classes']);
        $this->assertEquals(1, $studentReport['attended_classes']);
        $this->assertEquals(100.0, $studentReport['attendance_rate']);

        $student2Report = collect($report)->firstWhere('student_id', $student2->id);
        $this->assertEquals(1, $student2Report['total_classes']);
        $this->assertEquals(0, $student2Report['attended_classes']);
        $this->assertEquals(0.0, $student2Report['attendance_rate']);
    }

    public function test_it_allows_late_attendance_marking()
    {
        // End the class
        $this->liveClass->update([
            'status' => LiveClass::STATUS_COMPLETED,
            'ended_at' => now()->subMinutes(30), // Ended 30 minutes ago
        ]);

        // Should still allow attendance marking within 1 hour
        $attendance = $this->liveClassService->markAttendance($this->student, $this->liveClass);

        $this->assertInstanceOf(LiveAttendance::class, $attendance);
        $this->assertTrue($attendance->attended);
    }

    public function test_it_prevents_very_late_attendance_marking()
    {
        // End the class more than 1 hour ago
        $this->liveClass->update([
            'status' => LiveClass::STATUS_COMPLETED,
            'ended_at' => now()->subHours(2)->subMinutes(1), // 2 hours and 1 minute ago
        ]);

        $this->expectException(LiveClassException::class);
        $this->expectExceptionMessage('Attendance marking period has expired');

        $this->liveClassService->markAttendance($this->student, $this->liveClass);
    }
}