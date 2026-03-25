(() => {
  const normalizeTenantId = (value) => String(value || "").trim();

  const isOpaqueWorkspaceLabel = (value, tenantId = "") => {
    const text = String(value || "").trim();
    const rawTenantId = normalizeTenantId(tenantId);
    if (!text) {
      return true;
    }
    if (rawTenantId && text === rawTenantId) {
      return true;
    }
    return /^tenant\s+[a-z0-9]/i.test(text);
  };

  const normalizeWorkspaceMemberships = (memberships = []) =>
    Array.from(
      (Array.isArray(memberships) ? memberships : []).reduce((acc, item) => {
        const tenantId = normalizeTenantId(item?.tenant_id || item?.tenantId || "");
        if (!tenantId || acc.has(tenantId)) {
          return acc;
        }
        acc.set(tenantId, {
          ...item,
          tenant_id: tenantId,
          name: String(item?.name || "").trim() || `Workspace ${tenantId}`,
          role: String(item?.role || "").trim() || "member"
        });
        return acc;
      }, new Map()).values()
    ).sort((left, right) => String(left.tenant_id || "").localeCompare(String(right.tenant_id || "")));

  const buildLocalTenantMap = (localTenants = []) =>
    (Array.isArray(localTenants) ? localTenants : []).reduce((acc, item) => {
      const tenantId = normalizeTenantId(item?.tenant_id);
      if (tenantId) {
        acc.set(tenantId, item);
      }
      return acc;
    }, new Map());

  const getWorkspaceBaseLabel = (membership = {}, localTenant = null) => {
    const membershipName = String(membership?.name || "").trim();
    if (!isOpaqueWorkspaceLabel(membershipName, membership?.tenant_id || "")) {
      return membershipName;
    }
    const localCompany = (Array.isArray(localTenant?.companies) ? localTenant.companies : []).find(
      (company) => String(company?.name || "").trim()
    );
    if (localCompany?.name) {
      return String(localCompany.name).trim();
    }
    if (String(localTenant?.account?.name || "").trim()) {
      return String(localTenant.account.name).trim();
    }
    return "Workspace";
  };

  const getWorkspaceLabelSuffix = (membership = {}, localTenant = null) => {
    const tenantId = normalizeTenantId(membership?.tenant_id || "");
    const companyCount = Number(Array.isArray(localTenant?.companies) ? localTenant.companies.length : 0);
    if (companyCount > 1) {
      return `${companyCount} companies`;
    }
    if (tenantId) {
      return tenantId.slice(-6);
    }
    return "";
  };

  const decorateWorkspaceMemberships = (memberships = [], localTenants = []) => {
    const normalized = normalizeWorkspaceMemberships(memberships);
    const localMap = buildLocalTenantMap(localTenants);
    const baseCounts = normalized.reduce((acc, membership) => {
      const base = getWorkspaceBaseLabel(membership, localMap.get(membership.tenant_id) || null);
      const key = base.toLowerCase();
      acc.set(key, Number(acc.get(key) || 0) + 1);
      return acc;
    }, new Map());

    return normalized.map((membership) => {
      const localTenant = localMap.get(membership.tenant_id) || null;
      const baseLabel = getWorkspaceBaseLabel(membership, localTenant);
      const needsSuffix =
        isOpaqueWorkspaceLabel(membership.name, membership.tenant_id) ||
        Number(baseCounts.get(baseLabel.toLowerCase()) || 0) > 1;
      const suffix = needsSuffix ? getWorkspaceLabelSuffix(membership, localTenant) : "";
      return {
        ...membership,
        display_name: baseLabel,
        display_label: suffix ? `${baseLabel} · ${suffix}` : baseLabel
      };
    });
  };

  const selectPreferredWorkspaceTenant = ({
    memberships = [],
    storedTenantId = "",
    bootstrapTenantId = ""
  } = {}) => {
    const normalized = normalizeWorkspaceMemberships(memberships);
    const allowed = normalized.map((membership) => membership.tenant_id);
    return [storedTenantId, bootstrapTenantId, allowed[0] || ""]
      .map((value) => normalizeTenantId(value))
      .find((value) => value && allowed.includes(value)) || "";
  };

  const api = {
    normalizeWorkspaceMemberships,
    decorateWorkspaceMemberships,
    selectPreferredWorkspaceTenant,
    isOpaqueWorkspaceLabel
  };

  if (typeof window !== "undefined") {
    window.OnlineChatWorkspaceContext = api;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
