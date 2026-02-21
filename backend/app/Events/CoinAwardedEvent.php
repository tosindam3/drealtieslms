<?php

namespace App\Events;

use App\Models\User;
use App\Models\CoinTransaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CoinAwardedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public User $user,
        public int $amount,
        public string $sourceType,
        public CoinTransaction $transaction
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->user->id}"),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => 'coin_awarded',
            'user_id' => $this->user->id,
            'amount' => $this->amount,
            'source_type' => $this->sourceType,
            'source_description' => $this->transaction->source_description,
            'new_balance' => $this->user->getCurrentCoinBalance(),
            'transaction_id' => $this->transaction->id,
            'show_confetti' => $this->shouldShowConfetti(),
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'coin.awarded';
    }

    /**
     * Determine if confetti should be shown based on amount and source
     */
    private function shouldShowConfetti(): bool
    {
        // Show confetti for significant rewards or special achievements
        return $this->amount >= 100 || 
               in_array($this->sourceType, [
                   CoinTransaction::SOURCE_WEEK_COMPLETION,
                   CoinTransaction::SOURCE_BONUS
               ]);
    }
}