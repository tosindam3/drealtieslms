<?php
$file = 'backend/app/Http/Controllers/Api/TestController.php';
$content = file_get_contents($file);

$newMethod = '
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
';

$pos = strrpos($content, '}');
if ($pos !== false) {
    $content = substr_replace($content, $newMethod, $pos, 0);
    file_put_contents($file, $content);
    echo "Success\n";
} else {
    echo "Failed\n";
}
