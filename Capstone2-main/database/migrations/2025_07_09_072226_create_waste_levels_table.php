<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
      Schema::create('waste_levels', function (Blueprint $table) {
        $table->id();
        $table->enum('bin_type', ['bio', 'non_bio', 'unclassified']);
        $table->float('level_percentage'); 
        $table->boolean('is_full')->default(false);
        $table->timestamp('measured_at')->useCurrent();
        $table->timestamps();
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('waste_levels');
    }
};
