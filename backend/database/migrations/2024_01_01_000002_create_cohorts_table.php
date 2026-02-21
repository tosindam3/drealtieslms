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
        Schema::create('cohorts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('capacity')->default(50);
            $table->integer('enrolled_count')->default(0);
            $table->enum('status', ['draft', 'published', 'active', 'completed', 'archived'])->default('draft');
            $table->string('thumbnail_url')->nullable();
            $table->json('settings')->nullable(); // Additional cohort-specific settings
            $table->timestamps();

            $table->index(['status', 'start_date']);
            $table->index(['start_date', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cohorts');
    }
};