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
        Schema::create('lesson_block_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
            $table->string('block_id'); // The block ID from lesson_blocks JSON
            $table->enum('block_type', ['quiz', 'assignment', 'live', 'video', 'text', 'image']); // Block type
            $table->boolean('is_completed')->default(false);
            $table->integer('attempt_number')->default(1); // For quizzes/assignments that allow retakes
            $table->decimal('score_percentage', 5, 2)->nullable(); // For quizzes
            $table->integer('score_points')->nullable(); // For quizzes
            $table->integer('total_points')->nullable(); // For quizzes
            $table->boolean('passed')->nullable(); // For quizzes
            $table->integer('coins_awarded')->default(0);
            $table->json('completion_data')->nullable(); // Store answers, results, etc.
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->unique(['user_id', 'lesson_id', 'block_id', 'attempt_number'], 'user_lesson_block_attempt_unique');
            $table->index(['user_id', 'lesson_id']);
            $table->index(['block_type', 'is_completed']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lesson_block_completions');
    }
};
