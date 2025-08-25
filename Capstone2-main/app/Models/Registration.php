<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class Registration extends Authenticatable implements JWTSubject, MustVerifyEmail

{
    use Notifiable;

    protected $table = 'registrations';

    protected $fillable = [
        'full_name',
        'email',
        'password',
        'token', // optional: used for verification/email tracking
    ];

    protected $hidden = [
        'password',
        'remember_token', // optional: hide remember_token if you plan to use it
    ];

    protected $casts = [
        'email_verified_at' => 'datetime', // ensures email verification works
    ];

    // JWT Methods
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }
    
public function hasVerifiedEmail()
{
    // Bypass email verification if this is a hardware account
    if ($this->is_hardware) {
        return true;
    }

    // Normal users still require verification
    return !is_null($this->email_verified_at);
}


}
