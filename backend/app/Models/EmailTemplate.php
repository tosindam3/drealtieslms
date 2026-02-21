<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'subject',
        'body',
        'placeholders',
        'settings'
    ];

    protected $casts = [
        'placeholders' => 'array',
        'settings' => 'array'
    ];
}
