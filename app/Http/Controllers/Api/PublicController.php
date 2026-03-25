<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Message;
use App\Models\PopupRule;
use App\Models\Session;
use App\Models\Visitor;
use App\Models\VisitorPage;
use App\Models\Website;
use App\Services\AiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PublicController extends Controller
{
    /** Initialize a visitor session (widget bootstrap). */
    public function initSession(Request $request): JsonResponse
    {
        $request->validate([
            'widget_key'   => 'required|uuid',
            'visitor_uuid' => 'nullable|uuid',
        ]);

        $website = Website::where('widget_key', $request->input('widget_key'))
            ->where('is_active', true)
            ->first();

        if (!$website) {
            return response()->json(['error' => 'Invalid widget key'], 404);
        }

        $visitorUuid = $request->input('visitor_uuid') ?? Str::uuid()->toString();

        $visitor = Visitor::firstOrCreate(
            ['website_id' => $website->id, 'visitor_uuid' => $visitorUuid],
            [
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]
        );

        // Get or create active session
        $session = $visitor->sessions()
            ->where('status', 'active')
            ->latest()
            ->first();

        if (!$session) {
            $session = Session::create([
                'visitor_id' => $visitor->id,
                'website_id' => $website->id,
                'status'     => 'active',
                'channel'    => 'web',
            ]);
        }

        // Load popup rules for this website
        $popupRules = PopupRule::where('website_id', $website->id)
            ->where('is_active', true)
            ->orderByDesc('priority')
            ->get();

        return response()->json([
            'visitor_uuid' => $visitor->visitor_uuid,
            'session_id'   => $session->id,
            'website'      => $website->only('id', 'name'),
            'popup_rules'  => $popupRules,
        ]);
    }

    /** Send a visitor message. */
    public function sendMessage(Request $request): JsonResponse
    {
        $request->validate([
            'session_id' => 'required|integer',
            'content'    => 'required|string|max:5000',
            'auto_ai'    => 'boolean',
        ]);

        $session = Session::findOrFail($request->input('session_id'));

        // Save visitor message
        $visitorMsg = Message::create([
            'session_id'  => $session->id,
            'sender_type' => 'visitor',
            'content'     => $request->input('content'),
            'content_type' => 'text',
        ]);

        $session->update([
            'last_message_at' => now(),
            'unread_count'    => $session->unread_count + 1,
        ]);

        $result = ['message' => $visitorMsg, 'ai_reply' => null];

        // Auto AI reply if requested and no agent assigned
        if ($request->boolean('auto_ai', false) && !$session->assigned_user_id) {
            $ai = app(AiService::class);
            $aiContent = $ai->generateReply($session, $request->input('content'));

            if ($aiContent) {
                $aiMsg = Message::create([
                    'session_id'  => $session->id,
                    'sender_type' => 'ai',
                    'content'     => $aiContent,
                    'content_type' => 'text',
                ]);
                $result['ai_reply'] = $aiMsg;
            }
        }

        // Try to extract contact info
        $this->extractContactInfo($session, $request->input('content'));

        return response()->json($result, 201);
    }

    /** Get messages for a session (polling). */
    public function getMessages(int $sessionId, Request $request): JsonResponse
    {
        $since = $request->input('since'); // ISO timestamp

        $query = Message::where('session_id', $sessionId)
            ->orderBy('created_at');

        if ($since) {
            $query->where('created_at', '>', $since);
        }

        return response()->json($query->get());
    }

    /** Track a page visit. */
    public function trackPage(Request $request): JsonResponse
    {
        $request->validate([
            'visitor_uuid' => 'required|uuid',
            'session_id'   => 'nullable|integer',
            'url'          => 'required|string|max:2000',
            'title'        => 'nullable|string|max:500',
            'referrer'     => 'nullable|string|max:2000',
        ]);

        $visitor = Visitor::where('visitor_uuid', $request->input('visitor_uuid'))->first();
        if (!$visitor) {
            return response()->json(['error' => 'Visitor not found'], 404);
        }

        $page = VisitorPage::create([
            'visitor_id' => $visitor->id,
            'session_id' => $request->input('session_id'),
            'url'        => $request->input('url'),
            'path'       => parse_url($request->input('url'), PHP_URL_PATH),
            'title'      => $request->input('title'),
            'referrer'   => $request->input('referrer'),
        ]);

        return response()->json($page, 201);
    }

    /** Submit a lead form. */
    public function submitLead(Request $request): JsonResponse
    {
        $request->validate([
            'session_id' => 'required|integer',
            'name'       => 'nullable|string|max:120',
            'email'      => 'nullable|email|max:180',
            'phone'      => 'nullable|string|max:40',
            'message'    => 'nullable|string',
        ]);

        $session = Session::findOrFail($request->input('session_id'));

        $lead = Lead::create([
            'website_id' => $session->website_id,
            'visitor_id' => $session->visitor_id,
            'session_id' => $session->id,
            'name'       => $request->input('name'),
            'email'      => $request->input('email'),
            'phone'      => $request->input('phone'),
            'message'    => $request->input('message'),
            'source'     => 'chat',
            'status'     => 'new',
        ]);

        // Update visitor info
        $visitor = $session->visitor;
        if ($request->input('email')) $visitor->email = $request->input('email');
        if ($request->input('name')) $visitor->name = $request->input('name');
        if ($request->input('phone')) $visitor->phone = $request->input('phone');
        $visitor->save();

        return response()->json($lead, 201);
    }

    /** Upload attachment from widget. */
    public function uploadAttachment(Request $request): JsonResponse
    {
        $request->validate([
            'session_id' => 'required|integer',
            'file'       => 'required|file|max:5120',
        ]);

        $session = Session::findOrFail($request->input('session_id'));
        $file    = $request->file('file');
        $path    = $file->store("uploads/chat/{$session->id}", 'local');

        // Create message with attachment
        $message = Message::create([
            'session_id'  => $session->id,
            'sender_type' => 'visitor',
            'content'     => $file->getClientOriginalName(),
            'content_type' => 'file',
        ]);

        $message->attachments()->create([
            'file_path'  => $path,
            'file_name'  => $file->getClientOriginalName(),
            'mime_type'  => $file->getMimeType(),
            'size_bytes' => $file->getSize(),
        ]);

        return response()->json($message->load('attachments'), 201);
    }

    /** Voice transcription. */
    public function transcribe(Request $request): JsonResponse
    {
        $request->validate(['audio' => 'required|file|max:6144', 'session_id' => 'required|integer']);

        $ai   = app(AiService::class);
        $text = $ai->transcribe($request->file('audio')->getRealPath());

        if ($text === null) {
            return response()->json(['error' => 'AI not configured'], 503);
        }

        return response()->json(['text' => $text]);
    }

    /** Text-to-speech. */
    public function speak(Request $request): JsonResponse
    {
        $request->validate(['text' => 'required|string|max:4096', 'voice' => 'nullable|string|max:30']);

        $ai    = app(AiService::class);
        $audio = $ai->speak($request->input('text'), $request->input('voice', 'alloy'));

        if ($audio === null) {
            return response()->json(['error' => 'AI not configured'], 503);
        }

        $filename = 'speech_' . Str::random(8) . '.mp3';
        $path = storage_path("app/uploads/{$filename}");
        file_put_contents($path, $audio);

        return response()->json(['audio_url' => url("storage/uploads/{$filename}"), 'format' => 'mp3']);
    }

    /** Typing indicator (store in cache). */
    public function typing(Request $request): JsonResponse
    {
        $request->validate(['session_id' => 'required|integer', 'is_typing' => 'required|boolean']);
        // In-memory typing state — stored via cache for simplicity
        $key = "typing:{$request->input('session_id')}:visitor";
        if ($request->boolean('is_typing')) {
            cache()->put($key, true, 5);
        } else {
            cache()->forget($key);
        }
        return response()->json(['ok' => true]);
    }

    /** Check if agent is typing. */
    public function typingStatus(int $sessionId): JsonResponse
    {
        $agentTyping = cache()->get("typing:{$sessionId}:agent", false);
        return response()->json(['agent_typing' => $agentTyping]);
    }

    /** Extract email/phone from message text. */
    private function extractContactInfo(Session $session, string $text): void
    {
        $visitor = $session->visitor;

        if (!$visitor->email && preg_match('/[\w.+-]+@[\w-]+\.[\w.]+/', $text, $m)) {
            $visitor->email = $m[0];
            $visitor->save();
        }

        if (!$visitor->phone && preg_match('/\+?\d[\d\s\-()]{7,}/', $text, $m)) {
            $visitor->phone = trim($m[0]);
            $visitor->save();
        }
    }
}
