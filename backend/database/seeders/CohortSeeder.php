<?php

namespace Database\Seeders;

use App\Models\Cohort;
use Illuminate\Database\Seeder;

class CohortSeeder extends Seeder
{
    public function run(): void
    {
        $cohorts = [
            [
                'name' => 'Forex Mastery Alpha - January 2026',
                'description' => 'Elite 8-week institutional trading program focusing on advanced market structure and liquidity analysis.',
                'start_date' => '2026-01-15',
                'end_date' => '2026-03-15',
                'capacity' => 25,
                'enrolled_count' => 6,
                'status' => 'active',
            ],
            [
                'name' => 'Forex Mastery Beta - February 2026',
                'description' => 'Comprehensive trading curriculum with live market sessions and prop firm preparation.',
                'start_date' => '2026-02-15',
                'end_date' => '2026-04-15',
                'capacity' => 30,
                'enrolled_count' => 2,
                'status' => 'active',
            ],
            [
                'name' => 'Advanced Risk Management - March 2026',
                'description' => 'Specialized cohort focusing on institutional risk management and capital preservation strategies.',
                'start_date' => '2026-03-01',
                'end_date' => '2026-04-30',
                'capacity' => 20,
                'enrolled_count' => 0,
                'status' => 'published',
            ],
        ];

        foreach ($cohorts as $cohortData) {
            Cohort::create($cohortData);
        }
    }
}