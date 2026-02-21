<?php

/**
 * Test script to verify lesson blocks are saving to database
 * Run with: php test_lesson_blocks.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Lesson;
use App\Models\Module;
use App\Models\Week;
use App\Models\Cohort;

echo "=== Testing Lesson Blocks Database Persistence ===\n\n";

// Find a lesson to test with
$lesson = Lesson::with('module.week.cohort')->first();

if (!$lesson) {
    echo "❌ No lessons found in database. Please run seeders first.\n";
    exit(1);
}

echo "📚 Testing with Lesson: {$lesson->title} (ID: {$lesson->id})\n";
echo "📦 Module: {$lesson->module->title}\n";
echo "📅 Week: {$lesson->module->week->title}\n";
echo "🎓 Cohort: {$lesson->module->week->cohort->name}\n\n";

// Check current lesson_blocks
echo "--- Current Lesson Blocks ---\n";
if ($lesson->lesson_blocks) {
    echo "✅ Lesson has " . count($lesson->lesson_blocks) . " blocks\n";
    echo json_encode($lesson->lesson_blocks, JSON_PRETTY_PRINT) . "\n\n";
} else {
    echo "⚠️  Lesson has no blocks (null or empty)\n\n";
}

// Test 1: Add a new video block
echo "--- Test 1: Adding a Video Block ---\n";
$testBlocks = [
    [
        'id' => 'test-block-' . uniqid(),
        'type' => 'video',
        'title' => 'Test Video Block',
        'payload' => [
            'videoUrl' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'title' => 'Test Video',
            'description' => 'This is a test video block',
            'coinReward' => 10,
            'requiredBadges' => []
        ]
    ]
];

try {
    $lesson->lesson_blocks = $testBlocks;
    $lesson->save();
    echo "✅ Saved test block to database\n";
} catch (\Exception $e) {
    echo "❌ Failed to save: " . $e->getMessage() . "\n";
    exit(1);
}

// Refresh from database to verify
$lesson->refresh();
echo "--- Verifying Save ---\n";
if ($lesson->lesson_blocks && count($lesson->lesson_blocks) > 0) {
    echo "✅ Block successfully saved and retrieved from database\n";
    echo "📊 Block count: " . count($lesson->lesson_blocks) . "\n";
    echo json_encode($lesson->lesson_blocks, JSON_PRETTY_PRINT) . "\n\n";
} else {
    echo "❌ Block was not saved or retrieved correctly\n\n";
    exit(1);
}

// Test 2: Update existing block
echo "--- Test 2: Updating Block ---\n";
$updatedBlocks = $lesson->lesson_blocks;
$updatedBlocks[0]['payload']['title'] = 'Updated Test Video';
$updatedBlocks[0]['payload']['coinReward'] = 20;

try {
    $lesson->lesson_blocks = $updatedBlocks;
    $lesson->save();
    echo "✅ Updated block in database\n";
} catch (\Exception $e) {
    echo "❌ Failed to update: " . $e->getMessage() . "\n";
    exit(1);
}

// Verify update
$lesson->refresh();
if ($lesson->lesson_blocks[0]['payload']['coinReward'] === 20) {
    echo "✅ Block update verified\n";
    echo "📊 Updated coin reward: " . $lesson->lesson_blocks[0]['payload']['coinReward'] . "\n\n";
} else {
    echo "❌ Block update failed\n\n";
    exit(1);
}

// Test 3: Add multiple blocks
echo "--- Test 3: Adding Multiple Blocks ---\n";
$multipleBlocks = [
    [
        'id' => 'block-1-' . uniqid(),
        'type' => 'video',
        'title' => 'Video Block 1',
        'payload' => ['videoUrl' => 'https://youtube.com/watch?v=test1']
    ],
    [
        'id' => 'block-2-' . uniqid(),
        'type' => 'quiz',
        'title' => 'Quiz Block 1',
        'payload' => ['quizId' => 1, 'title' => 'Test Quiz']
    ],
    [
        'id' => 'block-3-' . uniqid(),
        'type' => 'assignment',
        'title' => 'Assignment Block 1',
        'payload' => ['assignmentId' => 1, 'title' => 'Test Assignment']
    ],
    [
        'id' => 'block-4-' . uniqid(),
        'type' => 'live',
        'title' => 'Live Session Block 1',
        'payload' => ['liveClassId' => 1, 'title' => 'Test Live Session']
    ]
];

try {
    $lesson->lesson_blocks = $multipleBlocks;
    $lesson->save();
    echo "✅ Saved multiple blocks to database\n";
} catch (\Exception $e) {
    echo "❌ Failed to save multiple blocks: " . $e->getMessage() . "\n";
    exit(1);
}

// Verify multiple blocks
$lesson->refresh();
if ($lesson->lesson_blocks && count($lesson->lesson_blocks) === 4) {
    echo "✅ All 4 blocks successfully saved and retrieved\n";
    echo "📊 Block types: ";
    foreach ($lesson->lesson_blocks as $block) {
        echo $block['type'] . " ";
    }
    echo "\n\n";
} else {
    echo "❌ Not all blocks were saved correctly\n";
    echo "📊 Expected 4 blocks, got: " . count($lesson->lesson_blocks ?? []) . "\n\n";
    exit(1);
}

// Test 4: Check via API endpoint simulation
echo "--- Test 4: Simulating API Update ---\n";
$apiData = [
    'lessonBlocks' => [
        [
            'id' => 'api-block-' . uniqid(),
            'type' => 'video',
            'title' => 'API Test Video',
            'payload' => [
                'videoUrl' => 'https://youtube.com/watch?v=api-test',
                'title' => 'API Test',
                'coinReward' => 15
            ]
        ]
    ]
];

// Simulate the AdminController mapping
if (isset($apiData['lessonBlocks'])) {
    $apiData['lesson_blocks'] = $apiData['lessonBlocks'];
    unset($apiData['lessonBlocks']);
}

try {
    $lesson->update($apiData);
    echo "✅ API-style update successful\n";
} catch (\Exception $e) {
    echo "❌ API-style update failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Verify API update
$lesson->refresh();
if ($lesson->lesson_blocks && $lesson->lesson_blocks[0]['title'] === 'API Test Video') {
    echo "✅ API update verified\n";
    echo "📊 Block title: " . $lesson->lesson_blocks[0]['title'] . "\n\n";
} else {
    echo "❌ API update verification failed\n\n";
    exit(1);
}

// Test 5: Check raw database value
echo "--- Test 5: Checking Raw Database Value ---\n";
$rawLesson = \DB::table('lessons')->where('id', $lesson->id)->first();
if ($rawLesson->lesson_blocks) {
    $decoded = json_decode($rawLesson->lesson_blocks, true);
    echo "✅ Raw database value exists\n";
    echo "📊 Raw JSON length: " . strlen($rawLesson->lesson_blocks) . " characters\n";
    echo "📊 Decoded block count: " . count($decoded) . "\n\n";
} else {
    echo "❌ No raw database value found\n\n";
    exit(1);
}

echo "=== All Tests Passed! ===\n";
echo "✅ Lesson blocks are correctly saving to and loading from the database\n";
echo "✅ JSON encoding/decoding is working properly\n";
echo "✅ API-style updates (camelCase to snake_case) are working\n";
echo "✅ Multiple block types are supported\n\n";

echo "📝 Summary:\n";
echo "   - Lesson ID: {$lesson->id}\n";
echo "   - Current block count: " . count($lesson->lesson_blocks) . "\n";
echo "   - Database column: lesson_blocks (JSON)\n";
echo "   - Model cast: array\n";
echo "   - Fillable: ✅\n\n";

echo "🔍 To check in MySQL directly:\n";
echo "   SELECT id, title, lesson_blocks FROM lessons WHERE id = {$lesson->id};\n\n";
