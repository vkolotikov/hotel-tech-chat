<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminSession extends Model
{
    protected $fillable = ['user_id', 'token_hash', 'ip_address', 'user_agent', 'expires_at', 'rotated_at'];

    protected function casts(): array
    {
        return ['expires_at' => 'datetime', 'rotated_at' => 'datetime'];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }

    public function isExpired(): bool { return $this->expires_at->isPast(); }
}
