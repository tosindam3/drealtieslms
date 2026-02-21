<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CohortSeeder::class,
            WeekSeeder::class,
            ModuleSeeder::class,
            LessonSeeder::class,
            TopicSeeder::class,
            QuizSeeder::class,
            AssignmentSeeder::class,
            LiveClassSeeder::class,
            EnrollmentSeeder::class,
            UserProgressSeeder::class,
            CoinTransactionSeeder::class,
        ]);
    }
}