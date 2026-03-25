<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\SaasController;
use Illuminate\Support\Facades\Route;

// ─── Health ────────────────────────────────────────────────────────────────
Route::get('health', fn () => response()->json([
    'ok'      => true,
    'service' => 'onlinechat',
    'laravel' => app()->version(),
]));

// ─── Public / Widget Endpoints ─────────────────────────────────────────────
Route::prefix('public')->group(function () {
    Route::post('init-session',        [PublicController::class, 'initSession']);
    Route::post('message',             [PublicController::class, 'sendMessage']);
    Route::get('messages/{sessionId}', [PublicController::class, 'getMessages']);
    Route::post('track-page',          [PublicController::class, 'trackPage']);
    Route::post('lead',                [PublicController::class, 'submitLead']);
    Route::post('upload',              [PublicController::class, 'uploadAttachment']);
    Route::post('transcribe',          [PublicController::class, 'transcribe']);
    Route::post('speak',               [PublicController::class, 'speak']);
    Route::post('typing',              [PublicController::class, 'typing']);
    Route::get('typing/{sessionId}',   [PublicController::class, 'typingStatus']);
});

// ─── Admin Auth (no middleware) ────────────────────────────────────────────
Route::post('admin/login',             [AdminController::class, 'login']);
Route::post('admin/login/saas',        [AdminController::class, 'loginViaSaas']);
Route::get('admin/saas/client-config', [AdminController::class, 'clientConfig']);

// ─── Admin Endpoints (session auth + tenant scope) ─────────────────────────
Route::prefix('admin')->middleware(['admin.auth', 'tenant.scope'])->group(function () {

    // Auth / Profile
    Route::post('logout',                                [AdminController::class, 'logout']);
    Route::get('me',                                     [AdminController::class, 'me']);
    Route::put('me',                                     [AdminController::class, 'updateMe']);
    Route::post('me/avatar',                             [AdminController::class, 'uploadMyAvatar']);

    // Dashboard & Analytics
    Route::get('dashboard',                              [AdminController::class, 'dashboard']);
    Route::get('analytics',                              [AdminController::class, 'analytics']);

    // Agents (online users)
    Route::get('agents',                                 [AdminController::class, 'listAgents']);

    // Chats (primary frontend naming)
    Route::get('chats',                                  [AdminController::class, 'listChats']);
    Route::get('chats/alerts',                           [AdminController::class, 'chatAlerts']);
    Route::get('chats/{chatId}/messages',                [AdminController::class, 'getChatMessages']);
    Route::post('chats/{chatId}/reply',                  [AdminController::class, 'chatReply']);
    Route::post('chats/{chatId}/resolve',                [AdminController::class, 'chatResolve']);
    Route::post('chats/{chatId}/assign',                 [AdminController::class, 'chatAssign']);
    Route::post('chats/{chatId}/typing',                 [AdminController::class, 'chatTyping']);
    Route::post('chats/{chatId}/upload',                 [AdminController::class, 'chatUpload']);
    Route::put('chats/{chatId}/details',                 [AdminController::class, 'chatUpdateDetails']);
    Route::delete('chats/{chatId}',                      [AdminController::class, 'chatDelete']);

    // Sessions (legacy alias — same controllers)
    Route::get('sessions',                               [AdminController::class, 'listSessions']);
    Route::get('sessions/{sessionId}/messages',          [AdminController::class, 'getSessionMessages']);
    Route::post('sessions/message',                      [AdminController::class, 'sendAgentMessage']);
    Route::post('sessions/{sessionId}/resolve',          [AdminController::class, 'resolveSession']);

    // Visitors
    Route::get('visitors/active',                        [AdminController::class, 'activeVisitors']);
    Route::get('visitors/{sessionId}/flow',              [AdminController::class, 'visitorFlow']);

    // Leads
    Route::get('leads',                                  [AdminController::class, 'listLeads']);
    Route::put('leads/{leadId}',                         [AdminController::class, 'updateLead']);

    // Users
    Route::get('users',                                  [AdminController::class, 'listUsers']);
    Route::post('users',                                 [AdminController::class, 'createUser']);
    Route::put('users/{userId}',                         [AdminController::class, 'updateUser']);
    Route::post('users/{userId}/avatar',                 [AdminController::class, 'uploadUserAvatar']);

    // Companies
    Route::get('companies',                              [AdminController::class, 'listCompanies']);
    Route::post('companies',                             [AdminController::class, 'createCompany']);
    Route::put('companies/{companyId}',                  [AdminController::class, 'updateCompany']);
    Route::delete('companies/{companyId}',               [AdminController::class, 'deleteCompany']);

    // Websites
    Route::get('websites',                               [AdminController::class, 'listWebsites']);
    Route::post('websites',                              [AdminController::class, 'createWebsite']);
    Route::put('websites/{websiteId}',                   [AdminController::class, 'updateWebsite']);
    Route::get('websites/{websiteId}/settings',          [AdminController::class, 'getWebsiteSettings']);
    Route::put('websites/{websiteId}/settings',          [AdminController::class, 'updateWebsiteSettings']);

    // Settings
    Route::get('settings',                               [AdminController::class, 'getSettings']);
    Route::put('settings',                               [AdminController::class, 'updateSettings']);
    Route::post('settings/voice-preview',                [AdminController::class, 'voicePreview']);

    // Canned Replies
    Route::get('canned-replies',                         [AdminController::class, 'listCannedReplies']);
    Route::post('canned-replies',                        [AdminController::class, 'storeCannedReply']);
    Route::put('canned-replies/{id}',                    [AdminController::class, 'updateCannedReply']);
    Route::delete('canned-replies/{id}',                 [AdminController::class, 'destroyCannedReply']);

    // Popup Rules
    Route::get('popup-rules',                            [AdminController::class, 'listPopupRules']);
    Route::post('popup-rules',                           [AdminController::class, 'storePopupRule']);
    Route::put('popup-rules/{id}',                       [AdminController::class, 'updatePopupRule']);
    Route::delete('popup-rules/{id}',                    [AdminController::class, 'destroyPopupRule']);

    // AI: FAQs (frontend uses /ai/faq, backend also supports /ai/faqs)
    Route::get('ai/faq',                                 [AdminController::class, 'listFaqs']);
    Route::post('ai/faq',                                [AdminController::class, 'storeFaq']);
    Route::put('ai/faq/{id}',                            [AdminController::class, 'updateFaq']);
    Route::delete('ai/faq/{id}',                         [AdminController::class, 'destroyFaq']);
    Route::get('ai/faqs',                                [AdminController::class, 'listFaqs']);
    Route::post('ai/faqs',                               [AdminController::class, 'storeFaq']);
    Route::put('ai/faqs/{id}',                           [AdminController::class, 'updateFaq']);
    Route::delete('ai/faqs/{id}',                        [AdminController::class, 'destroyFaq']);
    Route::get('ai/faq-jsonl',                           [AdminController::class, 'faqJsonl']);

    // AI: Documents (frontend uses /ai/docs, backend also supports /ai/documents)
    Route::get('ai/docs',                                [AdminController::class, 'listDocuments']);
    Route::post('ai/docs',                               [AdminController::class, 'uploadDocument']);
    Route::delete('ai/docs/{id}',                        [AdminController::class, 'destroyDocument']);
    Route::get('ai/documents',                           [AdminController::class, 'listDocuments']);
    Route::post('ai/documents',                          [AdminController::class, 'uploadDocument']);
    Route::delete('ai/documents/{id}',                   [AdminController::class, 'destroyDocument']);

    // AI: Knowledge
    Route::get('ai/knowledge',                           [AdminController::class, 'listKnowledge']);
    Route::post('ai/knowledge',                          [AdminController::class, 'storeKnowledge']);
    Route::put('ai/knowledge/{id}',                      [AdminController::class, 'updateKnowledge']);
    Route::delete('ai/knowledge/{id}',                   [AdminController::class, 'destroyKnowledge']);

    // AI: Feedback, Test, Training
    Route::post('ai/feedback',                           [AdminController::class, 'aiFeedback']);
    Route::post('ai/test',                               [AdminController::class, 'aiTest']);
    Route::post('ai/avatar',                             [AdminController::class, 'aiAvatar']);
    Route::get('ai/fine-tunes',                          [AdminController::class, 'listFineTunes']);
    Route::post('ai/fine-tunes',                         [AdminController::class, 'uploadFineTune']);
    Route::get('ai/training-data',                       [AdminController::class, 'trainingData']);
    Route::get('ai/training-preferences',                [AdminController::class, 'trainingPreferences']);

    // SaaS workspace management (authenticated)
    Route::get('saas/bootstrap',                         [AdminController::class, 'saasBootstrap']);
    Route::post('saas/sync-workspace-access',            [AdminController::class, 'saasSyncWorkspaceAccess']);
    Route::get('saas/tenants/{tenantId}/overview',       [AdminController::class, 'saasTenantOverview']);
    Route::post('saas/tenants/{tenantId}/checkout-session', [AdminController::class, 'saasCheckoutSession']);
    Route::post('saas/tenants/{tenantId}/trial',         [AdminController::class, 'saasStartTrial']);
    Route::post('saas/tenants/{tenantId}/customer-portal', [AdminController::class, 'saasCustomerPortal']);
});

// ─── SaaS Integration (external — JWT/gateway auth) ─────────────────────────
Route::prefix('saas')->middleware('saas.auth')->group(function () {
    Route::post('onboard-or-resume', [SaasController::class, 'onboardOrResume']);
});
