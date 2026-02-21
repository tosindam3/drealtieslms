<?php

namespace App\Exceptions;

use Exception;

class EnrollmentException extends Exception
{
    /**
     * Create a new enrollment exception instance.
     */
    public function __construct(string $message = 'Enrollment operation failed', int $code = 422, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Render the exception as an HTTP response.
     */
    public function render()
    {
        return response()->json([
            'error' => 'enrollment_failed',
            'message' => $this->getMessage(),
            'timestamp' => now()->toISOString()
        ], $this->getCode());
    }
}