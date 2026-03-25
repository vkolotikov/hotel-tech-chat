<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Website extends Model
{
    protected $fillable = ['company_id', 'name', 'domain', 'widget_key', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function company(): BelongsTo { return $this->belongsTo(Company::class); }
    public function users(): BelongsToMany { return $this->belongsToMany(User::class, 'user_websites'); }
    public function visitors(): HasMany { return $this->hasMany(Visitor::class); }
    public function sessions(): HasMany { return $this->hasMany(Session::class); }
    public function settings(): HasMany { return $this->hasMany(WebsiteSetting::class); }
    public function popupRules(): HasMany { return $this->hasMany(PopupRule::class); }
    public function leads(): HasMany { return $this->hasMany(Lead::class); }
}
