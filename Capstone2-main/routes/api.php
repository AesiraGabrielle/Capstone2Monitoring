<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use App\Http\Controllers\WasteLogController;
use App\Models\Registration;
use App\Http\Controllers\WasteLevelController;
use App\Http\Controllers\InitialDataController;

// --------------------------
// AUTHENTICATION ROUTES
// --------------------------

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// --------------------------
// EMAIL VERIFICATION ROUTES
// --------------------------

// ✅ Use proper EmailVerificationRequest for Laravel's built-in signed route
Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request, $id, $hash) {
    $frontend = config('app.frontend_url') ?: 'http://localhost:3000';

    $user = Registration::find($id);

    if (!$user) {
        return redirect($frontend . '/login?verified=0&reason=not_found');
    }

    // Verify the hash to ensure the signature matches
    if (!hash_equals(sha1($user->getEmailForVerification()), $hash)) {
        return redirect($frontend . '/login?verified=0&reason=hash');
    }

    // Mark as verified if not yet verified
    if (!$user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
    }

    return redirect($frontend . '/login?verified=1');
})->middleware(['signed'])->name('verification.verify');


// ✅ Resend verification email
Route::post('/email/resend', function (Request $request) {
    $request->validate(['email' => 'required|email']);

    $user = Registration::where('email', $request->email)->first();

    if (!$user) {
        return response()->json(['error' => 'User not found'], 404);
    }

    if ($user->hasVerifiedEmail()) {
        return response()->json(['message' => 'Email already verified.']);
    }

    $user->sendEmailVerificationNotification();

    return response()->json(['message' => 'Verification link resent.']);
})->name('verification.send');

// --------------------------
// PASSWORD MANAGEMENT ROUTES
// --------------------------

Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// --------------------------
// PROTECTED ROUTES (AUTH + VERIFIED)
// --------------------------

Route::middleware(['jwt.auth', 'verified'])->group(function () {
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Waste level data
    Route::post('/waste-levels', [WasteLevelController::class, 'store']);
    Route::get('/waste-levels/latest', [WasteLevelController::class, 'latestLevels']);

    // Waste logs
    Route::post('/waste-logs', [WasteLogController::class, 'store']);
    Route::get('/waste-logs/daily-breakdown', [WasteLogController::class, 'dailyBreakdown']);
    Route::get('/waste-logs/weekly-summary', [WasteLogController::class, 'weeklySummary']);
    Route::get('/waste-logs/monthly-summary', [WasteLogController::class, 'monthlySummary']);
    Route::get('/waste-logs/total', [WasteLogController::class, 'totalGarbageAllTime']);

    // Initial dashboard data
    Route::get('/initial-data', [InitialDataController::class, 'index']);
});

// --------------------------
// HARDWARE ROUTES (ESP32)
// --------------------------

Route::post('/hardware/login', [AuthController::class, 'hardwareLogin'])->middleware('throttle:5,1');

Route::middleware(['jwt.auth'])->prefix('hardware')->group(function () {
    Route::post('/waste-levels', [WasteLevelController::class, 'store']);
    Route::post('/waste-logs', [WasteLogController::class, 'store']);
});
