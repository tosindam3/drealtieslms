<?php

namespace Database\Seeders;

use App\Models\Lesson;
use Illuminate\Database\Seeder;

class LessonSeeder extends Seeder
{
    public function run(): void
    {
        $lessons = [
            // Week 0 Lessons (Foundation - Free)
            [
                'week_num' => 0,
                'module_title' => 'Academy Orientation',
                'number' => '0.1',
                'title' => 'Welcome to DrealtiesFX Academy',
                'description' => 'Introduction to the academy, platform navigation, and learning objectives.',
                'thumbnail_url' => 'https://picsum.photos/seed/welcome/800/450',
                'estimated_duration' => 15,
                'order' => 1,
                'status' => 'published',
                'is_free' => true,
                'lesson_blocks' => [
                    [
                        'id' => 'block-1',
                        'type' => 'video',
                        'title' => 'Welcome Video',
                        'payload' => [
                            'sourceType' => 'youtube',
                            'url' => 'dQw4w9WgXcQ',
                            'minWatchPercent' => 90,
                        ],
                        'coinReward' => 10,
                        'required' => true,
                    ],
                ],
            ],
            [
                'week_num' => 0,
                'module_title' => 'Academy Orientation',
                'number' => '0.2',
                'title' => 'Market Basics & Terminology',
                'description' => 'Essential forex terminology and market structure fundamentals.',
                'thumbnail_url' => 'https://picsum.photos/seed/market-basics/800/450',
                'estimated_duration' => 25,
                'order' => 2,
                'status' => 'published',
                'is_free' => true,
                'lesson_blocks' => [
                    [
                        'id' => 'block-1',
                        'type' => 'video',
                        'title' => 'Market Basics Introduction',
                        'payload' => [
                            'sourceType' => 'youtube',
                            'url' => 'dQw4w9WgXcQ',
                            'minWatchPercent' => 90,
                        ],
                        'coinReward' => 15,
                        'required' => true,
                    ],
                ],
            ],
            [
                'week_num' => 0,
                'module_title' => 'Academy Orientation',
                'number' => '0.3',
                'title' => 'Trading Platform Setup',
                'description' => 'Setting up your trading platform and understanding the interface.',
                'thumbnail_url' => 'https://picsum.photos/seed/platform-setup/800/450',
                'estimated_duration' => 20,
                'order' => 3,
                'status' => 'published',
                'is_free' => true,
                'lesson_blocks' => [
                    [
                        'id' => 'block-1',
                        'type' => 'video',
                        'title' => 'Platform Setup Guide',
                        'payload' => [
                            'sourceType' => 'youtube',
                            'url' => 'dQw4w9WgXcQ',
                            'minWatchPercent' => 90,
                        ],
                        'coinReward' => 10,
                        'required' => true,
                    ],
                ],
            ],

            // Week 1 Lessons (Premium)
            [
                'week_num' => 1,
                'module_title' => 'Market Structure',
                'number' => '1.1',
                'title' => 'Institutional Order Flow',
                'description' => 'Understanding how big banks and institutions move the market.',
                'thumbnail_url' => 'https://picsum.photos/seed/order-flow/800/450',
                'estimated_duration' => 45,
                'order' => 1,
                'status' => 'published',
                'is_free' => false,
                'lesson_blocks' => [
                    [
                        'id' => 'block-1',
                        'type' => 'video',
                        'title' => 'Understanding Institutional Order Flow',
                        'payload' => [
                            'sourceType' => 'youtube',
                            'url' => 'dQw4w9WgXcQ',
                            'minWatchPercent' => 90,
                        ],
                        'coinReward' => 25,
                        'required' => true,
                    ],
                ],
            ],
            [
                'week_num' => 1,
                'module_title' => 'Market Structure',
                'number' => '1.2',
                'title' => 'Market Structure Analysis',
                'description' => 'Identifying market phases and structural changes.',
                'thumbnail_url' => 'https://picsum.photos/seed/market-structure/800/450',
                'estimated_duration' => 40,
                'order' => 2,
                'status' => 'published',
                'is_free' => false,
                'lesson_blocks' => [
                    [
                        'id' => 'block-1',
                        'type' => 'video',
                        'title' => 'Market Structure Deep Dive',
                        'payload' => [
                            'sourceType' => 'youtube',
                            'url' => 'dQw4w9WgXcQ',
                            'minWatchPercent' => 90,
                        ],
                        'coinReward' => 30,
                        'required' => true,
                    ],
                ],
            ],
            [
                'week_num' => 1,
                'module_title' => 'Market Structure',
                'number' => '1.3',
                'title' => 'Price Action Fundamentals',
                'description' => 'Reading price action and understanding market sentiment.',
                'thumbnail_url' => 'https://picsum.photos/seed/price-action/800/450',
                'estimated_duration' => 35,
                'order' => 3,
                'status' => 'published',
                'is_free' => false,
                'lesson_blocks' => [
                    [
                        'id' => 'block-1',
                        'type' => 'video',
                        'title' => 'Price Action Mastery',
                        'payload' => [
                            'sourceType' => 'youtube',
                            'url' => 'dQw4w9WgXcQ',
                            'minWatchPercent' => 90,
                        ],
                        'coinReward' => 25,
                        'required' => true,
                    ],
                ],
            ],
        ];

        foreach ($lessons as $lessonData) {
            $weekNum = $lessonData['week_num'];
            $moduleTitle = $lessonData['module_title'];
            
            $week = \App\Models\Week::where('week_number', $weekNum)->first();
            if (!$week) continue;

            $module = \App\Models\Module::where('week_id', $week->id)
                ->where('title', $moduleTitle)
                ->first();
            
            if (!$module) continue;

            \App\Models\Lesson::create([
                'module_id' => $module->id,
                'number' => $lessonData['number'],
                'title' => $lessonData['title'],
                'description' => $lessonData['description'],
                'thumbnail_url' => $lessonData['thumbnail_url'],
                'estimated_duration' => $lessonData['estimated_duration'],
                'order' => $lessonData['order'],
                'status' => $lessonData['status'],
                'is_free' => $lessonData['is_free'],
                'lesson_blocks' => $lessonData['lesson_blocks'],
            ]);
        }
    }
}