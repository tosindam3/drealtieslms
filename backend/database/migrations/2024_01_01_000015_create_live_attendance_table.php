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
        Schema::create('live_attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->foreignId('live_class_id');
            $table->boolean('attended')->default(true);
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->string('absence_reason')->nullable();
            $table->integer('duration_minutes')->default(0); // Calculated attendance duration
            $table->decimal('attendance_percentage', 5, 2)->default(0.00); // % of class attended
            $table->integer('coins_awarded')->default(0);
            $table->json('attendance_data')->nullable(); // Platform-specific attendance data
            $table->json('metadata')->nullable(); // Additional metadata
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('live_class_id')->references('id')->on('live_classes')->onDelete('cascade');
            $table->unique(['user_id', 'live_class_id']);
            $table->index(['live_class_id', 'joined_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_attendance');
    }
};