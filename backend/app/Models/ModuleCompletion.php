<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuleCompletion extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'module_id',
        'started_at',
        'completed_at',
        'time_spent_seconds',
        'completion_percentage',
        'completion_data',
        'coins_awarded',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'completion_percentage' => 'decimal:2',
            'completion_data' => 'array',
        ];
    }

    /**
     * Get the user for this completion
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the module for this completion
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    /**
     * Check if module is completed
     */
    public function isCompleted(): bool
    {
        return !is_null($this->completed_at);
    }

    /**
     * Get completion data for specific key
     */
    public function getCompletionData(string $key, $default = null)
    {
        return $this->completion_data[$key] ?? $default;
    }

    /**
     * Set completion data for specific key
     */
    public function setCompletionData(string $key, $value): void
    {
        $data = $this->completion_data ?? [];
        $data[$key] = $value;
        $this->update(['completion_data' => $data]);
    }

    /**
     * Scope for completions by user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for completions by module
     */
    public function scopeForModule($query, int $moduleId)
    {
        return $query->where('module_id', $moduleId);
    }

    /**
     * Scope for completed modules
     */
    public function scopeCompleted($query)
    {
        return $query->whereNotNull('completed_at');
    }

    /**
     * Scope for recent completions
     */
    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('completed_at', '>=', now()->subDays($days));
    }
}
