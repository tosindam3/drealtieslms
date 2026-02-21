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
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->foreignId('cohort_id');
            $table->timestamp('enrolled_at');
            $table->enum('status', ['active', 'completed', 'dropped', 'suspended'])->default('active');
            $table->decimal('completion_percentage', 5, 2)->default(0.00);
            $table->timestamp('completed_at')->nullable();
            $table->json('metadata')->nullable(); // Additional enrollment data
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('cohort_id')->references('id')->on('cohorts')->onDelete('cascade');
            $table->unique(['user_id', 'cohort_id']);
            $table->index(['cohort_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};