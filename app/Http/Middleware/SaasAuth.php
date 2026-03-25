<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SaasAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        // Gateway headers
        if ($request->header('X-Saas-User-Id')) {
            $request->attributes->set('saas_authenticated', true);
            $request->attributes->set('saas_tenant_id', $request->header('X-Saas-Tenant-Id'));
            $request->attributes->set('saas_user_id', $request->header('X-Saas-User-Id'));
            return $next($request);
        }

        // Bearer JWT
        $token = $request->bearerToken();
        if ($token) {
            $result = $this->verifyJwt($token);
            if ($result['valid'] ?? false) {
                $request->attributes->set('saas_authenticated', true);
                $request->attributes->set('saas_tenant_id', $result['organization']['id'] ?? null);
                $request->attributes->set('saas_user_id', $result['user']['id'] ?? null);
                return $next($request);
            }
        }

        return response()->json(['error' => 'SaaS authentication required'], 401);
    }

    private function verifyJwt(string $token): array
    {
        $secret = env('SAAS_JWT_SECRET', '');
        if (!$secret) {
            return ['valid' => false, 'error' => 'JWT secret not configured'];
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return ['valid' => false, 'error' => 'Invalid token format'];
        }

        [$header, $payload, $signature] = $parts;

        $expected = rtrim(strtr(base64_encode(hash_hmac('sha256', "$header.$payload", $secret, true)), '+/', '-_'), '=');
        if (!hash_equals($expected, $signature)) {
            return ['valid' => false, 'error' => 'Invalid signature'];
        }

        $data = json_decode(base64_decode(str_pad(strtr($payload, '-_', '+/'), strlen($payload) % 4 ? strlen($payload) + 4 - strlen($payload) % 4 : strlen($payload), '=')), true);
        if (!$data) {
            return ['valid' => false, 'error' => 'Invalid payload'];
        }

        if (isset($data['exp']) && $data['exp'] < time()) {
            return ['valid' => false, 'error' => 'Token expired'];
        }

        return [
            'valid' => true,
            'user'  => [
                'id'    => $data['userId'] ?? $data['sub'] ?? '',
                'email' => $data['email'] ?? '',
            ],
            'organization' => isset($data['currentOrgId']) ? [
                'id'   => $data['currentOrgId'],
                'slug' => $data['currentOrgSlug'] ?? '',
            ] : null,
        ];
    }
}
