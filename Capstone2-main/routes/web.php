<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Models\Registration;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| These routes handle redirects for email verification and password reset.
| They connect Laravel’s backend authentication logic with your React
| frontend (e.g., http://localhost:3000 or your deployed domain).
|
*/

Route::get('/', function () {
    return view('welcome');
});

<?php
// filepath: d:\WasteSystem\Capstone2-main\routes\web.php
Route::get('/test-verify', function () {
    \Log::info('Test verify route hit');
    return 'Test verify route hit!';
});
/**
 * ---------------------------------------------------------------
 * EMAIL VERIFICATION REDIRECT (Frontend Integration)
 * ---------------------------------------------------------------
 * This route is the entry point for verifying emails via signed URLs.
 * It ensures signature validity, marks the email as verified if valid,
 * and redirects to your React frontend with status info.
 */
Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    \Log::info('Signature debug', [
        'full_url' => $request->fullUrl(),
        'host' => $request->getHost(),
        'scheme' => $request->getScheme(),
        'config_app_url' => config('app.url'),
    ]);

    $frontend = rtrim(config('app.frontend_url') ?: env('FRONTEND_URL', 'https://lnuwastemonitoring.onrender.com'), '/');
    $user = Registration::find($id);

    if (!$user) {
        return redirect($frontend . '/login?verified=0&reason=not_found');
    }

    // Verify the hash matches the user's email hash
    if (!hash_equals(sha1($user->getEmailForVerification()), $hash)) {
        return redirect($frontend . '/login?verified=0&reason=invalid_hash');
    }

    // Mark email as verified if not already done
    if (!$user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
    }

    // Redirect to frontend with success query params
    return redirect($frontend . '/login?verified=1');
})->middleware(['web'])->name('verification.verify');

/**
 * ---------------------------------------------------------------
 * PASSWORD RESET REDIRECT (SPA Compatibility)
 * ---------------------------------------------------------------
 * Converts the default Laravel password reset link to a frontend route.
 * Example:
 *  Laravel sends -> https://api.example.com/password/reset/{token}?email=foo@mail.com
 *  Redirects to -> https://frontend.example.com/reset-password?token={token}&email={email}
 */
Route::get('/password/reset/{token}', function ($token, Request $request) {
    $frontend = rtrim(config('app.frontend_url') ?: env('FRONTEND_URL', 'http://localhost:3000'), '/');
    $email = $request->query('email');

    $url = $frontend . '/reset-password?token=' . urlencode($token);
    if ($email) {
        $url .= '&email=' . urlencode($email);
    }

    return redirect($url);
})->name('password.reset.redirect');
