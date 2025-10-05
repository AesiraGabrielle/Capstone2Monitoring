<?php
// filepath: d:\WasteSystem\Capstone2-main\routes\web.php

use Illuminate\Http\Request;

Route::get('/test-verify', function () {
    \Log::info('Test verify route hit');
    return 'Test verify route hit!';
});

Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    // ...your verification logic...
})->middleware(['web', 'signed'])->name('verification.verify');