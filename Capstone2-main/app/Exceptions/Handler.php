<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Customize the response for unauthenticated users (especially for APIs).
     */
    // protected function unauthenticated($request, AuthenticationException $exception)
    // {
    //     return response()->json([
    //         'error' => 'Unauthenticated. Please log in.'
    //     ], 401);
    // }
    protected function unauthenticated($request, \Illuminate\Auth\AuthenticationException $exception)
{
    // Hardware routes should never redirect
    if ($request->is('api/hardware/*')) {
        return response()->json(['error' => 'Unauthenticated'], 401);
    }

    // For everything else, keep normal Laravel behavior
    if ($request->expectsJson()) {
        return response()->json(['error' => 'Unauthenticated'], 401);
    }

    return redirect()->guest(route('login'));
}

}
