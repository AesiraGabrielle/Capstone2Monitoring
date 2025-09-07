<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Registration;
use App\Models\WasteLevel;
use App\Models\WasteLog;

class HardwareSeeder extends Seeder
{
    public function run()
    {
        // Create or update hardware account
        $hardware = Registration::updateOrCreate(
            ['email' => 'device@wastesystem.com'],
            [
                'full_name' => 'ESP32CAM Hardware',
                'password' => Hash::make('kultoniDepaz'),
                'is_hardware' => 1,
                'token' => null, // permanent JWT will be generated on login
                'email_verified_at' => now(), 

            ]
        );

        $levels = [
        ['bin_type' => 'bio', 'level_percentage' => 0],
        ['bin_type' => 'non_bio', 'level_percentage' => 0],
        ['bin_type' => 'unclassified', 'level_percentage' => 0],
    ];

    foreach ($levels as $level) {
        WasteLevel::updateOrCreate(
            ['bin_type' => $level['bin_type']],
            [
                'level_percentage' => $level['level_percentage'],
                'measured_at' => now(),
            ]
        );
    }

        // Insert initial waste logs if necessary
       $logs = [
            ['bin_type' => 'bio', 'count' => 0, 'label' => 'initial', 'confidence_score' => 1.0],
            ['bin_type' => 'non_bio', 'count' => 0, 'label' => 'initial', 'confidence_score' => 1.0],
        ];

        foreach ($logs as $log) {
            WasteLog::updateOrCreate(
                [
                    'bin_type' => $log['bin_type'],
                    'logged_at' => now()
                ],
                [
                    'count' => $log['count'],
                    'label' => $log['label'],
                    'confidence_score' => $log['confidence_score'],
                ]
            );
        }
    }
}
