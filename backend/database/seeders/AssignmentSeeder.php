<?php

namespace Database\Seeders;

use App\Models\Assignment;
use Illuminate\Database\Seeder;

class AssignmentSeeder extends Seeder
{
    public function run(): void
    {
        $assignmentsData = [
            [
                'week_num' => 0,
                'title' => 'Platform Setup Verification',
                'description' => 'Complete your trading platform setup and submit screenshots of your configured workspace.',
                'instructions_html' => 'Set up your trading platform according to the lesson guidelines. Take screenshots of: 1) Your chart layout with multiple timeframes, 2) Your indicator setup, 3) Your workspace configuration. Upload all screenshots in a single PDF document.',
                'deadline' => now()->addDays(7),
                'max_points' => 50,
                'coin_reward' => 30,
                'submission_type' => 'file',
                'allowed_extensions' => json_encode(['pdf']),
            ],
            [
                'week_num' => 1,
                'title' => 'Market Structure Analysis Report',
                'description' => 'Analyze the current market structure of EUR/USD and GBP/USD pairs.',
                'instructions_html' => 'Provide a comprehensive analysis of the current market structure for EUR/USD and GBP/USD. Include: 1) Current market phase (trending/ranging/transitional), 2) Key support and resistance levels, 3) Institutional bias based on order flow, 4) Potential trading opportunities. Submit as a detailed written report (minimum 1000 words).',
                'deadline' => now()->addDays(10),
                'max_points' => 100,
                'coin_reward' => 60,
                'submission_type' => 'file',
                'allowed_extensions' => json_encode(['pdf', 'doc', 'docx']),
            ],
            [
                'week_num' => 2,
                'title' => 'Liquidity Mapping Exercise',
                'description' => 'Create a detailed liquidity map for a major currency pair.',
                'instructions_html' => 'Choose one major currency pair (EUR/USD, GBP/USD, USD/JPY, or AUD/USD) and create a comprehensive liquidity map. Your analysis should include: 1) Identification of major liquidity pools, 2) Historical liquidity sweep patterns, 3) Current institutional positioning, 4) Predicted liquidity targets, 5) Risk assessment for potential trades. Present your findings in a professional format with annotated charts.',
                'deadline' => now()->addDays(14),
                'max_points' => 150,
                'coin_reward' => 100,
                'submission_type' => 'file',
                'allowed_extensions' => json_encode(['pdf']),
            ],
        ];

        foreach ($assignmentsData as $data) {
            $week = \App\Models\Week::where('week_number', $data['week_num'])->first();
            if (!$week) continue;

            $assignmentData = [
                'week_id' => $week->id,
                'title' => $data['title'],
                'description' => $data['description'],
                'instructions_html' => $data['instructions_html'],
                'deadline' => $data['deadline'],
                'max_points' => $data['max_points'],
                'coin_reward' => $data['coin_reward'],
                'submission_type' => $data['submission_type'],
                'allowed_extensions' => $data['allowed_extensions'],
            ];

            Assignment::create($assignmentData);
        }
    }
}