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
            'distance_cm' => 'required|numeric|min:0',
            'bin_height_cm' => 'required|numeric|min:1',
            'measured_at' => 'required|date',
        ]);

        $binType = $request->bin_type;

        // If ultrasonic not connected, skip update
        if (!$request->ultrasonic_connected) {
            return response()->json([
                'message' => 'Ultrasonic not connected. Keeping last known value for ' . $binType,
                'status'  => 'Stale Data',
            ], 200);
        }

        // 🔹 Convert distance → fill percentage using min/max mapping
        $distance = $request->distance_cm;

        $distance_max = 45; // empty bin → 0%
        $distance_min = 7;  // full bin → 100%

        // Map distance to percentage (inverted)
        $level = (($distance_max - $distance) / ($distance_max - $distance_min)) * 100;

        // Clamp between 0 and 100 and round
        $level = round(max(0, min(100, $level)));

        // 🔹 Alerts (stacked)
        $alerts = [];

        if ($level >= 80) {
            $alerts[] = ucfirst($binType) . " bin is reaching high capacity.";
        }

        if ($level >= 90) {
            $alerts[] = "Warning: " . ucfirst($binType) . " bin is 90%+ full.";
        }

        if ($level >= 95) {
            $alerts[] = "Critical: " . ucfirst($binType) . " bin is 95%+ full.";
        }

        if ($level >= 98) {
            $alerts[] = ucfirst($binType) . " bin is full and has been locked.";
        }

        $is_full = $level >= 90;

        // 🔹 Update or insert latest data for the bin
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
                $levels[$bin] = [
                    'level_percentage' => $level->level_percentage,
                    'alerts' => $level->level_percentage >= 80
                        ? $this->generateAlerts($level->level_percentage, $bin)
                        : []
                ];
            } else {
                $levels[$bin] = [
                    'level_percentage' => null,
                    'alerts' => []
                ];
            }
        }

        return response()->json($levels);
    }

    /**
     * Generate stacked alerts based on level percentage
     */
    private function generateAlerts(int $level, string $binType): array
    {
        $alerts = [];

        if ($level >= 80) {
            $alerts[] = ucfirst($binType) . " bin is reaching high capacity.";
        }

        if ($level >= 90) {
            $alerts[] = "Warning: " . ucfirst($binType) . " bin is 90%+ full.";
        }

        if ($level >= 95) {
            $alerts[] = "Critical: " . ucfirst($binType) . " bin is 95%+ full.";
        }

        if ($level >= 98) {
            $alerts[] = ucfirst($binType) . " bin is full and has been locked.";
        }

        return $alerts;
    }
}
