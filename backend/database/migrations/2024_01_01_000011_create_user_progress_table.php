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
        Schema::create('user_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->foreignId('cohort_id');
            $table->foreignId('week_id');
            $table->decimal('completion_percentage', 5, 2)->default(0.00);
            $table->boolean('is_unlocked')->default(false);
            $table->timestamp('unlocked_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->json('completion_data')->nullable(); // Track individual item completions
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('cohort_id')->references('id')->on('cohorts')->onDelete('cascade');
            $table->foreign('week_id')->references('id')->on('weeks')->onDelete('cascade');
            $table->unique(['user_id', 'week_id']);
            $table->index(['user_id', 'cohort_id']);
            $table->index(['week_id', 'is_unlocked']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_progress');
    }
};