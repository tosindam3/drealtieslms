<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\Week;
use Illuminate\Database\Seeder;

class ModuleSeeder extends Seeder
{
    public function run(): void
    {
        $weeks = Week::all();

        foreach ($weeks as $week) {
            Module::create([
                'week_id' => $week->id,
                'title' => $week->week_number === 0 ? 'Academy Orientation' : 'Market Structure',
                'description' => $week->week_number === 0 
                    ? 'Welcome to DrealtiesFX Academy - Platform orientation and trading fundamentals'
                    : 'Understanding institutional order flow and market microstructure',
                'order' => 1,
                'position' => 1,
            ]);
        }
    }
}
