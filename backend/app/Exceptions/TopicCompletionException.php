<?php

namespace App\Exceptions;

use Exception;

class TopicCompletionException extends Exception
{
    /**
     * Create a new topic completion exception instance.
     */
    public function __construct(string $message = 'Topic completion operation failed', int $code = 422, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Render the exception as an HTTP response.
     */
    public function render()
    {
        return response()->json([
            'error' => 'topic_completion_failed',
            'message' => $this->getMessage(),
            'timestamp' => now()->toISOString()
        ], $this->getCode());
    }
}