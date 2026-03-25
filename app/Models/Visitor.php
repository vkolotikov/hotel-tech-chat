<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Visitor extends Model
{
    protected $fillable = [
        'website_id', 'visitor_uuid', 'name', 'email', 'phone',
        'ip_address', 'country', 'city', 'user_agent', 'browser', 'os', 'device',
        'custom_data',
    ];

    protected function casts(): array
    {
        return ['custom_data' => 'array'];
    }

    public function website(): BelongsTo { return $this->belongsTo(Website::class); }
    public function sessions(): HasMany { return $this->hasMany(Session::class); }
    public function pages(): HasMany { return $this->hasMany(VisitorPage::class); }
}
