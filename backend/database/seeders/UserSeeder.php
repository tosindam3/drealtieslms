<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserCoinBalance;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        $admin = User::create([
            'name' => 'DrealtiesFX Admin',
            'email' => 'admin@drealtiesfx.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
            'role' => 'administrator',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        UserCoinBalance::create([
            'user_id' => $admin->id,
            'total_balance' => 1000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create instructor user
        $instructor = User::create([
            'name' => 'Marcus Thompson',
            'email' => 'instructor@drealtiesfx.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
            'role' => 'instructor',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        UserCoinBalance::create([
            'user_id' => $instructor->id,
            'total_balance' => 500,
            'created_at' => now(),
            'updated_at' => now(),
        ]);


        // Create admin student for easy preview/testing
        $adminStudent = User::create([
            'name' => 'Admin Student',
            'email' => 'admin.student@drealtiesfx.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
            'role' => 'student',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        UserCoinBalance::create([
            'user_id' => $adminStudent->id,
            'total_balance' => 500,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create sample students
        $students = [
            ['name' => 'Sarah Johnson', 'email' => 'sarah@example.com'],
            ['name' => 'Michael Chen', 'email' => 'michael@example.com'],
            ['name' => 'Emma Rodriguez', 'email' => 'emma@example.com'],
            ['name' => 'David Kim', 'email' => 'david@example.com'],
            ['name' => 'Lisa Anderson', 'email' => 'lisa@example.com'],
            ['name' => 'James Wilson', 'email' => 'james@example.com'],
            ['name' => 'Maria Garcia', 'email' => 'maria@example.com'],
            ['name' => 'Robert Taylor', 'email' => 'robert@example.com'],
        ];

        foreach ($students as $studentData) {
            $student = User::create([
                'name' => $studentData['name'],
                'email' => $studentData['email'],
                'email_verified_at' => now(),
                'password' => Hash::make('password123'),
                'role' => 'student',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            UserCoinBalance::create([
                'user_id' => $student->id,
                'total_balance' => rand(50, 300),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
