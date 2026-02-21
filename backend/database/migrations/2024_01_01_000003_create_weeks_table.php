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
        Schema::create('weeks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cohort_id');
            $table->integer('week_number');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('thumbnail_url')->nullable();
            $table->json('unlock_rules'); // JSON containing unlock requirements
            $table->boolean('is_free')->default(false);
            $table->integer('min_completion_percentage')->default(90);
            $table->integer('min_coins_to_unlock_next')->default(0);
            $table->date('deadline_at')->nullable();
            $table->timestamps();

            $table->foreign('cohort_id')->references('id')->on('cohorts')->onDelete('cascade');
            $table->unique(['cohort_id', 'week_number']);
            $table->index(['cohort_id', 'week_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('weeks');
    }
};