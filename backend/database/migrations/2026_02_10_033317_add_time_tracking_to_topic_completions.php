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
            $table->timestamp('started_at')->nullable()->after('completed_at');
            $table->integer('time_spent_seconds')->default(0)->after('started_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('topic_completions', function (Blueprint $table) {
            $table->dropColumn(['started_at', 'time_spent_seconds']);
        });
    }
};
