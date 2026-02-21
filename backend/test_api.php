<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Cohort;
use Illuminate\Support\Facades\Auth;

$user = User::where('email', 'admin@drealtiesfx.com')->first();
if (!$user) {
    echo "User not found\n";
    exit;
}

Auth::login($user);

$controller = app(\App\Http\Controllers\Api\CohortController::class);
$request = Illuminate\Http\Request::create('/api/student/courses/authorized', 'GET');
$request->setUserResolver(fn() => $user);

$response = $controller->authorized($request);
echo "Authorized Response Outcome: " . ($response->getStatusCode() == 200 ? "SUCCESS" : "FAILURE (" . $response->getStatusCode() . ")") . "\n";
$data = json_decode($response->getContent(), true);
if (isset($data['weeks'])) {
    echo "Weeks found: " . count($data['weeks']) . "\n";
    foreach ($data['weeks'] as $w) {
        $moduleCount = isset($w['modules']) ? count($w['modules']) : 0;
        echo " - Week " . ($w['number'] ?? '?') . ": " . $moduleCount . " modules\n";
    }
} else {
    echo "No weeks field in response\n";
    print_r($data);
}

$adminController = app(\App\Http\Controllers\Api\AdminController::class);
$structureRequest = Illuminate\Http\Request::create('/api/admin/courses/structure', 'GET');
$structureRequest->setUserResolver(fn() => $user);
$structureResponse = $adminController->getStructure($structureRequest);
echo "\nAdmin Structure Response Outcome: " . ($structureResponse->getStatusCode() == 200 ? "SUCCESS" : "FAILURE (" . $structureResponse->getStatusCode() . ")") . "\n";
$sData = json_decode($structureResponse->getContent(), true);
if (isset($sData['weeks'])) {
    echo "Weeks found: " . count($sData['weeks']) . "\n";
    foreach ($sData['weeks'] as $w) {
        $moduleCount = isset($w['modules']) ? count($w['modules']) : 0;
        echo " - Week " . ($w['number'] ?? '?') . ": " . $moduleCount . " modules\n";
    }
}
