<?php

namespace App\Http\Controllers;

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
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|regex:/^[a-zA-Z0-9._%+-]+@lnu\.edu\.ph$/i|unique:registrations,email',
            'password' => 'required|min:8|confirmed',
        ], [
            'email.regex' => 'Only emails ending in @lnu.edu.ph are allowed.',
            'password.confirmed' => 'Passwords do not match.',
        ]);

        // Create user
        $user = Registration::create([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'token' => $token = Str::random(60), // optional, if needed for email verification
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
                return response()->json(['error' => 'Invalid credentials'], 401);
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
            'new_password' => 'required|min:8|confirmed',
        ]);

        $user = auth()->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 400);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Password changed successfully!']);
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

    $credentials = $request->only('email', 'password');

    // Attempt login
    if (!$token = auth()->attempt($credentials)) {
        return response()->json(['error' => 'Unauthorized'], 401);
    }

    $user = auth()->user();

    // Optional: check if this is a hardware account
    if (!$user->is_hardware) {
        return response()->json(['error' => 'Not a hardware account'], 403);
    }

    return response()->json([
        'access_token' => $token,
        'token_type' => 'bearer',
        'expires_in' => null, // permanent token, or set TTL if desired
    ]);
}


}
