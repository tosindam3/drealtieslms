<?php

namespace Database\Seeders;

use App\Models\Week;
use Illuminate\Database\Seeder;

class WeekSeeder extends Seeder
{
    public function run(): void
    {
        $weeks = [
            // Week 0 - Foundation (Free)
            [
                'cohort_id' => 1,
                'week_number' => 0,
                'title' => 'Foundation Week: Market Fundamentals',
                'description' => 'Introduction to institutional trading concepts and platform orientation.',
                'unlock_rules' => json_encode(['locked_by_default' => false, 'min_completion_percent' => 0, 'min_coins_to_unlock_next_week' => 0]),
                'is_free' => true,
                'min_completion_percentage' => 0,
                'min_coins_to_unlock_next' => 0,
            ],
            // Week 1
            [
                'cohort_id' => 1,
                'week_number' => 1,
                'title' => 'Market Structure & Price Action',
                'description' => 'Understanding institutional order flow and market microstructure.',
                'unlock_rules' => json_encode(['locked_by_default' => true, 'min_completion_percent' => 85, 'min_coins_to_unlock_next_week' => 50]),
                'is_free' => false,
                'min_completion_percentage' => 85,
                'min_coins_to_unlock_next' => 50,
            ],
        ];

        foreach ($weeks as $weekData) {
            Week::create($weekData);
        }
    }
}