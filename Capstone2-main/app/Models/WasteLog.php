<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WasteLog extends Model
{
    protected $fillable = [
        'bin_type',
        'count',
        'logged_at',
        'label',
        'confidence_score',
    ];

    protected $casts = [
        'logged_at' => 'datetime',
        'confidence_score' => 'float',
    ];
}
