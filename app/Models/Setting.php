<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Setting extends Model
{
    public $timestamps = false;
    protected $fillable = ['company_id', 'key_name', 'value'];
    public function company(): BelongsTo { return $this->belongsTo(Company::class); }
}
