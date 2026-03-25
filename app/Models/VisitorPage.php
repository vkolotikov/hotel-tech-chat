<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VisitorPage extends Model
{
    public $timestamps = false;
    protected $fillable = ['visitor_id', 'session_id', 'url', 'path', 'title', 'referrer', 'duration_seconds'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function visitor(): BelongsTo { return $this->belongsTo(Visitor::class); }
    public function session(): BelongsTo { return $this->belongsTo(Session::class); }
}
