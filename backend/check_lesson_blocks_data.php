<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Get a lesson with lesson_blocks
$lesson = App\Models\Lesson::with('module.week')->first();

if ($lesson) {
    echo "Lesson ID: " . $lesson->id . "\n";
    echo "Lesson Title: " . $lesson->title . "\n";
    echo "Lesson Blocks (raw): " . json_encode($lesson->lesson_blocks, JSON_PRETTY_PRINT) . "\n\n";
    
    // Check what the API would return
    $lessonData = [
        'id' => $lesson->id,
        'title' => $lesson->title,
        'lesson_blocks' => $lesson->lesson_blocks,
    ];
    
    echo "API Response would be:\n";
    echo json_encode($lessonData, JSON_PRETTY_PRINT) . "\n";
} else {
    echo "No lessons found in database\n";
}
