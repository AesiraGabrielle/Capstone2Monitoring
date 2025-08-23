<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
   protected function redirectTo(Request $request): ?string
{
    // Return JSON error instead of redirecting to a named route
    if ($request->expectsJson()) {
        return null;
    }

    return null;
}

}
