<?php

namespace Database\Seeders;

use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Database\Seeder;

class EnrollmentSeeder extends Seeder
{
    public function run(): void
    {
        // Get all student users (excluding admin and instructor)
        $students = User::where('role', 'student')->get();
        
        // Enroll first 6 students in the main cohort
        $enrolledStudents = $students->take(6);
        
        foreach ($enrolledStudents as $student) {
            Enrollment::create([
                'user_id' => $student->id,
                'cohort_id' => 1, // Forex Mastery Alpha - January 2026
                'enrolled_at' => now()->subDays(rand(1, 10)),
                'status' => 'active',
                'completion_percentage' => rand(15, 85),
            ]);
        }

        // Enroll 2 more students in the second cohort
        $remainingStudents = $students->skip(6)->take(2);
        
        foreach ($remainingStudents as $student) {
            Enrollment::create([
                'user_id' => $student->id,
                'cohort_id' => 2, // Forex Mastery Beta - February 2026
                'enrolled_at' => now()->subDays(rand(1, 5)),
                'status' => 'active',
                'completion_percentage' => rand(5, 25),
            ]);
        }
    }
}