<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use App\Http\Controllers\WasteLogController;
use App\Http\Controllers\WasteLevelController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/hardware/login', [AuthController::class, 'hardwareLogin']);


// Email verification link handler
Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();
    return response()->json(['message' => 'Email verified successfully!']);
})->middleware(['jwt.auth', 'signed'])->name('verification.verify');

// Resend email verification
Route::post('/email/resend', function (Request $request) {
    $user = auth()->user();
    if ($user->hasVerifiedEmail()) {
        return response()->json(['message' => 'Email already verified.'], 400);
    }

    $user->sendEmailVerificationNotification();
    return response()->json(['message' => 'Verification link sent!']);
})->middleware(['jwt.auth'])->name('verification.send');

// Protected routes using JWT authentication & email verified
Route::middleware(['jwt.auth', 'verified'])->group(function () {
    // Auth-related
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/logout', [AuthController::class, 'logout']); // optional logout route

    // Waste levels (ultrasonic sensors)
    Route::post('/waste-levels', [WasteLevelController::class, 'store']);
    Route::get('/waste-levels/latest', [WasteLevelController::class, 'latestLevels']);

    // Waste logs (camera object detection)
    Route::post('/waste-logs', [WasteLogController::class, 'store']); 
    Route::get('/waste-logs/daily-breakdown', [WasteLogController::class, 'dailyBreakdown']);
    Route::get('/waste-logs/weekly-summary', [WasteLogController::class, 'weeklySummary']);
    Route::get('/waste-logs/monthly-summary', [WasteLogController::class, 'monthlySummary']);
    Route::get('/waste-logs/total', [WasteLogController::class, 'totalGarbageAllTime']);
});

Route::middleware(['jwt.auth'])->group(function () {
    // Hardware updates for waste levels/logs
    Route::post('/hardware/waste-levels', [WasteLevelController::class, 'store']);
    Route::post('/hardware/waste-logs', [WasteLogController::class, 'store']);
});
