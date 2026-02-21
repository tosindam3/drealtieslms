<?php

namespace App\Exceptions;

use Exception;

class WeekProgressionException extends Exception
{
    /**
     * Create a new week progression exception instance.
     */
    public function __construct(string $message = 'Week progression operation failed', int $code = 422, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Render the exception as an HTTP response.
     */
    public function render()
    {
        return response()->json([
            'error' => 'week_progression_failed',
            'message' => $this->getMessage(),
            'timestamp' => now()->toISOString()
        ], $this->getCode());
    }
}