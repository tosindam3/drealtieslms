<?php

namespace App\Exceptions;

use Exception;

class LiveClassException extends Exception
{
    /**
     * Create a new live class exception instance.
     */
    public function __construct(string $message = 'Live class operation failed', int $code = 422, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Render the exception as an HTTP response.
     */
    public function render()
    {
        return response()->json([
            'error' => 'live_class_operation_failed',
            'message' => $this->getMessage(),
            'timestamp' => now()->toISOString()
        ], $this->getCode());
    }
}