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
        // Drop foreign key first
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropForeign(['week_id']);
        });
        
        // Then drop index
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropIndex('lessons_week_id_order_index');
        });
        
        // Then drop column
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn('week_id');
        });

        // Finally add new relationship
        Schema::table('lessons', function (Blueprint $table) {
            $table->foreignId('module_id')->after('id')->constrained()->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop new relationship
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropForeign(['module_id']);
            $table->dropColumn('module_id');
        });

        // Recreate old relationship
        Schema::table('lessons', function (Blueprint $table) {
            $table->foreignId('week_id')->after('id')->constrained()->onDelete('cascade');
        });
        
        // Recreate index
        Schema::table('lessons', function (Blueprint $table) {
            $table->index(['week_id', 'order'], 'lessons_week_id_order_index');
        });
    }
};
