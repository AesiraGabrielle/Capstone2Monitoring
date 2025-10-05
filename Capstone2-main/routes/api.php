<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\WasteLevelController;
use App\Http\Controllers\WasteLogController;
use App\Http\Controllers\InitialDataController;
use App\Models\Registration;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| These routes are loaded by the RouteServiceProvider within a group
| which is assigned the "api" middleware group.
|--------------------------------------------------------------------------
*/

// -------------------- AUTH ROUTES --------------------
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);

Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/change-password', [AuthController::class, 'changePassword']);

// -------------------- EMAIL VERIFICATION --------------------
// This route handles verification from email links
Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    if (! $request->hasValidSignature()) {
        return response()->json(['message' => 'Invalid signature'], 403);
    }

    $user = Registration::find($id);
    if (! $user) {
        return response()->json(['message' => 'User not found'], 404);
    }

    if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
        return response()->json(['message' => 'Invalid hash'], 403);
    }

    if (! $user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
    }

    // Redirect to frontend after success
    $frontend = env('APP_FRONTEND_URL', 'https://lnuwastemonitoring.onrender.com');
    return redirect($frontend . '/login?verified=1');
})->middleware(['signed'])->name('verification.verify');

Route::post('/email/resend', [AuthController::class, 'resendVerification'])->name('verification.send');

// -------------------- HARDWARE DATA --------------------
Route::post('/hardware/login', [AuthController::class, 'hardwareLogin']);
Route::post('/hardware/waste-levels', [WasteLevelController::class, 'store']);
Route::post('/hardware/waste-logs', [WasteLogController::class, 'store']);

// -------------------- DATA RETRIEVAL --------------------
Route::get('/initial-data', [InitialDataController::class, 'index']);
Route::post('/waste-levels', [WasteLevelController::class, 'store']);
Route::get('/waste-levels/latest', [WasteLevelController::class, 'latestLevels']);

Route::post('/waste-logs', [WasteLogController::class, 'store']);
Route::get('/waste-logs/daily-breakdown', [WasteLogController::class, 'dailyBreakdown']);
Route::get('/waste-logs/weekly-summary', [WasteLogController::class, 'weeklySummary']);
Route::get('/waste-logs/monthly-summary', [WasteLogController::class, 'monthlySummary']);
Route::get('/waste-logs/total', [WasteLogController::class, 'totalGarbageAllTime']);
