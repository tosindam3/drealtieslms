<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;
use App\Models\Cohort;

class Discussion extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'cohort_id',
        'parent_id',
        'content',
        'is_instructor_only',
        'is_resolved',
        'metadata',
    ];

    protected $casts = [
        'is_instructor_only' => 'boolean',
        'is_resolved' => 'boolean',
        'metadata' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function cohort()
    {
        return $this->belongsTo(Cohort::class);
    }

    public function parent()
    {
        return $this->belongsTo(Discussion::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(Discussion::class, 'parent_id');
    }
}
