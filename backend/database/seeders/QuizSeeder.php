<?php

namespace Database\Seeders;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Database\Seeder;

class QuizSeeder extends Seeder
{
    public function run(): void
    {
        // Get foundation week
        $foundationWeek = \App\Models\Week::where('week_number', 0)->first();
        if (!$foundationWeek) return;

        // Foundation Week Quiz
        $foundationQuiz = Quiz::create([
            'week_id' => $foundationWeek->id,
            'title' => 'Foundation Knowledge Assessment',
            'description' => 'Test your understanding of basic forex concepts and platform navigation.',
            'passing_score' => 80,
            'duration' => 15,
            'max_attempts' => 3,
            'coin_reward' => 25,
        ]);

        $foundationQuestions = [
            [
                'quiz_id' => $foundationQuiz->id,
                'question_text' => 'What does the term "pip" stand for in forex trading?',
                'type' => 'multiple_choice',
                'options' => json_encode([
                    'A' => 'Price Interest Point',
                    'B' => 'Percentage in Point',
                    'C' => 'Profit in Pips',
                    'D' => 'Point in Price'
                ]),
                'correct_answers' => json_encode(['B']),
                'explanation' => 'A pip stands for "Percentage in Point" and represents the smallest price move in a currency pair.',
                'points' => 10,
            ],
            [
                'quiz_id' => $foundationQuiz->id,
                'question_text' => 'In the currency pair EUR/USD, which currency is the base currency?',
                'type' => 'multiple_choice',
                'options' => json_encode([
                    'A' => 'USD (US Dollar)',
                    'B' => 'EUR (Euro)',
                    'C' => 'Both are base currencies',
                    'D' => 'Neither is a base currency'
                ]),
                'correct_answers' => json_encode(['B']),
                'explanation' => 'In any currency pair, the first currency listed is always the base currency.',
                'points' => 10,
            ],
            [
                'quiz_id' => $foundationQuiz->id,
                'question_text' => 'What is the primary difference between institutional and retail trading approaches?',
                'type' => 'multiple_choice',
                'options' => json_encode([
                    'A' => 'Institutional traders use more indicators',
                    'B' => 'Institutional traders focus on order flow and liquidity',
                    'C' => 'Retail traders have better technology',
                    'D' => 'There is no difference'
                ]),
                'correct_answers' => json_encode(['B']),
                'explanation' => 'Institutional traders focus on understanding order flow, liquidity, and market structure rather than relying heavily on technical indicators.',
                'points' => 15,
            ],
        ];

        foreach ($foundationQuestions as $questionData) {
            QuizQuestion::create($questionData);
        }

        // Get Week 1
        $week1 = \App\Models\Week::where('week_number', 1)->first();
        if (!$week1) return;

        // Market Structure Quiz
        $marketStructureQuiz = Quiz::create([
            'week_id' => $week1->id,
            'title' => 'Market Structure Mastery',
            'description' => 'Advanced assessment of market structure analysis and institutional concepts.',
            'passing_score' => 85,
            'duration' => 20,
            'max_attempts' => 2,
            'coin_reward' => 40,
        ]);

        $structureQuestions = [
            [
                'quiz_id' => $marketStructureQuiz->id,
                'question_text' => 'What characterizes a trending market from an institutional perspective?',
                'type' => 'multiple_choice',
                'options' => json_encode([
                    'A' => 'Higher highs and higher lows only',
                    'B' => 'Consistent order flow in one direction with liquidity sweeps',
                    'C' => 'Moving averages pointing in the same direction',
                    'D' => 'High volume on every candle'
                ]),
                'correct_answers' => json_encode(['B']),
                'explanation' => 'Institutional trending markets show consistent directional order flow with periodic liquidity sweeps to fuel continuation.',
                'points' => 15,
            ],
            [
                'quiz_id' => $marketStructureQuiz->id,
                'question_text' => 'How do institutions typically approach range-bound markets?',
                'type' => 'multiple_choice',
                'options' => json_encode([
                    'A' => 'They avoid trading ranges completely',
                    'B' => 'They trade from range extremes back to equilibrium',
                    'C' => 'They only trade breakouts from ranges',
                    'D' => 'They use scalping strategies only'
                ]),
                'correct_answers' => json_encode(['B']),
                'explanation' => 'Institutions often trade ranges by selling at resistance and buying at support, targeting moves back to equilibrium.',
                'points' => 15,
            ],
        ];

        foreach ($structureQuestions as $questionData) {
            QuizQuestion::create($questionData);
        }

        // Get Week 3
        $week3 = \App\Models\Week::where('week_number', 3)->first();
        if (!$week3) return;

        // Risk Management Quiz
        $riskQuiz = Quiz::create([
            'week_id' => $week3->id,
            'title' => 'Professional Risk Management',
            'description' => 'Comprehensive assessment of institutional risk management principles.',
            'passing_score' => 90,
            'duration' => 25,
            'max_attempts' => 2,
            'coin_reward' => 50,
        ]);

        $riskQuestions = [
            [
                'quiz_id' => $riskQuiz->id,
                'question_text' => 'What is the maximum recommended risk per trade for professional traders?',
                'type' => 'multiple_choice',
                'options' => json_encode([
                    'A' => '1-2% of account balance',
                    'B' => '5-10% of account balance',
                    'C' => '10-15% of account balance',
                    'D' => 'It depends on the setup quality'
                ]),
                'correct_answers' => json_encode(['A']),
                'explanation' => 'Professional traders typically risk 1-2% of their account per trade to ensure long-term capital preservation.',
                'points' => 20,
            ],
            [
                'quiz_id' => $riskQuiz->id,
                'question_text' => 'What is the primary purpose of position sizing in institutional trading?',
                'type' => 'multiple_choice',
                'options' => json_encode([
                    'A' => 'To maximize profits on every trade',
                    'B' => 'To optimize risk-adjusted returns',
                    'C' => 'To minimize transaction costs',
                    'D' => 'To increase trading frequency'
                ]),
                'correct_answers' => json_encode(['B']),
                'explanation' => 'Position sizing is designed to optimize risk-adjusted returns, balancing potential profits with acceptable risk levels.',
                'points' => 20,
            ],
        ];

        foreach ($riskQuestions as $questionData) {
            QuizQuestion::create($questionData);
        }
    }
}