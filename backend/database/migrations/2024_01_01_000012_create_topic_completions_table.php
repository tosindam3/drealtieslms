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
        Schema::create('topic_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->foreignId('topic_id');
            $table->timestamp('completed_at');
            $table->integer('coins_awarded')->default(0);
            $table->json('completion_data')->nullable(); // Watch time, interactions, etc.
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('topic_id')->references('id')->on('topics')->onDelete('cascade');
            $table->unique(['user_id', 'topic_id']);
            $table->index(['topic_id', 'completed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('topic_completions');
    }
};