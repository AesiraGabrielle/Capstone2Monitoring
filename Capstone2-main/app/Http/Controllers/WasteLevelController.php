<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\WasteLevel;
use Carbon\Carbon;

class WasteLevelController extends Controller
{
    // Apply JWT middleware
    public function __construct()
    {
        $this->middleware('jwt.auth');
    }

    // Store new waste level
    public function store(Request $request)
    {
        $request->validate([
            'bin_type' => 'required|in:bio,non_bio,unclassified',
            'level_percentage' => 'required|numeric|min:0|max:100',
            'measured_at' => 'required|date',
        ]);

        $binType = $request->bin_type;
        $level = $request->level_percentage;

        $alerts = [];

        if ($level >= 98) {
            $alerts[] = ucfirst(str_replace('_', ' ', $binType)) . ' bin is full and has been locked.';
        } elseif ($level >= 95) {
            $alerts[] = 'Critical: ' . ucfirst(str_replace('_', ' ', $binType)) . ' bin is 95% full.';
        } elseif ($level >= 90) {
            $alerts[] = 'Warning: ' . ucfirst(str_replace('_', ' ', $binType)) . ' bin is 90% full.';
        } elseif ($level >= 80) {
            $alerts[] = 'Notice: ' . ucfirst(str_replace('_', ' ', $binType)) . ' bin is 80% full.';
        }

        $is_full = $level >= 90;

        // Save to database
        WasteLevel::create([
            'bin_type' => $binType,
            'level_percentage' => $level,
            'measured_at' => $request->measured_at,
            'is_full' => $is_full,
        ]);

        return response()->json([
            'message' => 'Waste level stored.',
            'status' => $is_full ? 'Bin approaching full capacity.' : 'OK',
            'alerts' => $alerts,
        ]);
    }

    // Get latest levels for each bin
    public function latestLevels()
    {
        $bins = ['bio', 'non_bio', 'unclassified'];
        $levels = [];

        foreach ($bins as $bin) {
            $level = WasteLevel::where('bin_type', $bin)
                ->orderByDesc('measured_at')
                ->first();

            $levels[$bin] = $level ? $level->level_percentage : null;
        }

        return response()->json($levels);
    }
}
