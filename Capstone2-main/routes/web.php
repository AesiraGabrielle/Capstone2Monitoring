<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Models\Registration;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Frontend email verification redirect
Route::get('/verify-email/{id}/{hash}', function (Request $request, $id, $hash) {
    $user = Registration::find($id);
    if (!$user) {
        return redirect(config('app.frontend_url') . '/login?verified=0&reason=not_found');
    }
    if (!hash_equals(sha1($user->getEmailForVerification()), $hash)) {
        return redirect(config('app.frontend_url') . '/login?verified=0&reason=hash');
    }
    if (!$user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
    }
    return redirect(config('app.frontend_url') . '/login?verified=1');
})->name('frontend.verification.redirect');
