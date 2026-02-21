<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Lesson;

echo "=== Checking All Lessons for Lesson Blocks ===\n\n";

$lessons = Lesson::with('module.week')->get();

echo "Total lessons in database: " . $lessons->count() . "\n\n";

$lessonsWithBlocks = 0;
$lessonsWithoutBlocks = 0;

foreach ($lessons as $lesson) {
    $blockCount = count($lesson->lesson_blocks ?? []);
    
    if ($blockCount > 0) {
        $lessonsWithBlocks++;
        echo "✅ ID: {$lesson->id} | {$lesson->title}\n";
        echo "   Module: {$lesson->module->title}\n";
        echo "   Week: {$lesson->module->week->title}\n";
        echo "   Blocks: {$blockCount}\n";
        
        // Show block types
        $blockTypes = array_map(function($block) {
            return $block['type'] ?? 'unknown';
        }, $lesson->lesson_blocks);
        echo "   Types: " . implode(', ', $blockTypes) . "\n\n";
    } else {
        $lessonsWithoutBlocks++;
    }
}

echo "--- Summary ---\n";
echo "Lessons with blocks: {$lessonsWithBlocks}\n";
echo "Lessons without blocks: {$lessonsWithoutBlocks}\n\n";

if ($lessonsWithBlocks > 0) {
    echo "✅ Lesson blocks ARE being saved to the database!\n";
} else {
    echo "⚠️  No lessons have blocks yet. Try creating some in the admin panel.\n";
}
