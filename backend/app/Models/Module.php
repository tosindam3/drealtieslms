<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    use HasFactory;
    protected $fillable = [
        'week_id',
        'title',
        'description',
        'thumbnail_url',
        'order',
        'position',
    ];

    /**
     * Get the week that owns the module.
     */
    public function week()
    {
        return $this->belongsTo(Week::class);
    }

    /**
     * Get the lessons for the module.
     */
    public function lessons()
    {
        return $this->hasMany(Lesson::class)->orderBy('order');
    }

    /**
     * Get module completions
     */
    public function completions()
    {
        return $this->hasMany(ModuleCompletion::class);
    }

    /**
     * Check if user has completed this module
     */
    public function isCompletedByUser(User $user): bool
    {
        return $this->completions()
                    ->where('user_id', $user->id)
                    ->whereNotNull('completed_at')
                    ->exists();
    }

    /**
     * Get completion for specific user
     */
    public function getCompletionForUser(User $user): ?ModuleCompletion
    {
        return $this->completions()
                    ->where('user_id', $user->id)
                    ->first();
    }
}
