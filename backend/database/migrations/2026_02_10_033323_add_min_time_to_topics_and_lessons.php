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
        Schema::table('topics', function (Blueprint $table) {
            $table->integer('min_time_required_seconds')->default(120)->after('coin_reward'); // 2 minutes default
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->integer('min_time_required_seconds')->default(300)->after('is_free'); // 5 minutes default
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('topics', function (Blueprint $table) {
            $table->dropColumn('min_time_required_seconds');
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn('min_time_required_seconds');
        });
    }
};
