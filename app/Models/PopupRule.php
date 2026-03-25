<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PopupRule extends Model
{
    protected $fillable = ['website_id', 'name', 'trigger_type', 'trigger_config', 'message', 'is_active', 'priority'];
    protected function casts(): array { return ['trigger_config' => 'array', 'is_active' => 'boolean']; }
    public function website(): BelongsTo { return $this->belongsTo(Website::class); }
}
