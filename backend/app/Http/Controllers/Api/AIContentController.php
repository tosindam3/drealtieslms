<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AIService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class AIContentController extends Controller
{
    public function __construct(
        private AIService $aiService
    ) {}

    /**
     * Generate content based on type.
     */
    public function generate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:module,quiz,assignment,topic_blocks',
            'prompt' => 'required|string|min:5',
            'context' => 'nullable|string',
            'topic_title' => 'required_if:type,topic_blocks|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $type = $request->input('type');
            $prompt = $request->input('prompt');
            $context = $request->input('context', '');

            $content = match ($type) {
                'module' => $this->aiService->generateModule($prompt),
                'quiz' => $this->aiService->generateQuiz($prompt . ' ' . $context),
                'assignment' => $this->aiService->generateAssignment($prompt . ' ' . $context),
                'topic_blocks' => $this->aiService->generateTopicBlocks($request->input('topic_title'), $prompt . ' ' . $context),
            };

            return response()->json([
                'status' => 'success',
                'data' => $content
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
