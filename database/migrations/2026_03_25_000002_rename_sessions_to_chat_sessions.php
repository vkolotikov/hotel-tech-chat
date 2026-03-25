<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Rename sessions -> chat_sessions to avoid conflict with Laravel's
 * built-in session management table.
 * Only runs if the old 'sessions' table still exists (idempotent).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sessions') && ! Schema::hasTable('chat_sessions')) {
            Schema::rename('sessions', 'chat_sessions');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('chat_sessions') && ! Schema::hasTable('sessions')) {
            Schema::rename('chat_sessions', 'sessions');
        }
    }
};
