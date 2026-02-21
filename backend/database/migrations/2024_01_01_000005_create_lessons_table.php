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
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('week_id');
            $table->string('number'); // e.g., "1.1", "1.2"
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('thumbnail_url')->nullable();
            $table->integer('estimated_duration')->nullable(); // in minutes
            $table->integer('order')->default(0);
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->boolean('is_free')->default(false);
            $table->json('lesson_blocks')->nullable(); // Quiz, Assignment, Live blocks
            $table->timestamps();

            $table->foreign('week_id')->references('id')->on('weeks')->onDelete('cascade');
            $table->index(['week_id', 'order']);
            $table->index(['status', 'is_free']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};