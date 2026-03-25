<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SaasProvisionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaasController extends Controller
{
    public function __construct(private SaasProvisionService $provision) {}

    /** Onboard or resume a SaaS tenant workspace. */
    public function onboardOrResume(Request $request): JsonResponse
    {
        $tenantId = $request->attributes->get('saas_tenant_id');
        if (!$tenantId) {
            return response()->json(['error' => 'Missing tenant ID'], 400);
        }

        $result = $this->provision->onboardOrResume($tenantId, $request->all());
        return response()->json($result);
    }
}
