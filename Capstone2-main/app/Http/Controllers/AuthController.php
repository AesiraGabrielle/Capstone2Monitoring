<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use App\Models\Registration;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\Registered;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller
{
    // Register new user and return JWT
    public function register(Request $request)
    {
        $request->validate([
            'full_name' => 'required|string|max:255|regex:/^[A-Za-z ]+$/',
            'email' => 'required|email|regex:/^[a-zA-Z0-9._%+-]+@lnu\.edu\.ph$/i|unique:registrations,email',
            // Alphanumeric only, at least 8 chars
            // Must contain at least one letter, one digit, and one symbol
            'password' => ['required','confirmed','regex:/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]|:;"\'<>.,?\/`~]).{8,}$/'],
        ], [
            'full_name.regex' => 'Full name must contain only letters (A–Z, a–z) and spaces.',
            'email.regex' => 'Only emails ending in @lnu.edu.ph are allowed.',
            'password.confirmed' => 'Passwords do not match.',
            'password.regex' => 'Password must be at least 8 chars with a letter, a number, and an allowed symbol (!@#$%^&*()_+-={}[]|:;"\'<>.,?/`~).',
            // regex message removed
        ]);

        // Create user
        $user = Registration::create([
        'full_name' => $request->full_name,
        'email' => $request->email,
        'password' => $request->password, // plain here, model mutator hashes it
        'token' => Str::random(60),
    ]);


        // Fire email verification event
        event(new Registered($user));

        // Generate JWT token
        $jwtToken = JWTAuth::fromUser($user);

        return response()->json([
            'message' => 'Registration successful! Please verify your email.',
            'user' => $user,
            'token' => $jwtToken,
        ]);
    }

    // Login user and return JWT
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        try {
            if (!$token = JWTAuth::attempt($credentials)) {
                return response()->json(['error' => 'Incorrect Email or Password. Please Try Again.'], 401);
            }
        } catch (JWTException $e) {
            return response()->json(['error' => 'Could not create token'], 500);
        }

        $user = auth()->user();

        // Check email verification
        if (!$user->hasVerifiedEmail()) {
            return response()->json(['error' => 'Please verify your email first.'], 403);
        }

        return response()->json([
            'message' => 'Login successful!',
            'token' => $token,
            'user' => $user,
        ]);
    }

    // Change authenticated user's password
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => ['required','confirmed','regex:/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]|:;"\'<>.,?\/`~]).{8,}$/'],
    ]);

        $user = auth()->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 400);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Password changed successfully!']);
    }

    
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:registrations,email',
        ], [
            'new_password.regex' => 'New password must be at least 8 chars with a letter, a number, and an allowed symbol (!@#$%^&*()_+-={}[]|:;"\'<>.,?/`~).',
        ]);

        $status = Password::broker('registrations')->sendResetLink(
            $request->only('email')
        );

        return $status === Password::RESET_LINK_SENT
            ? response()->json(['message' => 'Password reset link sent to your email.'])
            : response()->json(['error' => 'Unable to send reset link.'], 500);
    }

    /**
     * Reset the password using the token sent by email
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email|exists:registrations,email',
            'password' => ['required','confirmed','regex:/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]|:;"\'<>.,?\/`~]).{8,}$/'],
        ], [
            'password.regex' => 'Password must be at least 8 chars with a letter, a number, and an allowed symbol (!@#$%^&*()_+-={}[]|:;"\'<>.,?/`~).',
        ]);

        $status = \Illuminate\Support\Facades\Password::broker('registrations')->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->password = \Illuminate\Support\Facades\Hash::make($password);
                $user->setRememberToken(\Illuminate\Support\Str::random(60));
                $user->save();

                event(new \Illuminate\Auth\Events\PasswordReset($user));
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => 'Password reset successful. You can now log in with your new password.'])
            : response()->json(['error' => 'Invalid or expired token.'], 400);
    }

    // Optional: Logout user by invalidating token
    public function logout()
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
            return response()->json(['message' => 'Successfully logged out']);
        } catch (JWTException $e) {
            return response()->json(['error' => 'Failed to logout, please try again.'], 500);
        }
    }


public function hardwareLogin(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'password' => 'required|string',
    ]);

    // Manually check credentials (no email verification here)
    $user = \App\Models\Registration::where('email', $request->email)->first();
    if (!$user || !\Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
        return response()->json(['error' => 'Unauthorized'], 401);
    }

    if (empty($user->is_hardware)) {
        return response()->json(['error' => 'Not a hardware account'], 403);
    }


    $claims = [
        'jti'         => 'device-esp32cam-v1',        
        'iat'         => 1704067200,                  // 2024-01-01 00:00:00 UTC
        'nbf'         => 1704067200,
        'exp'         => 2145811200,                  // 2037-12-31 00:00:00 UTC
        'is_hardware' => true,                        // handy in downstream checks
        'role'        => 'device',
    ];

    $token = \Tymon\JWTAuth\Facades\JWTAuth::claims($claims)->fromUser($user);

    return response()->json([
        'access_token' => $token,
        'token_type'   => 'bearer',
        'expires_in'   => null,   
    ]);
}


}
