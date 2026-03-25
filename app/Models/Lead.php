<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lead extends Model
{
    protected $fillable = [
        'website_id', 'visitor_id', 'session_id',
        'name', 'email', 'phone', 'company_name', 'message', 'source', 'status',
    ];

    public function website(): BelongsTo { return $this->belongsTo(Website::class); }
    public function visitor(): BelongsTo { return $this->belongsTo(Visitor::class); }
    public function session(): BelongsTo { return $this->belongsTo(Session::class); }
}
