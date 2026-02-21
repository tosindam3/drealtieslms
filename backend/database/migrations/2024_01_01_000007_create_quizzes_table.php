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
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('week_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('passing_score')->default(70); // Percentage
            $table->integer('max_attempts')->nullable()->default(3);
            $table->integer('duration')->nullable(); // in minutes
            $table->integer('coin_reward')->default(25);
            $table->boolean('randomize_questions')->default(false);
            $table->boolean('show_results_immediately')->default(true);
            $table->timestamps();

            $table->foreign('week_id')->references('id')->on('weeks')->onDelete('cascade');
            $table->index('week_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quizzes');
    }
};