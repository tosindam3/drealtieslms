<?php

namespace Database\Seeders;

use App\Models\UserProgress;
use App\Models\TopicCompletion;
use App\Models\QuizAttempt;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Topic;
use App\Models\Quiz;
use Illuminate\Database\Seeder;

class UserProgressSeeder extends Seeder
{
    public function run(): void
    {
        $enrollments = Enrollment::with('user')->get();
        $weeks = \App\Models\Week::all();
        $lessons = \App\Models\Lesson::with('module.week')->get();
        $topics = \App\Models\Topic::all();
        $quizzes = \App\Models\Quiz::all();

        foreach ($enrollments as $enrollment) {
            $userId = $enrollment->user_id;
            $cohortId = $enrollment->cohort_id;
            
            // Randomly unlock and complete some weeks based on student progress
            $weeksToUnlock = 3; 
            
            foreach ($weeks->take($weeksToUnlock) as $week) {
                $isCompleted = rand(0, 1) === 1;
                
                UserProgress::create([
                    'user_id' => $userId,
                    'cohort_id' => $cohortId,
                    'week_id' => $week->id,
                    'completion_percentage' => $isCompleted ? 100 : rand(20, 80),
                    'is_unlocked' => true,
                    'unlocked_at' => now()->subDays(30),
                    'completed_at' => $isCompleted ? now()->subDays(rand(1, 10)) : null,
                    'completion_data' => json_encode(['topics' => [], 'quizzes' => []]),
                ]);

                // Also seed some topic completions
                $weekTopics = $topics->filter(function($t) use ($week) {
                    return $t->lesson && $t->lesson->module && $t->lesson->module->week_id == $week->id;
                });

                foreach ($weekTopics->take(5) as $topic) {
                    TopicCompletion::create([
                        'user_id' => $userId,
                        'topic_id' => $topic->id,
                        'completed_at' => now()->subDays(rand(1, 15)),
                        'coins_awarded' => 10,
                    ]);
                }

                // Seed some quiz attempts
                $weekQuizzes = $quizzes->where('week_id', $week->id);
                foreach ($weekQuizzes as $quiz) {
                    $score = rand(70, 100);
                    QuizAttempt::create([
                        'user_id' => $userId,
                        'quiz_id' => $quiz->id,
                        'attempt_number' => 1,
                        'status' => 'completed',
                        'started_at' => now()->subDays(5),
                        'completed_at' => now()->subDays(5),
                        'score_points' => $score,
                        'total_points' => 100,
                        'score_percentage' => $score,
                        'passed' => $score >= $quiz->passing_score,
                        'coins_awarded' => 25,
                    ]);
                }
            }
        }
    }
}