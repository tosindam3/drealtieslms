<?php

use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Starting Curriculum Cleanup (DB Facade Mode)...\n";

DB::statement('SET FOREIGN_KEY_CHECKS=0;');
DB::table('topics')->delete();
DB::table('lessons')->delete();
DB::table('modules')->delete();
DB::table('weeks')->delete();
DB::table('quizzes')->delete();
DB::table('assignments')->delete();
DB::table('live_classes')->delete();
DB::table('user_progress')->delete();
DB::table('enrollments')->delete();
DB::statement('SET FOREIGN_KEY_CHECKS=1;');

echo "Database Cleared.\n";

$now = now();
$cohortId = 1;

// 1. Ensure Cohort 1 exists
DB::table('cohorts')->updateOrInsert(
    ['id' => $cohortId],
    [
        'name' => 'Cohort 1',
        'status' => 'active',
        'start_date' => $now,
        'end_date' => $now->copy()->addMonths(3),
        'capacity' => 100,
        'enrolled_count' => 1,
        'created_at' => $now,
        'updated_at' => $now,
    ]
);

// 2. Week 0
$w0Id = DB::table('weeks')->insertGetId([
    'cohort_id' => $cohortId,
    'week_number' => 0,
    'title' => 'Fundamentals of Forex',
    'description' => 'Master the basics of currency trading and market mechanics.',
    'is_free' => true,
    'unlock_rules' => json_encode(['locked_by_default' => false, 'min_completion_percent' => 0]),
    'created_at' => $now,
    'updated_at' => $now
]);

$m0Id = DB::table('modules')->insertGetId([
    'week_id' => $w0Id,
    'title' => 'Academy Orientation',
    'order' => 1,
    'position' => 1,
    'created_at' => $now,
    'updated_at' => $now
]);

$l0Id = DB::table('lessons')->insertGetId([
    'module_id' => $m0Id,
    'number' => '0.1',
    'title' => 'Introduction to the Markets',
    'order' => 1,
    'status' => 'published',
    'is_free' => true,
    'lesson_blocks' => '[]',
    'created_at' => $now,
    'updated_at' => $now
]);

DB::table('topics')->insert([
    'lesson_id' => $l0Id,
    'title' => 'The DrealtiesFX Philosophy',
    'order' => 1,
    'blocks' => '[]',
    'created_at' => $now,
    'updated_at' => $now
]);

// 3. Week 1
$w1Id = DB::table('weeks')->insertGetId([
    'cohort_id' => $cohortId,
    'week_number' => 1,
    'title' => 'Institutional Order Flow',
    'description' => 'Understanding how big banks move the market.',
    'is_free' => false,
    'unlock_rules' => json_encode(['locked_by_default' => true, 'min_completion_percent' => 90]),
    'created_at' => $now,
    'updated_at' => $now
]);

$m1Id = DB::table('modules')->insertGetId([
    'week_id' => $w1Id,
    'title' => 'Market Structure',
    'order' => 1,
    'position' => 1,
    'created_at' => $now,
    'updated_at' => $now
]);

$l1Id = DB::table('lessons')->insertGetId([
    'module_id' => $m1Id,
    'number' => '1.1',
    'title' => 'Supply & Demand Zones',
    'order' => 1,
    'status' => 'published',
    'is_free' => false,
    'lesson_blocks' => '[]',
    'created_at' => $now,
    'updated_at' => $now
]);

// 4. Week 2
$w2Id = DB::table('weeks')->insertGetId([
    'cohort_id' => $cohortId,
    'week_number' => 2,
    'title' => 'Related Forex Based Content',
    'description' => 'Deep dive into advanced liquidity mapping and execution.',
    'is_free' => false,
    'unlock_rules' => json_encode(['locked_by_default' => true, 'min_completion_percent' => 90]),
    'created_at' => $now,
    'updated_at' => $now
]);

$m2Id = DB::table('modules')->insertGetId([
    'week_id' => $w2Id,
    'title' => 'Advanced Analysis',
    'order' => 1,
    'position' => 1,
    'created_at' => $now,
    'updated_at' => $now
]);

$l2Id = DB::table('lessons')->insertGetId([
    'module_id' => $m2Id,
    'number' => '2.1',
    'title' => 'Liquidity & Stop Hunting',
    'order' => 1,
    'status' => 'published',
    'is_free' => false,
    'lesson_blocks' => '[]',
    'created_at' => $now,
    'updated_at' => $now
]);

echo "Curriculum Rebuilt Successfully via DB Facade.\n";

// 5. Enroll Admin
$admin = DB::table('users')->where('email', 'admin@drealtiesfx.com')->first();
if ($admin) {
    DB::table('enrollments')->updateOrInsert(
        ['user_id' => $admin->id, 'cohort_id' => $cohortId],
        [
            'status' => 'active',
            'enrolled_at' => $now,
            'created_at' => $now,
            'updated_at' => $now
        ]
    );
     echo "Admin Enrolled in Cohort 1.\n";
}

echo "Cleanup Complete!\n";
