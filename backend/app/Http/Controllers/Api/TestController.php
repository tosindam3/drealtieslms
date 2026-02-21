<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Cohort;
use App\Models\Week;
use App\Models\Lesson;
use Illuminate\Http\Request;

class TestController extends Controller
{
    public function index()
    {
        return response()->json([
            'message' => 'DrealtiesFX Academy API is running successfully!',
            'timestamp' => now(),
            'environment' => app()->environment(),
            'stats' => [
                'users' => User::count(),
                'cohorts' => Cohort::count(),
                'weeks' => Week::count(),
                'lessons' => Lesson::count(),
            ]
        ]);
    }

    public function courses()
    {
        $cohorts = Cohort::with(['weeks.lessons'])->get();
        
        return response()->json([
            'success' => true,
            'data' => $cohorts,
            'message' => 'Courses retrieved successfully'
        ]);
    }

    public function users()
    {
        $users = User::with('coinBalance')->get();
        
        return response()->json([
            'success' => true,
            'data' => $users,
            'message' => 'Users retrieved successfully'
        ]);
    }

    public function gemini(\App\Services\AIService $aiService)
    {
        try {
            $prompt = "Write a very short one-sentence greeting for the DrealtiesFX Academy.";
            $systemInstruction = "You are a helpful assistant. Respond with ONLY the greeting.";
            
            $result = $aiService->generate($prompt, $systemInstruction);
            
            return response()->json([
                "success" => true,
                "prompt" => $prompt,
                "response" => $result,
                "message" => "Gemini API test successful"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                "success" => false,
                "message" => "Gemini API test failed",
                "error" => $e->getMessage()
            ], 500);
        }
    }
}