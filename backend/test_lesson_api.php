<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

// Get first lesson
$lesson = App\Models\Lesson::with(['topics', 'module.week.cohort'])->first();

if (!$lesson) {
    echo "No lessons found\n";
    exit;
}

echo "Testing Lesson API Response\n";
echo "============================\n\n";

// Simulate what the controller returns
$lessonData = [
    'id' => $lesson->id,
    'number' => $lesson->number,
    'title' => $lesson->title,
    'description' => $lesson->description,
    'thumbnail_url' => $lesson->thumbnail_url,
    'estimated_duration' => $lesson->estimated_duration,
    'formatted_duration' => $lesson->formatted_duration,
    'order' => $lesson->order,
    'status' => $lesson->status,
    'is_free' => $lesson->is_free,
    'lesson_blocks' => $lesson->lesson_blocks,
    'week' => [
        'id' => $lesson->module->week->id,
        'week_number' => $lesson->module->week->week_number,
        'title' => $lesson->module->week->title,
        'cohort' => [
            'id' => $lesson->module->week->cohort->id,
            'name' => $lesson->module->week->cohort->name,
        ],
    ],
    'module' => [
        'id' => $lesson->module->id,
        'title' => $lesson->module->title,
    ],
    'topic_count' => $lesson->topics->count(),
];

echo "Lesson ID: {$lesson->id}\n";
echo "Lesson Title: {$lesson->title}\n";
echo "Lesson Blocks Count: " . count($lesson->lesson_blocks ?? []) . "\n\n";

echo "Full API Response:\n";
echo json_encode($lessonData, JSON_PRETTY_PRINT) . "\n";
