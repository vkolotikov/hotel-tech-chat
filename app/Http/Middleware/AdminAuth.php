<?php

namespace App\Http\Middleware;

use App\Models\AdminSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie('oc_admin_sid') ?? $request->bearerToken();

        if (!$token) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        $tokenHash = hash('sha256', $token);
        $session   = AdminSession::where('token_hash', $tokenHash)
            ->where('expires_at', '>', now())
            ->with('user')
            ->first();

        if (!$session || !$session->user || !$session->user->is_active) {
            return response()->json(['error' => 'Invalid or expired session'], 401);
        }

        // Rotate token if needed
        $rotateHours = (int) config('chat.admin_rotate_hours', 24);
        if ($session->rotated_at && $session->rotated_at->diffInHours(now()) >= $rotateHours) {
            $newToken    = bin2hex(random_bytes(32));
            $newTokenHash = hash('sha256', $newToken);
            $session->update(['token_hash' => $newTokenHash, 'rotated_at' => now()]);
            // The new token would be set via cookie in the response
        }

        $request->attributes->set('auth_user', $session->user);
        $request->attributes->set('auth_session', $session);

        return $next($request);
    }
}
