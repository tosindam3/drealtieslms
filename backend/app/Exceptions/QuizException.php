<?php

namespace App\Exceptions;

use Exception;

class QuizException extends Exception
{
    /**
     * Create a new quiz exception instance.
     */
    public function __construct(string $message = 'Quiz operation failed', int $code = 422, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Render the exception as an HTTP response.
     */
    public function render()
    {
        return response()->json([
            'error' => 'quiz_operation_failed',
            'message' => $this->getMessage(),
            'timestamp' => now()->toISOString()
        ], $this->getCode());
    }
}