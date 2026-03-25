<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attachment extends Model
{
    public $timestamps = false;
    protected $fillable = ['message_id', 'file_path', 'file_name', 'mime_type', 'size_bytes'];

    protected function casts(): array { return ['created_at' => 'datetime']; }
    public function message(): BelongsTo { return $this->belongsTo(Message::class); }
}
