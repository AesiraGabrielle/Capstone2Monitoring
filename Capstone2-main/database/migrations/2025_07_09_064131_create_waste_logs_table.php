<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('waste_logs', function (Blueprint $table) {
            $table->id();
            $table->enum('bin_type', ['bio', 'non_bio', 'unclassified']);
            $table->string('label'); 
            $table->decimal('confidence_score', 5, 4)->default(1.0000); // e.g., 0.9321 = 93.21%
            $table->integer('count')->default(1);
            $table->timestamp('logged_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('waste_logs');
    }
};
