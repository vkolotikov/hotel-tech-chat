<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ─── Accounts (SaaS tenants) ───────────────────────────────────────
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name', 180);
            $table->string('saas_tenant_id', 64)->nullable()->unique();
            $table->string('clerk_org_id', 128)->nullable();
            $table->string('plan', 30)->default('free');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ─── Users (admin/agents) ──────────────────────────────────────────
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->string('email', 180)->unique();
            $table->string('password_hash', 255);
            $table->string('display_name', 120)->nullable();
            $table->string('avatar_url', 255)->nullable();
            $table->string('role', 20)->default('agent'); // admin, agent
            $table->string('clerk_user_id', 128)->nullable();
            $table->boolean('is_online')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ─── Companies ─────────────────────────────────────────────────────
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->string('name', 180);
            $table->text('description')->nullable();
            $table->string('timezone', 60)->default('UTC');
            $table->jsonb('business_hours')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ─── Websites ──────────────────────────────────────────────────────
        Schema::create('websites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('name', 180);
            $table->string('domain', 255)->nullable();
            $table->uuid('widget_key')->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ─── User-Company role assignments ─────────────────────────────────
        Schema::create('user_companies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('role', 20)->default('agent');
            $table->timestamps();

            $table->unique(['user_id', 'company_id']);
        });

        // ─── User-Website access ───────────────────────────────────────────
        Schema::create('user_websites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('website_id')->constrained('websites')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'website_id']);
        });

        // ─── Visitors ──────────────────────────────────────────────────────
        Schema::create('visitors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('website_id')->constrained('websites')->cascadeOnDelete();
            $table->uuid('visitor_uuid')->unique();
            $table->string('name', 120)->nullable();
            $table->string('email', 180)->nullable();
            $table->string('phone', 40)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('country', 60)->nullable();
            $table->string('city', 60)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->string('browser', 60)->nullable();
            $table->string('os', 60)->nullable();
            $table->string('device', 30)->nullable();
            $table->jsonb('custom_data')->nullable();
            $table->timestamps();

            $table->index('website_id');
        });

        // ─── Sessions (chat sessions) ──────────────────────────────────────
        Schema::create('chat_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('visitor_id')->constrained('visitors')->cascadeOnDelete();
            $table->foreignId('website_id')->constrained('websites')->cascadeOnDelete();
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('active'); // active, offline, resolved
            $table->string('channel', 30)->default('web');
            $table->string('subject', 255)->nullable();
            $table->integer('unread_count')->default(0);
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->index(['website_id', 'status']);
            $table->index('assigned_user_id');
        });

        // ─── Visitor Pages (tracking) ──────────────────────────────────────
        Schema::create('visitor_pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('visitor_id')->constrained('visitors')->cascadeOnDelete();
            $table->foreignId('session_id')->nullable()->constrained('chat_sessions')->nullOnDelete();
            $table->string('url', 2000)->nullable();
            $table->string('path', 500)->nullable();
            $table->string('title', 500)->nullable();
            $table->string('referrer', 2000)->nullable();
            $table->integer('duration_seconds')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });

        // ─── Messages ──────────────────────────────────────────────────────
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('chat_sessions')->cascadeOnDelete();
            $table->string('sender_type', 20); // visitor, agent, system, ai
            $table->foreignId('sender_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('content');
            $table->string('content_type', 30)->default('text'); // text, html, image, file
            $table->boolean('is_read')->default(false);
            $table->boolean('is_internal')->default(false); // internal agent note
            $table->jsonb('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['session_id', 'created_at']);
            $table->index('sender_type');
        });

        // ─── Attachments ───────────────────────────────────────────────────
        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained('messages')->cascadeOnDelete();
            $table->string('file_path', 500);
            $table->string('file_name', 255);
            $table->string('mime_type', 120)->nullable();
            $table->unsignedInteger('size_bytes')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // ─── Leads ─────────────────────────────────────────────────────────
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('website_id')->constrained('websites')->cascadeOnDelete();
            $table->foreignId('visitor_id')->nullable()->constrained('visitors')->nullOnDelete();
            $table->foreignId('session_id')->nullable()->constrained('chat_sessions')->nullOnDelete();
            $table->string('name', 120)->nullable();
            $table->string('email', 180)->nullable();
            $table->string('phone', 40)->nullable();
            $table->string('company_name', 180)->nullable();
            $table->text('message')->nullable();
            $table->string('source', 60)->default('chat');
            $table->string('status', 20)->default('new'); // new, contacted, qualified, converted
            $table->timestamps();

            $table->index('website_id');
        });

        // ─── Global Settings ───────────────────────────────────────────────
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('key_name', 120);
            $table->text('value')->nullable();

            $table->unique(['company_id', 'key_name']);
        });

        // ─── Website Settings ──────────────────────────────────────────────
        Schema::create('website_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('website_id')->constrained('websites')->cascadeOnDelete();
            $table->string('key_name', 120);
            $table->text('value')->nullable();

            $table->unique(['website_id', 'key_name']);
        });

        // ─── Canned Replies ────────────────────────────────────────────────
        Schema::create('canned_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('shortcut', 60);
            $table->string('title', 180);
            $table->text('content');
            $table->string('category', 60)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ─── Popup Rules ───────────────────────────────────────────────────
        Schema::create('popup_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('website_id')->constrained('websites')->cascadeOnDelete();
            $table->string('name', 180);
            $table->string('trigger_type', 30); // time_delay, scroll, exit_intent, page_url
            $table->jsonb('trigger_config')->nullable();
            $table->text('message');
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(0);
            $table->timestamps();
        });

        // ─── AI FAQs ──────────────────────────────────────────────────────
        Schema::create('ai_faqs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('question', 500);
            $table->text('answer');
            $table->string('category', 60)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ─── AI Documents ──────────────────────────────────────────────────
        Schema::create('ai_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('file_path', 500);
            $table->string('file_name', 255);
            $table->string('mime_type', 120)->nullable();
            $table->unsignedInteger('size_bytes')->nullable();
            $table->text('extracted_text')->nullable();
            $table->string('status', 20)->default('pending'); // pending, processed, failed
            $table->timestamps();
        });

        // ─── AI Knowledge ──────────────────────────────────────────────────
        Schema::create('ai_knowledge', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('topic', 180);
            $table->text('content');
            $table->string('category', 60)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // ─── AI Feedback ───────────────────────────────────────────────────
        Schema::create('ai_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained('messages')->cascadeOnDelete();
            $table->smallInteger('rating')->nullable(); // 1-5
            $table->text('correction')->nullable();
            $table->text('comment')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // ─── Admin Sessions (token auth) ───────────────────────────────────
        Schema::create('admin_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('token_hash', 64);
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('expires_at');
            $table->timestamp('rotated_at')->nullable();
            $table->timestamps();

            $table->index('token_hash');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        $tables = [
            'admin_sessions', 'ai_feedback', 'ai_knowledge', 'ai_documents', 'ai_faqs',
            'popup_rules', 'canned_replies', 'website_settings', 'settings',
            'leads', 'attachments', 'messages', 'visitor_pages', 'chat_sessions',
            'visitors', 'user_websites', 'user_companies', 'websites',
            'companies', 'users', 'accounts',
        ];
        foreach ($tables as $t) Schema::dropIfExists($t);
    }
};
