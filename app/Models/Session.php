<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Session extends Model
{
    protected $table = 'chat_sessions';

    protected $fillable = [
        'visitor_id', 'website_id', 'assigned_user_id',
        'status', 'channel', 'subject', 'unread_count', 'last_message_at',
    ];

    protected function casts(): array
    {
        return ['last_message_at' => 'datetime'];
    }

    public function visitor(): BelongsTo { return $this->belongsTo(Visitor::class); }
    public function website(): BelongsTo { return $this->belongsTo(Website::class); }
    public function assignedUser(): BelongsTo { return $this->belongsTo(User::class, 'assigned_user_id'); }
    public function messages(): HasMany { return $this->hasMany(Message::class); }
    public function leads(): HasMany { return $this->hasMany(Lead::class); }
}
