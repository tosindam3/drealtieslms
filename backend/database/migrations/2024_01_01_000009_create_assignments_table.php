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
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('week_id');
            $table->string('title');
            $table->text('description');
            $table->text('instructions_html')->nullable();
            $table->integer('max_points')->default(100);
            $table->enum('submission_type', ['file', 'link', 'text'])->default('file');
            $table->json('allowed_extensions')->nullable(); // For file submissions
            $table->integer('max_file_size')->nullable(); // in MB
            $table->boolean('allow_resubmission')->default(true);
            $table->integer('coin_reward')->default(50);
            $table->timestamp('deadline')->nullable();
            $table->json('reference_assets')->nullable(); // Additional files/links
            $table->timestamps();

            $table->foreign('week_id')->references('id')->on('weeks')->onDelete('cascade');
            $table->index(['week_id', 'deadline']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assignments');
    }
};