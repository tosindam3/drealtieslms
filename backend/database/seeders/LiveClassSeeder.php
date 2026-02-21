<?php

namespace Database\Seeders;

use App\Models\LiveClass;
use Illuminate\Database\Seeder;

class LiveClassSeeder extends Seeder
{
    public function run(): void
    {
        $classesData = [
            [
                'week_num' => 0,
                'title' => 'Welcome Session & Platform Orientation',
                'description' => 'Live welcome session covering academy expectations, platform navigation, and Q&A.',
                'scheduled_at' => now()->addDays(1)->setTime(19, 0),
                'duration' => 90,
                'join_url' => 'https://zoom.us/j/123456789',
                'coin_reward' => 20,
            ],
            [
                'week_num' => 1,
                'title' => 'Live Market Analysis: Institutional Order Flow',
                'description' => 'Real-time market analysis focusing on identifying institutional order flow patterns.',
                'scheduled_at' => now()->addDays(8)->setTime(19, 0),
                'duration' => 120,
                'join_url' => 'https://zoom.us/j/123456790',
                'coin_reward' => 40,
            ],
        ];

        foreach ($classesData as $data) {
            $week = \App\Models\Week::where('week_number', $data['week_num'])->first();
            if (!$week) continue;

            LiveClass::create([
                'week_id' => $week->id,
                'title' => $data['title'],
                'description' => $data['description'],
                'scheduled_at' => $data['scheduled_at'],
                'duration' => $data['duration'],
                'join_url' => $data['join_url'],
                'coin_reward' => $data['coin_reward'],
                'platform' => 'zoom',
                'status' => 'scheduled',
            ]);
        }
    }
}