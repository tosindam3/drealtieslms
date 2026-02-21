<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Cohort;
use App\Models\Enrollment;

$user = User::where('email', 'admin@drealtiesfx.com')->first();
$cohort = Cohort::find(1);

if ($user && $cohort) {
    $exists = $user->enrollments()->where('cohort_id', $cohort->id)->exists();
    if (!$exists) {
        $user->enrollments()->attach($cohort->id, [
            'enrolled_at' => now(),
            'status' => 'active',
            'completion_percentage' => 0
        ]);
        echo "Successfully enrolled admin in Cohort 1 via attach()\n";
    } else {
        echo "Admin is already enrolled in Cohort 1\n";
    }
} else {
    echo "User or Cohort not found\n";
}
