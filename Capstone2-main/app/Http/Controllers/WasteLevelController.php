<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\WasteLevel;

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

        // 🔹 Distance mapping settings
        $distance = $request->distance_cm;
        $distance_max = 45; // empty bin → 0%
        $distance_min = 7;  // full bin → 100%

        // Clamp distance between min and max
        $distance = max($distance_min, min($distance, $distance_max));

        // Map distance to fill percentage (inverted)
        $level = (($distance_max - $distance) / ($distance_max - $distance_min)) * 100;

        // Clamp to 0–100 and round
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
            $record = WasteLevel::where('bin_type', $bin)->first();

            if ($record) {
                $levels[$bin] = [
                    'level_percentage' => $record->level_percentage,
                    'alerts' => $this->generateAlerts($record->level_percentage, $bin)
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

{bins.map((bin) => {
  const levelObj = levels?.[bin.key];
  const displayLevel = typeof levelObj?.level_percentage === 'number' ? Math.round(levelObj.level_percentage) : null;
  const isCovered = (displayLevel ?? 0) >= 50;
  const textStyle = displayLevel === null
    ? {}
    : isCovered
      ? { color: '#000', textShadow: '0 1px 2px rgba(255,255,255,0.6)' }
      : { color: bin.color, textShadow: '0 1px 1px rgba(0,0,0,0.15)' };
  return (
    <div key={bin.id} className="col-12 col-sm-10 col-md-4 text-center mb-4">
      <div className="bin-container">
        {/* Bin graphic */}
        <div className="bin-graphic">
          {/* Lid/handle outline */}
          <div className="bin-lid"></div>
          {/* Thin rim line across the top opening */}
          <div className="bin-rim"></div>
          <div className="bin-body">
            <div className="bin-level-text" style={textStyle}>
              {displayLevel !== null ? `${displayLevel}%` : 'No data'}
            </div>
            <div 
              className="bin-level" 
              style={{ 
                height: `${displayLevel ?? 0}%`,
                backgroundColor: bin.color,
              }}
            ></div>
          </div>
        </div>
        <div className="bin-label mt-3">
          {bin.type}
        </div>
        {/* Show alerts if any */}
        {levelObj?.alerts?.length > 0 && (
          <div className="mt-2">
            {levelObj.alerts.map((alert, idx) => (
              <div key={idx} className="alert alert-warning py-1 my-1">
                {alert}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
})}
