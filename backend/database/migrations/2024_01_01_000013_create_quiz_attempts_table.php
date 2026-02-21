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
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->foreignId('quiz_id');
            $table->integer('attempt_number');
            $table->enum('status', ['in_progress', 'completed', 'abandoned'])->default('in_progress');
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->integer('score_points')->default(0);
            $table->integer('total_points')->default(0);
            $table->decimal('score_percentage', 5, 2)->default(0.00);
            $table->boolean('passed')->default(false);
            $table->integer('coins_awarded')->default(0);
            $table->json('answers')->nullable(); // User's answers
            $table->json('results')->nullable(); // Detailed results per question
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('quiz_id')->references('id')->on('quizzes')->onDelete('cascade');
            $table->index(['user_id', 'quiz_id', 'attempt_number']);
            $table->index(['quiz_id', 'passed']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_attempts');
    }
};