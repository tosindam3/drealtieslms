<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use App\Mail\StudentRegisteredMail;
use App\Services\Mail\EmailTemplateService;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    protected $emailService;

    public function __construct(EmailTemplateService $emailService)
    {
        $this->emailService = $emailService;
    }

    /**
     * Register a new user
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'sometimes|string|in:' . implode(',', User::getRoles()),
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'validation_failed',
                'message' => 'The provided data is invalid',
                'errors' => $validator->errors(),
                'timestamp' => now()->toISOString()
            ], 422);
        }

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role ?? User::ROLE_STUDENT,
            ]);

            // Create initial coin balance for students
            if ($user->isStudent()) {
                $user->coinBalance()->create(['total_balance' => 0]);

                // Trigger welcome email
                $this->emailService->sendTemplateMail('student-registered', $user->email, [
                    'user_name' => $user->name,
                ]);
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'message' => 'User registered successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'coin_balance' => $user->getCurrentCoinBalance(),
                    'created_at' => $user->created_at->toISOString(),
                ],
                'token' => $token,
                'token_type' => 'Bearer',
                'timestamp' => now()->toISOString()
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'registration_failed',
                'message' => 'Failed to register user',
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }

    /**
     * Login user and create token
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'validation_failed',
                'message' => 'The provided data is invalid',
                'errors' => $validator->errors(),
                'timestamp' => now()->toISOString()
            ], 422);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'error' => 'authentication_failed',
                'message' => 'Invalid credentials',
                'timestamp' => now()->toISOString()
            ], 401);
        }

        $user = Auth::user();

        // Update last active timestamp
        $user->update(['last_active_at' => now()]);

        // Revoke existing tokens for security
        $user->tokens()->delete();

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'coin_balance' => $user->getCurrentCoinBalance(),
                'last_active_at' => $user->last_active_at?->toISOString(),
            ],
            'token' => $token,
            'token_type' => 'Bearer',
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Logout user and revoke token
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            // Revoke current token
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'message' => 'Logout successful',
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'logout_failed',
                'message' => 'Failed to logout user',
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }

    /**
     * Get authenticated user profile
     */
    public function user(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load(['coinBalance', 'enrollments']);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar_url' => $user->avatar_url,
                'preferences' => $user->preferences,
                'coin_balance' => $user->getCurrentCoinBalance(),
                'last_active_at' => $user->last_active_at?->toISOString(),
                'created_at' => $user->created_at->toISOString(),
                'enrollments' => $user->enrollments->map(function ($cohort) {
                    return [
                        'id' => $cohort->id,
                        'name' => $cohort->name,
                        'status' => $cohort->pivot->status,
                        'completion_percentage' => $cohort->pivot->completion_percentage,
                        'enrolled_at' => $cohort->pivot->enrolled_at,
                    ];
                }),
            ],
            'timestamp' => now()->toISOString()
        ]);
    }

    /**
     * Refresh user token
     */
    public function refresh(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // Revoke current token
            $request->user()->currentAccessToken()->delete();

            // Create new token
            $token = $user->createToken('auth-token')->plainTextToken;

            $user->update(['last_active_at' => now()]);

            return response()->json([
                'message' => 'Token refreshed successfully',
                'token' => $token,
                'token_type' => 'Bearer',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'coin_balance' => $user->getCurrentCoinBalance(),
                    'last_active_at' => $user->last_active_at?->toISOString(),
                ],
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'token_refresh_failed',
                'message' => 'Failed to refresh token',
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }
}
