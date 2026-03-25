<?php

namespace App\Http\Middleware;

use App\Models\Company;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantScope
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->attributes->get('auth_user');
        if (!$user) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        // Resolve company from header or query
        $companyId = $request->header('X-Company-Id') ?? $request->input('company_id');

        if ($companyId) {
            // Verify user has access to this company
            $hasAccess = $user->companies()->where('companies.id', $companyId)->exists();
            if (!$hasAccess) {
                return response()->json(['error' => 'Access denied to this company'], 403);
            }

            $company = Company::find($companyId);
            $request->attributes->set('tenant_company', $company);
            $request->attributes->set('tenant_company_id', (int) $companyId);
        } else {
            // Default to first company
            $company = $user->companies()->first();
            if ($company) {
                $request->attributes->set('tenant_company', $company);
                $request->attributes->set('tenant_company_id', $company->id);
            }
        }

        // Resolve website if provided
        $websiteId = $request->header('X-Website-Id') ?? $request->input('website_id');
        if ($websiteId) {
            $request->attributes->set('tenant_website_id', (int) $websiteId);
        }

        return $next($request);
    }
}
