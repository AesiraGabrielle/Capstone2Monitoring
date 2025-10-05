<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Models\Registration;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| These routes are for redirects and frontend entry points only.
|--------------------------------------------------------------------------
*/

// Default page (optional)
Route::get('/', function () {
    return view('welcome');
});

/**
 * ---------------------------------------------------------------
 * PASSWORD RESET REDIRECT
 * ---------------------------------------------------------------
 * Converts Laravel's default password reset link into a
 * frontend-friendly URL. It simply redirects users to your
 * SPA page with token & email query parameters.
 */
Route::get('/password/reset/{token}', function ($token, Request $request) {
    $frontend = rtrim(env('APP_FRONTEND_URL', 'https://lnuwastemonitoring.onrender.com'), '/');
    $email = $request->query('email');

    $url = $frontend . '/reset-password?token=' . urlencode($token);
    if ($email) {
        $url .= '&email=' . urlencode($email);
    }

    return redirect($url);
})->name('password.reset.redirect');
