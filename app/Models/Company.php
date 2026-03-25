<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    protected $fillable = ['account_id', 'name', 'description', 'timezone', 'business_hours', 'is_active'];

    protected function casts(): array
    {
        return ['business_hours' => 'array', 'is_active' => 'boolean'];
    }

    public function account(): BelongsTo { return $this->belongsTo(Account::class); }
    public function websites(): HasMany { return $this->hasMany(Website::class); }
    public function users(): BelongsToMany { return $this->belongsToMany(User::class, 'user_companies')->withPivot('role'); }
    public function settings(): HasMany { return $this->hasMany(Setting::class); }
    public function cannedReplies(): HasMany { return $this->hasMany(CannedReply::class); }
    public function aiFaqs(): HasMany { return $this->hasMany(AiFaq::class); }
    public function aiDocuments(): HasMany { return $this->hasMany(AiDocument::class); }
    public function aiKnowledge(): HasMany { return $this->hasMany(AiKnowledge::class); }
}
