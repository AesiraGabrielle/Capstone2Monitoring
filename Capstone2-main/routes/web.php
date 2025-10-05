<?php
// filepath: d:\WasteSystem\Capstone2-main\routes\web.php
Route::get('/test-verify', function () {
    \Log::info('Test verify route hit');
    return 'Test verify route hit!';
});