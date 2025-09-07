<?php

namespace App\Models;

use Illuminate\Support\Facades\Hash;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use App\Notifications\ResetPassword as CustomResetPassword;

class Registration extends Authenticatable implements JWTSubject, MustVerifyEmail
{
    use Notifiable;

    protected $table = 'registrations';

    protected $fillable = [
    'full_name',
    'email',
    'password',
    'token',
    'is_hardware', // add this
    'email_verified_at', // also add this
];


    protected $hidden = [
        'password',
        // 'remember_token', // 🔹 removed since we don’t use it
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',

    ];
    

    /**
     * 🔹 Override: send custom reset password notification
     */
    public function sendPasswordResetNotification($token)
    {
        $base = config('app.frontend_url');
        if (!$base || !preg_match('/^https?:\/\//i', $base)) {
            // Fallback to env or sensible default
            $base = rtrim(env('APP_FRONTEND_URL', 'http://localhost:3000'), '/');
        } else {
            $base = rtrim($base, '/');
        }
        $url = $base . '/reset-password?token=' . urlencode($token) . '&email=' . urlencode($this->email);
        $this->notify(new CustomResetPassword($token, $url));
    }
    //    protected function setPasswordAttribute($value)
    // {
    //     $this->attributes['password'] = Hash::make($value);
    // }

    /**
     * 🔹 Override: disable remember_token entirely
     */
    public function setRememberToken($value) {}
    public function getRememberTokenName() { return null; }
    public function getRememberToken() { return null; }

    /**
     * JWT methods
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    /**
     * 🔹 Email verification override
     */
    public function hasVerifiedEmail()
{
    if (!empty($this->is_hardware)) { // ✅ check the DB column, not PHP property
        return true;
    }
    return !is_null($this->email_verified_at);
}

}
