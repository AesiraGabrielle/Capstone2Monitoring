<?php
// filepath: d:\WasteSystem\Capstone2-main\routes\web.php

use Illuminate\Http\Request;

Route::get('/test-verify', function () {
    \Log::info('Test verify route hit');
    return 'Test verify route hit!';
});

Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    // Your actual verification logic here
    // Example:
    $user = \App\Models\Registration::find($id);
    if (!$user) {
        return redirect('/login?verified=0&reason=not_found');
    }
    if (!hash_equals(sha1($user->email), $hash)) {
        return redirect('/login?verified=0&reason=hash');
    }
    if (!$user->hasVerifiedEmail()) {
        $user->email_verified_at = now();
        $user->save();
    }
    return redirect('https://lnuwastemonitoring.onrender.com/login?verified=1');
})->middleware(['web', 'signed'])->name('verification.verify');