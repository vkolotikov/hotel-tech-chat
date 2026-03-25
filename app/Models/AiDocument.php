<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiDocument extends Model
{
    protected $fillable = ['company_id', 'file_path', 'file_name', 'mime_type', 'size_bytes', 'extracted_text', 'status'];
    public function company(): BelongsTo { return $this->belongsTo(Company::class); }
}
