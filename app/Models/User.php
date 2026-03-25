<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Model
{
    protected $fillable = [
        'account_id', 'email', 'password_hash', 'display_name', 'avatar_url',
        'role', 'clerk_user_id', 'is_online', 'is_active',
    ];

    protected $hidden = ['password_hash'];

    protected function casts(): array
    {
        return ['is_online' => 'boolean', 'is_active' => 'boolean'];
    }

    public function account(): BelongsTo { return $this->belongsTo(Account::class); }
    public function companies(): BelongsToMany { return $this->belongsToMany(Company::class, 'user_companies')->withPivot('role'); }
    public function websites(): BelongsToMany { return $this->belongsToMany(Website::class, 'user_websites'); }
    public function adminSessions(): HasMany { return $this->hasMany(AdminSession::class); }
    public function assignedSessions(): HasMany { return $this->hasMany(Session::class, 'assigned_user_id'); }
}
