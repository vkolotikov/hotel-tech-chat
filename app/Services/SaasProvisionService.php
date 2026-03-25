<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Company;
use App\Models\User;
use App\Models\Website;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SaasProvisionService
{
    /** Onboard or resume a SaaS tenant workspace. */
    public function onboardOrResume(string $tenantId, array $context = []): array
    {
        // Check if account already exists for this tenant
        $account = Account::where('saas_tenant_id', $tenantId)->first();

        if ($account) {
            return $this->resumeWorkspace($account, $context);
        }

        return $this->createWorkspace($tenantId, $context);
    }

    /** Create a new workspace for a SaaS tenant. */
    private function createWorkspace(string $tenantId, array $context): array
    {
        $orgName = $context['org_name'] ?? 'My Workspace';
        $email   = $context['email'] ?? "admin@{$tenantId}.chat";

        $account = Account::create([
            'name'           => $orgName,
            'saas_tenant_id' => $tenantId,
            'clerk_org_id'   => $context['clerk_org_id'] ?? null,
            'plan'           => $context['plan'] ?? 'free',
            'is_active'      => true,
        ]);

        $user = User::create([
            'account_id'    => $account->id,
            'email'         => $email,
            'password_hash' => Hash::make(Str::random(16)),
            'display_name'  => $context['display_name'] ?? 'Admin',
            'role'          => 'admin',
            'clerk_user_id' => $context['clerk_user_id'] ?? null,
            'is_active'     => true,
        ]);

        $company = Company::create([
            'account_id' => $account->id,
            'name'       => $orgName,
            'timezone'   => $context['timezone'] ?? 'UTC',
            'is_active'  => true,
        ]);

        $website = Website::create([
            'company_id' => $company->id,
            'name'       => 'Default Website',
            'widget_key' => Str::uuid(),
            'is_active'  => true,
        ]);

        // Assign user to company and website
        $user->companies()->attach($company->id, ['role' => 'admin']);
        $user->websites()->attach($website->id);

        return [
            'status'     => 'created',
            'account_id' => $account->id,
            'company_id' => $company->id,
            'website_id' => $website->id,
            'widget_key' => $website->widget_key,
            'user_id'    => $user->id,
        ];
    }

    /** Resume existing workspace. */
    private function resumeWorkspace(Account $account, array $context): array
    {
        $company = $account->companies()->first();
        $website = $company?->websites()->first();

        return [
            'status'     => 'resumed',
            'account_id' => $account->id,
            'company_id' => $company?->id,
            'website_id' => $website?->id,
            'widget_key' => $website?->widget_key,
        ];
    }
}
