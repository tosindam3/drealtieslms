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
        Schema::create('live_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('week_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamp('scheduled_at');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->foreignId('started_by')->nullable();
            $table->foreignId('ended_by')->nullable();
            $table->integer('duration')->default(60); // in minutes
            $table->string('join_url')->nullable();
            $table->enum('platform', ['zoom', 'teams', 'direct', 'youtube'])->default('zoom');
            $table->boolean('tracking_enabled')->default(true);
            $table->integer('coin_reward')->default(25);
            $table->enum('status', ['scheduled', 'live', 'completed', 'cancelled'])->default('scheduled');
            $table->json('metadata')->nullable(); // Platform-specific data
            $table->timestamps();

            $table->foreign('week_id')->references('id')->on('weeks')->onDelete('cascade');
            $table->foreign('started_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('ended_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['week_id', 'scheduled_at']);
            $table->index(['scheduled_at', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_classes');
    }
};