<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LiveClass;
use App\Models\LiveAttendance;
use App\Models\UserProgress;
use App\Services\LiveClassService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Exceptions\LiveClassException;

class LiveClassController extends Controller
{
    public function __construct(
        private LiveClassService $liveClassService
    ) {}

    /**
     * Get live class details
     */
    public function show(Request $request, LiveClass $liveClass): JsonResponse
    {
        $user = $request->user();

        try {
            // Check if user has access to this live class's week
            if ($user->isStudent()) {
                $progress = UserProgress::where('user_id', $user->id)
                    ->where('week_id', $liveClass->week_id)
                    ->first();

                if (!$progress || !$progress->is_unlocked) {
                    return $this->forbiddenResponse('The week containing this live class is not yet unlocked');
                }
            }

            // Load live class with relationships
            $liveClass->load([
                'week' => function ($query) {
                    $query->with('cohort:id,name');
                }
            ]);

            $liveClassData = [
                'id' => $liveClass->id,
                'title' => $liveClass->title,
                'description' => $liveClass->description,
                'scheduled_at' => $liveClass->scheduled_at->toISOString(),
                'duration_minutes' => $liveClass->duration_minutes,
                'meeting_url' => $liveClass->meeting_url,
                'meeting_id' => $liveClass->meeting_id,
                'meeting_password' => $liveClass->meeting_password,
                'coin_reward' => $liveClass->coin_reward,
                'status' => $liveClass->status,
                'instructor_notes' => $liveClass->instructor_notes,
                'recording_url' => $liveClass->recording_url,
                'week' => [
                    'id' => $liveClass->week->id,
                    'week_number' => $liveClass->week->week_number,
                    'title' => $liveClass->week->title,
                    'cohort' => [
                        'id' => $liveClass->week->cohort->id,
                        'name' => $liveClass->week->cohort->name,
                    ],
                ],
                'timing' => [
                    'is_upcoming' => $liveClass->scheduled_at->isFuture(),
                    'is_live' => $liveClass->status === 'live',
                    'has_ended' => $liveClass->status === 'ended',
                    'starts_in_minutes' => $liveClass->scheduled_at->isFuture() ?
                        now()->diffInMinutes($liveClass->scheduled_at) : null,
                    'ended_at' => $liveClass->ended_at?->toISOString(),
                ],
            ];

            // Add attendance information for students
            if ($user && $user->isStudent()) {
                $attendance = $user->liveAttendance()
                    ->where('live_class_id', $liveClass->id)
                    ->first();

                $liveClassData['attendance'] = $attendance ? [
                    'id' => $attendance->id,
                    'attended_at' => $attendance->attended_at->toISOString(),
                    'left_at' => $attendance->left_at?->toISOString(),
                    'duration_minutes' => $attendance->duration_minutes,
                    'coins_awarded' => $attendance->coins_awarded,
                    'attendance_percentage' => $attendance->attendance_percentage,
                ] : null;

                $liveClassData['has_attended'] = !is_null($attendance);
                $liveClassData['can_join'] = $liveClass->status === 'live' ||
                    ($liveClass->status === 'scheduled' && $liveClass->scheduled_at->diffInMinutes(now()) <= 15);
            }

            // Add live class statistics for instructors/admins
            if ($user && ($user->isInstructor() || $user->isAdmin())) {
                $liveClassData['statistics'] = $this->liveClassService->getLiveClassStatistics($liveClass);

                // Include meeting management controls
                $liveClassData['controls'] = [
                    'can_start' => $liveClass->status === 'scheduled',
                    'can_end' => $liveClass->status === 'live',
                    'can_update' => in_array($liveClass->status, ['scheduled', 'live']),
                ];
            }

            return response()->json([
                'live_class' => $liveClassData,
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'live_class_fetch_failed',
                'Failed to fetch live class details',
                500
            );
        }
    }

    /**
     * Join/attend live class
     */
    public function attend(Request $request, LiveClass $liveClass): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStudent()) {
            return $this->forbiddenResponse('Only students can attend live classes');
        }

        $validator = Validator::make($request->all(), [
            'join_time' => 'sometimes|date',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors()->toArray());
        }

        try {
            Log::debug('Attempting attendance recording', ['user_id' => $user->id, 'live_class_id' => $liveClass->id]);
            // Check if user can attend this live class
            if (!$this->liveClassService->canUserAttend($user, $liveClass)) {
                Log::debug('Attendance not allowed', ['user_id' => $user->id, 'live_class_id' => $liveClass->id]);
                return $this->errorResponse(
                    'attendance_not_allowed',
                    'You cannot attend this live class at this time',
                    400
                );
            }

            $joinTime = $request->get('join_time') ?
                \Carbon\Carbon::parse($request->get('join_time')) : now();

            Log::debug('Recording attendance via service', ['user_id' => $user->id, 'live_class_id' => $liveClass->id, 'join_time' => $joinTime->toISOString()]);
            $attendance = $this->liveClassService->recordAttendance($user, $liveClass, $joinTime);
            Log::debug('Attendance recorded successfully', ['attendance_id' => $attendance->id]);

            return response()->json([
                'message' => 'Attendance recorded successfully',
                'live_class' => [
                    'id' => $liveClass->id,
                    'title' => $liveClass->title,
                    'meeting_url' => $liveClass->meeting_url,
                    'meeting_id' => $liveClass->meeting_id,
                    'meeting_password' => $liveClass->meeting_password,
                ],
                'attendance' => [
                    'id' => $attendance->id,
                    'attended_at' => $attendance->attended_at->toISOString(),
                    'coins_potential' => $liveClass->coin_reward,
                ],
                'instructions' => [
                    'message' => 'You can now join the live class using the meeting details provided',
                    'note' => 'Coins will be awarded based on your attendance duration when the class ends',
                ],
                'timestamp' => now()->toISOString()
            ], 201);
        } catch (LiveClassException $e) {
            return $this->errorResponse(
                'attendance_failed',
                $e->getMessage(),
                400
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'attendance_error',
                'An error occurred while recording attendance',
                500
            );
        }
    }

    /**
     * Leave live class (update attendance duration)
     */
    public function leave(Request $request, LiveClass $liveClass): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStudent()) {
            return $this->forbiddenResponse('Only students can leave live classes');
        }

        $validator = Validator::make($request->all(), [
            'leave_time' => 'sometimes|date',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors()->toArray());
        }

        try {
            $attendance = $user->liveAttendance()
                ->where('live_class_id', $liveClass->id)
                ->whereNull('left_at')
                ->first();

            if (!$attendance) {
                return $this->errorResponse(
                    'attendance_not_found',
                    'No active attendance record found for this live class',
                    404
                );
            }

            $leaveTime = $request->get('leave_time') ?
                \Carbon\Carbon::parse($request->get('leave_time')) : now();

            $updatedAttendance = $this->liveClassService->updateAttendanceLeaveTime($attendance, $leaveTime);

            return response()->json([
                'message' => 'Leave time recorded successfully',
                'attendance' => [
                    'id' => $updatedAttendance->id,
                    'attended_at' => $updatedAttendance->attended_at->toISOString(),
                    'left_at' => $updatedAttendance->left_at->toISOString(),
                    'duration_minutes' => $updatedAttendance->duration_minutes,
                    'attendance_percentage' => $updatedAttendance->attendance_percentage,
                ],
                'note' => 'Final coins will be awarded when the live class officially ends',
                'timestamp' => now()->toISOString()
            ]);
        } catch (LiveClassException $e) {
            return $this->errorResponse(
                'leave_recording_failed',
                $e->getMessage(),
                400
            );
        } catch (\Exception $e) {
            file_put_contents(storage_path('logs/debug_exception.txt'), $e->getMessage() . "\n" . $e->getTraceAsString());
            Log::error('Attendance recording failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'An internal error occurred', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Start live class (for instructors/admins)
     */
    public function start(Request $request, LiveClass $liveClass): JsonResponse
    {
        $user = $request->user();

        if (!$user->isInstructor() && !$user->isAdmin()) {
            return $this->forbiddenResponse('Only instructors and admins can start live classes');
        }

        try {
            if ($liveClass->status !== 'scheduled') {
                return $this->errorResponse(
                    'invalid_status',
                    'Live class can only be started if it is scheduled',
                    400
                );
            }

            $this->liveClassService->startLiveClass($liveClass, $user);

            return response()->json([
                'message' => 'Live class started successfully',
                'live_class' => [
                    'id' => $liveClass->id,
                    'title' => $liveClass->title,
                    'status' => $liveClass->fresh()->status,
                    'started_at' => $liveClass->fresh()->started_at->toISOString(),
                    'meeting_url' => $liveClass->meeting_url,
                ],
                'timestamp' => now()->toISOString()
            ]);
        } catch (LiveClassException $e) {
            return $this->errorResponse(
                'start_failed',
                $e->getMessage(),
                400
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'start_error',
                'An error occurred while starting the live class',
                500
            );
        }
    }

    /**
     * End live class (for instructors/admins)
     */
    public function end(Request $request, LiveClass $liveClass): JsonResponse
    {
        $user = $request->user();

        if (!$user->isInstructor() && !$user->isAdmin()) {
            return $this->forbiddenResponse('Only instructors and admins can end live classes');
        }

        $validator = Validator::make($request->all(), [
            'recording_url' => 'sometimes|url',
            'summary' => 'sometimes|string|max:2000',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors()->toArray());
        }

        try {
            if ($liveClass->status !== 'live') {
                return $this->errorResponse(
                    'invalid_status',
                    'Live class can only be ended if it is currently live',
                    400
                );
            }

            $endData = [
                'recording_url' => $request->get('recording_url'),
                'summary' => $request->get('summary'),
            ];

            $result = $this->liveClassService->endLiveClass($liveClass, $user, $endData);

            return response()->json([
                'message' => 'Live class ended successfully',
                'live_class' => [
                    'id' => $liveClass->id,
                    'title' => $liveClass->title,
                    'status' => $liveClass->fresh()->status,
                    'ended_at' => $liveClass->fresh()->ended_at->toISOString(),
                    'recording_url' => $liveClass->fresh()->recording_url,
                ],
                'attendance_summary' => [
                    'total_attendees' => $result['total_attendees'],
                    'coins_distributed' => $result['coins_distributed'],
                    'average_attendance_duration' => $result['average_attendance_duration'],
                ],
                'timestamp' => now()->toISOString()
            ]);
        } catch (LiveClassException $e) {
            return $this->errorResponse(
                'end_failed',
                $e->getMessage(),
                400
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'end_error',
                'An error occurred while ending the live class',
                500
            );
        }
    }

    /**
     * Get live class attendance (for instructors/admins)
     */
    public function attendance(Request $request, LiveClass $liveClass): JsonResponse
    {
        $user = $request->user();

        if (!$user->isInstructor() && !$user->isAdmin()) {
            return $this->forbiddenResponse('Access denied');
        }

        try {
            $attendances = $liveClass->attendances()
                ->with(['user:id,name,email'])
                ->orderBy('attended_at')
                ->get();

            $attendanceData = $attendances->map(function ($attendance) {
                return [
                    'id' => $attendance->id,
                    'user' => [
                        'id' => $attendance->user->id,
                        'name' => $attendance->user->name,
                        'email' => $attendance->user->email,
                    ],
                    'attended_at' => $attendance->attended_at->toISOString(),
                    'left_at' => $attendance->left_at?->toISOString(),
                    'duration_minutes' => $attendance->duration_minutes,
                    'attendance_percentage' => $attendance->attendance_percentage,
                    'coins_awarded' => $attendance->coins_awarded,
                    'is_still_attending' => is_null($attendance->left_at) && $liveClass->status === 'live',
                ];
            });

            return response()->json([
                'live_class' => [
                    'id' => $liveClass->id,
                    'title' => $liveClass->title,
                    'status' => $liveClass->status,
                    'scheduled_at' => $liveClass->scheduled_at->toISOString(),
                    'started_at' => $liveClass->started_at?->toISOString(),
                    'ended_at' => $liveClass->ended_at?->toISOString(),
                    'duration_minutes' => $liveClass->duration_minutes,
                ],
                'attendance' => $attendanceData,
                'statistics' => $this->liveClassService->getLiveClassStatistics($liveClass),
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'attendance_fetch_failed',
                'Failed to fetch live class attendance',
                500
            );
        }
    }

    /**
     * Get live class statistics (for instructors/admins)
     */
    public function statistics(Request $request, LiveClass $liveClass): JsonResponse
    {
        $user = $request->user();

        if (!$user->isInstructor() && !$user->isAdmin()) {
            return $this->forbiddenResponse('Access denied');
        }

        try {
            $statistics = $this->liveClassService->getLiveClassStatistics($liveClass);

            return response()->json([
                'live_class' => [
                    'id' => $liveClass->id,
                    'title' => $liveClass->title,
                    'week_number' => $liveClass->week->week_number,
                    'scheduled_at' => $liveClass->scheduled_at->toISOString(),
                    'status' => $liveClass->status,
                    'coin_reward' => $liveClass->coin_reward,
                ],
                'statistics' => $statistics,
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'live_class_statistics_fetch_failed',
                'Failed to fetch live class statistics',
                500
            );
        }
    }
}
