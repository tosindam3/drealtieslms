<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

// Get a student user
$student = App\Models\User::where('role', 'student')->first();

if (!$student) {
    echo "No student user found\n";
    exit;
}

echo "Testing /api/student/courses/authorized endpoint\n";
echo "================================================\n\n";
echo "Student: {$student->name} (ID: {$student->id})\n\n";

// Simulate the API request
$request = Illuminate\Http\Request::create('/api/student/courses/authorized', 'GET');
$request->setUserResolver(fn() => $student);

$controller = app(\App\Http\Controllers\Api\CohortController::class);

try {
    $response = $controller->authorized($request);
    $data = json_decode($response->getContent(), true);
    
    echo "Response Status: " . $response->getStatusCode() . "\n\n";
    
    if (isset($data['weeks']) && count($data['weeks']) > 0) {
        $firstWeek = $data['weeks'][0];
        echo "First Week: {$firstWeek['title']}\n";
        
        if (isset($firstWeek['modules']) && count($firstWeek['modules']) > 0) {
            $firstModule = $firstWeek['modules'][0];
            echo "First Module: {$firstModule['title']}\n";
            
            if (isset($firstModule['lessons']) && count($firstModule['lessons']) > 0) {
                $firstLesson = $firstModule['lessons'][0];
                echo "First Lesson: {$firstLesson['title']}\n";
                echo "Lesson Blocks Count: " . count($firstLesson['lessonBlocks'] ?? []) . "\n\n";
                
                if (!empty($firstLesson['lessonBlocks'])) {
                    echo "Lesson Blocks:\n";
                    echo json_encode($firstLesson['lessonBlocks'], JSON_PRETTY_PRINT) . "\n";
                } else {
                    echo "No lesson blocks found!\n";
                }
            }
        }
    }
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
