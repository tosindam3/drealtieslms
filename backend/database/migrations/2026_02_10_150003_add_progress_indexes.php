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
        Schema::table('user_progress', function (Blueprint $table) {
            $table->index(['user_id', 'cohort_id', 'completion_percentage'], 'idx_user_cohort_progress');
        });

        Schema::table('topic_completions', function (Blueprint $table) {
            $table->index(['user_id', 'topic_id', 'completed_at'], 'idx_topic_completion_lookup');
            $table->index(['user_id', 'started_at', 'time_spent_seconds'], 'idx_topic_time_tracking');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_progress', function (Blueprint $table) {
            $table->dropIndex('idx_user_cohort_progress');
        });

        Schema::table('topic_completions', function (Blueprint $table) {
            $table->dropIndex('idx_topic_completion_lookup');
            $table->dropIndex('idx_topic_time_tracking');
        });
    }
};
