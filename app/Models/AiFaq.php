<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiFaq extends Model
{
    protected $fillable = ['company_id', 'question', 'answer', 'category', 'is_active'];
    protected function casts(): array { return ['is_active' => 'boolean']; }
    public function company(): BelongsTo { return $this->belongsTo(Company::class); }
}
