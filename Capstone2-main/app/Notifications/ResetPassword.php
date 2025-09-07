<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPassword extends Notification
{
    public $token;
    public $url;

    /**
     * Create a new notification instance.
     */
    public function __construct($token, $url)
    {
        $this->token = $token;
        $this->url   = $url;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    /**
     * Build the mail representation of the notification.
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Reset Password Notification')
            ->greeting('Hello ' . $notifiable->full_name . ',')
            ->line('We received a request to reset your password.')
            ->line('Click the button below to reset it:')
            ->action('Reset Password', $this->url)
            ->line('If the button does not work, copy and paste this link into your browser: ' . $this->url)
            ->line('Or use this reset token (PIN): **' . $this->token . '**')
            ->line('This password reset link will expire in ' . config('auth.passwords.' . config('auth.defaults.passwords') . '.expire') . ' minutes.')
            ->line('If you did not request a password reset, no further action is required.');
    }
}
