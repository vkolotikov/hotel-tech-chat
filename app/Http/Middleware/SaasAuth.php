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
            $sdkPath = base_path('../../../saas/packages/auth-sdk/php/SaasAuth.php');
            if (file_exists($sdkPath)) {
                require_once $sdkPath;
                $auth = new \SaasAuth([
                    'platform_url' => config('chat.saas_base_url'),
                    'jwt_secret'   => config('chat.saas_jwt_secret'),
                ]);
                $result = $auth->verifyToken($token);
                if ($result['valid'] ?? false) {
                    $request->attributes->set('saas_authenticated', true);
                    $request->attributes->set('saas_tenant_id', $result['organization']['id'] ?? null);
                    $request->attributes->set('saas_user_id', $result['user']['id'] ?? null);
                    return $next($request);
                }
            }
        }

        return response()->json(['error' => 'SaaS authentication required'], 401);
    }
}
