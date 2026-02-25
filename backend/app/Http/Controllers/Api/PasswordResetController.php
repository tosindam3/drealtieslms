<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use App\Mail\PasswordResetMail;
use App\Events\PasswordChangedEvent;
use App\Services\Mail\EmailTemplateService;

class PasswordResetController extends Controller
{
    protected $emailService;

    public function __construct(EmailTemplateService $emailService)
    {
        $this->emailService = $emailService;
    }

    /**
     * Send a reset link to the given user.
     */
    public function sendResetLinkEmail(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            // We return a generic successful message even if email doesn't exist for security
            // but for this specific validation check, we might want to be explicit depending on policy.
            // Industry standard: "If account exists, email sent."
            return response()->json([
                'message' => 'Check your email for the password reset link.',
                'timestamp' => now()->toISOString()
            ]);
        }

        $email = $request->email;
        $token = Str::random(64);

        try {
            // Delete existing tokens for this email
            DB::table('password_reset_tokens')->where('email', $email)->delete();

            // Insert new token
            DB::table('password_reset_tokens')->insert([
                'email' => $email,
                'token' => Hash::make($token),
                'created_at' => now(),
            ]);

            // Send Reset Email
            $resetUrl = config('app.url') . "/reset-password?token={$token}&email=" . urlencode($email);
            $this->emailService->sendTemplateMail('password-reset-link', $email, [
                'reset_url' => $resetUrl,
            ]);

            return response()->json([
                'message' => 'Password reset link sent successfully.',
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Password reset email failed: " . $e->getMessage());
            return response()->json([
                'error' => 'email_failed',
                'message' => 'Failed to send reset email. Please try again later.',
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }

    /**
     * Reset the given user's password.
     */
    public function reset(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'validation_failed',
                'errors' => $validator->errors(),
                'timestamp' => now()->toISOString()
            ], 422);
        }

        $reset = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$reset || !Hash::check($request->token, $reset->token)) {
            return response()->json([
                'error' => 'invalid_token',
                'message' => 'This password reset token is invalid or expired.',
                'timestamp' => now()->toISOString()
            ], 400);
        }

        // Check expiration (60 minutes)
        if (now()->subMinutes(60)->gt($reset->created_at)) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json([
                'error' => 'expired_token',
                'message' => 'This password reset token has expired.',
                'timestamp' => now()->toISOString()
            ], 400);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'error' => 'user_not_found',
                'message' => 'We can\'t find a user with that email address.',
                'timestamp' => now()->toISOString()
            ], 404);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->password)
        ]);

        // Revoke all tokens for security
        $user->tokens()->delete();

        // Delete the reset token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Send confirmation email
        event(new PasswordChangedEvent($user));

        return response()->json([
            'message' => 'Password has been reset successfully.',
            'timestamp' => now()->toISOString()
        ]);
    }
}
