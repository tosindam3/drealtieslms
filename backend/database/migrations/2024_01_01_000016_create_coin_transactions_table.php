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
        Schema::create('coin_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->enum('transaction_type', ['earned', 'spent', 'bonus', 'penalty', 'adjustment'])->default('earned');
            $table->integer('amount'); // Can be negative for spent/penalty
            $table->string('source_type'); // 'topic', 'quiz', 'assignment', 'week_completion', 'live_class', 'manual'
            $table->unsignedBigInteger('source_id')->nullable(); // ID of the source item
            $table->text('description')->nullable();
            $table->json('metadata')->nullable(); // Additional transaction data
            $table->foreignId('created_by')->nullable(); // For manual adjustments
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['user_id', 'created_at']);
            $table->index(['source_type', 'source_id']);
            $table->index(['transaction_type', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coin_transactions');
    }
};