<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Message extends Model
{
    public $timestamps = false;
    protected $fillable = [
        'session_id', 'sender_type', 'sender_user_id', 'content',
        'content_type', 'is_read', 'is_internal', 'metadata',
    ];

    protected function casts(): array
    {
        return ['is_read' => 'boolean', 'is_internal' => 'boolean', 'metadata' => 'array', 'created_at' => 'datetime'];
    }

    public function session(): BelongsTo { return $this->belongsTo(Session::class); }
    public function senderUser(): BelongsTo { return $this->belongsTo(User::class, 'sender_user_id'); }
    public function attachments(): HasMany { return $this->hasMany(Attachment::class); }
    public function aiFeedback(): HasOne { return $this->hasOne(AiFeedback::class); }
}
