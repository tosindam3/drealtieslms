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
        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id');
            $table->enum('type', ['multiple_choice', 'single_choice', 'true_false', 'text', 'number']);
            $table->text('question_text');
            $table->json('options')->nullable(); // For multiple choice and true/false
            $table->json('correct_answers'); // Array of correct answer(s)
            $table->integer('points')->default(1);
            $table->text('explanation')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->foreign('quiz_id')->references('id')->on('quizzes')->onDelete('cascade');
            $table->index(['quiz_id', 'order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_questions');
    }
};