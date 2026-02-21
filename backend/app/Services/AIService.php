<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIService
{
    protected ?string $apiKey;
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key');
    }

    /**
     * Generate content based on a prompt and a specific schema.
     */
    public function generate(string $prompt, string $systemInstruction): array
    {
        if (empty($this->apiKey)) {
            Log::error('Gemini API Key is not set.');
            throw new \Exception('AI integration is not configured. Please set GEMINI_API_KEY.');
        }

        $response = Http::post($this->baseUrl . '?key=' . $this->apiKey, [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ],
            'system_instruction' => [
                'parts' => [
                    ['text' => $systemInstruction]
                ]
            ],
            'generationConfig' => [
                'response_mime_type' => 'application/json',
            ]
        ]);

        if ($response->failed()) {
            Log::error('Gemini API Error: ' . $response->body());
            throw new \Exception('Failed to generate content from AI.');
        }

        $result = $response->json();

        try {
            $content = $result['candidates'][0]['content']['parts'][0]['text'];
            return json_decode($content, true);
        } catch (\Exception $e) {
            Log::error('Failed to parse Gemini response: ' . $response->body());
            throw new \Exception('AI returned invalid content format.');
        }
    }

    /**
     * Generate a Module structure (Lessons and Topics).
     */
    public function generateModule(string $topicSummary): array
    {
        $systemInstruction = "You are an expert curriculum designer. Generate a module structure in JSON format. 
        The module should include 'title', 'description', and an array of 'lessons'.
        Each lesson should include 'title', 'description', 'estimated_duration' (in minutes), and an array of 'topics'.
        Each topic should include 'title', 'description', and 'content_outline'.
        Respond ONLY with the JSON structure.";

        return $this->generate("Create a comprehensive module about: " . $topicSummary, $systemInstruction);
    }

    /**
     * Generate a Quiz based on topics.
     */
    public function generateQuiz(string $context): array
    {
        $systemInstruction = "You are an expert educator. Generate a quiz in JSON format based on the provided context.
        The JSON should include 'title', 'description', 'passing_score' (default 70), and an array of 'questions'.
        Each question should include 'type' (single_choice, multiple_choice, true_false, text, number), 'question_text', 'options' (array of objects with 'id' and 'text'), 'correct_answers' (array of IDs or text/number), 'points', and 'explanation'.
        Respond ONLY with the JSON structure.";

        return $this->generate("Generate 5-10 quiz questions based on the following: " . $context, $systemInstruction);
    }

    /**
     * Generate an Assignment.
     */
    public function generateAssignment(string $context): array
    {
        $systemInstruction = "You are an expert instructor. Generate an assignment in JSON format.
        The JSON should include 'title', 'description', 'instructions_html', 'max_points', 'submission_type' (file, link, or text).
        Respond ONLY with the JSON structure.";

        return $this->generate("Create a practical assignment based on the following topic: " . $context, $systemInstruction);
    }

    /**
     * Generate content blocks for a Topic.
     */
    public function generateTopicBlocks(string $topicTitle, string $context): array
    {
        $systemInstruction = "You are an expert content creator. Generate educational content blocks for a topic in JSON format.
        The JSON should be an array of blocks. Each block has 'id', 'type' (text, video_link, image_placeholder), and 'content'.
        'content' for 'text' should be markdown formatted.
        Respond ONLY with the JSON structure.";

        return $this->generate("Generate comprehensive learning content blocks for the topic '{$topicTitle}' with this context: " . $context, $systemInstruction);
    }
}
