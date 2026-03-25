<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebsiteSetting extends Model
{
    public $timestamps = false;
    protected $fillable = ['website_id', 'key_name', 'value'];
    public function website(): BelongsTo { return $this->belongsTo(Website::class); }
}
