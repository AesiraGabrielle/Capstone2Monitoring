<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\WasteLevel;
use Carbon\Carbon;

class WasteLevelController extends Controller
{
    public function __construct()
    {
        $this->middleware('jwt.auth');
    }

    /**
     * Store waste level when ultrasonic scans a bin
     */
    public function store(Request $request)
    {
        $request->validate([
            'bin_type' => 'required|in:bio,non_bio,unclassified',
            'ultrasonic_connected' => 'required|boolean',
            'distance_cm' => 'nullable|numeric|min:0', // raw ultrasonic reading
            'bin_height_cm' => 'required|numeric|min:1', // fixed per bin (you can store per bin in DB too)
            'measured_at' => 'required|date',
        ]);

        $binType = $request->bin_type;

        // if ultrasonic not connected, skip update
        if (!$request->ultrasonic_connected) {
            return response()->json([
                'message' => 'Ultrasonic not connected. Keeping last known value for ' . $binType,
                'status'  => 'Stale Data',
            ], 200);
        }

        // 🔹 Convert distance → fill percentage
        // Formula: (bin_height - distance) / bin_height * 100
        $distance = $request->distance_cm;
        $binHeight = $request->bin_height_cm;

        $level = max(0, min(100, round((($binHeight - $distance) / $binHeight) * 100)));

        // Alerts
        $alerts = [];
        if ($level >= 98) {
            $alerts[] = ucfirst($binType) . ' bin is full and has been locked.';
        } elseif ($level >= 95) {
            $alerts[] = 'Critical: ' . ucfirst($binType) . ' bin is 95% full.';
        } elseif ($level >= 90) {
            $alerts[] = 'Warning: ' . ucfirst($binType) . ' bin is 90% full.';
        } elseif ($level >= 80) {
            $alerts[] = 'Notice: ' . ucfirst($binType) . ' bin is 80% full.';
        }

        $is_full = $level >= 90;

        // 🔹 Update or insert only that bin's latest data
        WasteLevel::updateOrCreate(
            ['bin_type' => $binType],
            [
                'level_percentage' => $level,
                'measured_at'      => $request->measured_at,
                'is_full'          => $is_full,
            ]
        );

        return response()->json([
            'message' => 'Waste level updated for ' . $binType,
            'level_percentage' => $level,
            'status'  => $is_full ? 'Bin approaching full capacity.' : 'OK',
            'alerts'  => $alerts,
        ]);
    }

    /**
     * Get latest levels for all bins
     */
    public function latestLevels()
    {
        $bins = ['bio', 'non_bio', 'unclassified'];
        $levels = [];

        foreach ($bins as $bin) {
            $level = WasteLevel::where('bin_type', $bin)->first();

            if ($level) {
                $levels[$bin] = $level->level_percentage;
            } else {
                $levels[$bin] = 'No Data Yet';
            }
        }

        return response()->json($levels);
    }
}
