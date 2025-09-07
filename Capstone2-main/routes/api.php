<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use App\Http\Controllers\WasteLogController;
use App\Models\Registration;
use App\Http\Controllers\WasteLevelController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);


Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    $user = Registration::find($id);

    if (!$user) {
        return response()->json(['error' => 'User not found'], 404);
    }

    if (!hash_equals(sha1($user->getEmailForVerification()), $hash)) {
        return response()->json(['error' => 'Invalid verification link'], 403);
    }

    if ($user->hasVerifiedEmail()) {
        return response()->json(['message' => 'Email already verified']);
    }

    $user->markEmailAsVerified();

    return response()->json(['message' => 'Email verified successfully.']);
})->middleware(['signed'])->name('verification.verify');



Route::post('/email/resend', function (Request $request) {
    $request->validate(['email' => 'required|email']);
    $user = \App\Models\Registration::where('email', $request->email)->first();

    if (!$user) {
        return response()->json(['error' => 'User not found'], 404);
    }

    if ($user->hasVerifiedEmail()) {
        return response()->json(['message' => 'Email already verified.']);
    }

    $user->sendEmailVerificationNotification();

    return response()->json(['message' => 'Verification link resent.']);
})->name('verification.send');


Route::middleware(['jwt.auth', 'verified'])->group(function () {
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/logout', [AuthController::class, 'logout']); 

    Route::post('/waste-levels', [WasteLevelController::class, 'store']);
    Route::get('/waste-levels/latest', [WasteLevelController::class, 'latestLevels']);

    Route::post('/waste-logs', [WasteLogController::class, 'store']); 
    Route::get('/waste-logs/daily-breakdown', [WasteLogController::class, 'dailyBreakdown']);
    Route::get('/waste-logs/weekly-summary', [WasteLogController::class, 'weeklySummary']);
    Route::get('/waste-logs/monthly-summary', [WasteLogController::class, 'monthlySummary']);
    Route::get('/waste-logs/total', [WasteLogController::class, 'totalGarbageAllTime']);
});

Route::post('/hardware/login', [AuthController::class, 'hardwareLogin']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware(['jwt.auth'])->group(function () {
    Route::post('/hardware/waste-levels', [WasteLevelController::class, 'store']);
    Route::post('/hardware/waste-logs', [WasteLogController::class, 'store']);
});
