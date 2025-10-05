<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Models\Registration;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| These routes handle email verification for SPA frontends like yours.
|--------------------------------------------------------------------------
*/

// ✅ Email Verification Handler
Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    $frontend = config('app.frontend_url') ?: 'http://localhost:3000';
    $user = Registration::find($id);

    // 🧩 1. Check if user exists
    if (!$user) {
        return redirect($frontend . '/login?verified=0&reason=not_found');
    }

    // 🧩 2. Validate hash
    if (!hash_equals(sha1($user->getEmailForVerification()), $hash)) {
        return redirect($frontend . '/login?verified=0&reason=hash');
    }

    // ✅ 3. Mark as verified
    if (!$user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
    }

    // 🔁 4. Redirect to frontend login
    return redirect($frontend . '/login?verified=1');
})->middleware(['signed'])->name('verification.verify');


// Optional: backend root test route
Route::get('/', function () {
    return response()->json(['message' => 'Backend is running.']);
});
