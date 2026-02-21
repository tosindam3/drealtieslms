<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Http\JsonResponse;

class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * Return a success JSON response
     */
    protected function successResponse(array $data = [], string $message = 'Success', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => now()->toISOString()
        ], $status);
    }

    /**
     * Return an error JSON response
     */
    protected function errorResponse(string $error, string $message, int $status = 400, array $errors = []): JsonResponse
    {
        $response = [
            'success' => false,
            'error' => $error,
            'message' => $message,
            'timestamp' => now()->toISOString()
        ];

        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $status);
    }

    /**
     * Return a validation error response
     */
    protected function validationErrorResponse(array $errors): JsonResponse
    {
        return $this->errorResponse(
            'validation_failed',
            'The provided data is invalid',
            422,
            $errors
        );
    }

    /**
     * Return a not found error response
     */
    protected function notFoundResponse(string $resource = 'Resource'): JsonResponse
    {
        return $this->errorResponse(
            'not_found',
            "{$resource} not found",
            404
        );
    }

    /**
     * Return an unauthorized error response
     */
    protected function unauthorizedResponse(string $message = 'Unauthorized'): JsonResponse
    {
        return $this->errorResponse(
            'unauthorized',
            $message,
            401
        );
    }

    /**
     * Return a forbidden error response
     */
    protected function forbiddenResponse(string $message = 'Forbidden'): JsonResponse
    {
        return $this->errorResponse(
            'forbidden',
            $message,
            403
        );
    }
}