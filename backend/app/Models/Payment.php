<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'enrollment_id',
        'amount',
        'currency',
        'status',
        'channel',
        'reference',
        'metadata',
        'proof_path',
        'confirmed_by',
        'confirmed_at',
        'rejection_reason',
    ];

    protected $casts = [
        'metadata' => 'array',
        'amount' => 'decimal:2',
        'confirmed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function confirmedBy()
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }
}
