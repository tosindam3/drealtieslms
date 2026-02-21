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
        Schema::create('assignment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->foreignId('assignment_id');
            $table->enum('status', ['submitted', 'approved', 'rejected', 'revision_requested'])->default('submitted');
            $table->text('submission_content')->nullable(); // For text submissions
            $table->string('submission_url')->nullable(); // For link submissions
            $table->json('submission_files')->nullable(); // For file submissions
            $table->integer('score')->nullable(); // Out of assignment max_points
            $table->integer('coins_awarded')->default(0);
            $table->text('instructor_feedback')->nullable();
            $table->foreignId('reviewed_by')->nullable(); // Instructor who reviewed
            $table->timestamp('submitted_at');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('assignment_id')->references('id')->on('assignments')->onDelete('cascade');
            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['assignment_id', 'status']);
            $table->index(['user_id', 'assignment_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assignment_submissions');
    }
};