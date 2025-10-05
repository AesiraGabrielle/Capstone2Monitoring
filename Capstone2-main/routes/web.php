<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use App\Models\Registration;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| These routes handle email verification and frontend redirects.
| All API routes remain inside api.php.
|--------------------------------------------------------------------------
*/

// 📨 Email verification link handler
Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    $frontend = config('app.frontend_url') ?: 'http://localhost:3000';
    $user = Registration::find($id);

    // 🧩 Check if user exists
    if (!$user) {
        return redirect($frontend . '/login?verified=0&reason=not_found');
    }

    // 🧩 Validate hash integrity
    if (!hash_equals(sha1($user->getEmailForVerification()), $hash)) {
        return redirect($frontend . '/login?verified=0&reason=hash');
    }

    // ✅ Mark email as verified if not yet
    if (!$user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
    }

    // 🔁 Redirect back to frontend after successful verification
    return redirect($frontend . '/login?verified=1');
})->middleware(['signed'])->name('verification.verify');


// 🪄 Optional: Basic welcome route (for testing purposes)
Route::get('/', function () {
    return response()->json(['message' => 'Laravel backend is running.']);
});
