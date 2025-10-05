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
            'distance_cm' => 'nullable|numeric|min:0',
            'bin_height_cm' => 'required|numeric|min:1',
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
        if ($level >= 80) {
            $alerts[] = 'Notice: ' . ucfirst($binType) . ' bin is 80% full.';
        }
        if ($level >= 90) {
            $alerts[] = 'Warning: ' . ucfirst($binType) . ' bin is 90% full.';
        }
        if ($level >= 95) {
            $alerts[] = 'Critical: ' . ucfirst($binType) . ' bin is 95% full.';
        }
        if ($level >= 98) {
            $alerts[] = ucfirst($binType) . ' bin is full and has been locked.';
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

            $alerts = [];
            if ($level) {
                $levelValue = $level->level_percentage;
                if ($levelValue >= 80) {
                    $alerts[] = 'Notice: ' . ucfirst($bin) . ' bin is 80% full.';
                }
                if ($levelValue >= 90) {
                    $alerts[] = 'Warning: ' . ucfirst($bin) . ' bin is 90% full.';
                }
                if ($levelValue >= 95) {
                    $alerts[] = 'Critical: ' . ucfirst($bin) . ' bin is 95% full.';
                }
                if ($levelValue >= 98) {
                    $alerts[] = ucfirst($bin) . ' bin is full and has been locked.';
                }
                $levels[$bin] = [
                    'level' => $levelValue,
                    'alerts' => $alerts,
                ];
            } else {
                $levels[$bin] = [
                    'level' => null,
                    'alerts' => [],
                ];
            }
        }

        return response()->json($levels);
    }
}
