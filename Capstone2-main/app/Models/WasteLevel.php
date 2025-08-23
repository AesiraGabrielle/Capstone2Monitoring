<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WasteLevel extends Model
{
    protected $fillable = ['bin_type', 'level_percentage', 'measured_at', 'is_full'];
}
