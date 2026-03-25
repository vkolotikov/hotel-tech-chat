<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\AdminSession;
use App\Models\AiDocument;
use App\Models\AiFaq;
use App\Models\AiFeedback;
use App\Models\AiKnowledge;
use App\Models\Attachment;
use App\Models\CannedReply;
use App\Models\Company;
use App\Models\Lead;
use App\Models\Message;
use App\Models\PopupRule;
use App\Models\Session;
use App\Models\Setting;
use App\Models\User;
use App\Models\Visitor;
use App\Models\VisitorPage;
use App\Models\Website;
use App\Models\WebsiteSetting;
use App\Services\SaasProvisionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function tenantWebsiteIds(Request $request): \Illuminate\Support\Collection
    {
        $companyId = $request->attributes->get('tenant_company_id');
        return Website::where('company_id', $companyId)->pluck('id');
    }

    // ─── Auth ───────────────────────────────────────────────────────────────

    public function login(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email', 'password' => 'required|string']);

        $user = User::where('email', $request->input('email'))->where('is_active', true)->first();
        if (!$user || !Hash::check($request->input('password'), $user->password_hash)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        $token     = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $ttlHours  = (int) config('chat.admin_ttl_hours', 168);

        AdminSession::create([
            'user_id'    => $user->id,
            'token_hash' => $tokenHash,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'expires_at' => now()->addHours($ttlHours),
            'rotated_at' => now(),
        ]);

        return response()->json([
            'token' => $token,
            'user'  => $user->only('id', 'email', 'display_name', 'role', 'avatar_url'),
        ])->cookie('oc_admin_sid', $token, $ttlHours * 60, '/', null, false, true);
    }

    public function loginViaSaas(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email', 'password' => 'required|string']);

        $saasBaseUrl = rtrim(config('chat.saas_base_url', 'http://localhost:3000'), '/');

        try {
            $saasResponse = Http::timeout(10)->post("{$saasBaseUrl}/api/auth/token", [
                'email'    => $request->input('email'),
                'password' => $request->input('password'),
            ]);
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'error' => 'Unable to reach the authentication service.'], 502);
        }

        if (!$saasResponse->successful()) {
            $body   = $saasResponse->json();
            $status = $saasResponse->status();
            return response()->json([
                'ok'     => false,
                'error'  => $body['error'] ?? 'Authentication failed',
                'code'   => $body['code'] ?? '',
                'reason' => $body['reason'] ?? '',
            ], $status >= 400 && $status < 500 ? $status : 401);
        }

        $saasData   = $saasResponse->json();
        $saasUser   = $saasData['user'] ?? [];
        $saasOrg    = $saasData['organization'] ?? [];
        $saasUserId = $saasUser['id'] ?? '';
        $orgId      = $saasOrg['id'] ?? '';
        $orgName    = $saasOrg['name'] ?? 'My Workspace';
        $orgRole    = $saasOrg['role'] ?? 'STAFF';

        if (!$saasUserId) {
            return response()->json(['ok' => false, 'error' => 'Invalid token response'], 502);
        }

        $provision = app(SaasProvisionService::class);
        $account   = $orgId ? Account::where('saas_tenant_id', $orgId)->first() : null;

        if (!$account && $orgId) {
            $provision->onboardOrResume($orgId, [
                'org_name'     => $orgName,
                'email'        => $saasUser['email'] ?? $request->input('email'),
                'display_name' => $saasUser['name'] ?? 'Admin',
                'plan'         => 'free',
            ]);
            $account = Account::where('saas_tenant_id', $orgId)->first();
        }

        $email = $saasUser['email'] ?? $request->input('email');
        $user  = User::where('email', $email)->first();

        if (!$user && $account) {
            $user = User::create([
                'account_id'    => $account->id,
                'email'         => $email,
                'password_hash' => Hash::make(Str::random(32)),
                'display_name'  => $saasUser['name'] ?? explode('@', $email)[0],
                'role'          => strtolower($orgRole) === 'owner' ? 'admin' : 'agent',
                'is_active'     => true,
            ]);
            $company = $account->companies()->first();
            if ($company) {
                $user->companies()->attach($company->id, ['role' => strtolower($orgRole) === 'owner' ? 'admin' : 'agent']);
                $website = $company->websites()->first();
                if ($website) {
                    $user->websites()->attach($website->id);
                }
            }
        }

        if (!$user && !$orgId) {
            return response()->json([
                'ok'    => false,
                'error' => 'No workspace access yet. Please complete onboarding first.',
                'code'  => 'membership_missing',
            ], 403);
        }

        if (!$user || !$user->is_active) {
            return response()->json(['ok' => false, 'error' => 'User account is inactive'], 403);
        }

        $token     = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $ttlHours  = (int) config('chat.admin_ttl_hours', 168);

        AdminSession::create([
            'user_id'    => $user->id,
            'token_hash' => $tokenHash,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'expires_at' => now()->addHours($ttlHours),
            'rotated_at' => now(),
        ]);

        $memberships = [];
        if ($account) {
            foreach ($account->companies as $company) {
                $pivot = $user->companies()->where('companies.id', $company->id)->first();
                $memberships[] = [
                    'tenant_id' => $account->saas_tenant_id,
                    'name'      => $company->name,
                    'role'      => $pivot?->pivot?->role ?? 'agent',
                ];
            }
        }

        return response()->json([
            'ok'                      => true,
            'token'                   => $token,
            'user'                    => $user->only('id', 'email', 'display_name', 'role', 'avatar_url'),
            'selected_tenant_id'      => $account?->saas_tenant_id ?? '',
            'memberships'             => $memberships,
            'auto_provisioned'        => false,
            'onboarding_action_taken' => 'none',
            'plan_status'             => $account?->plan ?? '',
            'period_end'              => null,
            'workspace_reason'        => '',
        ])->cookie('oc_admin_sid', $token, $ttlHours * 60, '/', null, false, true);
    }

    public function clientConfig(): JsonResponse
    {
        $saasBaseUrl = rtrim(config('chat.saas_base_url', ''), '/');
        return response()->json([
            'saas_enabled'  => (bool) config('chat.saas_enabled', false),
            'saas_base_url' => $saasBaseUrl ?: null,
            'product_key'   => config('chat.saas_product_key', 'onlinechat'),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $session = $request->attributes->get('auth_session');
        if ($session) {
            $session->delete();
        }
        return response()->json(['message' => 'Logged out'])->withoutCookie('oc_admin_sid');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        return response()->json($user->only('id', 'email', 'display_name', 'role', 'avatar_url', 'is_online'));
    }

    public function updateMe(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $user->update($request->only('display_name', 'email'));
        return response()->json($user->only('id', 'email', 'display_name', 'role', 'avatar_url', 'is_online'));
    }

    public function uploadMyAvatar(Request $request): JsonResponse
    {
        $request->validate(['file' => 'required|image|max:2048']);
        $user = $request->attributes->get('auth_user');
        $path = $request->file('file')->store("uploads/avatars/{$user->id}", 'public');
        $user->update(['avatar_url' => "/storage/{$path}"]);
        return response()->json(['avatar_url' => $user->avatar_url]);
    }

    // ─── Dashboard ──────────────────────────────────────────────────────────

    public function dashboard(Request $request): JsonResponse
    {
        $websiteIds = $this->tenantWebsiteIds($request);

        $activeSessions = Session::whereIn('website_id', $websiteIds)->where('status', 'active')->count();
        $totalMessages  = Message::whereHas('session', fn ($q) => $q->whereIn('website_id', $websiteIds))->count();
        $totalLeads     = Lead::whereIn('website_id', $websiteIds)->count();
        $unreadCount    = Message::whereHas('session', fn ($q) => $q->whereIn('website_id', $websiteIds))
            ->where('sender_type', 'visitor')->where('is_read', false)->count();

        return response()->json([
            'active_sessions' => $activeSessions,
            'total_messages'  => $totalMessages,
            'total_leads'     => $totalLeads,
            'unread_count'    => $unreadCount,
        ]);
    }

    public function analytics(Request $request): JsonResponse
    {
        $websiteIds = $this->tenantWebsiteIds($request);
        $from = $request->input('from', now()->subDays(30)->toDateString());
        $to   = $request->input('to', now()->toDateString());

        $sessions = Session::whereIn('website_id', $websiteIds)
            ->whereBetween('created_at', ["{$from} 00:00:00", "{$to} 23:59:59"]);

        $messages = Message::whereHas('session', fn ($q) => $q->whereIn('website_id', $websiteIds))
            ->whereBetween('created_at', ["{$from} 00:00:00", "{$to} 23:59:59"]);

        $leads = Lead::whereIn('website_id', $websiteIds)
            ->whereBetween('created_at', ["{$from} 00:00:00", "{$to} 23:59:59"]);

        $dailySessions = Session::whereIn('website_id', $websiteIds)
            ->whereBetween('created_at', ["{$from} 00:00:00", "{$to} 23:59:59"])
            ->selectRaw("DATE(created_at) as date, COUNT(*) as count")
            ->groupByRaw("DATE(created_at)")
            ->orderBy('date')
            ->get();

        $dailyMessages = Message::whereHas('session', fn ($q) => $q->whereIn('website_id', $websiteIds))
            ->whereBetween('created_at', ["{$from} 00:00:00", "{$to} 23:59:59"])
            ->selectRaw("DATE(created_at) as date, COUNT(*) as count")
            ->groupByRaw("DATE(created_at)")
            ->orderBy('date')
            ->get();

        return response()->json([
            'period'          => ['from' => $from, 'to' => $to],
            'total_sessions'  => (clone $sessions)->count(),
            'total_messages'  => (clone $messages)->count(),
            'total_leads'     => (clone $leads)->count(),
            'active_sessions' => (clone $sessions)->where('status', 'active')->count(),
            'resolved'        => (clone $sessions)->where('status', 'resolved')->count(),
            'ai_messages'     => (clone $messages)->where('sender_type', 'ai')->count(),
            'agent_messages'  => (clone $messages)->where('sender_type', 'agent')->count(),
            'visitor_messages'=> (clone $messages)->where('sender_type', 'visitor')->count(),
            'daily_sessions'  => $dailySessions,
            'daily_messages'  => $dailyMessages,
            'avg_response_time' => 0,
        ]);
    }

    // ─── Chats (Sessions) ───────────────────────────────────────────────────

    public function listChats(Request $request): JsonResponse
    {
        $websiteIds = $this->tenantWebsiteIds($request);
        $status = $request->input('status', 'active');

        $chats = Session::whereIn('website_id', $websiteIds)
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->with(['visitor:id,name,email,country,city', 'website:id,name,domain', 'assignedUser:id,display_name,avatar_url'])
            ->withCount('messages')
            ->orderByDesc('last_message_at')
            ->paginate($request->input('per_page', 20));

        return response()->json($chats);
    }

    public function chatAlerts(Request $request): JsonResponse
    {
        $websiteIds = $this->tenantWebsiteIds($request);

        $unassigned = Session::whereIn('website_id', $websiteIds)
            ->where('status', 'active')
            ->whereNull('assigned_user_id')
            ->count();

        $unread = Session::whereIn('website_id', $websiteIds)
            ->where('status', 'active')
            ->where('unread_count', '>', 0)
            ->count();

        $waiting = Session::whereIn('website_id', $websiteIds)
            ->where('status', 'active')
            ->where('unread_count', '>', 0)
            ->whereNull('assigned_user_id')
            ->count();

        return response()->json([
            'unassigned' => $unassigned,
            'unread'     => $unread,
            'waiting'    => $waiting,
        ]);
    }

    public function getChatMessages(int $chatId): JsonResponse
    {
        $messages = Message::where('session_id', $chatId)
            ->with(['senderUser:id,display_name,avatar_url', 'attachments'])
            ->orderBy('created_at')
            ->get();

        Message::where('session_id', $chatId)
            ->where('sender_type', 'visitor')
            ->where('is_read', false)
            ->update(['is_read' => true]);

        Session::where('id', $chatId)->update(['unread_count' => 0]);

        return response()->json($messages);
    }

    public function chatReply(int $chatId, Request $request): JsonResponse
    {
        $request->validate(['content' => 'required|string']);
        $user = $request->attributes->get('auth_user');

        $message = Message::create([
            'session_id'     => $chatId,
            'sender_type'    => 'agent',
            'sender_user_id' => $user->id,
            'content'        => $request->input('content'),
            'content_type'   => $request->input('content_type', 'text'),
        ]);

        Session::where('id', $chatId)
            ->update(['last_message_at' => now(), 'assigned_user_id' => $user->id]);

        return response()->json($message, 201);
    }

    public function chatResolve(int $chatId): JsonResponse
    {
        Session::where('id', $chatId)->update(['status' => 'resolved']);
        return response()->json(['message' => 'Chat resolved']);
    }

    public function chatAssign(int $chatId, Request $request): JsonResponse
    {
        $request->validate(['user_id' => 'required|integer']);
        Session::where('id', $chatId)->update(['assigned_user_id' => $request->input('user_id')]);
        return response()->json(['message' => 'Chat assigned']);
    }

    public function chatUpdateDetails(int $chatId, Request $request): JsonResponse
    {
        $session = Session::findOrFail($chatId);
        $session->update($request->only('subject', 'status', 'channel'));

        if ($request->has('visitor') && $session->visitor_id) {
            $visitor = Visitor::find($session->visitor_id);
            if ($visitor) {
                $visitor->update($request->input('visitor', []));
            }
        }

        return response()->json($session->fresh()->load('visitor'));
    }

    public function chatDelete(int $chatId): JsonResponse
    {
        $session = Session::findOrFail($chatId);
        Message::where('session_id', $chatId)->delete();
        $session->delete();
        return response()->json(['message' => 'Chat deleted']);
    }

    public function chatUpload(int $chatId, Request $request): JsonResponse
    {
        $request->validate(['file' => 'required|file|max:5120']);
        $user = $request->attributes->get('auth_user');
        $file = $request->file('file');

        $message = Message::create([
            'session_id'     => $chatId,
            'sender_type'    => 'agent',
            'sender_user_id' => $user->id,
            'content'        => $file->getClientOriginalName(),
            'content_type'   => 'file',
        ]);

        $path = $file->store("uploads/chat/{$chatId}", 'local');

        Attachment::create([
            'message_id' => $message->id,
            'file_path'  => $path,
            'file_name'  => $file->getClientOriginalName(),
            'mime_type'  => $file->getMimeType(),
            'size_bytes' => $file->getSize(),
        ]);

        Session::where('id', $chatId)->update(['last_message_at' => now()]);

        return response()->json($message->load('attachments'), 201);
    }

    public function chatTyping(int $chatId, Request $request): JsonResponse
    {
        // Typing indicators are ephemeral — just acknowledge
        return response()->json(['ok' => true]);
    }

    // ─── Sessions (legacy alias) ────────────────────────────────────────────

    public function listSessions(Request $request): JsonResponse
    {
        return $this->listChats($request);
    }

    public function getSessionMessages(int $sessionId): JsonResponse
    {
        return $this->getChatMessages($sessionId);
    }

    public function sendAgentMessage(Request $request): JsonResponse
    {
        $request->validate(['session_id' => 'required|integer', 'content' => 'required|string']);
        $user = $request->attributes->get('auth_user');

        $message = Message::create([
            'session_id'     => $request->input('session_id'),
            'sender_type'    => 'agent',
            'sender_user_id' => $user->id,
            'content'        => $request->input('content'),
            'content_type'   => 'text',
        ]);

        Session::where('id', $request->input('session_id'))
            ->update(['last_message_at' => now(), 'assigned_user_id' => $user->id]);

        return response()->json($message, 201);
    }

    public function resolveSession(int $sessionId): JsonResponse
    {
        return $this->chatResolve($sessionId);
    }

    // ─── Visitors ───────────────────────────────────────────────────────────

    public function activeVisitors(Request $request): JsonResponse
    {
        $websiteIds = $this->tenantWebsiteIds($request);

        $visitors = Visitor::whereIn('website_id', $websiteIds)
            ->whereHas('sessions', fn ($q) => $q->where('status', 'active'))
            ->with(['sessions' => fn ($q) => $q->where('status', 'active')->latest('last_message_at')->limit(1)])
            ->with('website:id,name,domain')
            ->orderByDesc('updated_at')
            ->limit(100)
            ->get();

        return response()->json(['visitors' => $visitors]);
    }

    public function visitorFlow(int $sessionId): JsonResponse
    {
        $session = Session::with('visitor')->findOrFail($sessionId);
        $pages = VisitorPage::where('visitor_id', $session->visitor_id)
            ->where(function ($q) use ($session) {
                $q->where('session_id', $session->id)->orWhereNull('session_id');
            })
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'visitor' => $session->visitor,
            'pages'   => $pages,
        ]);
    }

    // ─── Agents ─────────────────────────────────────────────────────────────

    public function listAgents(Request $request): JsonResponse
    {
        $user  = $request->attributes->get('auth_user');
        $users = User::where('account_id', $user->account_id)
            ->where('is_active', true)
            ->get()
            ->map(fn ($u) => $u->only('id', 'email', 'display_name', 'role', 'avatar_url', 'is_online'));

        return response()->json(['agents' => $users]);
    }

    // ─── Leads ──────────────────────────────────────────────────────────────

    public function listLeads(Request $request): JsonResponse
    {
        $websiteIds = $this->tenantWebsiteIds($request);

        $leads = Lead::whereIn('website_id', $websiteIds)
            ->with('website:id,name')
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 20));

        return response()->json($leads);
    }

    public function updateLead(int $leadId, Request $request): JsonResponse
    {
        $lead = Lead::findOrFail($leadId);
        $lead->update($request->only('name', 'email', 'phone', 'company_name', 'status', 'message', 'source'));
        return response()->json($lead);
    }

    // ─── Settings ───────────────────────────────────────────────────────────

    public function getSettings(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('tenant_company_id');
        $settings  = Setting::where('company_id', $companyId)->pluck('value', 'key_name');
        return response()->json($settings);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('tenant_company_id');
        $items     = $request->input('settings', []);

        foreach ($items as $key => $value) {
            Setting::updateOrCreate(
                ['company_id' => $companyId, 'key_name' => $key],
                ['value' => $value]
            );
        }

        return response()->json(['message' => 'Settings updated']);
    }

    public function voicePreview(Request $request): JsonResponse
    {
        // Voice preview is an OpenAI TTS integration — return placeholder
        return response()->json(['ok' => true, 'audio_url' => null, 'message' => 'Voice preview not configured']);
    }

    public function getWebsiteSettings(int $websiteId): JsonResponse
    {
        $settings = WebsiteSetting::where('website_id', $websiteId)->pluck('value', 'key_name');
        return response()->json($settings);
    }

    public function updateWebsiteSettings(Request $request, int $websiteId): JsonResponse
    {
        $items = $request->input('settings', []);
        foreach ($items as $key => $value) {
            WebsiteSetting::updateOrCreate(
                ['website_id' => $websiteId, 'key_name' => $key],
                ['value' => $value]
            );
        }
        return response()->json(['message' => 'Website settings updated']);
    }

    // ─── Companies ──────────────────────────────────────────────────────────

    public function listCompanies(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $companies = $user->companies()->withCount('websites')->get();
        return response()->json(['companies' => $companies]);
    }

    public function createCompany(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $request->validate(['name' => 'required|string|max:180']);

        $company = Company::create([
            'account_id' => $user->account_id,
            'name'       => $request->input('name'),
            'timezone'   => $request->input('timezone', 'UTC'),
            'is_active'  => true,
        ]);

        $user->companies()->attach($company->id, ['role' => 'admin']);

        return response()->json($company, 201);
    }

    public function updateCompany(int $companyId, Request $request): JsonResponse
    {
        $company = Company::findOrFail($companyId);
        $company->update($request->only('name', 'description', 'timezone', 'business_hours'));
        return response()->json($company);
    }

    public function deleteCompany(int $companyId): JsonResponse
    {
        Company::findOrFail($companyId)->delete();
        return response()->json(['message' => 'Company deleted']);
    }

    // ─── Websites ───────────────────────────────────────────────────────────

    public function listWebsites(Request $request): JsonResponse
    {
        $companyId = $request->input('company_id') ?? $request->attributes->get('tenant_company_id');
        $websites  = Website::where('company_id', $companyId)->withCount('visitors', 'sessions')->get();
        return response()->json($websites);
    }

    public function createWebsite(Request $request): JsonResponse
    {
        $companyId = $request->input('company_id') ?? $request->attributes->get('tenant_company_id');
        $request->validate(['name' => 'required|string|max:180', 'domain' => 'nullable|string|max:255']);

        $website = Website::create([
            'company_id' => $companyId,
            'name'       => $request->input('name'),
            'domain'     => $request->input('domain'),
            'widget_key' => Str::uuid(),
            'is_active'  => true,
        ]);

        return response()->json($website, 201);
    }

    public function updateWebsite(int $websiteId, Request $request): JsonResponse
    {
        $website = Website::findOrFail($websiteId);
        $website->update($request->only('name', 'domain', 'is_active'));
        return response()->json($website);
    }

    // ─── Canned Replies ─────────────────────────────────────────────────────

    public function listCannedReplies(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('tenant_company_id');
        return response()->json(CannedReply::where('company_id', $companyId)->get());
    }

    public function storeCannedReply(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('tenant_company_id');
        $validated = $request->validate([
            'shortcut' => 'required|string|max:60',
            'title'    => 'required|string|max:180',
            'content'  => 'required|string',
            'category' => 'nullable|string|max:60',
        ]);

        $reply = CannedReply::create(array_merge($validated, ['company_id' => $companyId]));
        return response()->json($reply, 201);
    }

    public function updateCannedReply(Request $request, int $id): JsonResponse
    {
        $reply = CannedReply::findOrFail($id);
        $reply->update($request->only('shortcut', 'title', 'content', 'category', 'is_active'));
        return response()->json($reply);
    }

    public function destroyCannedReply(int $id): JsonResponse
    {
        CannedReply::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // ─── Popup Rules ────────────────────────────────────────────────────────

    public function listPopupRules(Request $request): JsonResponse
    {
        $websiteId = $request->attributes->get('tenant_website_id');
        $query = PopupRule::query();
        if ($websiteId) {
            $query->where('website_id', $websiteId);
        }
        return response()->json($query->get());
    }

    public function storePopupRule(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'website_id'     => 'required|exists:websites,id',
            'name'           => 'required|string|max:180',
            'trigger_type'   => 'required|string|max:30',
            'trigger_config' => 'nullable|array',
            'message'        => 'required|string',
            'priority'       => 'integer',
        ]);

        $rule = PopupRule::create($validated);
        return response()->json($rule, 201);
    }

    public function updatePopupRule(Request $request, int $id): JsonResponse
    {
        $rule = PopupRule::findOrFail($id);
        $rule->update($request->except('id'));
        return response()->json($rule);
    }

    public function destroyPopupRule(int $id): JsonResponse
    {
        PopupRule::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // ─── AI: FAQs ───────────────────────────────────────────────────────────

    public function listFaqs(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('tenant_company_id');
        return response()->json(AiFaq::where('company_id', $companyId)->get());
    }

    public function storeFaq(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('tenant_company_id');
        $validated = $request->validate([
            'question' => 'required|string|max:500',
            'answer'   => 'required|string',
            'category' => 'nullable|string|max:60',
        ]);
        return response()->json(AiFaq::create(array_merge($validated, ['company_id' => $companyId])), 201);
    }

    public function updateFaq(Request $request, int $id): JsonResponse
    {
        $faq = AiFaq::findOrFail($id);
        $faq->update($request->only('question', 'answer', 'category', 'is_active'));
        return response()->json($faq);
    }

    public function destroyFaq(int $id): JsonResponse
    {
        AiFaq::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function faqJsonl(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('tenant_company_id');
        $faqs = AiFaq::where('company_id', $companyId)->where('is_active', true)->get();
        $lines = $faqs->map(fn ($faq) => json_encode([
            'messages' => [
                ['role' => 'user', 'content' => $faq->question],
                ['role' => 'assistant', 'content' => $faq->answer],
            ],
        ]));
        return response()->json(['jsonl' => $lines->implode("\n"), 'count' => $faqs->count()]);
    }

    // ─── AI: Documents ──────────────────────────────────────────────────────

    public function listDocuments(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('tenant_company_id');
        return response()->json(AiDocument::where('company_id', $companyId)->get());
    }

    public function uploadDocument(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('tenant_company_id');
        $request->validate(['file' => 'required|file|max:10240']);

        $file = $request->file('file');
        $path = $file->store("uploads/documents/{$companyId}", 'local');

        $doc = AiDocument::create([
            'company_id' => $companyId,
            'file_path'  => $path,
            'file_name'  => $file->getClientOriginalName(),
            'mime_type'  => $file->getMimeType(),
            'size_bytes' => $file->getSize(),
            'status'     => 'pending',
        ]);

        return response()->json($doc, 201);
    }

    public function destroyDocument(int $id): JsonResponse
    {
        AiDocument::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // ─── AI: Knowledge ──────────────────────────────────────────────────────

    public function listKnowledge(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('tenant_company_id');
        return response()->json(AiKnowledge::where('company_id', $companyId)->get());
    }

    public function storeKnowledge(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('tenant_company_id');
        $validated = $request->validate([
            'topic'    => 'required|string|max:180',
            'content'  => 'required|string',
            'category' => 'nullable|string|max:60',
        ]);
        return response()->json(AiKnowledge::create(array_merge($validated, ['company_id' => $companyId])), 201);
    }

    public function updateKnowledge(Request $request, int $id): JsonResponse
    {
        $k = AiKnowledge::findOrFail($id);
        $k->update($request->only('topic', 'content', 'category', 'is_active'));
        return response()->json($k);
    }

    public function destroyKnowledge(int $id): JsonResponse
    {
        AiKnowledge::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // ─── AI: Feedback ───────────────────────────────────────────────────────

    public function aiFeedback(Request $request): JsonResponse
    {
        $request->validate([
            'message_id' => 'required|integer',
            'rating'     => 'required|integer|min:1|max:5',
        ]);
        $user = $request->attributes->get('auth_user');

        $feedback = AiFeedback::updateOrCreate(
            ['message_id' => $request->input('message_id')],
            [
                'rating'     => $request->input('rating'),
                'correction' => $request->input('correction'),
                'comment'    => $request->input('comment'),
                'user_id'    => $user->id,
            ]
        );

        return response()->json($feedback);
    }

    // ─── AI: Test / Fine-tune / Training ────────────────────────────────────

    public function aiTest(Request $request): JsonResponse
    {
        $request->validate(['message' => 'required|string']);
        // AI test endpoint — returns a placeholder response when OpenAI is not configured
        $apiKey = config('chat.openai_api_key');
        if (!$apiKey) {
            return response()->json([
                'reply'  => 'AI is not configured. Set OC_OPENAI_API_KEY in your environment.',
                'source' => 'placeholder',
            ]);
        }

        return response()->json([
            'reply'  => 'AI test response placeholder.',
            'source' => 'openai',
        ]);
    }

    public function listFineTunes(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('tenant_company_id');
        // Fine-tunes are not stored locally yet — return empty list
        return response()->json([]);
    }

    public function uploadFineTune(Request $request): JsonResponse
    {
        $request->validate(['file' => 'required|file|max:10240']);
        return response()->json(['message' => 'Fine-tune upload received', 'status' => 'pending'], 201);
    }

    public function trainingData(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('tenant_company_id');
        $faqs      = AiFaq::where('company_id', $companyId)->where('is_active', true)->count();
        $docs      = AiDocument::where('company_id', $companyId)->count();
        $knowledge = AiKnowledge::where('company_id', $companyId)->where('is_active', true)->count();

        return response()->json([
            'faq_count'       => $faqs,
            'document_count'  => $docs,
            'knowledge_count' => $knowledge,
            'total'           => $faqs + $docs + $knowledge,
        ]);
    }

    public function trainingPreferences(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('tenant_company_id');
        $settings  = Setting::where('company_id', $companyId)
            ->whereIn('key_name', ['ai_model', 'ai_temperature', 'ai_max_tokens', 'ai_system_prompt', 'ai_enabled'])
            ->pluck('value', 'key_name');

        return response()->json($settings);
    }

    public function aiAvatar(Request $request): JsonResponse
    {
        $request->validate(['file' => 'required|image|max:2048']);
        $companyId = $request->attributes->get('tenant_company_id');
        $path = $request->file('file')->store("uploads/ai-avatar/{$companyId}", 'public');
        $url  = "/storage/{$path}";

        Setting::updateOrCreate(
            ['company_id' => $companyId, 'key_name' => 'ai_avatar_url'],
            ['value' => $url]
        );

        return response()->json(['avatar_url' => $url]);
    }

    // ─── Users ──────────────────────────────────────────────────────────────

    public function listUsers(Request $request): JsonResponse
    {
        $user  = $request->attributes->get('auth_user');
        $users = User::where('account_id', $user->account_id)->get();
        return response()->json(['users' => $users->map(fn ($u) => $u->only('id', 'email', 'display_name', 'role', 'avatar_url', 'is_online', 'is_active'))]);
    }

    public function createUser(Request $request): JsonResponse
    {
        $request->validate([
            'email'        => 'required|email|unique:users,email',
            'display_name' => 'required|string|max:180',
            'role'         => 'nullable|string|in:admin,agent',
            'password'     => 'nullable|string|min:6',
        ]);

        $authUser = $request->attributes->get('auth_user');

        $user = User::create([
            'account_id'    => $authUser->account_id,
            'email'         => $request->input('email'),
            'password_hash' => Hash::make($request->input('password', Str::random(16))),
            'display_name'  => $request->input('display_name'),
            'role'          => $request->input('role', 'agent'),
            'is_active'     => true,
        ]);

        // Attach to same companies as the creating user
        foreach ($authUser->companies as $company) {
            $user->companies()->attach($company->id, ['role' => $request->input('role', 'agent')]);
            foreach ($company->websites as $website) {
                $user->websites()->syncWithoutDetaching([$website->id]);
            }
        }

        return response()->json($user->only('id', 'email', 'display_name', 'role', 'is_active'), 201);
    }

    public function updateUser(int $userId, Request $request): JsonResponse
    {
        $user = User::findOrFail($userId);
        $user->update($request->only('display_name', 'email', 'role', 'is_active'));
        return response()->json($user->only('id', 'email', 'display_name', 'role', 'avatar_url', 'is_online', 'is_active'));
    }

    public function uploadUserAvatar(int $userId, Request $request): JsonResponse
    {
        $request->validate(['file' => 'required|image|max:2048']);
        $user = User::findOrFail($userId);
        $path = $request->file('file')->store("uploads/avatars/{$userId}", 'public');
        $user->update(['avatar_url' => "/storage/{$path}"]);
        return response()->json(['avatar_url' => $user->avatar_url]);
    }

    // ─── SaaS Integration ───────────────────────────────────────────────────

    public function saasBootstrap(Request $request): JsonResponse
    {
        $user    = $request->attributes->get('auth_user');
        $account = Account::find($user->account_id);

        $memberships = [];
        if ($account) {
            foreach ($account->companies as $company) {
                $pivot = $user->companies()->where('companies.id', $company->id)->first();
                $memberships[] = [
                    'tenant_id' => $account->saas_tenant_id,
                    'name'      => $company->name,
                    'role'      => $pivot?->pivot?->role ?? 'agent',
                ];
            }
        }

        return response()->json([
            'saas_enabled'        => (bool) config('chat.saas_enabled', false),
            'saas_base_url'       => rtrim(config('chat.saas_base_url', ''), '/') ?: null,
            'tenant_id'           => $account?->saas_tenant_id ?? '',
            'memberships'         => $memberships,
            'plan'                => $account?->plan ?? 'free',
            'workspace_ready'     => true,
            'product_key'         => config('chat.saas_product_key', 'onlinechat'),
        ]);
    }

    public function saasSyncWorkspaceAccess(Request $request): JsonResponse
    {
        return response()->json(['ok' => true, 'message' => 'Workspace access synced']);
    }

    public function saasTenantOverview(string $tenantId): JsonResponse
    {
        $account = Account::where('saas_tenant_id', $tenantId)->first();
        if (!$account) {
            return response()->json(['error' => 'Tenant not found'], 404);
        }

        $company  = $account->companies()->first();
        $websites = $company ? $company->websites()->count() : 0;

        return response()->json([
            'tenant_id'       => $tenantId,
            'plan'            => $account->plan,
            'workspace_ready' => true,
            'company_name'    => $company?->name ?? $account->name,
            'website_count'   => $websites,
            'entitled'        => true,
            'customer_state'  => 'active',
        ]);
    }

    public function saasCheckoutSession(string $tenantId, Request $request): JsonResponse
    {
        return response()->json([
            'ok'  => false,
            'url' => null,
            'message' => 'Billing is managed through the SaaS platform.',
        ]);
    }

    public function saasStartTrial(string $tenantId, Request $request): JsonResponse
    {
        $account = Account::where('saas_tenant_id', $tenantId)->first();
        if ($account) {
            $account->update(['plan' => 'trial']);
        }
        return response()->json(['ok' => true, 'plan' => 'trial']);
    }

    public function saasCustomerPortal(string $tenantId, Request $request): JsonResponse
    {
        $saasBaseUrl = rtrim(config('chat.saas_base_url', ''), '/');
        return response()->json([
            'ok'  => true,
            'url' => $saasBaseUrl ? "{$saasBaseUrl}/billing" : null,
        ]);
    }
}
