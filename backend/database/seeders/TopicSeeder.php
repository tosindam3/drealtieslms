<?php

namespace Database\Seeders;

use App\Models\Topic;
use App\Models\Lesson;
use Illuminate\Database\Seeder;

class TopicSeeder extends Seeder
{
    public function run(): void
    {
        $topics = [
            // Topics for "Welcome to DrealtiesFX Academy"
            [
                'lesson_num' => '0.1',
                'title' => 'Academy Philosophy',
                'description' => 'Understanding the institutional approach to forex trading and our commitment to professional-grade education.',
                'order' => 1,
                'blocks' => [
                    [
                        'id' => 'block-1',
                        'type' => 'text',
                        'payload' => [
                            'content' => '<h2>Welcome to DrealtiesFX Academy</h2><p>At DrealtiesFX Academy, we believe in teaching institutional-grade trading strategies that professional traders use in banks and hedge funds. Our philosophy is built on three core principles:</p><ul><li><strong>Professional Standards:</strong> We teach the same concepts used by institutional traders</li><li><strong>Risk Management First:</strong> Capital preservation is the foundation of successful trading</li><li><strong>Continuous Learning:</strong> Markets evolve, and so should your skills</li></ul>',
                        ],
                    ],
                    [
                        'id' => 'block-2',
                        'type' => 'video',
                        'payload' => [
                            'sourceType' => 'youtube',
                            'url' => 'dQw4w9WgXcQ',
                            'enableManualCompletion' => true,
                            'autoCompleteOnEnd' => false,
                        ],
                    ],
                    [
                        'id' => 'block-3',
                        'type' => 'text',
                        'payload' => [
                            'content' => '<h3>What Makes Us Different</h3><p>Unlike retail trading courses that focus on indicators and patterns, we teach you to think like institutional traders. You\'ll learn to identify where banks place their orders, how they manage risk, and how to position yourself alongside smart money.</p>',
                        ],
                    ],
                ],
            ],
            [
                'lesson_num' => '0.1',
                'title' => 'Platform Navigation',
                'description' => 'Complete walkthrough of the learning platform, progress tracking, and community features.',
                'order' => 2,
                'blocks' => [
                    [
                        'id' => 'block-1',
                        'type' => 'text',
                        'payload' => [
                            'content' => '<h2>Navigating Your Learning Platform</h2><p>This platform is designed to provide you with a seamless learning experience. Here\'s how to make the most of it:</p>',
                        ],
                    ],
                    [
                        'id' => 'block-2',
                        'type' => 'photo',
                        'payload' => [
                            'images' => [
                                ['id' => 'img-1', 'url' => 'https://picsum.photos/seed/platform/800/600', 'caption' => 'Platform Dashboard Overview'],
                            ],
                        ],
                    ],
                    [
                        'id' => 'block-3',
                        'type' => 'text',
                        'payload' => [
                            'content' => '<h3>Key Features</h3><ul><li><strong>Progress Tracking:</strong> Monitor your completion percentage and earned coins</li><li><strong>Lesson Library:</strong> Access all course materials organized by week</li><li><strong>Community Forum:</strong> Connect with fellow traders and instructors</li><li><strong>Live Sessions:</strong> Join scheduled live trading sessions</li></ul>',
                        ],
                    ],
                ],
            ],
            [
                'lesson_num' => '0.1',
                'title' => 'Learning Path Overview',
                'description' => 'Your 8-week journey from foundation to advanced institutional trading strategies.',
                'order' => 3,
                'blocks' => [
                    [
                        'id' => 'block-1',
                        'type' => 'text',
                        'payload' => [
                            'content' => '<h2>Your 8-Week Trading Journey</h2><p>This comprehensive program takes you from foundational concepts to advanced institutional trading strategies. Each week builds upon the previous, creating a solid foundation for professional trading.</p>',
                        ],
                    ],
                    [
                        'id' => 'block-2',
                        'type' => 'text',
                        'payload' => [
                            'content' => '<h3>Week-by-Week Breakdown</h3><ul><li><strong>Week 0:</strong> Foundation & Platform Setup</li><li><strong>Week 1:</strong> Market Structure & Price Action</li><li><strong>Week 2:</strong> Liquidity Concepts</li><li><strong>Weeks 3-4:</strong> Order Flow Analysis</li><li><strong>Weeks 5-6:</strong> Risk Management & Position Sizing</li><li><strong>Weeks 7-8:</strong> Advanced Strategies & Live Trading</li></ul>',
                        ],
                    ],
                ],
            ],

            // Topics for "Market Basics & Terminology"
            [
                'lesson_num' => '0.2',
                'title' => 'Currency Pairs Explained',
                'description' => 'Major, minor, and exotic pairs. Understanding base and quote currencies in professional context.',
                'order' => 1,
                'blocks' => [
                    [
                        'id' => 'block-1',
                        'type' => 'text',
                        'payload' => [
                            'content' => '<h2>Understanding Currency Pairs</h2><p>In forex trading, currencies are always traded in pairs. The first currency is the base currency, and the second is the quote currency. For example, in EUR/USD, EUR is the base and USD is the quote.</p>',
                        ],
                    ],
                    [
                        'id' => 'block-2',
                        'type' => 'text',
                        'payload' => [
                            'content' => '<h3>Types of Currency Pairs</h3><ul><li><strong>Major Pairs:</strong> EUR/USD, GBP/USD, USD/JPY, USD/CHF</li><li><strong>Minor Pairs:</strong> EUR/GBP, EUR/JPY, GBP/JPY</li><li><strong>Exotic Pairs:</strong> USD/TRY, EUR/ZAR, USD/MXN</li></ul>',
                        ],
                    ],
                ],
            ],
            [
                'lesson_num' => '0.2',
                'title' => 'Pips, Spreads & Market Mechanics',
                'description' => 'Professional understanding of market pricing, spreads, and how institutional orders affect pricing.',
                'order' => 2,
                'blocks' => [
                    [
                        'id' => 'block-1',
                        'type' => 'text',
                        'payload' => [
                            'content' => '<h2>Market Mechanics</h2><p>A pip (percentage in point) is the smallest price move in forex. For most pairs, it\'s the fourth decimal place (0.0001). Understanding pips is crucial for calculating profit, loss, and position sizing.</p><p><strong>Spread:</strong> The difference between bid and ask price. This is how brokers make money and represents your trading cost.</p>',
                        ],
                    ],
                ],
            ],
            [
                'lesson_num' => '0.2',
                'title' => 'Market Sessions & Timing',
                'description' => 'Global market sessions, optimal trading times, and session-specific characteristics.',
                'order' => 3,
                'blocks' => [
                    [
                        'id' => 'block-1',
                        'type' => 'text',
                        'payload' => [
                            'content' => '<h2>Global Trading Sessions</h2><p>The forex market operates 24 hours a day, 5 days a week, divided into four major sessions:</p><ul><li><strong>Sydney Session:</strong> 10 PM - 7 AM GMT</li><li><strong>Tokyo Session:</strong> 12 AM - 9 AM GMT</li><li><strong>London Session:</strong> 8 AM - 5 PM GMT (highest volume)</li><li><strong>New York Session:</strong> 1 PM - 10 PM GMT</li></ul><p>The London-New York overlap (1 PM - 5 PM GMT) typically sees the highest volatility and liquidity.</p>',
                        ],
                    ],
                ],
            ],

            // Topics for "Institutional Order Flow"
            [
                'lesson_num' => '1.1',
                'title' => 'Bank Trading Patterns',
                'description' => 'How major banks execute large orders and the footprints they leave in price action.',
                'order' => 1,
                'blocks' => [
                    [
                        'id' => 'block-1',
                        'type' => 'text',
                        'payload' => [
                            'content' => '<h2>Understanding Bank Trading Patterns</h2><p>Major banks and financial institutions move billions of dollars daily. Their large orders create identifiable patterns in price action that retail traders can learn to recognize and trade alongside.</p>',
                        ],
                    ],
                    [
                        'id' => 'block-2',
                        'type' => 'video',
                        'payload' => [
                            'sourceType' => 'youtube',
                            'url' => 'dQw4w9WgXcQ',
                            'enableManualCompletion' => true,
                        ],
                    ],
                ],
            ],
            [
                'lesson_num' => '1.1',
                'title' => 'Order Flow Analysis',
                'description' => 'Reading institutional order flow through price action and volume analysis.',
                'order' => 2,
                'blocks' => [
                    [
                        'id' => 'block-1',
                        'type' => 'text',
                        'payload' => [
                            'content' => '<h2>Order Flow Analysis</h2><p>Order flow analysis helps you understand the buying and selling pressure in the market. By analyzing how price moves and where it stalls, you can identify institutional activity.</p><h3>Key Concepts:</h3><ul><li>Absorption: Where large orders absorb market pressure</li><li>Exhaustion: When one side runs out of orders</li><li>Imbalance: When buy or sell orders dominate</li></ul>',
                        ],
                    ],
                ],
            ],

            // Topics for "Market Structure Analysis"
            [
                'lesson_num' => '1.2',
                'title' => 'Trending Market Identification',
                'description' => 'Professional methods for confirming and trading trending market conditions.',
                'order' => 1,
                'blocks' => [
                    [
                        'id' => 'block-1',
                        'type' => 'text',
                        'payload' => [
                            'content' => '<h2>Identifying Trending Markets</h2><p>Trending markets offer the best risk-to-reward opportunities. Learn to identify strong trends using institutional methods:</p><ul><li>Higher highs and higher lows (uptrend)</li><li>Lower highs and lower lows (downtrend)</li><li>Break of structure confirmation</li><li>Momentum analysis</li></ul>',
                        ],
                    ],
                ],
            ],
            [
                'lesson_num' => '1.2',
                'title' => 'Range-Bound Markets',
                'description' => 'Identifying and profiting from ranging market conditions using institutional techniques.',
                'order' => 2,
                'blocks' => [
                    [
                        'id' => 'block-1',
                        'type' => 'text',
                        'payload' => [
                            'content' => '<h2>Trading Range-Bound Markets</h2><p>When markets aren\'t trending, they\'re ranging. Professional traders use different strategies for range-bound conditions:</p><ul><li>Identify support and resistance zones</li><li>Trade the range boundaries</li><li>Watch for breakout signals</li><li>Manage risk with tight stops</li></ul>',
                        ],
                    ],
                ],
            ],
        ];

        foreach ($topics as $topicData) {
            $lesson = Lesson::where('number', $topicData['lesson_num'])->first();
            if (!$lesson) continue;

            Topic::create([
                'lesson_id' => $lesson->id,
                'title' => $topicData['title'],
                'description' => $topicData['description'],
                'order' => $topicData['order'],
                'blocks' => $topicData['blocks'] ?? [],
                'coin_reward' => 10,
            ]);
        }
    }
}
