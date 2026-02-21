<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CohortController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Controllers\Api\CoinController;
use App\Http\Controllers\Api\WeekController;
use App\Http\Controllers\Api\LessonController;
use App\Http\Controllers\Api\TopicController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\LiveClassController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\TestController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\CommunityController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Test endpoints (for development and API verification)
Route::get('/test', [TestController::class, 'index']);
Route::get('/test/courses', [TestController::class, 'courses']);
Route::get('/test/users', [TestController::class, 'users']);
Route::get('/test/gemini', [TestController::class, 'gemini']);

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/password/email', [\App\Http\Controllers\Api\PasswordResetController::class, 'sendResetLinkEmail']);
Route::post('/password/reset', [\App\Http\Controllers\Api\PasswordResetController::class, 'reset']);
Route::post('/contact', [PaymentController::class, 'contactSubmit']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Payments & Subscriptions
    Route::post('/payments/verify', [PaymentController::class, 'verifyPayment']);
    Route::post('/payments/bank-transfer', [PaymentController::class, 'logBankTransfer']);
    Route::get('/student/subscription/check', [PaymentController::class, 'checkSubscription']);
    // Authentication
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // Student Profile
    Route::get('/student/profile/stats', [ProfileController::class, 'getStats']);
    Route::post('/student/profile/update', [ProfileController::class, 'updateProfile']);

    // Cohorts
    Route::get('/cohorts', [CohortController::class, 'index']);
    Route::get('/student/courses/authorized', [CohortController::class, 'authorized']);
    Route::get('/cohorts/{cohort}', [CohortController::class, 'show']);
    Route::post('/cohorts/{cohort}/enroll', [CohortController::class, 'enroll']);
    Route::get('/cohorts/{cohort}/progress', [ProgressController::class, 'cohortProgress']);

    // Weeks
    Route::get('/weeks/{week}', [WeekController::class, 'show']);
    Route::get('/weeks/{week}/progress', [ProgressController::class, 'weekProgress']);
    Route::post('/weeks/{week}/evaluate-unlock', [WeekController::class, 'evaluateUnlock']);

    // Lessons
    Route::get('/lessons/{lesson}', [LessonController::class, 'show']);
    Route::get('/lessons/{lesson}/progress', [ProgressController::class, 'lessonProgress']);
    Route::post('/lessons/{lesson}/track-time', [ProgressController::class, 'trackLessonTime']);
    Route::post('/lessons/{lesson}/blocks/{blockId}/complete', [LessonController::class, 'completeBlock']);
    Route::get('/lessons/{lesson}/blocks/{blockId}/attempts', [LessonController::class, 'getBlockAttempts']);

    // Modules
    Route::get('/modules/{module}/progress', [ProgressController::class, 'moduleProgress']);

    // Topics
    Route::get('/topics/{topic}', [TopicController::class, 'show']);
    Route::post('/topics/{topic}/track-time', [ProgressController::class, 'trackTopicTime']);
    Route::post('/topics/{topic}/complete', [TopicController::class, 'complete']);

    // Quizzes
    Route::get('/quizzes/{quiz}', [QuizController::class, 'show']);
    Route::post('/quizzes/{quiz}/attempts', [QuizController::class, 'startAttempt']);
    Route::post('/quizzes/{quiz}/submit', [QuizController::class, 'submitAttempt']);

    // Assignments
    Route::get('/assignments/{assignment}', [AssignmentController::class, 'show']);
    Route::post('/assignments/{assignment}/submit', [AssignmentController::class, 'submit']);
    Route::post('/assignment-submissions/{submission}/approve', [AssignmentController::class, 'approve']);

    // Live Classes
    Route::get('/live-classes/{liveClass}', [LiveClassController::class, 'show']);
    Route::post('/live-classes/{liveClass}/attend', [LiveClassController::class, 'attend']);

    // Coins & Rewards
    Route::get('/students/me/coins', [CoinController::class, 'balance']);
    Route::get('/students/me/coin-ledger', [CoinController::class, 'ledger']);
    Route::get('/leaderboard', [CoinController::class, 'leaderboard']);
    Route::post('/coins/award', [CoinController::class, 'award']);

    // Progress sync
    Route::post('/student/progress/sync', [ProgressController::class, 'sync']);

    // Community & Discussions
    Route::get('/community', [CommunityController::class, 'index']);
    Route::post('/community/discussions', [CommunityController::class, 'store']);
    Route::post('/community/discussions/{discussion}/resolve', [CommunityController::class, 'resolve']);

    // Admin routes
    Route::middleware('can:admin-access')->prefix('admin')->group(function () {
        // Dashboard
        Route::get('/dashboard/stats', [AdminController::class, 'getDashboardStats']);
        Route::get('/stats/export', [AdminController::class, 'exportStatistics']);

        // Cohort management
        Route::post('/cohorts', [AdminController::class, 'createCohort']);
        Route::match(['PUT', 'PATCH'], '/cohorts/{cohort}', [AdminController::class, 'updateCohort']);
        Route::delete('/cohorts/{cohort}', [AdminController::class, 'deleteCohort']);
        Route::get('/cohorts/{cohort}/students', [\App\Http\Controllers\Api\CohortController::class, 'students']);
        Route::post('/cohorts/{cohort}/publish', [AdminController::class, 'publishCohort']);
        Route::post('/cohorts/{cohort}/duplicate', [AdminController::class, 'duplicateCohort']);
        Route::get('/cohorts/{cohort}/unenrolled', [AdminController::class, 'getUnenrolledUsers']);
        Route::post('/cohorts/{cohort}/enroll', [AdminController::class, 'enrollUser']);
        Route::delete('/cohorts/{cohort}/users/{user}', [AdminController::class, 'removeUser']);

        // Week management
        Route::post('/cohorts/{cohort}/weeks', [AdminController::class, 'createWeek']);
        Route::match(['PUT', 'PATCH'], '/weeks/{week}', [AdminController::class, 'updateWeek']);
        Route::delete('/weeks/{week}', [AdminController::class, 'deleteWeek']);

        // Content management
        Route::post('/courses/init', [AdminController::class, 'initializeCourse']);
        Route::get('/courses/structure', [AdminController::class, 'getStructure']);
        Route::post('/courses/persist-structure', [AdminController::class, 'persistStructure']);

        Route::post('/weeks/{week}/modules/create', [AdminController::class, 'createModule']);
        Route::match(['PUT', 'PATCH'], '/modules/{module}', [AdminController::class, 'updateModule']);
        Route::post('/modules/{module}/duplicate', [AdminController::class, 'duplicateModule']);
        Route::patch('/modules/{module}/move', [AdminController::class, 'moveModule']);
        Route::patch('/weeks/{week}/modules/reorder', [AdminController::class, 'reorderModules']);
        Route::delete('/curriculum/module/{module}', [AdminController::class, 'deleteModule']);

        Route::post('/modules/{module}/lessons/create', [AdminController::class, 'createLesson']);
        Route::match(['PUT', 'PATCH'], '/lessons/{lesson}', [AdminController::class, 'updateLesson']);
        Route::delete('/curriculum/lesson/{lesson}', [AdminController::class, 'deleteLesson']);

        Route::post('/lessons/{lesson}/topics/create', [AdminController::class, 'createTopic']);
        Route::match(['PUT', 'PATCH'], '/topics/{topic}', [AdminController::class, 'updateTopic']);
        Route::delete('/curriculum/topic/{topic}', [AdminController::class, 'deleteTopic']);

        // Media
        Route::post('/media/upload', [MediaController::class, 'upload']);
        Route::post('/media/upload-init', [MediaController::class, 'initiateChunkedUpload']);
        Route::post('/media/upload-chunk', [MediaController::class, 'uploadChunk']);
        Route::post('/media/upload-complete', [MediaController::class, 'completeChunkedUpload']);

        // Quick Actions
        Route::post('/command/execute', [AdminController::class, 'executeCommand']);

        // Instructor management
        Route::get('/instructors', [AdminController::class, 'getInstructors']);

        // AI Generation
        Route::post('/ai/generate', [\App\Http\Controllers\Api\AIContentController::class, 'generate']);

        // Email Templates
        Route::get('/email-templates', [\App\Http\Controllers\Api\Admin\EmailTemplateController::class, 'index']);
        Route::get('/email-templates/{emailTemplate}', [\App\Http\Controllers\Api\Admin\EmailTemplateController::class, 'show']);
        Route::match(['PUT', 'PATCH'], '/email-templates/{emailTemplate}', [\App\Http\Controllers\Api\Admin\EmailTemplateController::class, 'update']);
        Route::post('/email-templates/{emailTemplate}/test', [\App\Http\Controllers\Api\Admin\EmailTemplateController::class, 'test']);
        Route::post('/email-templates/broadcast', [\App\Http\Controllers\Api\Admin\EmailTemplateController::class, 'broadcast']);
    });

    // Debug routes (development only)
    Route::get('/debug/state', function (Request $request) {
        if (!app()->environment('local')) {
            abort(404);
        }

        $user = $request->user();
        return response()->json([
            'user' => $user->only(['id', 'name', 'email', 'role']),
            'enrollments' => $user->enrollments()->with('cohort')->get(),
            'coin_balance' => $user->coinBalance?->total_balance ?? 0,
            'recent_transactions' => $user->coinTransactions()->latest()->limit(5)->get(),
            'progress' => $user->progress()->with(['week', 'cohort'])->get(),
        ]);
    });
});

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'service' => 'DrealtiesFX Academy API',
        'version' => '1.0.0'
    ]);
});
