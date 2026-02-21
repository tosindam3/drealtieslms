<?php

namespace Database\Seeders;

use App\Models\CoinTransaction;
use App\Models\UserCoinBalance;
use App\Models\Enrollment;
use Illuminate\Database\Seeder;

class CoinTransactionSeeder extends Seeder
{
    public function run(): void
    {
        $enrollments = Enrollment::with('user')->get();
        $weeks = \App\Models\Week::all();
        $lessons = \App\Models\Lesson::all();
        $quizzes = \App\Models\Quiz::all();
        $assignments = \App\Models\Assignment::all();

        foreach ($enrollments as $enrollment) {
            $userId = $enrollment->user_id;
            $userBalance = UserCoinBalance::firstOrCreate(
                ['user_id' => $userId],
                ['total_balance' => 0, 'lifetime_earned' => 0, 'lifetime_spent' => 0]
            );
            
            // Create various coin transactions
            $transactions = [
                // Welcome bonus
                [
                    'user_id' => $userId,
                    'transaction_type' => 'earned',
                    'amount' => 50,
                    'description' => 'Welcome bonus for joining DrealtiesFX Academy',
                    'source_type' => 'manual',
                    'source_id' => $enrollment->id,
                    'created_at' => $enrollment->enrolled_at,
                ],
                
                // Lesson completion rewards
                [
                    'user_id' => $userId,
                    'transaction_type' => 'earned',
                    'amount' => 15,
                    'description' => 'Completed Lesson: Welcome to DrealtiesFX Academy',
                    'source_type' => 'topic',
                    'source_id' => $lessons->first()->id ?? null,
                    'created_at' => now()->subDays(rand(5, 20)),
                ],
            ];

            foreach ($transactions as $data) {
                if ($data['source_id'] === null && $data['source_type'] !== 'manual') continue;
                CoinTransaction::create($data);
                
                if ($data['transaction_type'] === 'earned') {
                    $userBalance->total_balance += $data['amount'];
                    $userBalance->lifetime_earned += $data['amount'];
                } elseif ($data['transaction_type'] === 'spent') {
                    $userBalance->total_balance -= abs($data['amount']);
                    $userBalance->lifetime_spent += abs($data['amount']);
                }
            }
            $userBalance->save();
        }
    }
}