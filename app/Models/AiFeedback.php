<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiFeedback extends Model
{
    protected $fillable = ['message_id', 'rating', 'correction', 'comment', 'user_id'];
    public function message(): BelongsTo { return $this->belongsTo(Message::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
