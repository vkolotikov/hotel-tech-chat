const initDashboard = async () => {
  const { state } = window.dashboardState;

  let typingTimer = null;
  let typingActive = false;
  let typingChatId = null;
  let typingLastSent = 0;
  let wizardCompanyId = 0;

  if (window.dashboardElements && typeof window.dashboardElements.refreshElements === "function") {
    window.dashboardElements.refreshElements();
  }
  if (window.OnlineChatPartialsReady && typeof window.OnlineChatPartialsReady.then === "function") {
    await window.OnlineChatPartialsReady;
    if (window.dashboardElements && typeof window.dashboardElements.refreshElements === "function") {
      window.dashboardElements.refreshElements();
    }
  }
  const { elements } = window.dashboardElements;
  const resolveAdminConfig = () => window.OnlineChatAdminConfig || {};
  const isSaasEnabledByConfig = () => {
    const cfg = resolveAdminConfig();
    if (cfg.saasEnabled !== undefined) {
      return Boolean(cfg.saasEnabled);
    }
    return Boolean(cfg.saasCoreBaseUrl || cfg.getSaasToken || cfg.saasToken);
  };
  const POST_LOGIN_ONBOARDING_KEY = "oc_post_login_onboarding";
  const workspaceContext = window.OnlineChatWorkspaceContext || {
    normalizeWorkspaceMemberships: (memberships = []) => Array.isArray(memberships) ? memberships : [],
    decorateWorkspaceMemberships: (memberships = []) => Array.isArray(memberships) ? memberships : [],
    selectPreferredWorkspaceTenant: ({ memberships = [], storedTenantId = "", bootstrapTenantId = "" } = {}) => {
      const allowed = (Array.isArray(memberships) ? memberships : [])
        .map((membership) => String(membership?.tenant_id || "").trim())
        .filter(Boolean);
      return [storedTenantId, bootstrapTenantId, allowed[0] || ""]
        .map((value) => String(value || "").trim())
        .find((value) => value && allowed.includes(value)) || "";
    },
    isOpaqueWorkspaceLabel: (value, tenantId = "") => {
      const text = String(value || "").trim();
      const rawTenantId = String(tenantId || "").trim();
      if (!text) {
        return true;
      }
      if (rawTenantId && text === rawTenantId) {
        return true;
      }
      return /^tenant\s+[a-z0-9]/i.test(text);
    }
  };
  const isOwnerMembershipRole =
    window.OnlineChatAdmin?.isOwnerMembershipRole ||
    ((role) => ["owner", "admin"].includes(String(role || "").toLowerCase()));
  const pickSaasUpgradePlan =
    window.OnlineChatAdmin?.pickSaasUpgradePlan ||
    ((plans = [], currentPlanKey = "") => {
      const normalizedCurrent = String(currentPlanKey || "").trim().toLowerCase();
      const activePlans = (Array.isArray(plans) ? plans : []).filter(
        (plan) =>
          !plan?.is_trial &&
          String(plan?.status || "").trim().toLowerCase() !== "inactive" &&
          String(plan?.plan_key || "").trim().toLowerCase() !== normalizedCurrent
      );
      return activePlans.find((plan) => Boolean(plan?.recommended)) || activePlans[0] || null;
    });
  const resolveSaasPrimaryAction =
    window.OnlineChatAdmin?.resolveSaasPrimaryAction ||
    ((options = {}) => ({
      hidden: !options.enabled || !String(options.tenantId || "").trim(),
      action: "",
      label: "Take action",
      disabled: true,
      title: !String(options.tenantId || "").trim() ? "Select a workspace first" : ""
    }));
  const resolveSaasStatusMessage =
    window.OnlineChatAdmin?.resolveSaasStatusMessage ||
    ((options = {}) => String(options.displayMessage || "").trim() || "Workspace access is not ready.");
  const applySaasButtonState =
    window.OnlineChatAdmin?.applySaasButtonState ||
    ((button, options = {}) => {
      if (!button) {
        return;
      }
      const {
        visible = true,
        disabled = false,
        planKey = "",
        action = "",
        label = "",
        title = ""
      } = options;
      button.hidden = !visible;
      button.disabled = Boolean(disabled);
      if (label) {
        button.textContent = label;
      }
      if (title) {
        button.title = title;
      } else {
        button.title = "";
      }
      if (!button.dataset || typeof button.dataset !== "object") {
        button.dataset = {};
      }
      if (planKey) {
        button.dataset.planKey = planKey;
      } else {
        delete button.dataset.planKey;
      }
      if (action) {
        button.dataset.action = action;
      } else {
        delete button.dataset.action;
      }
    });
  const isActivePlan = (plan = {}) =>
    !["inactive", "disabled", "archived"].includes(String(plan?.status || "").toLowerCase());
  if (!state.saas || typeof state.saas !== "object") {
    state.saas = {};
  }
  state.saas.enabled = Boolean(state.saas.enabled || isSaasEnabledByConfig());
  state.saas.selectedTenantId =
    state.saas.selectedTenantId || (window.OnlineChatAdmin?.getSelectedSaasTenantId?.() || "");
  state.saas.memberships = Array.isArray(state.saas.memberships) ? state.saas.memberships : [];
  state.saas.localTenants = Array.isArray(state.saas.localTenants) ? state.saas.localTenants : [];
  state.saas.ready = state.saas.enabled ? Boolean(state.saas.ready) : true;
  state.saas.status = state.saas.status || "ready";
  state.saas.message = state.saas.message || "";
  state.saas.plans = Array.isArray(state.saas.plans) ? state.saas.plans : [];
  state.saas.actionBusy = Boolean(state.saas.actionBusy);

  const setSaasTenantId = (tenantId, persist = true) => {
    const next = String(tenantId || "").trim();
    state.saas.selectedTenantId = next;
    if (persist && window.OnlineChatAdmin?.setSelectedSaasTenantId) {
      window.OnlineChatAdmin.setSelectedSaasTenantId(next);
    }
  };

  const getSelectedMembership = () => {
    const memberships = Array.isArray(state.saas.memberships) ? state.saas.memberships : [];
    return (
      memberships.find(
        (membership) => String(membership?.tenant_id || "") === String(state.saas.selectedTenantId || "")
      ) || null
    );
  };

  const isOpaqueWorkspaceLabel = (value, tenantId = "") => {
    return workspaceContext.isOpaqueWorkspaceLabel(value, tenantId);
  };

  const getWorkspaceDisplayName = (membership = null) => {
    const explicitLabel = String(membership?.display_label || membership?.display_name || "").trim();
    if (explicitLabel) {
      return explicitLabel;
    }
    const tenantId = String(membership?.tenant_id || state.saas.selectedTenantId || "").trim();
    const membershipName = String(membership?.name || "").trim();
    if (!isOpaqueWorkspaceLabel(membershipName, tenantId)) {
      return membershipName;
    }
    const activeCompany = state.companies.find((item) => Number(item.id) === Number(state.currentCompanyId || 0)) || null;
    if (activeCompany?.name) {
      return activeCompany.name;
    }
    const userName = String(state.currentUser?.name || "").trim();
    if (userName) {
      return `${userName}'s workspace`;
    }
    return "Select workspace";
  };

  const pickTrialPlan = () =>
    (Array.isArray(state.saas.plans) ? state.saas.plans : []).find(
      (plan) => Boolean(plan?.is_trial) && isActivePlan(plan)
    ) || null;

  const pickPaidPlan = () =>
    (Array.isArray(state.saas.plans) ? state.saas.plans : []).find(
      (plan) => !plan?.is_trial && isActivePlan(plan)
    ) ||
    (Array.isArray(state.saas.plans) ? state.saas.plans : []).find((plan) => isActivePlan(plan)) ||
    null;

  const readPostLoginOnboarding = () => {
    try {
      const raw = sessionStorage.getItem(POST_LOGIN_ONBOARDING_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  };

  const clearPostLoginOnboarding = () => {
    try {
      sessionStorage.removeItem(POST_LOGIN_ONBOARDING_KEY);
    } catch (err) {
      // Ignore storage failures in UI-only flow.
    }
  };

  const hideSaasOnboardingBanner = () => {
    if (!elements.saasOnboardingBanner) {
      return;
    }
    elements.saasOnboardingBanner.hidden = true;
    if (elements.saasOnboardingTitle) {
      elements.saasOnboardingTitle.textContent = "";
    }
    if (elements.saasOnboardingText) {
      elements.saasOnboardingText.textContent = "";
    }
  };

  const openDeveloperSettings = () => {
    setView("settings");
    const developerTabButton = document.querySelector("[data-settings-tab='developer']");
    if (developerTabButton) {
      developerTabButton.click();
    }
    updateEmbedInputs();
    updateEmbedCode();
  };

  const renderSaasOnboardingBanner = () => {
    if (!elements.saasOnboardingBanner || !elements.saasOnboardingTitle || !elements.saasOnboardingText) {
      return;
    }
    const onboarding = readPostLoginOnboarding();
    const selectedTenantId = String(state.saas.selectedTenantId || "").trim();
    if (!onboarding || !selectedTenantId || String(onboarding.selected_tenant_id || "") !== selectedTenantId) {
      hideSaasOnboardingBanner();
      return;
    }

    const workspaceName = String(onboarding.workspace_name || "").trim() || "your workspace";
    const planStatus = String(onboarding.plan_status || "").toLowerCase();
    const periodEnd = onboarding.period_end ? formatDate(onboarding.period_end) : "";
    let title = "";
    let message = "";

    if (onboarding.onboarding_action_taken === "accepted_invite") {
      title = "Workspace joined";
      message = `You joined ${workspaceName}. Billing lives in Settings > Membership. Install the widget in Settings > Developer.`;
    } else if (onboarding.auto_provisioned || ["created_tenant", "started_trial"].includes(onboarding.onboarding_action_taken)) {
      title = planStatus.startsWith("trial") ? "Trial started" : "Workspace ready";
      message = `Your ${workspaceName} workspace is connected.${periodEnd ? ` Trial access runs until ${periodEnd}.` : ""} Manage billing in Settings > Membership and install the widget in Settings > Developer.`;
    } else {
      hideSaasOnboardingBanner();
      return;
    }

    elements.saasOnboardingTitle.textContent = title;
    elements.saasOnboardingText.textContent = message;
    elements.saasOnboardingBanner.hidden = false;
  };

  const syncWorkspaceAccess = async (tenantId) => {
    const selected = String(tenantId || "").trim();
    if (!selected) {
      return null;
    }
    const payload = await fetchJson(`${API_BASE}/admin/saas/sync-workspace-access`, {
      method: "POST",
      body: JSON.stringify({
        tenant_id: selected,
        stored_tenant_id: selected
      })
    });
    if (payload?.user) {
      applyCurrentUser(payload.user);
    }
    return payload || null;
  };

  const openSaasCustomerPortal = async (tenantId) => {
    const response = await fetchJson(`${API_BASE}/admin/saas/tenants/${encodeURIComponent(tenantId)}/customer-portal`, {
      method: "POST",
      body: JSON.stringify({})
    });
    const url = String(response?.url || "").trim();
    if (!url) {
      throw new Error("Customer portal URL was not returned.");
    }
    window.location.href = url;
  };

  const renderSaasAccessActions = () => {
    if (!elements.saasAccessActions || !elements.saasAccessActionsMessage) {
      return;
    }
    const status = String(state.saas.status || "ready");
    if (!state.saas.enabled || status === "ready") {
      elements.saasAccessActions.hidden = true;
      elements.saasAccessActionsMessage.textContent = "";
      return;
    }

    const tenantId = String(state.saas.selectedTenantId || "").trim();
    const selectedMembership = getSelectedMembership();
    const membershipRole = String(selectedMembership?.role || "").toLowerCase();
    const isOwnerAdmin = isOwnerMembershipRole(membershipRole);
    const summary = state.saas.summary && typeof state.saas.summary === "object" ? state.saas.summary : {};
    const overviewSummary =
      state.saas.overview?.summary && typeof state.saas.overview.summary === "object"
        ? state.saas.overview.summary
        : {};
    const trialPlan = pickTrialPlan();
    const paidPlan = pickSaasUpgradePlan(
      state.saas.plans,
      summary?.current_plan_key || summary?.plan_key || overviewSummary?.current_plan_key || ""
    );
    const customerState = String(summary?.customer_state || "").trim().toLowerCase();
    const nextAction = String(summary?.next_action || "").trim().toLowerCase();
    const canManageBilling = Boolean(summary?.can_manage_billing || overviewSummary?.can_manage_billing);
    const canStartTrial = Boolean(summary?.can_start_trial);
    const canUpgrade = Boolean(summary?.can_upgrade);
    const workspaceReady =
      summary?.workspace_ready !== undefined
        ? Boolean(summary.workspace_ready)
        : String(summary?.setup_state || "").trim().toLowerCase() === "ready";

    const message = resolveSaasStatusMessage({
      surface: "banner",
      role: membershipRole,
      customerState: customerState || status,
      nextAction,
      displayMessage: summary?.display_message || state.saas.message || "",
      periodEndText: ""
    });

    elements.saasAccessActions.hidden = false;
    elements.saasAccessActionsMessage.textContent = message;

    const busy = Boolean(state.saas.actionBusy);
    const primaryAction = resolveSaasPrimaryAction({
      enabled: state.saas.enabled,
      tenantId,
      role: membershipRole,
      nextAction,
      customerState,
      workspaceReady,
      entitled: state.saas.productEnabled,
      canStartTrial,
      canUpgrade,
      canManageBilling,
      busy,
      trialPlanAvailable: Boolean(trialPlan?.plan_key),
      upgradePlanAvailable: Boolean(paidPlan?.plan_key)
    });

    const showUpgradeSecondary =
      isOwnerAdmin &&
      Boolean(tenantId) &&
      Boolean(paidPlan?.plan_key) &&
      canUpgrade &&
      primaryAction.action !== "upgrade";
    const showBillingSecondary =
      isOwnerAdmin &&
      Boolean(tenantId) &&
      canManageBilling &&
      primaryAction.action !== "billing" &&
      ["payment_required", "past_due", "suspended"].includes(customerState || status);

    applySaasButtonState(elements.saasAccessOpenMembership, {
      visible: true,
      disabled: busy,
      action: "open",
      label: "Open membership"
    });
    applySaasButtonState(elements.saasAccessStartTrial, {
      visible: !primaryAction.hidden,
      disabled: primaryAction.disabled,
      action: primaryAction.action,
      label: primaryAction.label,
      title: primaryAction.title
    });
    applySaasButtonState(elements.saasAccessUpgrade, {
      visible: showUpgradeSecondary,
      disabled: busy,
      action: "upgrade",
      label: "Upgrade plan",
      planKey: paidPlan?.plan_key || ""
    });
    applySaasButtonState(elements.saasAccessBilling, {
      visible: showBillingSecondary,
      disabled: busy,
      action: "billing",
      label: "Manage billing",
      planKey: paidPlan?.plan_key || ""
    });
  };

  const setSaasAccessState = (status, message = "") => {
    state.saas.status = status;
    state.saas.message = message;
    state.saas.ready = status === "ready";
    if (!elements.saasAccessState) {
      return;
    }
    if (status === "ready") {
      elements.saasAccessState.hidden = true;
      elements.saasAccessState.textContent = "";
      elements.saasAccessState.className = "saas-access-state";
      renderSaasAccessActions();
      return;
    }
    const classByStatus = {
      unauthenticated: "state-error",
      no_tenant: "state-warning",
      no_workspace: "state-warning",
      not_entitled: "state-warning",
      no_entitlement: "state-warning",
      suspended: "state-error",
      past_due: "state-warning",
      workspace_not_ready: "state-warning",
      api_failure: "state-error"
    };
    elements.saasAccessState.hidden = false;
    elements.saasAccessState.textContent = message || "Workspace access is not ready";
    elements.saasAccessState.className = `saas-access-state ${classByStatus[status] || "state-warning"}`;
    renderSaasAccessActions();
  };

  const resetWorkspaceScopedState = () => {
    state.companies = [];
    state.websites = [];
    state.currentCompanyId = 0;
    state.currentWebsiteId = 0;
    state.currentWebsiteKey = "";
    if (typeof resetAlertState === "function") {
      resetAlertState({ clearBanner: true });
    }
    localStorage.removeItem("oc_current_company_id");
    localStorage.removeItem("oc_current_website_id");
    localStorage.removeItem("oc_current_website_key");
  };

  const renderSaasWorkspaceSelector = () => {
    const memberships = normalizeWorkspaceMemberships(state.saas.memberships, state.saas.localTenants);
    state.saas.memberships = memberships;
    if (elements.saasWorkspaceWrap) {
      elements.saasWorkspaceWrap.hidden = !state.saas.enabled;
    }
    if (!elements.topContextWorkspace) {
      return;
    }
    elements.topContextWorkspace.innerHTML = "";
    memberships.forEach((membership) => {
      const option = document.createElement("option");
      option.value = String(membership.tenant_id || "");
      option.textContent = getWorkspaceDisplayName(membership);
      elements.topContextWorkspace.appendChild(option);
    });
    if (state.saas.selectedTenantId) {
      elements.topContextWorkspace.value = state.saas.selectedTenantId;
    }
    elements.topContextWorkspace.disabled = memberships.length <= 1;
    if (elements.topbarWorkspaceName) {
      const selected = memberships.find(
        (membership) => String(membership.tenant_id || "") === String(state.saas.selectedTenantId || "")
      );
      elements.topbarWorkspaceName.textContent = getWorkspaceDisplayName(selected);
    }
    renderSaasAccessActions();
  };

  const getSaasErrorStatus = (errorLike) => {
    const code = String(errorLike?.code || "").toLowerCase();
    if (code === "token_invalid") {
      return "unauthenticated";
    }
    if (code === "membership_missing") {
      return "no_workspace";
    }
    if (code === "tenant_required") {
      return "no_tenant";
    }
    if (code === "workspace_not_ready") {
      return "workspace_not_ready";
    }
    if (code === "entitlement_missing") {
      return "not_entitled";
    }
    if (code === "entitlement_suspended") {
      return "suspended";
    }
    if (code === "past_due") {
      return "past_due";
    }
    const text = String(errorLike?.message || errorLike || "").toLowerCase();
    if (text.includes("unauthorized") || text.includes("missing saas bearer token")) {
      return "unauthenticated";
    }
    if (text.includes("workspace") && text.includes("not ready")) {
      return "workspace_not_ready";
    }
    if (text.includes("workspace") && text.includes("not enabled")) {
      return "not_entitled";
    }
    if (text.includes("no workspace")) {
      return "no_workspace";
    }
    if (text.includes("tenant")) {
      return "no_tenant";
    }
    return "api_failure";
  };

  const initDashboardSaasRuntime = async () => {
    let clientConfig = null;
    try {
      clientConfig = await fetchJson(`${API_BASE}/admin/saas/client-config`);
    } catch (err) {
      clientConfig = null;
    }

    const cfg = resolveAdminConfig();
    if (clientConfig && typeof clientConfig === "object") {
      cfg.saasEnabled = Boolean(clientConfig.enabled);
      cfg.saasCoreBaseUrl = String(clientConfig.saas_base_url || "");
      window.OnlineChatAdminConfig = cfg;
    }

    state.saas.enabled = Boolean(
      clientConfig && clientConfig.enabled !== undefined
        ? clientConfig.enabled
        : state.saas.enabled || isSaasEnabledByConfig()
    );
    state.saas.plans = [];
    renderSaasWorkspaceSelector();

    if (!state.saas.enabled) {
      setSaasAccessState("ready", "");
      return true;
    }

    // Cookie-based SaaS auth — ensureAuth() validates the session cookie
    setSaasAccessState("ready", "");
    return true;
  };

  const validateSelectedWorkspace = async (tenantId) => {
    const selected = String(tenantId || "").trim();
    const previousTenantId = String(state.saas.selectedTenantId || "").trim();
    const selectedMembership =
      (Array.isArray(state.saas.memberships) ? state.saas.memberships : []).find(
        (membership) => String(membership?.tenant_id || "") === selected
      ) || null;
    if (!selected) {
      state.saas.plans = [];
      hideSaasOnboardingBanner();
      setSaasAccessState("no_tenant", "Select a workspace to continue.");
      return false;
    }
    setSaasTenantId(selected, false);
    renderSaasWorkspaceSelector();
    try {
      await syncWorkspaceAccess(selected);
      setSaasTenantId(selected, true);
      renderSaasWorkspaceSelector();
      const overviewPayload = await fetchJson(
        `${API_BASE}/admin/saas/tenants/${encodeURIComponent(selected)}/overview`
      );
      const overview =
        overviewPayload?.overview && typeof overviewPayload.overview === "object"
          ? overviewPayload.overview
          : {};
      const products = Array.isArray(overview.products) ? overview.products : [];
      const productKey = String(state.saas?.productKey || "chat_widget").trim().toLowerCase();
      const productSummary =
        products.find(
          (item) => String(item?.product_key || "").trim().toLowerCase() === productKey
        ) || products[0] || null;

      state.saas.overview = overview;
      state.saas.summary = productSummary;
      state.saas.plans = Array.isArray(productSummary?.plans)
        ? productSummary.plans.map((plan) => ({
            ...plan,
            is_trial:
              Number(plan?.trial_days || 0) > 0 ||
              String(plan?.plan_key || "").trim().toLowerCase() === "trial"
          }))
        : [];
      state.saas.productEnabled = Boolean(productSummary) && String(productSummary?.customer_state || "") !== "no_access";
      state.saas.entitlements = productSummary || null;
      state.saas.workspaceReady = String(productSummary?.setup_state || "") === "ready";
      state.saas.workspaceReason = String(productSummary?.display_message || "").trim();

      const customerState = String(productSummary?.customer_state || "no_access").trim().toLowerCase();
      const setupState = String(productSummary?.setup_state || "not_started").trim().toLowerCase();
      const displayMessage = resolveSaasStatusMessage({
        surface: "banner",
        role: selectedMembership?.role || "",
        customerState,
        nextAction: String(productSummary?.next_action || "").trim().toLowerCase(),
        displayMessage: state.saas.workspaceReason || "",
        periodEndText: ""
      });

      if (!productSummary || customerState === "no_access") {
        hideSaasOnboardingBanner();
        setSaasAccessState("not_entitled", displayMessage);
        return false;
      }

      if (customerState === "payment_required") {
        hideSaasOnboardingBanner();
        setSaasAccessState("past_due", displayMessage);
        return false;
      }

      if (customerState === "suspended" || customerState === "archived") {
        hideSaasOnboardingBanner();
        setSaasAccessState("suspended", displayMessage);
        return false;
      }

      if (customerState === "setup_in_progress" || setupState !== "ready") {
        hideSaasOnboardingBanner();
        setSaasAccessState("workspace_not_ready", displayMessage);
        return false;
      }

      renderSaasOnboardingBanner();
      setSaasAccessState("ready", "");
      return true;
    } catch (err) {
      setSaasTenantId(previousTenantId, false);
      renderSaasWorkspaceSelector();
      state.saas.plans = [];
      hideSaasOnboardingBanner();
      const status = getSaasErrorStatus(err);
      const fallbackMessage =
        status === "unauthenticated"
          ? "SaaS session is missing or expired. Sign in again."
          : status === "suspended"
            ? resolveSaasStatusMessage({ surface: "banner", role: selectedMembership?.role || "", customerState: "suspended" })
            : status === "past_due"
              ? resolveSaasStatusMessage({ surface: "banner", role: selectedMembership?.role || "", customerState: "payment_required" })
            : status === "not_entitled"
              ? resolveSaasStatusMessage({ surface: "banner", role: selectedMembership?.role || "", customerState: "no_access" })
              : status === "no_workspace"
              ? "No workspace access yet."
                : status === "no_tenant"
                ? "Select a workspace to continue."
                : status === "workspace_not_ready"
                  ? resolveSaasStatusMessage({ surface: "banner", role: selectedMembership?.role || "", customerState: "setup_in_progress" })
                  : "Failed to load workspace access. Retry in a moment.";
      setSaasAccessState(status, err?.reason || err?.message || fallbackMessage);
      return false;
    }
  };

  const initSaasWorkspace = async () => {
    if (!state.saas.enabled) {
      state.saas.plans = [];
      setSaasAccessState("ready", "");
      renderSaasWorkspaceSelector();
      return true;
    }
    try {
      const bootstrap = await fetchJson(`${API_BASE}/admin/saas/bootstrap`);
      if (!bootstrap?.enabled) {
        state.saas.enabled = false;
        state.saas.plans = [];
        setSaasAccessState("ready", "");
        renderSaasWorkspaceSelector();
        return true;
      }
      const localTenants = Array.isArray(bootstrap.local_tenants) ? bootstrap.local_tenants : [];
      const memberships = normalizeWorkspaceMemberships(bootstrap.memberships, localTenants);
      state.saas.user = bootstrap.user || null;
      state.saas.localTenants = localTenants;
      state.saas.memberships = memberships;
      if (!memberships.length) {
        state.saas.plans = [];
        hideSaasOnboardingBanner();
        renderSaasWorkspaceSelector();
        setSaasAccessState("no_workspace", "No workspace access yet.");
        return false;
      }
      const storedTenantId = window.OnlineChatAdmin?.getSelectedSaasTenantId?.() || "";
      const bootstrapTenantId = String(bootstrap.selected_tenant_id || "").trim();
      const selectedTenantId = workspaceContext.selectPreferredWorkspaceTenant({
        memberships,
        storedTenantId,
        bootstrapTenantId
      });
      setSaasTenantId(selectedTenantId || "", true);
      renderSaasWorkspaceSelector();
      return validateSelectedWorkspace(selectedTenantId || "");
    } catch (err) {
      state.saas.plans = [];
      hideSaasOnboardingBanner();
      const status = getSaasErrorStatus(err);
      const message =
        status === "unauthenticated"
          ? "SaaS session is missing or expired. Sign in again."
          : "Failed to load workspace bootstrap from SaaS Core.";
      setSaasAccessState(status, err?.message || message);
      renderSaasWorkspaceSelector();
      return false;
    }
  };

  if (elements.emojiPanel) {
    elements.emojiPanel.hidden = true;
    elements.emojiPanel.classList.remove("is-open");
    elements.emojiPanel.innerHTML = "";
    const emojiList = [
      0x1f600, 0x1f601, 0x1f602, 0x1f60a, 0x1f60d,
      0x1f44d, 0x1f44f, 0x1f64f, 0x1f389, 0x2705,
      0x1f680, 0x1f4e6, 0x1f4de, 0x1f4ac, 0x2764,
      0x2b50
    ];
    emojiList.forEach((code) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = String.fromCodePoint(code);
      elements.emojiPanel.appendChild(btn);
    });
  }

  if (!elements.chatCompany && elements.chatDetailsForm) {
    const grid = elements.chatDetailsForm.querySelector(".details-grid");
    const phoneField = grid ? grid.querySelector("#chat-phone") : null;
    if (grid) {
      const wrapper = document.createElement("div");
      const label = document.createElement("label");
      label.className = "field-label";
      label.setAttribute("for", "chat-company");
      label.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 10h16v8H4v-8zM7 10V6h10v4" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
        </svg>
        <span class="sr-only">Company</span>
      `;
      const input = document.createElement("input");
      input.id = "chat-company";
      input.type = "text";
      input.placeholder = "Company";
      wrapper.appendChild(label);
      wrapper.appendChild(input);
      if (phoneField && phoneField.parentElement === grid) {
        grid.insertBefore(wrapper, phoneField.parentElement);
      } else {
        grid.appendChild(wrapper);
      }
      elements.chatCompany = input;
    }
  }

  const enableSound = () => {
    state.canPlaySound = true;
  };

  document.addEventListener("pointerdown", enableSound, { once: true });
  document.addEventListener("keydown", enableSound, { once: true });

  const ensureAuth = async () => {
    try {
      const data = await fetchJson(`${API_BASE}/admin/me`);
      applyCurrentUser(data.user);
    } catch (err) {
      window.location.href = "index.html";
    }
  };

  const setView = (view) => {
    state.activeView = view;
    elements.views.forEach((section) => {
      section.classList.toggle("active", section.dataset.view === view);
    });
    elements.navButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.view === view);
    });
    if (view === "dashboard") {
      safeCall("analytics", loadAnalytics);
    }
    if (view === "ai") {
      safeCall("ai faqs", loadAiFaqs);
      safeCall("ai docs", loadAiDocs);
      safeCall("ai fine-tunes", loadAiFineTunes);
    }
  };

  const updateAiStatus = (enabled) => {
    const label = enabled ? "On" : "Off";
    [elements.aiStatus, elements.aiStatusPanel].forEach((el) => {
      if (!el) {
        return;
      }
      el.textContent = label;
      el.classList.toggle("is-online", enabled);
    });
  };

  const setAiEnabled = (enabled) => {
    if (elements.aiToggle) {
      elements.aiToggle.checked = enabled;
    }
    if (elements.aiTogglePanel) {
      elements.aiTogglePanel.checked = enabled;
    }
    updateAiStatus(enabled);
  };

  const updateTenantState = (companyId, websiteId) => {
    const nextCompany = Number(companyId || 0);
    const nextWebsite = Number(websiteId || 0);
    state.currentCompanyId = nextCompany;
    state.currentWebsiteId = nextWebsite;
    localStorage.setItem("oc_current_company_id", String(nextCompany || ""));
    localStorage.setItem("oc_current_website_id", String(nextWebsite || ""));
    const site = state.websites.find((item) => Number(item.id) === nextWebsite);
    state.currentWebsiteKey = site?.widget_key || "";
    if (state.currentWebsiteKey) {
      localStorage.setItem("oc_current_website_key", state.currentWebsiteKey);
    } else {
      localStorage.removeItem("oc_current_website_key");
    }
  };

  const setWizardStep = (step) => {
    if (!elements.wizardSteps || !elements.wizardPanels) {
      return;
    }
    const allowStep2 = Boolean(wizardCompanyId || state.currentCompanyId);
    elements.wizardSteps.forEach((button) => {
      const buttonStep = Number(button.dataset.step || 0);
      if (buttonStep === 2) {
        button.disabled = !allowStep2;
      }
      button.classList.toggle("is-active", buttonStep === step);
    });
    elements.wizardPanels.forEach((panel) => {
      const panelStep = Number(panel.dataset.step || 0);
      panel.classList.toggle("is-active", panelStep === step);
    });
  };

  const openWizardModal = (step, companyId) => {
    if (!elements.companyWizardModal) {
      return;
    }
    wizardCompanyId = Number(companyId || 0);
    elements.companyWizardModal.hidden = false;
    if (elements.wizardResult) {
      elements.wizardResult.hidden = true;
    }
    if (elements.wizardWebsiteKey) {
      elements.wizardWebsiteKey.textContent = "";
    }
    if (elements.wizardCompanyForm && step === 1) {
      elements.wizardCompanyForm.reset();
    }
    if (elements.wizardWebsiteForm) {
      elements.wizardWebsiteForm.reset();
    }
    setWizardStep(step);
  };

  const closeWizardModal = () => {
    if (!elements.companyWizardModal) {
      return;
    }
    elements.companyWizardModal.hidden = true;
  };

  const confirmCompanySwitch = () => {
    if (
      !state.settingsDirty &&
      !state.companyDirty &&
      !state.aiSettingsDirty &&
      !state.aiKnowledgeDirty
    ) {
      return true;
    }
    return window.confirm("You have unsaved changes. Switch company anyway?");
  };

  const normalizeWorkspaceMemberships = (memberships = [], localTenants = state.saas.localTenants) =>
    workspaceContext.decorateWorkspaceMemberships(memberships, localTenants);

  const syncTopbarCompanyName = () => {
    if (!elements.topbarCompanyName) {
      return;
    }
    const company =
      state.companies.find((item) => Number(item.id) === Number(state.currentCompanyId || 0)) || null;
    elements.topbarCompanyName.textContent = company?.name || "Select company";
  };

  const renderContextSelectors = () => {
    const companySelectors = [elements.contextCompany, elements.topContextCompany].filter(Boolean);
    companySelectors.forEach((select) => {
      select.innerHTML = "";
      state.companies.forEach((company) => {
        const option = document.createElement("option");
        option.value = String(company.id);
        option.textContent = company.name;
        select.appendChild(option);
      });
      if (state.currentCompanyId) {
        select.value = String(state.currentCompanyId);
      }
    });
    syncTopbarCompanyName();
    if (elements.contextWebsite) {
      elements.contextWebsite.innerHTML = "";
      state.websites.forEach((site) => {
        const option = document.createElement("option");
        option.value = String(site.id);
        option.textContent = site.name;
        elements.contextWebsite.appendChild(option);
      });
      if (state.currentWebsiteId) {
        elements.contextWebsite.value = String(state.currentWebsiteId);
      }
    }
  };

  const switchCompanyContext = async (companyId) => {
    const nextCompanyId = Number(companyId || 0);
    if (!nextCompanyId || nextCompanyId === state.currentCompanyId) {
      return;
    }
    if (!confirmCompanySwitch()) {
      renderContextSelectors();
      return;
    }
    resetAlertState({ clearBanner: true });
    updateTenantState(nextCompanyId, 0);
    await loadWebsites(nextCompanyId);
    const websiteId = state.websites[0]?.id || 0;
    updateTenantState(nextCompanyId, websiteId);
    renderCompanies();
    renderContextSelectors();
    updateEmbedInputs();
    updateEmbedCode();
    if (typeof syncTenantEditors === "function") {
      syncTenantEditors();
    }
    await loadSettingsWithLocal();
    loadAiBehaviorState();
    await refreshAll();
    state.companyDirty = false;
    if (elements.companySaveStatus) {
      elements.companySaveStatus.textContent = "";
      elements.companySaveStatus.classList.remove("is-saved");
    }
  };

  const switchWorkspaceContext = async (tenantId) => {
    const nextTenantId = String(tenantId || "").trim();
    if (!nextTenantId || nextTenantId === String(state.saas.selectedTenantId || "")) {
      return;
    }
    resetAlertState({ clearBanner: true });
    setSaasTenantId(nextTenantId, true);
    const isReady = await validateSelectedWorkspace(nextTenantId);
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
      state.pollTimer = null;
    }
    if (!isReady) {
      resetWorkspaceScopedState();
      renderContextSelectors();
      return;
    }
    await initTenantContext();
    setView(state.activeView);
    await loadSettingsWithLocal();
    loadAiBehaviorState();
    await refreshAll();
    startPolling();
  };

  const initTenantContext = async () => {
    await loadCompanies();
    if (!state.companies.length) {
      openWizardModal(1, 0);
    }
    const companyIds = state.companies.map((company) => Number(company.id));
    const companyId = companyIds.includes(state.currentCompanyId)
      ? state.currentCompanyId
      : companyIds[0] || 0;
    if (companyId) {
      updateTenantState(companyId, state.currentWebsiteId);
    }
    await loadWebsites(companyId);
    const websiteIds = state.websites.map((site) => Number(site.id));
    const websiteId = websiteIds.includes(state.currentWebsiteId)
      ? state.currentWebsiteId
      : websiteIds[0] || 0;
    if (companyId && websiteId) {
      updateTenantState(companyId, websiteId);
    }
    renderContextSelectors();
    updateEmbedInputs();
    updateEmbedCode();
    if (typeof syncTenantEditors === "function") {
      syncTenantEditors();
    }
  };

  const {
    showToast,
    playSound,
    showDesktopNotification,
    updateFaviconBadge,
    showAlertBanner,
    setSignal,
    setDetailsDrawer,
    toggleDetailsDrawer
  } = window.dashboardUiUtils;

  const sendTypingState = async (chatId, isTyping, force = false) => {
    if (!chatId) {
      return;
    }
    const now = Date.now();
    if (!isTyping && typingChatId === chatId && !typingActive) {
      return;
    }
    if (isTyping && !force && now - typingLastSent < 900) {
      return;
    }
    typingChatId = chatId;
    typingActive = isTyping;
    if (isTyping) {
      typingLastSent = now;
    }
    try {
      await fetchJson(`${API_BASE}/admin/chats/${chatId}/typing`, {
        method: "POST",
        body: JSON.stringify({ is_typing: isTyping })
      });
    } catch (err) {
      return;
    }
  };

  const scheduleTypingStop = (chatId) => {
    if (typingTimer) {
      clearTimeout(typingTimer);
    }
    typingTimer = setTimeout(() => {
      sendTypingState(chatId, false);
    }, 4000);
  };

  const stopTyping = (chatId) => {
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimer = null;
    }
    if (typingActive && chatId) {
      sendTypingState(chatId, false, true);
    }
  };

  const getCompanyLocalKey = (suffix) => {
    const companyId = Number(state.currentCompanyId || 0);
    if (!companyId) {
      return "";
    }
    return `oc_company_${companyId}_${suffix}`;
  };

  const syncHandoverNever = () => {
    if (!elements.handoverNever) {
      return;
    }
    const neverChecked = elements.handoverNever.checked;
    [elements.handoverLead, elements.handoverPrice, elements.handoverHuman].forEach((input) => {
      if (!input) {
        return;
      }
      if (neverChecked) {
        input.checked = false;
      }
      input.disabled = Boolean(neverChecked);
    });
  };

  const loadCompanyLocalSettings = () => {
    if (!elements.companyPurpose && !elements.handoverLead && !elements.handoverNever) {
      return;
    }
    const purposeKey = getCompanyLocalKey("purpose");
    const handoffKey = getCompanyLocalKey("handover");
    const defaultPurpose = "mixed";
    const defaultHandover = ["human"];
    const purposeValue = purposeKey ? localStorage.getItem(purposeKey) || defaultPurpose : defaultPurpose;
    if (elements.companyPurpose) {
      elements.companyPurpose.value = purposeValue;
    }
    let handover = defaultHandover;
    if (handoffKey) {
      try {
        const stored = JSON.parse(localStorage.getItem(handoffKey) || "[]");
        handover = Array.isArray(stored) && stored.length ? stored : defaultHandover;
      } catch (err) {
        handover = defaultHandover;
      }
    }
    if (elements.handoverLead) {
      elements.handoverLead.checked = handover.includes("lead");
    }
    if (elements.handoverPrice) {
      elements.handoverPrice.checked = handover.includes("price");
    }
    if (elements.handoverHuman) {
      elements.handoverHuman.checked = handover.includes("human");
    }
    if (elements.handoverNever) {
      elements.handoverNever.checked = handover.includes("never");
    }
    syncHandoverNever();
  };

  const saveCompanyLocalSettings = () => {
    const companyId = Number(state.currentCompanyId || 0);
    if (!companyId) {
      return;
    }
    const purposeKey = getCompanyLocalKey("purpose");
    const handoffKey = getCompanyLocalKey("handover");
    if (purposeKey && elements.companyPurpose) {
      localStorage.setItem(purposeKey, elements.companyPurpose.value || "mixed");
    }
    if (handoffKey) {
      const handover = [];
      if (elements.handoverNever && elements.handoverNever.checked) {
        handover.push("never");
      } else {
        if (elements.handoverLead && elements.handoverLead.checked) {
          handover.push("lead");
        }
        if (elements.handoverPrice && elements.handoverPrice.checked) {
          handover.push("price");
        }
        if (elements.handoverHuman && elements.handoverHuman.checked) {
          handover.push("human");
        }
      }
      if (!handover.length) {
        handover.push("human");
      }
      localStorage.setItem(handoffKey, JSON.stringify(handover));
    }
  };

  let popupActionDraft = [];

  const normalizePopupActions = (value) => {
    const rawItems = Array.isArray(value)
      ? value
      : String(value || "")
          .split(/\r?\n|,/g)
          .map((item) => item.trim());
    const unique = new Set();
    const normalized = [];
    rawItems.forEach((item) => {
      const text = String(item || "").trim().slice(0, 80);
      if (!text) {
        return;
      }
      const key = text.toLowerCase();
      if (unique.has(key)) {
        return;
      }
      unique.add(key);
      normalized.push(text);
    });
    return normalized.slice(0, 6);
  };

  const parsePopupActions = (value) => {
    if (value === undefined || value === null || value === "") {
      return [];
    }
    if (Array.isArray(value)) {
      return normalizePopupActions(value);
    }
    const raw = String(value).trim();
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return normalizePopupActions(parsed);
    } catch (err) {
      return normalizePopupActions(raw);
    }
  };

  const renderPopupActionDraft = () => {
    if (!elements.popupActionList) {
      return;
    }
    elements.popupActionList.innerHTML = "";
    if (!popupActionDraft.length) {
      elements.popupActionList.innerHTML = "<span class='chat-meta'>No quick reply buttons yet.</span>";
      return;
    }
    popupActionDraft.forEach((text, index) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "popup-action-chip";
      const label = document.createElement("span");
      label.textContent = text;
      const remove = document.createElement("span");
      remove.textContent = "\u00d7";
      remove.setAttribute("aria-hidden", "true");
      chip.appendChild(label);
      chip.appendChild(remove);
      chip.setAttribute("aria-label", `Remove quick reply ${text}`);
      chip.addEventListener("click", () => {
        popupActionDraft = popupActionDraft.filter((_, itemIndex) => itemIndex !== index);
        if (elements.popupActionsJson) {
          elements.popupActionsJson.value = popupActionDraft.length
            ? JSON.stringify(popupActionDraft)
            : "";
        }
        renderPopupActionDraft();
      });
      elements.popupActionList.appendChild(chip);
    });
  };

  const setPopupActionDraft = (value) => {
    popupActionDraft = parsePopupActions(value);
    if (elements.popupActionsJson) {
      elements.popupActionsJson.value = popupActionDraft.length ? JSON.stringify(popupActionDraft) : "";
    }
    renderPopupActionDraft();
  };

  const addPopupActionFromInput = () => {
    if (!elements.popupActionInput) {
      return;
    }
    const value = String(elements.popupActionInput.value || "").trim().slice(0, 80);
    if (!value) {
      return;
    }
    popupActionDraft = normalizePopupActions([...popupActionDraft, value]);
    if (elements.popupActionsJson) {
      elements.popupActionsJson.value = popupActionDraft.length ? JSON.stringify(popupActionDraft) : "";
    }
    elements.popupActionInput.value = "";
    renderPopupActionDraft();
  };

  const applyPopupPreset = (preset) => {
    if (!elements.popupForm) {
      return;
    }
    const popupName = elements.popupForm.querySelector("#popup-name");
    const popupMessage = elements.popupForm.querySelector("#popup-message");
    const popupMatch = elements.popupForm.querySelector("#popup-match");
    const popupValue = elements.popupForm.querySelector("#popup-value");
    const popupStatus = elements.popupForm.querySelector("#popup-status");
    const popupVisitor = elements.popupForm.querySelector("#popup-visitor");
    const popupDelay = elements.popupForm.querySelector("#popup-delay");
    const setValue = (input, value) => {
      if (input && value !== undefined) {
        input.value = value;
      }
    };
    const presets = {
      pricing: {
        name: "Pricing page helper",
        message: "Have a pricing question? We can help you quickly.",
        popup_actions: ["Show prices", "Get a quick quote", "Talk to sales"],
        match_type: "contains",
        match_value: "/pricing",
        audience_status: "any",
        audience_returning: "any",
        delay_seconds: "6"
      },
      welcome: {
        name: "Welcome message",
        message: "Hi! Let us know if you need any help.",
        popup_actions: ["Show services", "Ask a question", "Talk to agent"],
        match_type: "contains",
        match_value: "/",
        audience_status: "any",
        audience_returning: "first",
        delay_seconds: "4"
      },
      exit: {
        name: "Exit intent",
        message: "Before you go, need help or a quick quote?",
        popup_actions: ["Get a quote", "Talk to sales", "Send us a message"],
        match_type: "contains",
        match_value: "/",
        audience_status: "any",
        audience_returning: "any",
        delay_seconds: "12"
      }
    };
    if (!presets[preset]) {
      if (preset === "custom") {
        setPopupActionDraft([]);
      }
      return;
    }
    const data = presets[preset];
    setValue(popupName, data.name);
    setValue(popupMessage, data.message);
    setValue(popupMatch, data.match_type);
    setValue(popupValue, data.match_value);
    setValue(popupStatus, data.audience_status);
    setValue(popupVisitor, data.audience_returning);
    setValue(popupDelay, data.delay_seconds);
    setPopupActionDraft(data.popup_actions || []);
  };

  const normalizePopupLocalePath = (value) => {
    if (value === undefined || value === null) {
      return "";
    }
    let next = String(value).trim().toLowerCase();
    if (!next) {
      return "";
    }
    if (!next.startsWith("/")) {
      next = `/${next}`;
    }
    if (next.length > 1) {
      next = next.replace(/\/+$/, "");
    }
    return next;
  };

  const isPopupLocalePath = (value) => /^\/[a-z]{2}(?:-[a-z]{2})?$/.test(String(value || "").trim());

  const setPopupLanguageControlState = () => {
    if (!elements.popupLanguageTarget || !elements.popupLocale) {
      return;
    }
    const target = elements.popupLanguageTarget.value === "specific" ? "specific" : "all";
    const showSpecific = target === "specific";
    if (elements.popupLanguageSelectWrap) {
      elements.popupLanguageSelectWrap.hidden = !showSpecific;
    }
    if (elements.popupLanguageCustomWrap && elements.popupLanguageCode) {
      elements.popupLanguageCustomWrap.hidden =
        !showSpecific || elements.popupLanguageCode.value !== "custom";
    }
    if (!showSpecific) {
      elements.popupLocale.value = "";
    }
  };

  const syncPopupLocaleFromControls = () => {
    if (!elements.popupLocale) {
      return "";
    }
    if (!elements.popupLanguageTarget) {
      const normalized = normalizePopupLocalePath(elements.popupLocale.value);
      elements.popupLocale.value = normalized;
      return normalized;
    }
    if (elements.popupLanguageTarget.value !== "specific") {
      elements.popupLocale.value = "";
      return "";
    }
    let source = "";
    if (elements.popupLanguageCode && elements.popupLanguageCode.value === "custom") {
      source = elements.popupLanguageCustom ? elements.popupLanguageCustom.value : "";
    } else if (elements.popupLanguageCode) {
      source = elements.popupLanguageCode.value;
    }
    const normalized = normalizePopupLocalePath(source);
    elements.popupLocale.value = normalized;
    return normalized;
  };

  const applyPopupLocaleToControls = (localePath) => {
    if (!elements.popupLanguageTarget || !elements.popupLocale) {
      if (elements.popupLocale) {
        elements.popupLocale.value = normalizePopupLocalePath(localePath);
      }
      return;
    }
    const normalized = normalizePopupLocalePath(localePath);
    if (!normalized) {
      elements.popupLanguageTarget.value = "all";
      if (elements.popupLanguageCode) {
        elements.popupLanguageCode.value = "/en";
      }
      if (elements.popupLanguageCustom) {
        elements.popupLanguageCustom.value = "";
      }
      setPopupLanguageControlState();
      elements.popupLocale.value = "";
      return;
    }

    elements.popupLanguageTarget.value = "specific";
    if (elements.popupLanguageCode) {
      const hasPreset = Array.from(elements.popupLanguageCode.options || []).some(
        (option) => option.value === normalized
      );
      elements.popupLanguageCode.value = hasPreset ? normalized : "custom";
    }
    if (elements.popupLanguageCustom) {
      elements.popupLanguageCustom.value =
        elements.popupLanguageCode && elements.popupLanguageCode.value === "custom" ? normalized : "";
    }
    setPopupLanguageControlState();
    elements.popupLocale.value = normalized;
  };

  const validatePopupLocaleControls = () => {
    const normalized = syncPopupLocaleFromControls();
    if (!normalized) {
      return true;
    }
    if (isPopupLocalePath(normalized)) {
      return true;
    }
    window.alert("Language prefix must look like `/en` or `/en-us`.");
    if (elements.popupLanguageCustom && !elements.popupLanguageCustomWrap?.hidden) {
      elements.popupLanguageCustom.focus();
    }
    return false;
  };

  const setFeedbackDraft = (messageId, patch) => {
    const id = Number(messageId || 0);
    if (!id) {
      return;
    }
    const current = state.feedbackDrafts.get(id) || {};
    state.feedbackDrafts.set(id, { ...current, ...patch });
  };

  const getFeedbackDraft = (messageId) => {
    const id = Number(messageId || 0);
    if (!id) {
      return null;
    }
    return state.feedbackDrafts.get(id) || null;
  };

  const updateFeedbackEditing = () => {
    const active = document.activeElement;
    state.feedbackEditing = Boolean(
      active &&
        active.closest &&
        (active.closest(".ai-feedback") || active.closest("#ai-feedback-modal"))
    );
  };

  const updateDetailsEditing = () => {
    const active = document.activeElement;
    state.detailsEditing = Boolean(active && active.closest && active.closest("#chat-details-form"));
  };

  const {
    formatLocalDateKey,
    getLastDays,
    getISOWeekKey,
    getLastWeeks,
    getLastMonths,
    normalizeBucketKey,
    getAnalyticsBuckets,
    buildSeries,
    formatCount,
    sumValues,
    normalizeAnalyticsRange,
    normalizeAnalyticsGroup,
    normalizeAnalyticsAgent,
    normalizeAnalyticsSort,
    initAnalyticsFilters,
    updateAnalyticsBadges,
    renderInteractionsSummary,
    renderAgentSummary,
    sortAgents,
    prepareCanvas,
    drawAxes,
    drawLineChart,
    drawBarChart,
    drawStackedBarChart,
    truncateLabel,
    drawGroupedBarChart,
    buildSeriesFromKey,
    loadAnalytics,
    loadMetrics,
    renderAnalyticsAgentOptions
  } = createAnalyticsModule({
    state,
    elements,
    fetchJson,
    updateFaviconBadge,
    escapeHtml
  });

  const {
    renderChats,
    setChatDetailsEnabled,
    populateChatDetails,
    saveAiFeedback,
    updateFeedbackToggleState,
    setFeedbackModalState,
    closeAiFeedbackModal,
    getActiveFeedbackId,
    openAiFeedbackModal,
    renderMessages,
    loadChats,
    loadChatAlerts,
    resetAlertState,
    renderAgentOptions,
    renderVisitors,
    renderVisitorFlow,
    selectVisitor,
    loadVisitors,
    initInboxWorkspaceUi,
    bindChatFilters,
    uploadChatFile,
    selectChat,
    saveChatDetails,
    deleteChat,
    sendReply,
    resolveChat
  } = createChatModule({
    state,
    elements,
    fetchJson,
    formatDate,
    formatFileSize,
    formatDuration,
    getHostFromUrl,
    getPathAlias,
    getPathFromUrl,
    escapeHtml,
    showToast,
    playSound,
    showDesktopNotification,
    setView,
    setSignal,
    showAlertBanner,
    setFeedbackDraft,
    getFeedbackDraft,
    updateFeedbackEditing,
    setDetailsDrawer,
    stopTyping
  });

  const {
    openLeadEditor,
    closeLeadEditor,
    saveLead,
    getLeadDateRange,
    normalizeLeadSearch,
    filterLeads,
    renderLeads,
    loadLeads
  } = createLeadsModule({
    state,
    elements,
    fetchJson,
    formatDate,
    loadChats
  });

  const {
    initSettingsTabs,
    updateSoundToggle,
    updateDesktopToggle,
    updatePollSelect,
    requestDesktopPermission,
    getWidgetBaseDefault,
    getEmbedDefaults,
    getEmbedConfig,
    buildEmbedCode,
    updateEmbedInputs,
    updateEmbedCode,
    updateWidgetPreview,
    renderProfileAvatar,
    renderAiAvatar,
    renderProfileMeta,
    applyCurrentUser,
    canManageUsers,
    buildHoursGrid,
    collectHours,
    renderCannedReplies,
    renderCannedSelect,
    loadCannedReplies,
    uploadUserAvatar,
    updateUser,
    renderUsers,
    loadUsers,
    uploadProfileAvatar,
    uploadAiAvatar,
    saveProfile,
    loadMembershipStatus,
    loadSettings,
    persistSettings,
    saveSettings,
    renderPopupRules,
    loadPopupRules,
    renderCompanies,
    renderWebsites,
    loadCompanies,
    loadWebsites,
    createCompany,
    createWebsite,
    syncTenantEditors
  } = createSettingsModule({
    state,
    elements,
    fetchWithAuth,
    fetchJson,
    formatDate,
    clampNumber,
    getInitials,
    setAiEnabled,
    escapeHtml,
    updateTenantState
  });

  const {
    initAiTabs,
    initAiBehavior,
    loadAiBehaviorState,
    initAiKnowledgeBuilder,
    loadAiKnowledge,
    initAiSettingsTracking,
    applyAiPermissions,
    saveAiSettings,
    renderAiFaqs,
    loadAiFaqs,
    renderAiDocs,
    loadAiDocs,
    getFineTuneStatusClass,
    renderAiFineTunes,
    loadAiFineTunes
  } = createAiModule({
    state,
    elements,
    fetchJson,
    clampNumber,
    formatFileSize,
    formatUnixDate,
    truncateText,
    loadSettings,
    escapeHtml
  });

  const loadSettingsWithLocal = async () => {
    await loadSettings();
    loadCompanyLocalSettings();
  };

  const openMembershipSettings = async () => {
    setView("settings");
    const membershipTabButton = document.querySelector("[data-settings-tab='membership']");
    if (membershipTabButton) {
      membershipTabButton.click();
    }
    if (typeof loadMembershipStatus === "function") {
      await loadMembershipStatus({ silent: true });
    }
  };

  const setSaasActionBusy = (busy) => {
    state.saas.actionBusy = Boolean(busy);
    renderSaasAccessActions();
  };

  const resolveTopbarPlanKey = (button, fallbackPaidPlan = null) => {
    const fromButton = String(button?.dataset?.planKey || "").trim();
    if (fromButton) {
      return fromButton;
    }
    const fallback = String(fallbackPaidPlan?.plan_key || "").trim();
    if (fallback) {
      return fallback;
    }
    return "";
  };

  const createSaasCheckoutSession = async (tenantId, planKey) => {
    const response = await fetchJson(
      `${API_BASE}/admin/saas/tenants/${encodeURIComponent(tenantId)}/checkout-session`,
      {
        method: "POST",
        body: JSON.stringify({ plan_key: planKey })
      }
    );
    const url = String(response?.url || "").trim();
    if (!url) {
      throw new Error("Checkout URL was not returned");
    }
    return url;
  };

  const runSaasAction = async (action) => {
    if (state.saas.actionBusy) {
      return;
    }
    const status = String(state.saas.status || "ready");
    if (status === "unauthenticated") {
      window.location.href = "index.html";
      return;
    }
    const tenantId = String(state.saas.selectedTenantId || "").trim();
    const selectedMembership = getSelectedMembership();
    const isOwner = isOwnerMembershipRole(selectedMembership?.role || "");
    const paidPlan = pickSaasUpgradePlan(
      state.saas.plans,
      state.saas.summary?.current_plan_key || state.saas.summary?.plan_key || ""
    );

    if (action !== "open" && !tenantId) {
      throw new Error("Select a workspace first.");
    }
    if (["trial", "upgrade", "billing"].includes(action) && !isOwner) {
      throw new Error("Only workspace owner/admin can manage billing or trial actions.");
    }

    setSaasActionBusy(true);
    try {
      if (action === "open") {
        await openMembershipSettings();
        return;
      }
      if (action === "refresh") {
        await validateSelectedWorkspace(tenantId);
        return;
      }
      if (action === "install") {
        openDeveloperSettings();
        return;
      }
      if (action === "trial") {
        await fetchJson(`${API_BASE}/admin/saas/tenants/${encodeURIComponent(tenantId)}/trial`, {
          method: "POST",
          body: JSON.stringify({})
        });
        await validateSelectedWorkspace(tenantId);
        await openMembershipSettings();
        return;
      }
      if (action === "upgrade" || action === "billing") {
        if (action === "billing") {
          await openSaasCustomerPortal(tenantId);
          return;
        }
        const planKey = resolveTopbarPlanKey(elements.saasAccessUpgrade, paidPlan);
        if (!planKey) {
          throw new Error("No plan available for checkout.");
        }
        const checkoutUrl = await createSaasCheckoutSession(tenantId, planKey);
        window.location.href = checkoutUrl;
      }
    } finally {
      setSaasActionBusy(false);
    }
  };

  initSettingsTabs();

  const loadAgents = async () => {
    const data = await fetchJson(`${API_BASE}/admin/agents`);
    state.agents = data.agents || [];
    renderAgentOptions();
    renderAnalyticsAgentOptions();
  };

  const safeCall = async (label, fn) => {
    if (state.saas.enabled && !state.saas.ready) {
      return;
    }
    try {
      await fn();
    } catch (err) {
      console.warn(`OnlineChat admin ${label} failed`, err);
    }
  };

  const refreshAll = async () => {
    if (state.saas.enabled && !state.saas.ready) {
      return;
    }
    await safeCall("chat alerts", loadChatAlerts);
    if (!state.currentCompanyId || !state.currentWebsiteId) {
      return;
    }
    await safeCall("metrics", loadMetrics);
    await safeCall("chats", loadChats);
    await safeCall("leads", loadLeads);
    await safeCall("popup rules", loadPopupRules);
    await safeCall("agents", loadAgents);
    await safeCall("canned replies", loadCannedReplies);
    if (canManageUsers()) {
      await safeCall("users", loadUsers);
    }
    await safeCall("visitors", loadVisitors);
    await safeCall("ai faqs", loadAiFaqs);
    await safeCall("ai docs", loadAiDocs);
    await safeCall("ai knowledge", loadAiKnowledge);
    await safeCall("analytics", loadAnalytics);
  };

  const setPollInterval = (value) => {
    const next = Number(value || 5000);
    if (!Number.isFinite(next) || next < 3000) {
      return;
    }
    state.pollIntervalMs = next;
    localStorage.setItem("oc_poll_interval_ms", String(next));
    startPolling();
  };

  const startPolling = () => {
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
    }
    if (state.saas.enabled && !state.saas.ready) {
      return;
    }
    state.pollTimer = setInterval(async () => {
      updateFeedbackEditing();
      updateDetailsEditing();
      await safeCall("chat alerts", loadChatAlerts);
      if (!state.currentCompanyId || !state.currentWebsiteId) {
        return;
      }
      await safeCall("metrics", loadMetrics);
      await safeCall("chats", loadChats);
      await safeCall("visitors", loadVisitors);
      if (state.activeChatId && !state.feedbackEditing && !state.detailsEditing) {
        await safeCall("chat messages", () =>
          selectChat(state.activeChatId, { preserveScroll: true })
        );
      }
    }, state.pollIntervalMs);
  };

  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });
  if (elements.contextCompany) {
    elements.contextCompany.addEventListener("change", async () => {
      const companyId = Number(elements.contextCompany.value || 0);
      await switchCompanyContext(companyId);
    });
  }
  if (elements.topContextCompany) {
    elements.topContextCompany.addEventListener("change", async () => {
      const companyId = Number(elements.topContextCompany.value || 0);
      await switchCompanyContext(companyId);
    });
  }
  if (elements.topContextWorkspace) {
    elements.topContextWorkspace.addEventListener("change", async () => {
      await switchWorkspaceContext(elements.topContextWorkspace.value || "");
    });
  }
  if (elements.saasAccessOpenMembership) {
    elements.saasAccessOpenMembership.addEventListener("click", async () => {
      try {
        await runSaasAction(elements.saasAccessOpenMembership?.dataset?.action || "open");
      } catch (err) {
        setSaasAccessState(state.saas.status || "api_failure", err?.message || "Failed to open membership details.");
      }
    });
  }
  if (elements.saasAccessStartTrial) {
    elements.saasAccessStartTrial.addEventListener("click", async () => {
      try {
        await runSaasAction(elements.saasAccessStartTrial?.dataset?.action || "trial");
      } catch (err) {
        setSaasAccessState(state.saas.status || "api_failure", err?.message || "Failed to run workspace action.");
      }
    });
  }
  if (elements.saasAccessUpgrade) {
    elements.saasAccessUpgrade.addEventListener("click", async () => {
      try {
        await runSaasAction(elements.saasAccessUpgrade?.dataset?.action || "upgrade");
      } catch (err) {
        setSaasAccessState(state.saas.status || "api_failure", err?.message || "Failed to open checkout.");
      }
    });
  }
  if (elements.saasAccessBilling) {
    elements.saasAccessBilling.addEventListener("click", async () => {
      try {
        await runSaasAction(elements.saasAccessBilling?.dataset?.action || "billing");
      } catch (err) {
        setSaasAccessState(state.saas.status || "api_failure", err?.message || "Failed to open billing.");
      }
    });
  }
  if (elements.saasOnboardingMembership) {
    elements.saasOnboardingMembership.addEventListener("click", async () => {
      await openMembershipSettings();
    });
  }
  if (elements.saasOnboardingInstall) {
    elements.saasOnboardingInstall.addEventListener("click", () => {
      openDeveloperSettings();
    });
  }
  if (elements.saasOnboardingDismiss) {
    elements.saasOnboardingDismiss.addEventListener("click", () => {
      clearPostLoginOnboarding();
      hideSaasOnboardingBanner();
    });
  }
  if (elements.contextWebsite) {
    elements.contextWebsite.addEventListener("change", async () => {
      const websiteId = Number(elements.contextWebsite.value || 0);
      if (!state.currentCompanyId || !websiteId) {
        return;
      }
      updateTenantState(state.currentCompanyId, websiteId);
      renderContextSelectors();
      updateEmbedInputs();
      updateEmbedCode();
      if (typeof syncTenantEditors === "function") {
        syncTenantEditors();
      }
      await loadSettingsWithLocal();
      loadAiBehaviorState();
      await refreshAll();
      state.companyDirty = false;
      if (elements.companySaveStatus) {
        elements.companySaveStatus.textContent = "";
        elements.companySaveStatus.classList.remove("is-saved");
      }
    });
  }
  elements.soundToggle.addEventListener("click", () => {
    state.canPlaySound = true;
    state.soundEnabled = !state.soundEnabled;
    localStorage.setItem("oc_sound_enabled", state.soundEnabled ? "true" : "false");
    updateSoundToggle();
  });
  if (elements.analyticsRange) {
    elements.analyticsRange.addEventListener("change", () => {
      state.analyticsRangeDays = normalizeAnalyticsRange(elements.analyticsRange.value);
      localStorage.setItem("oc_analytics_range_days", String(state.analyticsRangeDays));
      updateAnalyticsBadges();
      safeCall("analytics", loadAnalytics);
    });
  }
  if (elements.analyticsGroup) {
    elements.analyticsGroup.addEventListener("change", () => {
      state.analyticsGroupBy = normalizeAnalyticsGroup(elements.analyticsGroup.value);
      localStorage.setItem("oc_analytics_group_by", state.analyticsGroupBy);
      updateAnalyticsBadges();
      safeCall("analytics", loadAnalytics);
    });
  }
  if (elements.analyticsAgent) {
    elements.analyticsAgent.addEventListener("change", () => {
      state.analyticsAgentId = normalizeAnalyticsAgent(elements.analyticsAgent.value);
      localStorage.setItem("oc_analytics_agent_id", String(state.analyticsAgentId));
      safeCall("analytics", loadAnalytics);
    });
  }
  if (elements.analyticsSort) {
    elements.analyticsSort.addEventListener("change", () => {
      state.analyticsAgentSort = normalizeAnalyticsSort(elements.analyticsSort.value);
      localStorage.setItem("oc_analytics_agent_sort", state.analyticsAgentSort);
      safeCall("analytics", loadAnalytics);
    });
  }
  if (elements.settingsSound) {
    elements.settingsSound.addEventListener("change", () => {
      state.canPlaySound = true;
      state.soundEnabled = elements.settingsSound.checked;
      localStorage.setItem("oc_sound_enabled", state.soundEnabled ? "true" : "false");
      updateSoundToggle();
    });
  }
  if (elements.settingsDesktop) {
    elements.settingsDesktop.addEventListener("change", async () => {
      if (elements.settingsDesktop.checked) {
        const granted = await requestDesktopPermission();
        if (!granted) {
          elements.settingsDesktop.checked = false;
          state.desktopEnabled = false;
          localStorage.setItem("oc_desktop_enabled", "false");
          return;
        }
      }
      state.desktopEnabled = elements.settingsDesktop.checked;
      localStorage.setItem("oc_desktop_enabled", state.desktopEnabled ? "true" : "false");
      updateDesktopToggle();
    });
  }
  if (elements.settingsPoll) {
    elements.settingsPoll.addEventListener("change", () => {
      setPollInterval(elements.settingsPoll.value);
      updatePollSelect();
    });
  }
  if (elements.testSound) {
    elements.testSound.addEventListener("click", () => {
      state.canPlaySound = true;
      playSound();
    });
  }
  if (elements.testDesktop) {
    elements.testDesktop.addEventListener("click", async () => {
      const granted = await requestDesktopPermission();
      if (!granted) {
        window.alert("Desktop notifications are blocked in your browser.");
        return;
      }
      state.desktopEnabled = true;
      localStorage.setItem("oc_desktop_enabled", "true");
      updateDesktopToggle();
      showDesktopNotification("OnlineChat test", "This is a preview notification.");
    });
  }
  if (elements.embedApiBase) {
    const embedInputs = [
      elements.embedApiBase,
      elements.embedWidgetBase,
      elements.embedPosition,
      elements.embedMaxUpload,
      elements.embedInlineCss
    ].filter(Boolean);
    embedInputs.forEach((input) => {
      input.addEventListener("input", updateEmbedCode);
      input.addEventListener("change", updateEmbedCode);
    });
  }
  if (elements.embedCopy) {
    elements.embedCopy.addEventListener("click", async () => {
      const code = buildEmbedCode();
      try {
        await navigator.clipboard.writeText(code);
        elements.embedCopy.textContent = "Copied!";
        setTimeout(() => {
          elements.embedCopy.textContent = "Copy code";
        }, 1600);
      } catch (err) {
        window.prompt("Copy this code:", code);
      }
    });
  }
  if (elements.refreshBtn) {
    elements.refreshBtn.addEventListener("click", refreshAll);
  }
  if (elements.refreshVisitors) {
    elements.refreshVisitors.addEventListener("click", loadVisitors);
  }
  if (typeof bindChatFilters === "function") {
    bindChatFilters();
  }
  if (typeof initInboxWorkspaceUi === "function") {
    initInboxWorkspaceUi();
  }
  elements.logoutBtn.addEventListener("click", async () => {
    await fetchJson(`${API_BASE}/admin/logout`, { method: "POST" });
    window.location.href = "index.html";
  });
  elements.sendReply.addEventListener("click", sendReply);
  elements.resolveChat.addEventListener("click", resolveChat);
  if (elements.chatDetailsForm) {
    elements.chatDetailsForm.addEventListener("submit", saveChatDetails);
    elements.chatDetailsForm.addEventListener("focusin", () => {
      state.detailsEditing = true;
    });
    elements.chatDetailsForm.addEventListener("focusout", () => {
      setTimeout(updateDetailsEditing, 0);
    });
    const detailInputs = [
      elements.chatName,
      elements.chatEmail,
      elements.chatCompany,
      elements.chatPhone,
      elements.chatNotes
    ].filter(Boolean);
    detailInputs.forEach((input) => {
      input.addEventListener("input", () => {
        state.detailsEditing = true;
      });
    });
  }
  if (elements.chatDelete) {
    elements.chatDelete.addEventListener("click", deleteChat);
  }
  if (elements.leadEditorForm) {
    elements.leadEditorForm.addEventListener("submit", saveLead);
  }
  if (elements.leadEditorClose) {
    elements.leadEditorClose.addEventListener("click", closeLeadEditor);
  }
  if (elements.leadEditorCancel) {
    elements.leadEditorCancel.addEventListener("click", closeLeadEditor);
  }
  if (elements.leadEditor) {
    elements.leadEditor.addEventListener("click", (event) => {
      if (event.target === elements.leadEditor) {
        closeLeadEditor();
      }
    });
  }
  if (elements.leadsSearch) {
    elements.leadsSearch.addEventListener("input", () => {
      renderLeads(filterLeads(state.leads));
    });
  }
  if (elements.leadsDate) {
    elements.leadsDate.addEventListener("change", () => {
      renderLeads(filterLeads(state.leads));
    });
  }
  if (elements.leadsImportance) {
    elements.leadsImportance.addEventListener("change", () => {
      renderLeads(filterLeads(state.leads));
    });
  }
  if (elements.aiFeedbackClose) {
    elements.aiFeedbackClose.addEventListener("click", closeAiFeedbackModal);
  }
  if (elements.aiFeedbackModal) {
    elements.aiFeedbackModal.addEventListener("click", (event) => {
      if (event.target === elements.aiFeedbackModal) {
        closeAiFeedbackModal();
      }
    });
  }
  if (elements.aiFeedbackHelpful) {
    elements.aiFeedbackHelpful.addEventListener("click", async () => {
      const messageId = getActiveFeedbackId();
      if (!messageId) {
        return;
      }
      setFeedbackModalState(1);
      const note = elements.aiFeedbackNote ? elements.aiFeedbackNote.value.trim() : "";
      setFeedbackDraft(messageId, { rating: 1, note, corrected_reply: "" });
      try {
        await saveAiFeedback(messageId, 1, note, "");
        updateFeedbackToggleState(messageId, 1);
      } catch (err) {
        window.alert(err.message);
      }
    });
  }
  if (elements.aiFeedbackNeeds) {
    elements.aiFeedbackNeeds.addEventListener("click", async () => {
      const messageId = getActiveFeedbackId();
      if (!messageId) {
        return;
      }
      setFeedbackModalState(-1);
      const note = elements.aiFeedbackNote ? elements.aiFeedbackNote.value.trim() : "";
      const corrected = elements.aiFeedbackCorrected
        ? elements.aiFeedbackCorrected.value.trim()
        : "";
      setFeedbackDraft(messageId, { rating: -1, note, corrected_reply: corrected });
      if (elements.aiFeedbackCorrected) {
        elements.aiFeedbackCorrected.focus();
      }
      try {
        await saveAiFeedback(messageId, -1, note, corrected);
        updateFeedbackToggleState(messageId, -1);
      } catch (err) {
        window.alert(err.message);
      }
    });
  }
  if (elements.aiFeedbackSave) {
    elements.aiFeedbackSave.addEventListener("click", async () => {
      const messageId = getActiveFeedbackId();
      if (!messageId || !elements.aiFeedbackModal) {
        return;
      }
      const rating = Number(elements.aiFeedbackModal.dataset.rating || 0);
      if (rating !== 1 && rating !== -1) {
        window.alert("Select Helpful or Needs work before saving a note.");
        return;
      }
      const note = elements.aiFeedbackNote ? elements.aiFeedbackNote.value.trim() : "";
      const corrected = elements.aiFeedbackCorrected
        ? elements.aiFeedbackCorrected.value.trim()
        : "";
      try {
        setFeedbackDraft(messageId, {
          rating,
          note,
          corrected_reply: corrected
        });
        await saveAiFeedback(messageId, rating, note, corrected);
        updateFeedbackToggleState(messageId, rating);
      } catch (err) {
        window.alert(err.message);
      }
    });
  }
  if (elements.aiFeedbackNote) {
    elements.aiFeedbackNote.addEventListener("input", () => {
      const messageId = getActiveFeedbackId();
      if (!messageId) {
        return;
      }
      setFeedbackDraft(messageId, { note: elements.aiFeedbackNote.value });
    });
    elements.aiFeedbackNote.addEventListener("focus", updateFeedbackEditing);
    elements.aiFeedbackNote.addEventListener("blur", () => {
      setTimeout(updateFeedbackEditing, 0);
    });
  }
  if (elements.aiFeedbackCorrected) {
    elements.aiFeedbackCorrected.addEventListener("input", () => {
      const messageId = getActiveFeedbackId();
      if (!messageId) {
        return;
      }
      setFeedbackDraft(messageId, { corrected_reply: elements.aiFeedbackCorrected.value });
    });
    elements.aiFeedbackCorrected.addEventListener("focus", updateFeedbackEditing);
    elements.aiFeedbackCorrected.addEventListener("blur", () => {
      setTimeout(updateFeedbackEditing, 0);
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.aiFeedbackModal && !elements.aiFeedbackModal.hidden) {
      closeAiFeedbackModal();
    }
  });
  if (elements.cannedInsert && elements.cannedSelect) {
    elements.cannedInsert.addEventListener("click", () => {
      const selectedId = Number(elements.cannedSelect.value || 0);
      if (!selectedId) {
        return;
      }
      const reply = state.cannedReplies.find((item) => item.id === selectedId);
      if (reply) {
        elements.chatReply.value = reply.content;
        elements.chatReply.focus();
      }
    });
  }
  if (elements.detailsToggle) {
    elements.detailsToggle.addEventListener("click", toggleDetailsDrawer);
  }
  if (elements.detailsClose) {
    elements.detailsClose.addEventListener("click", () => {
      state.detailsEditing = false;
      setDetailsDrawer(false);
    });
  }
  elements.assignAgent.addEventListener("change", async () => {
    if (!state.activeChatId) {
      return;
    }
    const userId = Number(elements.assignAgent.value || 0);
    await fetchJson(`${API_BASE}/admin/chats/${state.activeChatId}/assign`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId || null })
    });
    await loadChats();
  });
  elements.chatAttach.addEventListener("click", () => {
    if (!state.activeChatId) {
      window.alert("Select a chat first.");
      return;
    }
    elements.chatFile.click();
  });
  elements.chatFile.addEventListener("change", async () => {
    const file = elements.chatFile.files && elements.chatFile.files[0];
    elements.chatFile.value = "";
    if (!file) {
      return;
    }
    if (!state.activeChatId) {
      window.alert("Select a chat first.");
      return;
    }
    try {
      await uploadChatFile(file);
      await selectChat(state.activeChatId);
    } catch (err) {
      window.alert(err.message);
    }
  });
  elements.chatReply.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendReply();
    }
  });
  elements.chatReply.addEventListener("input", () => {
    if (!state.activeChatId) {
      return;
    }
    sendTypingState(state.activeChatId, true);
    scheduleTypingStop(state.activeChatId);
  });
  elements.chatReply.addEventListener("blur", () => {
    if (!state.activeChatId) {
      return;
    }
    stopTyping(state.activeChatId);
  });
  if (elements.chatEmoji && elements.emojiPanel) {
    elements.chatEmoji.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = elements.emojiPanel.classList.contains("is-open");
      elements.emojiPanel.classList.toggle("is-open", !isOpen);
    });
    elements.emojiPanel.addEventListener("click", (event) => {
      const btn = event.target.closest("button");
      if (!btn || !elements.chatReply) {
        return;
      }
      const emoji = btn.textContent || "";
      const input = elements.chatReply;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      input.value = `${input.value.slice(0, start)}${emoji}${input.value.slice(end)}`;
      const nextPos = start + emoji.length;
      input.setSelectionRange(nextPos, nextPos);
      input.focus();
      elements.emojiPanel.classList.remove("is-open");
    });
    document.addEventListener("click", (event) => {
      if (!elements.emojiPanel.classList.contains("is-open") || event.target.closest(".emoji-picker")) {
        return;
      }
      elements.emojiPanel.classList.remove("is-open");
    });
  }
  elements.settingsForm.addEventListener("submit", saveSettings);
  elements.settingsForm.addEventListener("input", () => {
    state.settingsDirty = true;
    if (elements.settingsSaveStatus) {
      elements.settingsSaveStatus.textContent = "Unsaved changes";
      elements.settingsSaveStatus.classList.remove("is-saved");
    }
    updateWidgetPreview();
  });
  const handleLocalSettingsChange = () => {
    syncHandoverNever();
    saveCompanyLocalSettings();
  };
  if (elements.companyPurpose) {
    elements.companyPurpose.addEventListener("change", saveCompanyLocalSettings);
  }
  if (elements.handoverLead) {
    elements.handoverLead.addEventListener("change", handleLocalSettingsChange);
  }
  if (elements.handoverPrice) {
    elements.handoverPrice.addEventListener("change", handleLocalSettingsChange);
  }
  if (elements.handoverHuman) {
    elements.handoverHuman.addEventListener("change", handleLocalSettingsChange);
  }
  if (elements.handoverNever) {
    elements.handoverNever.addEventListener("change", handleLocalSettingsChange);
  }
  if (elements.profileForm) {
    elements.profileForm.addEventListener("submit", saveProfile);
  }
  if (elements.profileAvatarBtn && elements.profileAvatarInput) {
    elements.profileAvatarBtn.addEventListener("click", () => elements.profileAvatarInput.click());
    elements.profileAvatarInput.addEventListener("change", async () => {
      const file = elements.profileAvatarInput.files && elements.profileAvatarInput.files[0];
      elements.profileAvatarInput.value = "";
      if (!file) {
        return;
      }
      try {
        const data = await uploadProfileAvatar(file);
        applyCurrentUser({
          ...(state.currentUser || {}),
          avatar_url: data.avatar_url || null
        });
      } catch (err) {
        window.alert(err.message);
      }
    });
  }
  if (elements.aiAvatarBtn && elements.aiAvatarInput) {
    elements.aiAvatarBtn.addEventListener("click", () => elements.aiAvatarInput.click());
    elements.aiAvatarInput.addEventListener("change", async () => {
      const file = elements.aiAvatarInput.files && elements.aiAvatarInput.files[0];
      elements.aiAvatarInput.value = "";
      if (!file) {
        return;
      }
      try {
        const data = await uploadAiAvatar(file);
        state.settings = {
          ...(state.settings || {}),
          ai_avatar_url: data.ai_avatar_url || data.avatar_url || null
        };
        renderAiAvatar(state.settings);
      } catch (err) {
        window.alert(err.message);
      }
    });
  }
  elements.cannedForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(elements.cannedForm);
    const payload = Object.fromEntries(formData.entries());
    await fetchJson(`${API_BASE}/admin/canned-replies`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    elements.cannedForm.reset();
    await loadCannedReplies();
  });
  if (elements.userForm) {
    elements.userForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(elements.userForm);
      const payload = Object.fromEntries(formData.entries());
      const role = String(payload.role || "agent").toLowerCase();
      const accessModeRaw = String(payload.website_access_mode || "all").toLowerCase();
      const websiteIds = Array.from(
        new Set(
          formData
            .getAll("website_ids")
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value) && value > 0)
        )
      );
      payload.website_access_mode = role === "admin" ? "all" : accessModeRaw === "selected" ? "selected" : "all";
      payload.website_ids =
        role === "admin" || payload.website_access_mode !== "selected" ? [] : websiteIds;
      if (role === "agent" && payload.website_access_mode === "selected" && !payload.website_ids.length) {
        window.alert("Select at least one website for this agent.");
        return;
      }
      try {
        await fetchJson(`${API_BASE}/admin/users`, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        elements.userForm.reset();
        await loadUsers();
      } catch (err) {
        window.alert(err.message);
      }
    });
  }
  if (elements.companyAddBtn) {
    elements.companyAddBtn.addEventListener("click", () => {
      state.companyDraft = {
        mode: "new",
        name: "",
        domain: ""
      };
      state.companyDirty = false;
      if (elements.companySaveStatus) {
        elements.companySaveStatus.textContent = "Creating a new company. Add the company name and website domain, then save.";
        elements.companySaveStatus.classList.remove("is-saved");
      }
      if (typeof syncTenantEditors === "function") {
        syncTenantEditors();
      }
      elements.companyEditName?.focus();
    });
  }
  if (elements.websiteAddBtn) {
    elements.websiteAddBtn.addEventListener("click", () => {
      if (!state.currentCompanyId) {
        openWizardModal(1, 0);
        return;
      }
      openWizardModal(2, state.currentCompanyId);
    });
  }
  if (elements.companySaveBtn) {
    elements.companySaveBtn.addEventListener("click", async () => {
      const isDraft = state.companyDraft && state.companyDraft.mode === "new";
      const companyId = Number(state.currentCompanyId || 0);
      if (!companyId && !isDraft) {
        return;
      }
      const name = elements.companyEditName ? elements.companyEditName.value.trim() : "";
      const timezone =
        state.companies.find((item) => Number(item.id) === Number(companyId))?.timezone || "UTC";
      const domain = elements.websiteEditDomain ? elements.websiteEditDomain.value.trim() : "";
      if (!name) {
        window.alert("Company name is required.");
        return;
      }
      try {
        if (isDraft) {
          const data = await createCompany({ name, timezone: "UTC" });
          const newCompanyId = Number(data?.id || 0);
          if (!newCompanyId) {
            throw new Error("Failed to create company.");
          }
          const createdWebsite = await createWebsite({
            company_id: newCompanyId,
            name,
            domain
          });
          state.companyDraft = null;
          await loadCompanies();
          updateTenantState(newCompanyId, 0);
          await loadWebsites(newCompanyId);
          const newWebsiteId = Number(createdWebsite?.id || state.websites[0]?.id || 0);
          updateTenantState(newCompanyId, newWebsiteId);
          renderContextSelectors();
          updateEmbedInputs();
          updateEmbedCode();
          state.companyDirty = false;
          if (typeof syncTenantEditors === "function") {
            syncTenantEditors();
          }
          if (elements.companySaveStatus) {
            elements.companySaveStatus.textContent = "Company and website created.";
            elements.companySaveStatus.classList.add("is-saved");
            clearTimeout(elements.companySaveStatus._timer);
            elements.companySaveStatus._timer = setTimeout(() => {
              elements.companySaveStatus.textContent = "";
              elements.companySaveStatus.classList.remove("is-saved");
            }, 2000);
          }
          await loadSettingsWithLocal();
          loadAiBehaviorState();
          await refreshAll();
          return;
        }
        await fetchJson(`${API_BASE}/admin/companies/${companyId}`, {
          method: "PUT",
          body: JSON.stringify({ name, timezone })
        });
        let websiteId = state.websites[0]?.id || 0;
        if (!websiteId) {
          const created = await createWebsite({
            company_id: companyId,
            name,
            domain
          });
          websiteId = created?.id || 0;
          await loadWebsites(companyId);
        }
        if (websiteId) {
          await fetchJson(`${API_BASE}/admin/websites/${websiteId}`, {
            method: "PUT",
            body: JSON.stringify({ name, domain })
          });
          await loadWebsites(companyId);
          updateTenantState(companyId, websiteId);
        }
        await loadCompanies();
        renderContextSelectors();
        updateEmbedInputs();
        updateEmbedCode();
        state.companyDirty = false;
        if (elements.companySaveStatus) {
          elements.companySaveStatus.textContent = "Saved";
          elements.companySaveStatus.classList.add("is-saved");
          clearTimeout(elements.companySaveStatus._timer);
          elements.companySaveStatus._timer = setTimeout(() => {
            elements.companySaveStatus.textContent = "";
            elements.companySaveStatus.classList.remove("is-saved");
          }, 2000);
        }
      } catch (err) {
        window.alert(err.message);
      }
    });
  }
  if (elements.companyEditName) {
    elements.companyEditName.addEventListener("input", () => {
      if (state.companyDraft && state.companyDraft.mode === "new") {
        state.companyDraft.name = elements.companyEditName.value;
      }
      state.companyDirty = true;
      if (elements.companySaveStatus) {
        elements.companySaveStatus.textContent = "Unsaved changes";
        elements.companySaveStatus.classList.remove("is-saved");
      }
    });
  }
  if (elements.websiteEditDomain) {
    elements.websiteEditDomain.addEventListener("input", () => {
      if (state.companyDraft && state.companyDraft.mode === "new") {
        state.companyDraft.domain = elements.websiteEditDomain.value;
      }
      state.companyDirty = true;
      if (elements.companySaveStatus) {
        elements.companySaveStatus.textContent = "Unsaved changes";
        elements.companySaveStatus.classList.remove("is-saved");
      }
    });
  }
  if (elements.companyDeleteBtn) {
    elements.companyDeleteBtn.addEventListener("click", async () => {
      const companyId = Number(state.currentCompanyId || 0);
      if (!companyId) {
        return;
      }
      const confirmed = window.confirm(
        "Delete this company and all related chats, leads, and settings? This cannot be undone."
      );
      if (!confirmed) {
        return;
      }
      try {
        await fetchJson(`${API_BASE}/admin/companies/${companyId}`, { method: "DELETE" });
        await loadCompanies();
        if (!state.companies.length) {
          updateTenantState(0, 0);
          renderContextSelectors();
          updateEmbedInputs();
          updateEmbedCode();
          openWizardModal(1, 0);
          return;
        }
        const nextCompanyId = state.companies[0]?.id || 0;
        updateTenantState(nextCompanyId, 0);
        await loadWebsites(nextCompanyId);
        const nextWebsiteId = state.websites[0]?.id || 0;
        updateTenantState(nextCompanyId, nextWebsiteId);
        renderContextSelectors();
        updateEmbedInputs();
        updateEmbedCode();
        await loadSettingsWithLocal();
        loadAiBehaviorState();
        await refreshAll();
      } catch (err) {
        window.alert(err.message);
      }
    });
  }
  if (elements.websiteSaveBtn) {
    elements.websiteSaveBtn.addEventListener("click", async () => {
      const websiteId = Number(state.currentWebsiteId || 0);
      if (!websiteId) {
        return;
      }
      const name =
        (elements.websiteEditName && elements.websiteEditName.value.trim()) ||
        (elements.companyEditName && elements.companyEditName.value.trim()) ||
        state.companies.find((item) => Number(item.id) === Number(state.currentCompanyId || 0))
          ?.name ||
        "Website";
      const domain = elements.websiteEditDomain ? elements.websiteEditDomain.value.trim() : "";
      try {
        await fetchJson(`${API_BASE}/admin/websites/${websiteId}`, {
          method: "PUT",
          body: JSON.stringify({ name, domain })
        });
        await loadWebsites(state.currentCompanyId);
        updateEmbedInputs();
        updateEmbedCode();
      } catch (err) {
        window.alert(err.message);
      }
    });
  }
  if (elements.websiteCopyBtn) {
    elements.websiteCopyBtn.addEventListener("click", async () => {
      if (!elements.websiteEditKey) {
        return;
      }
      const key = elements.websiteEditKey.value || "";
      if (!key) {
        return;
      }
      try {
        await navigator.clipboard.writeText(key);
        elements.websiteCopyBtn.textContent = "Copied";
        setTimeout(() => {
          elements.websiteCopyBtn.textContent = "Copy key";
        }, 1200);
      } catch (err) {
        window.prompt("Copy website key:", key);
      }
    });
  }
  if (elements.companyWizardClose) {
    elements.companyWizardClose.addEventListener("click", closeWizardModal);
  }
  if (elements.companyWizardModal) {
    elements.companyWizardModal.addEventListener("click", (event) => {
      if (event.target === elements.companyWizardModal) {
        closeWizardModal();
      }
    });
  }
  if (elements.popupPreset) {
    elements.popupPreset.addEventListener("change", () => {
      applyPopupPreset(elements.popupPreset.value);
    });
  }
  if (elements.popupActionAdd) {
    elements.popupActionAdd.addEventListener("click", addPopupActionFromInput);
  }
  if (elements.popupActionInput) {
    elements.popupActionInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addPopupActionFromInput();
      }
    });
  }
  if (elements.popupActionsJson) {
    elements.popupActionsJson.addEventListener("change", () => {
      setPopupActionDraft(elements.popupActionsJson.value);
    });
  }
  if (elements.popupLanguageTarget) {
    elements.popupLanguageTarget.addEventListener("change", () => {
      setPopupLanguageControlState();
      syncPopupLocaleFromControls();
    });
  }
  if (elements.popupLanguageCode) {
    elements.popupLanguageCode.addEventListener("change", () => {
      setPopupLanguageControlState();
      syncPopupLocaleFromControls();
    });
  }
  if (elements.popupLanguageCustom) {
    elements.popupLanguageCustom.addEventListener("input", () => {
      syncPopupLocaleFromControls();
    });
  }
  applyPopupLocaleToControls("");
  setPopupActionDraft(elements.popupActionsJson ? elements.popupActionsJson.value : "");
  elements.popupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validatePopupLocaleControls()) {
      return;
    }
    if (elements.popupActionsJson) {
      elements.popupActionsJson.value = popupActionDraft.length ? JSON.stringify(popupActionDraft) : "";
    }
    const formData = new FormData(elements.popupForm);
    const payload = Object.fromEntries(formData.entries());
    payload.delay_seconds =
      payload.delay_seconds === undefined || payload.delay_seconds === ""
        ? 6
        : Number(payload.delay_seconds);
    await fetchJson(`${API_BASE}/admin/popup-rules`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    elements.popupForm.reset();
    elements.popupForm.delay_seconds.value = "6";
    if (elements.popupPreset) {
      elements.popupPreset.value = "custom";
    }
    applyPopupLocaleToControls("");
    setPopupActionDraft([]);
    await loadPopupRules();
  });
  elements.exportLeads.href = `${API_BASE}/admin/leads/export`;
  elements.exportLeads.target = "_blank";

  elements.statusToggle.addEventListener("change", async () => {
    await persistSettings();
    elements.statusLabel.textContent = elements.statusToggle.checked ? "Online" : "Offline";
    elements.statusLabel.classList.toggle("is-online", elements.statusToggle.checked);
    updateWidgetPreview();
  });

  if (elements.aiToggle) {
    elements.aiToggle.addEventListener("change", async () => {
      setAiEnabled(elements.aiToggle.checked);
      await saveAiSettings();
    });
  }
  if (elements.wizardSteps && elements.wizardSteps.length) {
    elements.wizardSteps.forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) {
          return;
        }
        const step = Number(button.dataset.step || 1);
        setWizardStep(step || 1);
      });
    });
  }
  if (elements.wizardBack) {
    elements.wizardBack.addEventListener("click", () => {
      setWizardStep(1);
    });
  }
  if (elements.wizardJumpEmbed) {
    elements.wizardJumpEmbed.addEventListener("click", () => {
      const panel = document.getElementById("embed-panel");
      if (panel && panel.scrollIntoView) {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
  if (elements.wizardCompanyForm) {
    elements.wizardCompanyForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = elements.wizardCompanyName?.value?.trim();
      const domain = elements.wizardWebsiteDomain?.value?.trim() || "";
      const timezone = "UTC";
      if (!name) {
        window.alert("Company name is required.");
        return;
      }
      try {
        const data = await createCompany({ name, timezone });
        elements.wizardCompanyForm.reset();
        await loadCompanies();
        const newCompanyId = data.id || state.companies.find((item) => item.name === name)?.id;
        if (newCompanyId) {
          wizardCompanyId = Number(newCompanyId);
          updateTenantState(wizardCompanyId, 0);
          await loadWebsites(wizardCompanyId);
          let websiteId = state.websites[0]?.id || 0;
          if (!websiteId) {
            const created = await createWebsite({
              company_id: wizardCompanyId,
              name,
              domain
            });
            websiteId = created?.id || 0;
            await loadWebsites(wizardCompanyId);
          }
          if (websiteId) {
            await fetchJson(`${API_BASE}/admin/websites/${websiteId}`, {
              method: "PUT",
              body: JSON.stringify({ name, domain })
            });
            await loadWebsites(wizardCompanyId);
            updateTenantState(wizardCompanyId, websiteId);
          }
        }
        renderContextSelectors();
        updateEmbedInputs();
        updateEmbedCode();
        await loadSettingsWithLocal();
        loadAiBehaviorState();
        await refreshAll();
        if (elements.wizardResult) {
          elements.wizardResult.hidden = false;
        }
        if (elements.wizardWebsiteKey) {
          elements.wizardWebsiteKey.textContent = state.currentWebsiteKey || "";
        }
      } catch (err) {
        window.alert(err.message);
      }
    });
  }
  if (elements.companySwitcher) {
    elements.companySwitcher.addEventListener("click", async (event) => {
      const add = event.target.closest("[data-company-add]");
      if (add) {
        openWizardModal(1, 0);
        return;
      }
      const button = event.target.closest("[data-company-id]");
      if (!button) {
        return;
      }
      state.companyDraft = null;
      const companyId = Number(button.dataset.companyId || 0);
      if (!companyId || companyId === state.currentCompanyId) {
        return;
      }
      if (!confirmCompanySwitch()) {
        renderCompanies();
        return;
      }
      elements.companySwitcher.querySelectorAll(".switcher-chip").forEach((chip) => {
        chip.classList.remove("is-active");
      });
      button.classList.add("is-active");
      updateTenantState(companyId, 0);
      await loadWebsites(companyId);
      const websiteId = state.websites[0]?.id || 0;
      updateTenantState(companyId, websiteId);
      renderCompanies();
      renderContextSelectors();
      updateEmbedInputs();
      updateEmbedCode();
      if (typeof syncTenantEditors === "function") {
        syncTenantEditors();
      }
      await loadSettingsWithLocal();
      loadAiBehaviorState();
      await refreshAll();
    });
  }
  if (elements.websiteSwitcher) {
    elements.websiteSwitcher.addEventListener("click", async (event) => {
      const add = event.target.closest("[data-website-add]");
      if (add) {
        if (!state.currentCompanyId) {
          openWizardModal(1, 0);
          return;
        }
        openWizardModal(2, state.currentCompanyId);
        return;
      }
      const button = event.target.closest("[data-website-id]");
      if (!button) {
        return;
      }
      state.companyDraft = null;
      const websiteId = Number(button.dataset.websiteId || 0);
      if (!websiteId || websiteId === state.currentWebsiteId) {
        return;
      }
      if (!state.currentCompanyId) {
        return;
      }
      updateTenantState(state.currentCompanyId, websiteId);
      renderContextSelectors();
      updateEmbedInputs();
      updateEmbedCode();
      await loadSettingsWithLocal();
      loadAiBehaviorState();
      await refreshAll();
    });
  }

  if (elements.aiTogglePanel) {
    elements.aiTogglePanel.addEventListener("change", async () => {
      setAiEnabled(elements.aiTogglePanel.checked);
      await saveAiSettings();
    });
  }

  if (elements.aiSettingsForm) {
    elements.aiSettingsForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await saveAiSettings();
    });
  }

  if (elements.aiProvider) {
    elements.aiProvider.addEventListener("change", () => {
      const provider = elements.aiProvider.value;
      if (!elements.aiModel) {
        return;
      }
      const current = elements.aiModel.value.trim();
      if (provider === "openai" && (!current || current === "qwen3:8b")) {
        elements.aiModel.value = "gpt-5.4";
      }
    });
  }
  if (elements.companyForm) {
    elements.companyForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = elements.companyName?.value?.trim();
      const timezone = elements.companyTimezone?.value?.trim() || "UTC";
      if (!name) {
        window.alert("Company name is required.");
        return;
      }
      try {
        const data = await createCompany({ name, timezone });
        elements.companyForm.reset();
        await loadCompanies();
        const newCompanyId = data.id || state.companies.find((item) => item.name === name)?.id;
        if (newCompanyId) {
          updateTenantState(Number(newCompanyId), 0);
          await loadWebsites(Number(newCompanyId));
          const websiteId = state.websites[0]?.id || 0;
          updateTenantState(Number(newCompanyId), websiteId);
        }
        renderContextSelectors();
        updateEmbedInputs();
        updateEmbedCode();
        await loadSettingsWithLocal();
        loadAiBehaviorState();
        await refreshAll();
      } catch (err) {
        window.alert(err.message);
      }
    });
  }
  if (elements.websiteForm) {
    elements.websiteForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = elements.websiteName?.value?.trim();
      const domain = elements.websiteDomain?.value?.trim() || "";
      if (!name) {
        window.alert("Website name is required.");
        return;
      }
      try {
        const data = await createWebsite({
          company_id: state.currentCompanyId,
          name,
          domain
        });
        elements.websiteForm.reset();
        await loadWebsites(state.currentCompanyId);
        const newWebsiteId = data.id || state.websites.find((item) => item.name === name)?.id;
        if (newWebsiteId) {
          updateTenantState(state.currentCompanyId, Number(newWebsiteId));
        }
        renderContextSelectors();
        updateEmbedInputs();
        updateEmbedCode();
        await loadSettingsWithLocal();
        await refreshAll();
      } catch (err) {
        window.alert(err.message);
      }
    });
  }

  if (elements.aiFaqForm) {
    elements.aiFaqForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = {
        question: elements.aiFaqQuestion ? elements.aiFaqQuestion.value.trim() : "",
        answer: elements.aiFaqAnswer ? elements.aiFaqAnswer.value.trim() : ""
      };
      if (!payload.question || !payload.answer) {
        window.alert("Please add both a question and answer.");
        return;
      }
      await fetchJson(`${API_BASE}/admin/ai/faq`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      elements.aiFaqForm.reset();
      await loadAiFaqs();
    });
  }

  if (elements.aiFaqExportBtn) {
    elements.aiFaqExportBtn.addEventListener("click", () => {
      const productLine = elements.aiFaqExportLine ? elements.aiFaqExportLine.value.trim() : "";
      const params = new URLSearchParams();
      if (productLine) {
        params.set("product_line", productLine);
      }
      const url = `${API_BASE}/admin/ai/faq-jsonl${params.toString() ? `?${params.toString()}` : ""}`;
      window.open(url, "_blank", "noopener");
    });
  }

  if (elements.aiDocForm) {
    elements.aiDocForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const file = elements.aiDocFile?.files?.[0];
      if (!file) {
        window.alert("Select a document to upload.");
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      if (elements.aiDocTitle && elements.aiDocTitle.value.trim()) {
        formData.append("title", elements.aiDocTitle.value.trim());
      }
      const response = await fetchWithAuth(`${API_BASE}/admin/ai/docs`, {
        method: "POST",
        skipJsonContentType: true,
        body: formData
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        window.alert(data.error || "Upload failed.");
        return;
      }
      elements.aiDocForm.reset();
      if (elements.aiDocSelected) {
        elements.aiDocSelected.textContent = "No file selected";
        elements.aiDocSelected.hidden = true;
      }
      await loadAiDocs();
    });
  }

  if (elements.aiFineTuneForm) {
    elements.aiFineTuneForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const trainingFile = elements.aiFineTuneTraining?.files?.[0];
      if (!trainingFile) {
        window.alert("Select a training JSONL file.");
        return;
      }
      if (!trainingFile.name.toLowerCase().endsWith(".jsonl")) {
        window.alert("Training file must be a .jsonl file.");
        return;
      }
      const formData = new FormData();
      const model = elements.aiFineTuneModel ? elements.aiFineTuneModel.value.trim() : "";
      const suffix = elements.aiFineTuneSuffix ? elements.aiFineTuneSuffix.value.trim() : "";
      if (model) {
        formData.append("model", model);
      }
      if (suffix) {
        formData.append("suffix", suffix);
      }
      formData.append("training_file", trainingFile);
      const validationFile = elements.aiFineTuneValidation?.files?.[0];
      if (validationFile) {
        if (!validationFile.name.toLowerCase().endsWith(".jsonl")) {
          window.alert("Validation file must be a .jsonl file.");
          return;
        }
        formData.append("validation_file", validationFile);
      }
      const response = await fetchWithAuth(`${API_BASE}/admin/ai/fine-tunes`, {
        method: "POST",
        skipJsonContentType: true,
        body: formData
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        window.alert(data.error || "Failed to start fine-tune.");
        return;
      }
      elements.aiFineTuneForm.reset();
      await loadAiFineTunes();
      window.alert("Fine-tune job started. Check status in the list.");
    });
  }

  if (elements.aiFineTuneRefresh) {
    elements.aiFineTuneRefresh.addEventListener("click", loadAiFineTunes);
  }

  if (elements.aiExportJsonl) {
    elements.aiExportJsonl.addEventListener("click", () => {
      const includeFaqs = elements.aiExportFaqs ? elements.aiExportFaqs.checked : true;
      const includeChats = elements.aiExportChats ? elements.aiExportChats.checked : true;
      if (!includeFaqs && !includeChats) {
        window.alert("Select at least one data source to export.");
        return;
      }
      const maxChats = Math.round(clampNumber(elements.aiExportLimit?.value, 10, 500, 200));
      const params = new URLSearchParams();
      params.set("include_faqs", includeFaqs ? "1" : "0");
      params.set("include_chats", includeChats ? "1" : "0");
      params.set("max_chats", String(maxChats));
      const url = `${API_BASE}/admin/ai/training-data?${params.toString()}`;
      window.open(url, "_blank", "noopener");
    });
  }

  if (elements.aiExportPreferences) {
    elements.aiExportPreferences.addEventListener("click", () => {
      const limit = Math.round(clampNumber(elements.aiExportLimit?.value, 10, 500, 200));
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      const url = `${API_BASE}/admin/ai/training-preferences?${params.toString()}`;
      window.open(url, "_blank", "noopener");
    });
  }

  if (elements.aiTest) {
    elements.aiTest.addEventListener("click", async () => {
      if (elements.aiTestResult) {
        elements.aiTestResult.textContent = "Testing...";
      }
      const provider = elements.aiProvider ? elements.aiProvider.value : "openai";
      let model = elements.aiModel ? elements.aiModel.value.trim() : "";
      if (provider === "openai" && (!model || model === "qwen3:8b")) {
        model = "gpt-5.4";
      }
      const payload = {
        provider,
        model,
        prompt: elements.aiTestPrompt ? elements.aiTestPrompt.value.trim() : "",
        temperature: clampNumber(elements.aiTemperature?.value, 0, 2, 0.2),
        top_p: clampNumber(elements.aiTopP?.value, 0.1, 1, 0.9),
        max_tokens: Math.round(clampNumber(elements.aiMaxTokens?.value, 16, 2000, 160))
      };
      try {
        const data = await fetchJson(`${API_BASE}/admin/ai/test`, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        if (elements.aiTestResult) {
          elements.aiTestResult.textContent = data.reply ? truncateText(data.reply, 160) : "No reply";
        }
      } catch (err) {
        if (elements.aiTestResult) {
          elements.aiTestResult.textContent = err.message || "Test failed";
        }
      }
    });
  }

  if (elements.alertBanner) {
    elements.alertBanner.addEventListener("click", () => {
      setView("inbox");
      showAlertBanner(false);
    });
  }

  updateSoundToggle();
  updateDesktopToggle();
  updatePollSelect();
  initAnalyticsFilters();
  initAiTabs();
  initAiBehavior();
  initAiKnowledgeBuilder();
  initAiSettingsTracking();
  updateAnalyticsBadges();
  if (elements.settingsDesktop && !("Notification" in window)) {
    elements.settingsDesktop.disabled = true;
  }
  setSignal("No new alerts", false);
  resetAlertState({ clearBanner: true });
  populateChatDetails(null);
  setWizardStep(1);

  const saasRuntimeReady = await initDashboardSaasRuntime();
  if (!saasRuntimeReady) {
    if (state.saas.status === "unauthenticated") {
      window.location.href = "index.html";
      return;
    }
    resetWorkspaceScopedState();
    renderSaasWorkspaceSelector();
    renderContextSelectors();
    updateEmbedInputs();
    updateEmbedCode();
    if (typeof syncTenantEditors === "function") {
      syncTenantEditors();
    }
    return;
  }
  await ensureAuth();
  applyAiPermissions();
  setView(state.activeView);
  const workspaceReady = await initSaasWorkspace();
  if (!workspaceReady) {
    resetWorkspaceScopedState();
    renderSaasWorkspaceSelector();
    renderContextSelectors();
    updateEmbedInputs();
    updateEmbedCode();
    if (typeof syncTenantEditors === "function") {
      syncTenantEditors();
    }
    return;
  }

  await initTenantContext();
  await loadSettingsWithLocal();
  loadAiBehaviorState();
  await refreshAll();
  startPolling();
};


