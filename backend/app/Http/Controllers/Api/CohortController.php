<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cohort;
use App\Models\User;
use App\Models\Enrollment;
use App\Models\TopicCompletion;
use App\Models\QuizAttempt;
use App\Models\AssignmentSubmission;
use App\Models\LiveAttendance;
use App\Models\LiveClass;
use App\Services\CohortService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Exceptions\EnrollmentException;

class CohortController extends Controller
{
    public function __construct(
        private CohortService $cohortService
    ) {}

    /**
     * Get list of cohorts
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|string|in:' . implode(',', Cohort::getStatuses()),
            'enrollable_only' => 'sometimes|boolean',
            'per_page' => 'sometimes|integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors()->toArray());
        }

        try {
            $query = Cohort::with(['weeks' => function ($query) {
                $query->select('id', 'cohort_id', 'week_number', 'title');
            }]);

            // Filter by status if provided
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Filter for enrollable cohorts only
            if ($request->boolean('enrollable_only')) {
                $query->enrollable();
            }

            // For students, only show published/active cohorts
            $user = $request->user();
            if ($user->isStudent()) {
                $query->published();
            }

            $perPage = $request->get('per_page', 15);
            $cohorts = $query->orderBy('start_date', 'desc')->paginate($perPage);

            // Transform cohort data
            $transformedCohorts = $cohorts->getCollection()->map(function ($cohort) use ($user) {
                $cohortData = [
                    'id' => $cohort->id,
                    'name' => $cohort->name,
                    'description' => $cohort->description,
                    'start_date' => $cohort->start_date->toDateString(),
                    'end_date' => $cohort->end_date->toDateString(),
                    'capacity' => $cohort->capacity,
                    'enrolled_count' => $cohort->enrolled_count,
                    'available_spots' => $cohort->available_spots,
                    'enrollment_percentage' => $cohort->enrollment_percentage,
                    'status' => $cohort->status,
                    'thumbnail_url' => $cohort->thumbnail_url,
                    'can_enroll' => $cohort->canEnroll(),
                    'has_started' => $cohort->hasStarted(),
                    'has_ended' => $cohort->hasEnded(),
                    'is_full' => $cohort->isFull(),
                    'week_count' => $cohort->weeks->count(),
                    'created_at' => $cohort->created_at->toISOString(),
                ];

                // Add enrollment status for authenticated user
                if ($user && $user->isStudent()) {
                    $cohortData['is_enrolled'] = $this->cohortService->isStudentEnrolled($user, $cohort);
                }

                return $cohortData;
            });

            return response()->json([
                'cohorts' => $transformedCohorts,
                'pagination' => [
                    'current_page' => $cohorts->currentPage(),
                    'last_page' => $cohorts->lastPage(),
                    'per_page' => $cohorts->perPage(),
                    'total' => $cohorts->total(),
                    'from' => $cohorts->firstItem(),
                    'to' => $cohorts->lastItem(),
                ],
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'cohorts_fetch_failed',
                'Failed to fetch cohorts: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Get authorized course for the current student
     */
    public function authorized(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user->isStudent() && !$user->isAdmin()) {
                return $this->forbiddenResponse('Only students or admins can access curriculum data');
            }

            // Get the student's active enrollment using the Enrollment model directly
            $enrollment = Enrollment::where('user_id', $user->id)
                ->where('status', Enrollment::STATUS_ACTIVE)
                ->with([
                    'cohort.weeks' => function ($q) {
                        $q->orderBy('week_number')
                            ->with(['modules' => function ($q) {
                                $q->orderBy('order')
                                    ->with(['lessons' => function ($q) {
                                        $q->orderBy('order')
                                            ->with(['topics' => function ($q) {
                                                $q->orderBy('order');
                                            }]);
                                    }]);
                            }, 'quizzes', 'assignments', 'liveClasses']);
                    }
                ])
                ->first();

            if (!$enrollment || !$enrollment->cohort) {
                if ($user->isAdmin()) {
                    $cohort = \App\Models\Cohort::orderBy('id', 'desc')->with([
                        'weeks' => function ($q) {
                            $q->orderBy('week_number')
                                ->with(['modules' => function ($q) {
                                    $q->orderBy('order')
                                        ->with(['lessons' => function ($q) {
                                            $q->orderBy('order')
                                                ->with(['topics' => function ($q) {
                                                    $q->orderBy('order');
                                                }]);
                                        }]);
                                }, 'quizzes', 'assignments', 'liveClasses']);
                        }
                    ])->first();
                }

                if (!isset($cohort) || !$cohort) {
                    // Return empty if no enrollment and no default cohort found for admin
                    return response()->json([
                        'id' => 'no-active-course',
                        'title' => 'No Active Course',
                        'program' => 'DrealtiesFX Academy Foundation',
                        'shortDescription' => 'Enroll in a cohort to start your journey.',
                        'outcomes' => [],
                        'prerequisites' => [],
                        'category' => 'Forex',
                        'skillLevel' => 'Beginner',
                        'duration' => 'N/A',
                        'visibility' => 'Published',
                        'linkedCohorts' => [],
                        'weeks' => []
                    ]);
                }
            } else {
                $cohort = $enrollment->cohort;
            }

            // Fetch student completion data for the entire cohort
            $completedTopicIds = TopicCompletion::where('user_id', $user->id)->pluck('topic_id')->toArray();
            $passedQuizIds = QuizAttempt::where('user_id', $user->id)->where('passed', true)->pluck('quiz_id')->unique()->toArray();
            $approvedAssignmentIds = AssignmentSubmission::where('user_id', $user->id)->where('status', 'approved')->pluck('assignment_id')->unique()->toArray();
            $attendedLiveClassIds = LiveAttendance::where('user_id', $user->id)->pluck('live_class_id')->toArray();
            
            // Fetch lesson block completions (for embedded quizzes, assignments, etc.)
            $lessonBlockCompletions = \App\Models\LessonBlockCompletion::where('user_id', $user->id)
                ->where('is_completed', true)
                ->get()
                ->groupBy(function ($completion) {
                    return $completion->lesson_id . '_' . $completion->block_id;
                })
                ->map(function ($completions) {
                    // Get the latest attempt for each block
                    return $completions->sortByDesc('attempt_number')->first();
                });

            // Transform Cohort to CourseData structure
            $courseData = [
                'id' => (string) $cohort->id,
                'title' => $cohort->name,
                'program' => 'DrealtiesFX Academy Pro',
                'shortDescription' => $cohort->description,
                'outcomes' => [
                    ['id' => '1', 'text' => 'Master market structure analysis'],
                    ['id' => '2', 'text' => 'Implement advanced risk management'],
                    ['id' => '3', 'text' => 'Execute high-probability liquidity trades']
                ],
                'prerequisites' => [
                    ['id' => '1', 'text' => 'Basic understanding of trading terminology'],
                    ['id' => '2', 'text' => 'MetaTrader 4/5 account setup']
                ],
                'category' => 'Forex',
                'skillLevel' => 'Intermediate',
                'duration' => '8 Weeks',
                'visibility' => 'Published',
                'coinBalance' => $user->getCurrentCoinBalance(),
                'resumeTopic' => (function () use ($cohort, $completedTopicIds) {
                    foreach ($cohort->weeks as $week) {
                        foreach ($week->modules as $module) {
                            foreach ($module->lessons as $lesson) {
                                foreach ($lesson->topics as $topic) {
                                    if (!in_array($topic->id, $completedTopicIds)) {
                                        return [
                                            'topicId' => (string) $topic->id,
                                            'lessonId' => (string) $lesson->id,
                                            'moduleId' => (string) $module->id,
                                            'title' => $topic->title,
                                        ];
                                    }
                                }
                            }
                        }
                    }
                    return null;
                })(),
                'upcomingTasks' => (function () use ($cohort, $passedQuizIds, $approvedAssignmentIds) {
                    $tasks = [];
                    foreach ($cohort->weeks as $week) {
                        foreach ($week->modules as $module) {
                            foreach ($module->lessons as $lesson) {
                                $blocks = is_array($lesson->lesson_blocks) ? array_values($lesson->lesson_blocks) : [];
                                foreach ($blocks as $block) {
                                    if ($block['type'] === 'quiz' && isset($block['payload']['quizId'])) {
                                        if (!in_array($block['payload']['quizId'], $passedQuizIds)) {
                                            $tasks[] = [
                                                'id' => (string) $block['payload']['quizId'],
                                                'title' => $block['payload']['title'] ?? 'Pending Quiz',
                                                'course' => $cohort->name,
                                                'due' => 'Requirement',
                                                'type' => 'Quiz'
                                            ];
                                        }
                                    } elseif ($block['type'] === 'assignment' && isset($block['payload']['assignmentId'])) {
                                        if (!in_array($block['payload']['assignmentId'], $approvedAssignmentIds)) {
                                            $tasks[] = [
                                                'id' => (string) $block['payload']['assignmentId'],
                                                'title' => $block['payload']['title'] ?? 'Pending Assignment',
                                                'course' => $cohort->name,
                                                'due' => 'Next Phase',
                                                'type' => 'Assignment'
                                            ];
                                        }
                                    }
                                    if (count($tasks) >= 2) return $tasks;
                                }
                            }
                        }
                    }
                    return $tasks;
                })(),
                'upcomingClasses' => LiveClass::whereIn('week_id', $cohort->weeks->pluck('id'))
                    ->where('scheduled_at', '>', now())
                    ->orderBy('scheduled_at', 'asc')
                    ->limit(2)
                    ->get()
                    ->map(fn($lc) => [
                        'id' => (string) $lc->id,
                        'title' => $lc->title,
                        'time' => $lc->scheduled_at->diffForHumans(),
                        'instructor' => 'Academy Instructor'
                    ]),
                'activityFeed' => TopicCompletion::where('user_id', $user->id)
                    ->with('topic')
                    ->orderBy('completed_at', 'desc')
                    ->limit(3)
                    ->get()
                    ->map(fn($tc) => [
                        'type' => 'Topic Completed',
                        'title' => $tc->topic->title,
                        'timestamp' => $tc->completed_at->diffForHumans()
                    ]),
                'linkedCohorts' => [
                    [
                        'id' => (string) $cohort->id,
                        'name' => $cohort->name,
                        'studentCount' => $cohort->enrolled_count,
                        'maxStudents' => $cohort->capacity,
                        'startDate' => $cohort->start_date?->toDateString(),
                        'endDate' => $cohort->end_date?->toDateString(),
                    ]
                ],
                'weeks' => $cohort->weeks->map(function ($week) use ($completedTopicIds, $passedQuizIds, $approvedAssignmentIds, $attendedLiveClassIds, $lessonBlockCompletions) {
                    return [
                        'id' => (string) $week->id,
                        'cohortId' => (string) $week->cohort_id,
                        'number' => $week->week_number,
                        'title' => $week->title,
                        'thumbnailUrl' => $week->thumbnail_url ?? 'https://picsum.photos/seed/week' . $week->week_number . '/300/200',
                        'isFree' => (bool) $week->is_free,
                        'lockPolicy' => [
                            'lockedByDefault' => $week->week_number > 0, // Lock everything after week 0 by default
                            'minCompletionPercent' => 80,
                            'minCoinsToUnlockNextWeek' => 100,
                        ],
                        'modules' => $week->modules->map(function ($module) use ($completedTopicIds, $passedQuizIds, $approvedAssignmentIds, $attendedLiveClassIds, $lessonBlockCompletions) {
                            return [
                                'id' => (string) $module->id,
                                'weekId' => (string) $module->week_id,
                                'title' => $module->title,
                                'order' => $module->order,
                                'position' => $module->position,
                                'lessons' => $module->lessons->map(function ($lesson) use ($completedTopicIds, $passedQuizIds, $approvedAssignmentIds, $attendedLiveClassIds, $lessonBlockCompletions) {
                                    return [
                                        'id' => (string) $lesson->id,
                                        'number' => (string) $lesson->number,
                                        'title' => $lesson->title,
                                        'description' => $lesson->description,
                                        'thumbnailUrl' => $lesson->thumbnail_url ?? 'https://picsum.photos/seed/lesson' . $lesson->id . '/300/200',
                                        'order' => $lesson->order,
                                        'status' => $lesson->status,
                                        'isLocked' => false,
                                        'isFree' => $lesson->is_free,
                                        'topics' => $lesson->topics->map(function ($topic) use ($completedTopicIds) {
                                            return [
                                                'id' => (string) $topic->id,
                                                'title' => $topic->title,
                                                'description' => $topic->description,
                                                'thumbnailUrl' => $topic->thumbnail_url ?? 'https://picsum.photos/seed/topic' . $topic->id . '/300/200',
                                                'order' => $topic->order,
                                                'blocks' => $topic->blocks ?? [],
                                                'progressPercent' => in_array($topic->id, $completedTopicIds) ? 100 : 0,
                                                'isCompleted' => in_array($topic->id, $completedTopicIds),
                                            ];
                                        })->toArray(),
                                        'lessonBlocks' => collect(is_array($lesson->lesson_blocks) ? array_values($lesson->lesson_blocks) : [])
                                            ->map(function ($block) use ($lesson, $passedQuizIds, $approvedAssignmentIds, $attendedLiveClassIds, $lessonBlockCompletions) {
                                                $isCompleted = false;
                                                $blockKey = $lesson->id . '_' . ($block['id'] ?? '');
                                                
                                                // Check lesson block completions first (for embedded quizzes/assignments)
                                                if (isset($lessonBlockCompletions[$blockKey])) {
                                                    $completion = $lessonBlockCompletions[$blockKey];
                                                    $isCompleted = $completion->is_completed;
                                                    $block['attemptNumber'] = $completion->attempt_number;
                                                    $block['scorePercentage'] = $completion->score_percentage;
                                                    $block['passed'] = $completion->passed;
                                                    $block['coinsEarned'] = $completion->coins_awarded;
                                                }
                                                // Fallback to database records (for standalone quizzes/assignments)
                                                elseif ($block['type'] === 'quiz' && isset($block['payload']['quizId'])) {
                                                    $isCompleted = in_array($block['payload']['quizId'], $passedQuizIds);
                                                } elseif ($block['type'] === 'assignment' && isset($block['payload']['assignmentId'])) {
                                                    $isCompleted = in_array($block['payload']['assignmentId'], $approvedAssignmentIds);
                                                } elseif ($block['type'] === 'live' && isset($block['payload']['liveClassId'])) {
                                                    $isCompleted = in_array($block['payload']['liveClassId'], $attendedLiveClassIds);
                                                }
                                                
                                                $block['isCompleted'] = $isCompleted;
                                                $block['lessonId'] = (string) $lesson->id;
                                                return $block;
                                            })->toArray()
                                    ];
                                })->toArray()
                            ];
                        })->toArray(),
                        'lessons' => [] // Fallback for old frontend versions
                    ];
                })->toArray()
            ];

            return response()->json($courseData);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'authorized_course_fetch_failed',
                'Failed to fetch authorized course: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Get specific cohort details
     */
    public function show(Request $request, Cohort $cohort): JsonResponse
    {
        try {
            $user = $request->user();

            // Load relationships
            $cohort->load([
                'weeks' => function ($query) {
                    $query->orderBy('week_number')
                        ->with(['lessons.topics', 'quizzes', 'assignments', 'liveClasses']);
                }
            ]);

            $cohortData = [
                'id' => $cohort->id,
                'name' => $cohort->name,
                'description' => $cohort->description,
                'start_date' => $cohort->start_date->toDateString(),
                'end_date' => $cohort->end_date->toDateString(),
                'capacity' => $cohort->capacity,
                'enrolled_count' => $cohort->enrolled_count,
                'available_spots' => $cohort->available_spots,
                'enrollment_percentage' => $cohort->enrollment_percentage,
                'status' => $cohort->status,
                'thumbnail_url' => $cohort->thumbnail_url,
                'settings' => $cohort->settings,
                'can_enroll' => $cohort->canEnroll(),
                'has_started' => $cohort->hasStarted(),
                'has_ended' => $cohort->hasEnded(),
                'is_full' => $cohort->isFull(),
                'created_at' => $cohort->created_at->toISOString(),
                'weeks' => $cohort->weeks->map(function ($week) {
                    return [
                        'id' => $week->id,
                        'week_number' => $week->week_number,
                        'title' => $week->title,
                        'description' => $week->description,
                        'lesson_count' => $week->lessons->count(),
                        'topic_count' => $week->lessons->sum(fn($lesson) => $lesson->topics->count()),
                        'quiz_count' => $week->quizzes->count(),
                        'assignment_count' => $week->assignments->count(),
                        'live_class_count' => $week->liveClasses->count(),
                    ];
                }),
            ];

            // Add enrollment and progress info for students
            if ($user && $user->isStudent()) {
                $isEnrolled = $this->cohortService->isStudentEnrolled($user, $cohort);
                $cohortData['is_enrolled'] = $isEnrolled;

                if ($isEnrolled) {
                    $enrollment = $user->enrollments()
                        ->where('cohort_id', $cohort->id)
                        ->first();

                    $cohortData['enrollment'] = [
                        'enrolled_at' => $enrollment->pivot->enrolled_at,
                        'status' => $enrollment->pivot->status,
                        'completion_percentage' => $enrollment->pivot->completion_percentage,
                    ];
                }
            }

            // Add statistics for instructors/admins
            if ($user && ($user->isInstructor() || $user->isAdmin())) {
                $cohortData['statistics'] = $this->cohortService->getCohortStats($cohort);
            }

            return response()->json([
                'cohort' => $cohortData,
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'cohort_fetch_failed',
                'Failed to fetch cohort details',
                500
            );
        }
    }

    /**
     * Enroll student in cohort
     */
    public function enroll(Request $request, Cohort $cohort): JsonResponse
    {
        $user = $request->user();

        // Only students can enroll
        if (!$user->isStudent()) {
            return $this->forbiddenResponse('Only students can enroll in cohorts');
        }

        try {
            $enrollment = $this->cohortService->enrollStudent($user, $cohort);

            return response()->json([
                'message' => 'Successfully enrolled in cohort',
                'enrollment' => [
                    'id' => $enrollment->id,
                    'cohort_id' => $cohort->id,
                    'cohort_name' => $cohort->name,
                    'enrolled_at' => $enrollment->enrolled_at->toISOString(),
                    'status' => $enrollment->status,
                    'completion_percentage' => $enrollment->completion_percentage,
                ],
                'cohort' => [
                    'id' => $cohort->id,
                    'name' => $cohort->name,
                    'start_date' => $cohort->start_date->toDateString(),
                    'enrolled_count' => $cohort->fresh()->enrolled_count,
                    'available_spots' => $cohort->fresh()->available_spots,
                ],
                'timestamp' => now()->toISOString()
            ], 201);
        } catch (EnrollmentException $e) {
            return $this->errorResponse(
                'enrollment_failed',
                $e->getMessage(),
                400
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'enrollment_error',
                'An error occurred during enrollment',
                500
            );
        }
    }

    /**
     * Withdraw from cohort (for students)
     */
    public function withdraw(Request $request, Cohort $cohort): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStudent()) {
            return $this->forbiddenResponse('Only students can withdraw from cohorts');
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'sometimes|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors()->toArray());
        }

        try {
            $this->cohortService->withdrawStudent(
                $user,
                $cohort,
                $request->get('reason')
            );

            return response()->json([
                'message' => 'Successfully withdrawn from cohort',
                'cohort' => [
                    'id' => $cohort->id,
                    'name' => $cohort->name,
                    'enrolled_count' => $cohort->fresh()->enrolled_count,
                    'available_spots' => $cohort->fresh()->available_spots,
                ],
                'timestamp' => now()->toISOString()
            ]);
        } catch (EnrollmentException $e) {
            return $this->errorResponse(
                'withdrawal_failed',
                $e->getMessage(),
                400
            );
        } catch (\Exception $e) {
            return $this->errorResponse(
                'withdrawal_error',
                'An error occurred during withdrawal',
                500
            );
        }
    }

    /**
     * Get cohort students (for instructors/admins)
     */
    public function students(Request $request, Cohort $cohort): JsonResponse
    {
        $user = $request->user();

        if (!$user->isInstructor() && !$user->isAdmin()) {
            return $this->forbiddenResponse('Access denied');
        }

        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|string|in:' . implode(',', \App\Models\Enrollment::getStatuses()),
            'per_page' => 'sometimes|integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors()->toArray());
        }

        try {
            $query = $cohort->enrollments()->with(['user']);

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $perPage = $request->get('per_page', 20);
            $enrollments = $query->orderBy('enrolled_at', 'desc')->paginate($perPage);

            $students = $enrollments->getCollection()->map(function ($enrollment) {
                return [
                    'enrollment_id' => $enrollment->id,
                    'user' => [
                        'id' => $enrollment->user->id,
                        'name' => $enrollment->user->name,
                        'email' => $enrollment->user->email,
                        'avatar_url' => $enrollment->user->avatar_url,
                        'last_active_at' => $enrollment->user->last_active_at?->toISOString(),
                    ],
                    'enrolled_at' => $enrollment->enrolled_at->toISOString(),
                    'status' => $enrollment->status,
                    'completion_percentage' => $enrollment->completion_percentage,
                    'completed_at' => $enrollment->completed_at?->toISOString(),
                ];
            });

            return response()->json([
                'students' => $students,
                'pagination' => [
                    'current_page' => $enrollments->currentPage(),
                    'last_page' => $enrollments->lastPage(),
                    'per_page' => $enrollments->perPage(),
                    'total' => $enrollments->total(),
                ],
                'statistics' => $this->cohortService->getCohortStats($cohort),
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'students_fetch_failed',
                'Failed to fetch cohort students',
                500
            );
        }
    }
}
