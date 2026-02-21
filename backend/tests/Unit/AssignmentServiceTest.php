<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Week;
use App\Models\Cohort;
use App\Models\UserProgress;
use App\Services\AssignmentService;
use App\Services\CoinService;
use App\Services\WeekUnlockService;
use App\Exceptions\AssignmentException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use App\Events\AssignmentSubmittedEvent;
use App\Events\AssignmentApprovedEvent;
use App\Events\AssignmentRejectedEvent;

class AssignmentServiceTest extends TestCase
{
    use RefreshDatabase;

    private AssignmentService $assignmentService;
    private User $student;
    private User $instructor;
    private Assignment $assignment;
    private Week $week;
    private Cohort $cohort;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->assignmentService = app(AssignmentService::class);
        
        // Create test data
        $this->cohort = Cohort::factory()->create(['status' => 'active']);
        $this->week = Week::factory()->create(['cohort_id' => $this->cohort->id]);
        $this->student = User::factory()->create(['role' => 'student']);
        $this->instructor = User::factory()->create(['role' => 'instructor']);
        $this->assignment = Assignment::factory()->create([
            'week_id' => $this->week->id,
            'coin_reward' => 100,
            'allow_multiple_submissions' => false,
            'allow_late_submissions' => true,
        ]);

        // Unlock week for student
        UserProgress::factory()->create([
            'user_id' => $this->student->id,
            'week_id' => $this->week->id,
            'is_unlocked' => true,
        ]);
    }

    public function test_it_submits_assignment_successfully()
    {
        Event::fake();

        $submissionData = [
            'content' => 'This is my assignment submission.',
            'metadata' => ['submission_type' => 'text'],
        ];

        $submission = $this->assignmentService->submitAssignment($this->student, $this->assignment, $submissionData);

        $this->assertInstanceOf(AssignmentSubmission::class, $submission);
        $this->assertEquals($this->student->id, $submission->user_id);
        $this->assertEquals($this->assignment->id, $submission->assignment_id);
        $this->assertEquals('This is my assignment submission.', $submission->content);
        $this->assertEquals(AssignmentSubmission::STATUS_SUBMITTED, $submission->status);
        $this->assertNotNull($submission->submitted_at);

        Event::assertDispatched(AssignmentSubmittedEvent::class);
    }

    public function test_it_prevents_submission_when_week_not_unlocked()
    {
        // Lock the week
        UserProgress::where('user_id', $this->student->id)
                   ->where('week_id', $this->week->id)
                   ->update(['is_unlocked' => false]);

        $this->expectException(AssignmentException::class);
        $this->expectExceptionMessage('Week must be unlocked to access this assignment');

        $submissionData = ['content' => 'Test submission'];
        $this->assignmentService->submitAssignment($this->student, $this->assignment, $submissionData);
    }

    public function test_it_approves_submission_successfully()
    {
        Event::fake();

        // First submit assignment
        $submissionData = ['content' => 'Test submission'];
        $submission = $this->assignmentService->submitAssignment($this->student, $this->assignment, $submissionData);

        // Then approve it
        $feedback = 'Great work!';
        $approvedSubmission = $this->assignmentService->approveSubmission($submission, $this->instructor, $feedback);

        $this->assertEquals(AssignmentSubmission::STATUS_APPROVED, $approvedSubmission->status);
        $this->assertEquals($this->instructor->id, $approvedSubmission->reviewed_by);
        $this->assertEquals($feedback, $approvedSubmission->feedback);
        $this->assertNotNull($approvedSubmission->reviewed_at);

        Event::assertDispatched(AssignmentApprovedEvent::class);
    }

    public function test_it_rejects_submission_successfully()
    {
        Event::fake();

        // First submit assignment
        $submissionData = ['content' => 'Test submission'];
        $submission = $this->assignmentService->submitAssignment($this->student, $this->assignment, $submissionData);

        // Then reject it
        $feedback = 'Needs improvement';
        $rejectedSubmission = $this->assignmentService->rejectSubmission($submission, $this->instructor, $feedback);

        $this->assertEquals(AssignmentSubmission::STATUS_REJECTED, $rejectedSubmission->status);
        $this->assertEquals($this->instructor->id, $rejectedSubmission->reviewed_by);
        $this->assertEquals($feedback, $rejectedSubmission->feedback);
        $this->assertNotNull($rejectedSubmission->reviewed_at);

        Event::assertDispatched(AssignmentRejectedEvent::class);
    }

    public function test_it_requests_revision_successfully()
    {
        // First submit assignment
        $submissionData = ['content' => 'Test submission'];
        $submission = $this->assignmentService->submitAssignment($this->student, $this->assignment, $submissionData);

        // Then request revision
        $feedback = 'Please add more details';
        $revisionSubmission = $this->assignmentService->requestRevision($submission, $this->instructor, $feedback);

        $this->assertEquals(AssignmentSubmission::STATUS_REVISION_REQUESTED, $revisionSubmission->status);
        $this->assertEquals($this->instructor->id, $revisionSubmission->reviewed_by);
        $this->assertEquals($feedback, $revisionSubmission->feedback);
        $this->assertNotNull($revisionSubmission->reviewed_at);
    }

    public function test_it_resubmits_assignment_after_revision()
    {
        Event::fake();

        // Submit, request revision, then resubmit
        $submissionData = ['content' => 'Test submission'];
        $submission = $this->assignmentService->submitAssignment($this->student, $this->assignment, $submissionData);
        
        $this->assignmentService->requestRevision($submission, $this->instructor, 'Needs more detail');

        $resubmissionData = ['content' => 'Updated submission with more details'];
        $resubmittedSubmission = $this->assignmentService->resubmitAssignment($submission, $resubmissionData);

        $this->assertEquals(AssignmentSubmission::STATUS_SUBMITTED, $resubmittedSubmission->status);
        $this->assertEquals('Updated submission with more details', $resubmittedSubmission->content);
        $this->assertNotNull($resubmittedSubmission->submitted_at);

        Event::assertDispatched(AssignmentSubmittedEvent::class);
    }

    public function test_it_awards_coins_for_approved_assignment()
    {
        // Submit and approve assignment
        $submissionData = ['content' => 'Test submission'];
        $submission = $this->assignmentService->submitAssignment($this->student, $this->assignment, $submissionData);
        $this->assignmentService->approveSubmission($submission, $this->instructor, 'Good work');

        // Check that coins were awarded
        $this->assertDatabaseHas('coin_transactions', [
            'user_id' => $this->student->id,
            'source_type' => 'assignment',
            'source_id' => $this->assignment->id,
            'amount' => 100,
            'transaction_type' => 'earned',
        ]);
    }

    public function test_it_does_not_award_coins_for_rejected_assignment()
    {
        // Submit and reject assignment
        $submissionData = ['content' => 'Test submission'];
        $submission = $this->assignmentService->submitAssignment($this->student, $this->assignment, $submissionData);
        $this->assignmentService->rejectSubmission($submission, $this->instructor, 'Needs work');

        // Check that no coins were awarded
        $this->assertDatabaseMissing('coin_transactions', [
            'user_id' => $this->student->id,
            'source_type' => 'assignment',
            'source_id' => $this->assignment->id,
        ]);
    }

    public function test_it_checks_user_submission_status()
    {
        $this->assertFalse($this->assignmentService->hasUserSubmitted($this->student, $this->assignment));
        $this->assertFalse($this->assignmentService->hasUserCompleted($this->student, $this->assignment));

        // Submit assignment
        $submissionData = ['content' => 'Test submission'];
        $submission = $this->assignmentService->submitAssignment($this->student, $this->assignment, $submissionData);

        $this->assertTrue($this->assignmentService->hasUserSubmitted($this->student, $this->assignment));
        $this->assertFalse($this->assignmentService->hasUserCompleted($this->student, $this->assignment));

        // Approve assignment
        $this->assignmentService->approveSubmission($submission, $this->instructor, 'Good work');

        $this->assertTrue($this->assignmentService->hasUserCompleted($this->student, $this->assignment));
    }

    public function test_it_gets_user_submission()
    {
        $this->assertNull($this->assignmentService->getUserSubmission($this->student, $this->assignment));

        $submissionData = ['content' => 'Test submission'];
        $submission = $this->assignmentService->submitAssignment($this->student, $this->assignment, $submissionData);

        $retrievedSubmission = $this->assignmentService->getUserSubmission($this->student, $this->assignment);
        $this->assertEquals($submission->id, $retrievedSubmission->id);
    }

    public function test_it_gets_pending_submissions()
    {
        // Create submissions for different assignments
        $submissionData = ['content' => 'Test submission'];
        $submission1 = $this->assignmentService->submitAssignment($this->student, $this->assignment, $submissionData);

        $anotherStudent = User::factory()->create(['role' => 'student']);
        UserProgress::factory()->create([
            'user_id' => $anotherStudent->id,
            'week_id' => $this->week->id,
            'is_unlocked' => true,
        ]);
        $submission2 = $this->assignmentService->submitAssignment($anotherStudent, $this->assignment, $submissionData);

        $pendingSubmissions = $this->assignmentService->getPendingSubmissions($this->assignment);
        
        $this->assertCount(2, $pendingSubmissions);
        $this->assertTrue($pendingSubmissions->contains('id', $submission1->id));
        $this->assertTrue($pendingSubmissions->contains('id', $submission2->id));
    }

    public function test_it_generates_assignment_statistics()
    {
        // Create some submissions with different statuses
        $submissionData = ['content' => 'Test submission'];
        
        $submission1 = $this->assignmentService->submitAssignment($this->student, $this->assignment, $submissionData);
        $this->assignmentService->approveSubmission($submission1, $this->instructor, 'Good');

        $anotherStudent = User::factory()->create(['role' => 'student']);
        UserProgress::factory()->create([
            'user_id' => $anotherStudent->id,
            'week_id' => $this->week->id,
            'is_unlocked' => true,
        ]);
        $submission2 = $this->assignmentService->submitAssignment($anotherStudent, $this->assignment, $submissionData);
        $this->assignmentService->rejectSubmission($submission2, $this->instructor, 'Needs work');

        $stats = $this->assignmentService->getAssignmentStatistics($this->assignment);

        $this->assertEquals(2, $stats['total_submissions']);
        $this->assertEquals(1, $stats['approved_submissions']);
        $this->assertEquals(1, $stats['rejected_submissions']);
        $this->assertEquals(0, $stats['pending_submissions']);
        $this->assertEquals(50, $stats['approval_rate']);
    }
}