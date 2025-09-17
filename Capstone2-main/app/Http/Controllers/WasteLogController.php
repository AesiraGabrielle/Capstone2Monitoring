<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\WasteLog;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

class WasteLogController extends Controller
{
    public function __construct()
    {
        $this->middleware('jwt.auth');
    }

    public function store(Request $request)
    {
        $request->validate([
            'bin_type' => 'required|in:bio,non_bio,unclassified',
            'label' => 'required|string',
            'confidence_score' => 'required|numeric|between:0,1',
            'logged_at' => 'required|date',
        ]);

        WasteLog::create([
            'bin_type' => $request->bin_type,
            'label' => $request->label,
            'confidence_score' => $request->confidence_score,
            'count' => 1,
            'logged_at' => Carbon::parse($request->logged_at),
        ]);

        return response()->json(['message' => 'Waste log stored successfully.']);
    }

    public function dailyBreakdown(Request $request)
    {
        $startParam = $request->query('start');
        $endParam = $request->query('end');

        if ($startParam && $endParam) {
            try {
                $start = Carbon::parse($startParam)->startOfDay();
                $end = Carbon::parse($endParam)->endOfDay();
            } catch (\Exception $e) {
                return response()->json(['message' => 'Invalid date range. Use YYYY-MM-DD.'], 422);
            }
        } else {
            $start = Carbon::now()->startOfWeek();
            $end = Carbon::now()->endOfWeek();
        }

        $days = CarbonPeriod::create($start, '1 day', $end);
        $result = [];

        foreach ($days as $day) {
            $formattedDate = $day->format('Y-m-d');
            $logs = WasteLog::select('bin_type', DB::raw('SUM(count) as total'))
                ->whereDate('logged_at', $formattedDate)
                ->groupBy('bin_type')
                ->get()
                ->keyBy('bin_type');

            $result[] = [
                'date' => $formattedDate,
                'bio' => $logs['bio']->total ?? 0,
                'non_bio' => $logs['non_bio']->total ?? 0,
                'unclassified' => $logs['unclassified']->total ?? 0,
            ];
        }

    return response()->json($result);
    }

    public function weeklySummary()
    {
        $logs = WasteLog::select(
                DB::raw("YEAR(logged_at) as year"),
                DB::raw("MONTH(logged_at) as month"),
                DB::raw("WEEK(logged_at, 1) as week_number"),
                'bin_type',
                DB::raw('SUM(count) as total')
            )
            ->groupBy('year', 'month', 'week_number', 'bin_type')
            ->get();

        $grouped = [];

        foreach ($logs as $log) {
            $weekLabel = Carbon::createFromDate($log->year, $log->month)->format('F') . ' Week ' . $log->week_number;

            if (!isset($grouped[$weekLabel])) {
                $grouped[$weekLabel] = [
                    'bio' => 0,
                    'non_bio' => 0,
                    'unclassified' => 0,
                ];
            }

            $grouped[$weekLabel][$log->bin_type] = $log->total;
        }

        return response()->json($grouped);
    }

    public function monthlySummary(Request $request)
    {
        $monthParam = $request->query('month') ?? now()->format('Y-m');
        [$year, $month] = explode('-', $monthParam);

        $logs = WasteLog::select('bin_type', DB::raw('SUM(count) as total'))
            ->whereYear('logged_at', $year)
            ->whereMonth('logged_at', $month)
            ->groupBy('bin_type')
            ->get()
            ->keyBy('bin_type');

        $label = Carbon::createFromDate($year, $month)->format('F Y');

        return response()->json([
            'month' => $monthParam,
            'label' => $label,
            'summary' => [
                'bio' => $logs['bio']->total ?? 0,
                'non_bio' => $logs['non_bio']->total ?? 0,
                'unclassified' => $logs['unclassified']->total ?? 0,
            ]
        ]);
    }

    public function totalGarbageAllTime()
    {
        $bins = ['bio', 'non_bio', 'unclassified'];

        $logs = WasteLog::select('bin_type', DB::raw('SUM(count) as total'))
            ->groupBy('bin_type')
            ->pluck('total', 'bin_type')
            ->toArray();

        $summary = [];
        foreach ($bins as $bin) {
            $summary[$bin] = $logs[$bin] ?? 0;
        }

        return response()->json($summary);
    }
}
