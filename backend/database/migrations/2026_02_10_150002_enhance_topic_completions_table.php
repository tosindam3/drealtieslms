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
        Schema::table('topic_completions', function (Blueprint $table) {
            // Make completed_at nullable to support in-progress tracking
            $table->timestamp('completed_at')->nullable()->change();
            $table->decimal('completion_percentage', 5, 2)->default(0.00)->after('time_spent_seconds');
            $table->integer('last_position_seconds')->default(0)->after('completion_percentage');
            $table->string('completion_method', 50)->default('manual')->after('last_position_seconds');
            $table->index(['user_id', 'completion_percentage'], 'idx_user_progress');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('topic_completions', function (Blueprint $table) {
            $table->dropIndex('idx_user_progress');
            $table->dropColumn(['completion_percentage', 'last_position_seconds', 'completion_method']);
        });
    }
};
