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
        Schema::create('user_coin_balances', function (Blueprint $table) {
            $table->foreignId('user_id')->primary();
            $table->integer('total_balance')->default(0);
            $table->integer('lifetime_earned')->default(0);
            $table->integer('lifetime_spent')->default(0);
            $table->timestamp('last_updated')->useCurrent()->useCurrentOnUpdate();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['total_balance', 'last_updated']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_coin_balances');
    }
};