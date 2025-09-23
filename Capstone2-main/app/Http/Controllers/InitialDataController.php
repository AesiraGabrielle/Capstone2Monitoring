<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Controllers\WasteLevelController;
use App\Http\Controllers\WasteLogController;
use Symfony\Component\HttpFoundation\Response;

class InitialDataController extends Controller
{
    public function index(Request $request)
    {
        // Latest levels
        $levelsController = app(WasteLevelController::class);
        $levelsResponse = $levelsController->latestLevels();
        $levelsData = $levelsResponse->getData(true);

        // Daily breakdown (default behavior of existing dailyBreakdown)
        $logsController = app(WasteLogController::class);
        $dailyResponse = $logsController->dailyBreakdown($request);
        $dailyData = $dailyResponse->getData(true);

        // Overall totals (totalGarbageAllTime)
        $totalResponse = $logsController->totalGarbageAllTime();
        $totalData = $totalResponse->getData(true);

        // Compute rangeTotals from daily (sum visible daily)
        $rangeTotals = ['bio' => 0, 'non_bio' => 0, 'unclassified' => 0];
        $dailyArray = $dailyData['data'] ?? $dailyData ?? [];
        if (is_array($dailyArray)) {
            foreach ($dailyArray as $row) {
                $rangeTotals['bio'] += (int)($row['bio'] ?? 0);
                $rangeTotals['non_bio'] += (int)($row['non_bio'] ?? 0);
                $rangeTotals['unclassified'] += (int)($row['unclassified'] ?? 0);
            }
        }

        // Warnings (same thresholds as navbar)
        $warnings = [];
        if (isset($levelsData['bio'])) {
            $bio = (int) $levelsData['bio'];
            if ($bio >= 100) $warnings[] = 'Biodegradable Bin is Full! Please Clean Up the bin!';
            elseif ($bio >= 85) $warnings[] = 'Biodegradable Bin is Almost Full! Clean up the Bin!';
        }
        if (isset($levelsData['non_bio'])) {
            $nb = (int) $levelsData['non_bio'];
            if ($nb >= 100) $warnings[] = 'Non Biodegradable Bin is Full! Please Clean Up the bin!';
            elseif ($nb >= 85) $warnings[] = 'Non Biodegradable Bin is Almost Full! Clean up the Bin!';
        }
        if (isset($levelsData['unclassified'])) {
            $uc = (int) $levelsData['unclassified'];
            if ($uc >= 100) $warnings[] = 'Unidentified Waste Bin is Full! Please Clean Up the bin!';
            elseif ($uc >= 85) $warnings[] = 'Unidentified Waste Bin is Almost Full! Clean up the Bin!';
        }

        return response()->json([
            'levels' => [
                'bio' => (int)($levelsData['bio'] ?? 0),
                'non_bio' => (int)($levelsData['non_bio'] ?? 0),
                'unclassified' => (int)($levelsData['unclassified'] ?? 0),
            ],
            'warnings' => $warnings,
            'monitoring' => [
                'daily' => $dailyArray,
                'rangeTotals' => $rangeTotals,
                'allTotals' => [
                    'bio' => (int)($totalData['bio'] ?? 0),
                    'non_bio' => (int)($totalData['non_bio'] ?? 0),
                    'unclassified' => (int)($totalData['unclassified'] ?? 0),
                ],
            ]
        ], Response::HTTP_OK);
    }
}