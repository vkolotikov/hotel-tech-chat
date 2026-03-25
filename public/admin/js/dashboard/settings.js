const createSettingsModule = (context) => {
  const {
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
  } = context;
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

  const safe = (value) => (escapeHtml ? escapeHtml(value) : String(value || ""));
  const widgetIconStyles = [
    "classic",
    "glass",
    "solid",
    "minimal",
    "square",
    "halo",
    "midnight",
    "duotone",
    "aurora",
    "outline",
    "neon",
    "sunset"
  ];
  const widgetIconShapes = ["circle", "rounded", "square", "pill"];
  const widgetIconGlyphs = ["chat", "message", "support", "quote", "question", "sales"];
  const voiceInputLanguageModes = ["auto", "preferred"];
  const voiceSendModes = ["auto_send", "review_first"];
  const voiceInputLanguageOptions = [
    { value: "en", label: "English" },
    { value: "de", label: "German" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "it", label: "Italian" },
    { value: "lv", label: "Latvian" },
    { value: "lt", label: "Lithuanian" },
    { value: "nl", label: "Dutch" },
    { value: "pl", label: "Polish" },
    { value: "pt", label: "Portuguese" }
  ];
  const previewGlyphSvg = {
    chat:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7.8A3.8 3.8 0 018.8 4h6.4A3.8 3.8 0 0119 7.8v4.6a3.8 3.8 0 01-3.8 3.8h-4.1L7 19v-2.8A3.8 3.8 0 015 12.4V7.8z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path></svg>',
    message:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 6.5h15v9.8h-8.1L7 19v-2.7H4.5V6.5z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path></svg>',
    support:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.8 11.8a4.2 4.2 0 018.4 0v2.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path><rect x="4.3" y="13.4" width="3.9" height="5.5" rx="1.5" stroke="currentColor" stroke-width="1.5"></rect><rect x="15.8" y="13.4" width="3.9" height="5.5" rx="1.5" stroke="currentColor" stroke-width="1.5"></rect></svg>',
    quote:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 12h.01M12 12h.01M16 12h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></path></svg>',
    question:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9.7 9.1a2.3 2.3 0 114.6 0c0 1.6-2.3 1.8-2.3 3.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path><circle cx="12" cy="16.9" r="1" fill="currentColor"></circle></svg>',
    sales:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4.5" y="8" width="15" height="10.5" rx="2.2" stroke="currentColor" stroke-width="1.6"></rect><path d="M9 8V6.8A1.8 1.8 0 0110.8 5h2.4A1.8 1.8 0 0115 6.8V8M4.5 12h15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>'
  };

  const normalizeWidgetIconStyle = (value) => {
    const style = String(value || "").trim().toLowerCase();
    return widgetIconStyles.includes(style) ? style : "classic";
  };

  const normalizeWidgetIconShape = (value) => {
    const shape = String(value || "").trim().toLowerCase();
    return widgetIconShapes.includes(shape) ? shape : "circle";
  };

  const normalizeWidgetIconGlyph = (value) => {
    const glyph = String(value || "").trim().toLowerCase();
    return widgetIconGlyphs.includes(glyph) ? glyph : "chat";
  };

  const normalizeVoiceInputLanguageMode = (value) => {
    const mode = String(value || "").trim().toLowerCase();
    return voiceInputLanguageModes.includes(mode) ? mode : "auto";
  };

  const normalizeVoiceSendMode = (value) => {
    const mode = String(value || "").trim().toLowerCase();
    return voiceSendModes.includes(mode) ? mode : "auto_send";
  };

  const normalizeVoiceReplySpeed = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 1;
    }
    const clamped = Math.min(Math.max(numeric, 0.8), 1.35);
    return Math.round(clamped * 100) / 100;
  };

  const normalizeVoiceInputLanguage = (value) => {
    const raw = String(value || "")
      .trim()
      .replace(/_/g, "-");
    return /^[a-z]{2,3}(?:-[A-Z]{2})?$/i.test(raw) ? raw : "en";
  };

  const markSettingsDirty = () => {
    if (elements.settingsSaveStatus) {
      elements.settingsSaveStatus.textContent = "Unsaved changes";
      elements.settingsSaveStatus.classList.remove("is-saved");
    }
    state.settingsDirty = true;
  };

  const settingsTabStorageKey = "oc_settings_tab";
  const settingsTabNames = ["company", "personal", "widget", "automation", "team", "membership", "developer"];

  const normalizeSettingsTab = (value) => {
    const next = String(value || "").trim().toLowerCase();
    return settingsTabNames.includes(next) ? next : "company";
  };

  const getSettingsTabsScope = () =>
    document.getElementById("settings-tabs")?.closest(".settings-layout") ||
    document.querySelector("[data-view='settings']");

  const getSettingsTabButtons = () => {
    const scope = getSettingsTabsScope();
    if (!scope) {
      return [];
    }
    return Array.from(scope.querySelectorAll("#settings-tabs [data-settings-tab]"));
  };

  const getSettingsTabPanels = () => {
    const scope = getSettingsTabsScope();
    if (!scope) {
      return [];
    }
    return Array.from(scope.querySelectorAll("[data-settings-tab-panel]"));
  };

  const applySettingsTab = (tab) => {
    let next = normalizeSettingsTab(tab);
    if (next === "team" && state.currentUser && state.currentUser.role !== "admin") {
      next = "company";
    }

    const buttons = getSettingsTabButtons();
    const panels = getSettingsTabPanels();

    buttons.forEach((button) => {
      const isActive = button.dataset.settingsTab === next;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    let activePanels = 0;
    panels.forEach((panel) => {
      const isActive = panel.dataset.settingsTabPanel === next;
      panel.classList.toggle("is-active", isActive);
      panel.setAttribute("aria-hidden", isActive ? "false" : "true");
      panel.hidden = !isActive;
      if (isActive) {
        activePanels += 1;
      }
    });

    const ensurePanelVisible = (selector) => {
      const panel = document.querySelector(selector);
      if (!panel) {
        return false;
      }
      panel.hidden = false;
      panel.classList.add("is-active");
      panel.setAttribute("aria-hidden", "false");
      return true;
    };

    const extraVisible = {
      company: ["#company-switcher-panel"],
      personal: ["[data-settings-tab-panel='personal']"],
      widget: ["#company-intent-panel", "#widget-panel"],
      automation: ["#automation-panel"],
      team: ["#team-panel"],
      membership: ["#membership-panel"],
      developer: ["#embed-panel"]
    };

    const forced = extraVisible[next] || [];
    forced.forEach((selector) => ensurePanelVisible(selector));

    const stackTabs = document.querySelector(".settings-stack-tabs");
    if (stackTabs) {
      stackTabs.hidden = false;
    }

    const visibleAfterForce = getSettingsTabPanels().some(
      (panel) => panel.dataset.settingsTabPanel === next && panel.hidden !== true
    );

    if (!activePanels && !visibleAfterForce && next !== "company") {
      applySettingsTab("company");
      return;
    }

    localStorage.setItem(settingsTabStorageKey, next);
    if (next === "membership") {
      loadMembershipStatus({ silent: true }).catch(() => {});
    }
  };

  const initSettingsTabs = () => {
    const tabsRoot = document.getElementById("settings-tabs");
    if (!tabsRoot || tabsRoot.dataset.bound === "1") {
      return;
    }
    tabsRoot.dataset.bound = "1";

    tabsRoot.addEventListener("click", (event) => {
      const button = event.target.closest("[data-settings-tab]");
      if (!button) {
        return;
      }
      applySettingsTab(button.dataset.settingsTab);
    });

    const saved = normalizeSettingsTab(localStorage.getItem(settingsTabStorageKey));
    const initial = getSettingsTabButtons().find((button) => button.classList.contains("is-active"))
      ?.dataset.settingsTab;
    applySettingsTab(saved || initial || "company");
  };

  const setMembershipBadge = (element, text, tone = "neutral") => {
    if (!element) {
      return;
    }
    element.textContent = text || "-";
    element.className = `badge ${tone}`;
  };

  const renderMembershipList = (element, items = [], emptyText = "No data") => {
    if (!element) {
      return;
    }
    element.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("span");
      empty.className = "badge neutral";
      empty.textContent = emptyText;
      element.appendChild(empty);
      return;
    }
    items.forEach((item) => {
      const chip = document.createElement("span");
      chip.className = `badge ${item.tone || "neutral"}`;
      chip.textContent = item.label || "-";
      element.appendChild(chip);
    });
  };

  const formatMembershipValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    return String(value);
  };

  const formatMembershipText = (value, fallback = "Unknown") => {
    const text = String(value || "").trim();
    if (!text) {
      return fallback;
    }
    return text
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const syncTenantSelection = (companyId, websiteId) => {
    if (typeof updateTenantState === "function") {
      updateTenantState(companyId, websiteId);
      return;
    }
    state.currentCompanyId = Number(companyId || 0);
    state.currentWebsiteId = Number(websiteId || 0);
    localStorage.setItem("oc_current_company_id", String(state.currentCompanyId || ""));
    localStorage.setItem("oc_current_website_id", String(state.currentWebsiteId || ""));
  };

  const formatMembershipPlanName = (value, fallback = "Plan") => {
    const raw = String(value || "").trim();
    if (!raw) {
      return fallback;
    }
    if (/^[A-Z0-9\s&/+.-]+$/.test(raw) && raw.length <= 16) {
      return raw;
    }
    return formatMembershipText(raw, fallback);
  };

  const formatMembershipDate = (value) => {
    const raw = String(value || "").trim();
    if (!raw) {
      return "-";
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return raw;
    }
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(parsed);
  };

  const getMembershipDaysRemaining = (value) => {
    const raw = String(value || "").trim();
    if (!raw) {
      return null;
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    const diffMs = parsed.getTime() - Date.now();
    return Math.ceil(diffMs / 86400000);
  };

  const getMembershipChecklistIcon = (name) => {
    const icons = {
      done:
        '<svg viewBox="0 0 24 24" fill="none"><path d="M7 12.5l3.1 3.1L17.5 8.2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
      access:
        '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4l6.5 3.5v4.8c0 4-2.7 6.9-6.5 7.7-3.8-.8-6.5-3.7-6.5-7.7V7.5L12 4z" stroke="currentColor" stroke-width="1.8"></path></svg>',
      billing:
        '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="6.5" width="16" height="11" rx="2.5" stroke="currentColor" stroke-width="1.8"></rect><path d="M4 11h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>',
      launch:
        '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path></svg>',
      pending:
        '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="1.8"></circle><path d="M12 8.5v4l2.5 1.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>'
    };
    return icons[name] || icons.pending;
  };

  const isOpaqueWorkspaceLabel = (value, tenantId = "") => {
    const text = String(value || "").trim();
    const rawTenantId = String(tenantId || "").trim();
    if (!text) {
      return true;
    }
    if (rawTenantId && text === rawTenantId) {
      return true;
    }
    return /^tenant\s+[a-z0-9]/i.test(text);
  };

  const getMembershipDisplayName = ({ workspaceName = "", membershipName = "", tenantId = "" } = {}) => {
    const companyName = String(
      state.companies.find((company) => Number(company.id) === Number(state.currentCompanyId || 0))?.name || ""
    ).trim();
    if (companyName) {
      return companyName;
    }
    if (!isOpaqueWorkspaceLabel(workspaceName, tenantId)) {
      return workspaceName;
    }
    if (!isOpaqueWorkspaceLabel(membershipName, tenantId)) {
      return membershipName;
    }
    const userName = String(state.currentUser?.name || "").trim();
    if (userName) {
      return `${userName}'s workspace`;
    }
    return "Workspace";
  };

  const setMembershipTimeline = ({ label, value, meta } = {}) => {
    if (elements.membershipCycleLabel) {
      elements.membershipCycleLabel.textContent = label || "Timeline";
    }
    if (elements.membershipCycleValue) {
      elements.membershipCycleValue.textContent = value || "Waiting for workspace";
    }
    if (elements.membershipCycleMeta) {
      elements.membershipCycleMeta.textContent =
        meta || "Select a workspace to see billing timing.";
    }
  };

  const renderMembershipChecklist = (items = []) => {
    if (!elements.membershipChecklist) {
      return;
    }
    elements.membershipChecklist.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "membership-checklist-item is-locked";
      empty.innerHTML = [
        `<span class="membership-checklist-icon" aria-hidden="true">${getMembershipChecklistIcon("pending")}</span>`,
        '<div class="membership-checklist-copy">',
        '<strong>No actions yet</strong>',
        '<span>Select a workspace first.</span>',
        "</div>"
      ].join("");
      elements.membershipChecklist.appendChild(empty);
      return;
    }
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = `membership-checklist-item is-${item.state || "locked"}`;
      row.innerHTML = [
        `<span class="membership-checklist-icon" aria-hidden="true">${item.iconHtml || getMembershipChecklistIcon(item.icon || "pending")}</span>`,
        '<div class="membership-checklist-copy">',
        `<strong>${item.title || "-"}</strong>`,
        `<span>${item.text || ""}</span>`,
        "</div>"
      ].join("");
      elements.membershipChecklist.appendChild(row);
    });
  };

  const ensureMembershipUiState = () => {
    if (!state.membershipUi || typeof state.membershipUi !== "object") {
      state.membershipUi = {};
    }
    if (typeof state.membershipUi.selected_plan_key !== "string") {
      state.membershipUi.selected_plan_key = "";
    }
    state.membershipUi.action_busy = Boolean(state.membershipUi.action_busy);
    return state.membershipUi;
  };

  const pickDefaultMembershipPlanKey = ({
    plans = [],
    currentPlanKey = ""
  } = {}) => {
    const normalizedCurrent = String(currentPlanKey || "").trim().toLowerCase();
    const currentPlan = plans.find(
      (plan) => String(plan?.plan_key || "").trim().toLowerCase() === normalizedCurrent
    );
    if (currentPlan?.plan_key) {
      return String(currentPlan.plan_key);
    }
    const recommendedPaidPlan = plans.find((plan) => !plan?.is_trial && Boolean(plan?.recommended));
    if (recommendedPaidPlan?.plan_key) {
      return String(recommendedPaidPlan.plan_key);
    }
    const firstPaidPlan = plans.find((plan) => !plan?.is_trial);
    if (firstPaidPlan?.plan_key) {
      return String(firstPaidPlan.plan_key);
    }
    return String(plans[0]?.plan_key || "").trim();
  };

  const getMembershipSelectedPlanKey = () =>
    String(ensureMembershipUiState().selected_plan_key || "").trim();

  const setMembershipSelectedPlanKey = (planKey, { plans = [], currentPlanKey = "" } = {}) => {
    const next = String(planKey || "").trim();
    const availablePlans = Array.isArray(plans) ? plans : [];
    const existing = availablePlans.find(
      (plan) => String(plan?.plan_key || "").trim().toLowerCase() === next.toLowerCase()
    );
    ensureMembershipUiState().selected_plan_key = existing?.plan_key
      ? String(existing.plan_key)
      : pickDefaultMembershipPlanKey({
          plans: availablePlans,
          currentPlanKey
        });
    if (elements.membershipPlanSelect) {
      elements.membershipPlanSelect.value = ensureMembershipUiState().selected_plan_key || "";
    }
    return ensureMembershipUiState().selected_plan_key;
  };

  const getMembershipPlanByKey = (plans = [], planKey = "") => {
    const normalizedKey = String(planKey || "").trim().toLowerCase();
    if (!normalizedKey) {
      return null;
    }
    return (
      (Array.isArray(plans) ? plans : []).find(
        (plan) => String(plan?.plan_key || "").trim().toLowerCase() === normalizedKey
      ) || null
    );
  };

  const getMembershipPlanAction = (plan = {}, context = {}) => {
    const normalizedPlanKey = String(plan?.plan_key || "").trim().toLowerCase();
    const normalizedCurrentPlanKey = String(context.current_plan_key || "").trim().toLowerCase();
    const isCurrent = normalizedPlanKey && normalizedPlanKey === normalizedCurrentPlanKey;
    const isOwnerAdmin = ["owner", "admin"].includes(String(context.role || "").toLowerCase());
    const isBusy = Boolean(ensureMembershipUiState().action_busy);
    const hasTenant = Boolean(context.tenant_id);

    if (!state.saas?.enabled || !hasTenant) {
      return {
        label: "Unavailable",
        action: "",
        disabled: true,
        variant: "secondary",
        note: "Select a workspace first."
      };
    }

    if (isCurrent) {
      return {
        label: "Current plan",
        action: "",
        disabled: true,
        variant: "current",
        note: plan?.is_trial && String(context.plan_status || "").startsWith("trial")
          ? "Trial is active."
          : "This plan is active."
      };
    }

    if (!isOwnerAdmin) {
      return {
        label: "Owner/Admin only",
        action: "",
        disabled: true,
        variant: "secondary",
        note: "Only the workspace owner or admin can change billing."
      };
    }

    if (plan?.is_trial) {
      const canStartTrial = Boolean(context.can_start_trial) && !String(context.plan_status || "").startsWith("trial");
      return {
        label: canStartTrial ? "Start free trial" : "Trial unavailable",
        action: canStartTrial ? "trial" : "",
        disabled: !canStartTrial || isBusy,
        variant: canStartTrial ? "primary" : "secondary",
        note: canStartTrial
          ? `${Number(plan?.trial_days || 0) || 0} day trial.`
          : "Trial is not available for this workspace."
      };
    }

    if (String(plan?.action_type || "").trim().toLowerCase() === "checkout") {
      const canUpgrade = Boolean(context.can_upgrade);
      return {
        label: canUpgrade ? "Upgrade" : "Upgrade unavailable",
        action: canUpgrade ? "upgrade" : "",
        disabled: !canUpgrade || isBusy,
        variant: canUpgrade ? "primary" : "secondary",
        note: canUpgrade ? "Opens secure checkout." : "Upgrade is not available for this workspace."
      };
    }

    if (String(plan?.action_type || "").trim().toLowerCase() === "contact_support") {
      return {
        label: "Contact support",
        action: "",
        disabled: true,
        variant: "secondary",
        note: "This plan is activated manually by your workspace team."
      };
    }

    return {
      label: "Included",
      action: "",
      disabled: true,
      variant: "secondary",
      note: "No checkout step for this plan."
    };
  };

  const renderMembershipPlanCards = ({
    plans = [],
    selectedPlanKey = "",
    currentPlanKey = "",
    context = {}
  } = {}) => {
    if (!elements.membershipPlanCards) {
      return;
    }
    elements.membershipPlanCards.innerHTML = "";
    if (!plans.length) {
      const empty = document.createElement("div");
      empty.className = "membership-plan-card";
      empty.innerHTML = [
        '<div class="membership-plan-card-header">',
        '<div class="membership-plan-card-title">',
        "<strong>No plans</strong>",
        '<span class="membership-plan-card-subtitle">Plans appear here when available.</span>',
        "</div>",
        "</div>"
      ].join("");
      elements.membershipPlanCards.appendChild(empty);
      return;
    }
    const normalizedSelected = String(selectedPlanKey || "").trim().toLowerCase();
    const normalizedCurrent = String(currentPlanKey || "").trim().toLowerCase();

    plans.forEach((plan) => {
      const planKey = String(plan?.plan_key || "").trim();
      const normalizedKey = planKey.toLowerCase();
      const card = document.createElement("article");
      const actionState = getMembershipPlanAction(plan, context);
      const highlights = [];
      card.className = "membership-plan-card";
      card.tabIndex = 0;
      card.dataset.planKey = planKey;
      card.setAttribute("aria-selected", normalizedKey === normalizedSelected ? "true" : "false");
      card.classList.toggle("is-selected", normalizedKey === normalizedSelected);
      card.classList.toggle("is-current", normalizedKey === normalizedCurrent);

      if (plan?.is_trial) {
        highlights.push({
          label: `${Number(plan?.trial_days || 0) || 0} day trial`,
          tone: "success"
        });
      }
      if (plan?.recommended && normalizedKey !== normalizedCurrent) {
        highlights.push({ label: "Recommended", tone: "warning" });
      }
      if (normalizedKey === normalizedCurrent) {
        highlights.push({ label: "Current plan", tone: "success" });
      } else if (String(plan?.status || "").trim()) {
        highlights.push({ label: formatMembershipText(plan.status), tone: "neutral" });
      }

      const metaHtml = highlights.length
        ? `<div class="membership-plan-card-meta">${highlights
            .map((item) => `<span class="badge ${item.tone || "neutral"}">${item.label}</span>`)
            .join("")}</div>`
        : "";

      const buttonClasses = [
        "membership-plan-card-btn",
        actionState.variant === "secondary" ? "is-secondary" : "",
        actionState.variant === "current" ? "is-current" : ""
      ]
        .filter(Boolean)
        .join(" ");

      card.innerHTML = [
        '<div class="membership-plan-card-header">',
        '<div class="membership-plan-card-title">',
        `<strong>${safe(formatMembershipPlanName(plan?.name || planKey || "Plan", "Plan"))}</strong>`,
        `<span class="membership-plan-card-subtitle">${safe(
          plan?.is_trial
            ? "Try the product before moving to a paid plan."
            : normalizedKey === normalizedCurrent
              ? "Your active plan right now."
              : "Upgrade when you are ready."
        )}</span>`,
        "</div>",
        "</div>",
        metaHtml,
        '<div class="membership-plan-card-actions">',
        `<button type="button" class="${buttonClasses}" data-plan-action="${safe(actionState.action || "")}" data-plan-key="${safe(
          planKey
        )}" ${actionState.disabled ? "disabled" : ""}>${safe(actionState.label || "Unavailable")}</button>`,
        `<span class="membership-plan-card-note">${safe(actionState.note || "")}</span>`,
        "</div>"
      ].join("");
      elements.membershipPlanCards.appendChild(card);
    });
  };

  const normalizeMembershipPlanStatus = (value) => {
    const status = String(value || "").trim().toLowerCase();
    return status || "active";
  };

  const normalizeMembershipPlans = (productsData = {}, entitlements = {}) => {
    const rawPlans = Array.isArray(productsData?.plans) ? productsData.plans : [];
    const planKeys = Array.isArray(productsData?.plan_keys) ? productsData.plan_keys : [];
    const entitlementRaw =
      entitlements?.raw && typeof entitlements.raw === "object" ? entitlements.raw : {};

    const normalized = rawPlans
      .map((plan) => {
        const planKey = String(plan?.plan_key || plan?.key || plan?.id || "").trim();
        if (!planKey) {
          return null;
        }
        return {
          plan_key: planKey,
          name: String(plan?.name || plan?.label || planKey).trim() || planKey,
          status: normalizeMembershipPlanStatus(plan?.status),
          trial_days: Number(plan?.trial_days || plan?.trialDays || 0) || 0,
          recommended:
            plan?.recommended === true ||
            String(plan?.recommended || "").toLowerCase() === "true",
          is_trial:
            String(planKey).toLowerCase() === "trial" ||
            Number(plan?.trial_days || plan?.trialDays || 0) > 0
        };
      })
      .filter(Boolean);

    if (!normalized.length && planKeys.length) {
      planKeys.forEach((planKeyRaw) => {
        const planKey = String(planKeyRaw || "").trim();
        if (!planKey) {
          return;
        }
        normalized.push({
          plan_key: planKey,
          name: planKey,
          status: "active",
          trial_days: planKey.toLowerCase() === "trial" ? 7 : 0,
          recommended: false,
          is_trial: planKey.toLowerCase() === "trial"
        });
      });
    }

    const currentPlanKey = String(
      entitlementRaw.plan_key || entitlementRaw.plan || entitlementRaw.tier || ""
    ).trim();
    if (
      currentPlanKey &&
      !normalized.some((plan) => String(plan.plan_key || "").toLowerCase() === currentPlanKey.toLowerCase())
    ) {
      normalized.push({
        plan_key: currentPlanKey,
        name: String(entitlementRaw.plan_name || entitlementRaw.plan || currentPlanKey).trim() || currentPlanKey,
        status: normalizeMembershipPlanStatus(entitlementRaw.status),
        trial_days: currentPlanKey.toLowerCase() === "trial" ? 7 : 0,
        recommended: false,
        is_trial: currentPlanKey.toLowerCase() === "trial"
      });
    }

    const deduped = new Map();
    normalized.forEach((plan) => {
      const key = String(plan.plan_key || "").trim().toLowerCase();
      if (!key || deduped.has(key)) {
        return;
      }
      deduped.set(key, plan);
    });
    return Array.from(deduped.values());
  };

  const renderMembershipPlanOptions = ({
    plans = [],
    selectedPlanKey = ""
  } = {}) => {
    if (!elements.membershipPlanSelect) {
      return;
    }
    elements.membershipPlanSelect.innerHTML = "";
    if (!plans.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No plans available";
      elements.membershipPlanSelect.appendChild(option);
      return;
    }
    plans.forEach((plan) => {
      const option = document.createElement("option");
      const key = String(plan.plan_key || "").trim();
      option.value = key;
      const flags = [];
      if (plan.is_trial) {
        flags.push("Trial");
      }
      if (plan.recommended) {
        flags.push("Recommended");
      }
      const suffix = flags.length ? ` (${flags.join(", ")})` : "";
      option.textContent = `${formatMembershipPlanName(plan.name || key, key)}${suffix}`;
      elements.membershipPlanSelect.appendChild(option);
    });
    const normalizedSelectedKey = String(selectedPlanKey || "").trim().toLowerCase();
    if (normalizedSelectedKey) {
      const selected = plans.find(
        (plan) => String(plan.plan_key || "").trim().toLowerCase() === normalizedSelectedKey
      );
      if (selected) {
        elements.membershipPlanSelect.value = selected.plan_key;
        return;
      }
    }
    elements.membershipPlanSelect.value = selectedPlanKey || plans[0]?.plan_key || "";
  };

  const syncMembershipPlanSelectionUI = () => {
    const context = state.membershipContext || {};
    const selectedPlanKey = setMembershipSelectedPlanKey(getMembershipSelectedPlanKey(), {
      plans: Array.isArray(context.plans) ? context.plans : [],
      currentPlanKey: String(context.current_plan_key || context.plan_key || "").trim()
    });

    renderMembershipPlanOptions({
      plans: Array.isArray(context.plans) ? context.plans : [],
      selectedPlanKey
    });
    renderMembershipPlanCards({
      plans: Array.isArray(context.plans) ? context.plans : [],
      selectedPlanKey,
      currentPlanKey: String(context.current_plan_key || "").trim(),
      context
    });
  };

  const setMembershipButtonsDisabled = (disabled) => {
    ensureMembershipUiState().action_busy = Boolean(disabled);
  };

  const getWorkspaceHubUrl = () => {
    const baseUrl = String(window.OnlineChatAdminConfig?.saasCoreBaseUrl || "").trim().replace(/\/+$/, "");
    return baseUrl ? `${baseUrl}/portal` : "";
  };

  const openWorkspaceHub = () => {
    const url = getWorkspaceHubUrl();
    if (!url) {
      throw new Error("Workspace hub URL is not configured");
    }
    window.open(url, "_blank", "noopener");
  };

  const openInstallGuide = () => {
    const developerTabButton = document.querySelector("[data-settings-tab='developer']");
    if (!developerTabButton) {
      throw new Error("Developer settings tab is unavailable");
    }
    developerTabButton.click();
  };

  const resolveMembershipPrimaryAction = (context = {}) => {
    return resolveSaasPrimaryAction({
      enabled: state.saas?.enabled,
      tenantId: context.tenant_id,
      role: context.role,
      nextAction: context.next_action,
      customerState: context.customer_state || context.plan_status,
      workspaceReady: context.workspace_ready,
      entitled: context.entitled,
      canStartTrial: context.can_start_trial,
      canUpgrade: context.can_upgrade,
      canManageBilling: context.can_manage_billing,
      busy: Boolean(ensureMembershipUiState().action_busy),
      trialPlanAvailable: (Array.isArray(context.plans) ? context.plans : []).some((plan) => Boolean(plan?.is_trial)),
      upgradePlanAvailable: Boolean(
        pickSaasUpgradePlan(context.plans, context.current_plan_key || context.plan_key || "")?.plan_key
      )
    });
  };

  const updateMembershipActionState = () => {
    const context = state.membershipContext || {};
    const lockedByStatus =
      !state.saas?.enabled || !context.tenant_id || Boolean(ensureMembershipUiState().action_busy);
    const canManageBilling = Boolean(context.can_manage_billing);
    const primaryAction = resolveMembershipPrimaryAction(context);
    if (elements.membershipPrimaryActionBtn) {
      elements.membershipPrimaryActionBtn.hidden = Boolean(primaryAction.hidden);
      elements.membershipPrimaryActionBtn.disabled = Boolean(primaryAction.disabled);
      elements.membershipPrimaryActionBtn.textContent = primaryAction.label || "Take action";
      elements.membershipPrimaryActionBtn.dataset.action = primaryAction.action || "";
      elements.membershipPrimaryActionBtn.title = primaryAction.title || "";
    }
    if (elements.membershipInstallBtn) {
      const installVisible = Boolean(context.tenant_id);
      const installDisabled = lockedByStatus || !context.workspace_ready || !context.entitled;
      elements.membershipInstallBtn.hidden = !installVisible;
      elements.membershipInstallBtn.disabled = installDisabled;
      elements.membershipInstallBtn.title = installDisabled
        ? "Workspace must be active and ready before you install the widget"
        : "";
    }
    if (elements.membershipWorkspacePortalBtn) {
      const workspaceHubUrl = getWorkspaceHubUrl();
      elements.membershipWorkspacePortalBtn.hidden = !context.tenant_id || !workspaceHubUrl;
      elements.membershipWorkspacePortalBtn.disabled = lockedByStatus || !workspaceHubUrl;
      elements.membershipWorkspacePortalBtn.title = workspaceHubUrl ? "" : "Workspace hub URL is not configured";
    }
    if (elements.membershipBillingBtn) {
      elements.membershipBillingBtn.disabled = lockedByStatus || !canManageBilling;
      elements.membershipBillingBtn.hidden = !context.tenant_id;
      elements.membershipBillingBtn.title = lockedByStatus
        ? "Select a workspace first"
        : !canManageBilling
          ? "Billing is available to workspace owners/admins only"
          : "";
    }
    syncMembershipPlanSelectionUI();
  };

  const bindMembershipRefresh = () => {
    if (!elements.membershipRefreshBtn || elements.membershipRefreshBtn.dataset.bound === "1") {
      return;
    }
    elements.membershipRefreshBtn.dataset.bound = "1";
    elements.membershipRefreshBtn.addEventListener("click", async () => {
      try {
        await loadMembershipStatus({ silent: false });
      } catch (err) {
        if (elements.membershipStatusMessage) {
          elements.membershipStatusMessage.textContent = err?.message || "Failed to load membership status";
        }
      }
    });
  };

  const bindMembershipPlanPicker = () => {
    if (elements.membershipPlanCards && elements.membershipPlanCards.dataset.bound !== "1") {
      elements.membershipPlanCards.dataset.bound = "1";
      const selectPlanFromCard = (card) => {
        const context = state.membershipContext || {};
        const planKey = String(card?.dataset.planKey || "").trim();
        if (!planKey) {
          return "";
        }
        return setMembershipSelectedPlanKey(planKey, {
          plans: Array.isArray(context.plans) ? context.plans : [],
          currentPlanKey: String(context.current_plan_key || "").trim()
        });
      };

      elements.membershipPlanCards.addEventListener("click", async (event) => {
        const card = event.target.closest("[data-plan-key]");
        if (!card) {
          return;
        }
        const selectedPlanKey = selectPlanFromCard(card);
        updateMembershipActionState();

        const actionButton = event.target.closest("[data-plan-action]");
        if (!actionButton || actionButton.disabled) {
          return;
        }
        const action = String(actionButton.dataset.planAction || "").trim().toLowerCase();
        event.preventDefault();
        if (action === "trial") {
          await withMembershipAction(async () => {
            const { tenantId, role } = getMembershipActionContext(selectedPlanKey);
            if (!tenantId) {
              throw new Error("Select workspace first");
            }
            if (!["owner", "admin"].includes(role)) {
              throw new Error("Only owner/admin can start a trial");
            }
            await fetchJson(`${API_BASE}/admin/saas/tenants/${encodeURIComponent(tenantId)}/trial`, {
              method: "POST",
              body: JSON.stringify({})
            });
            await loadMembershipStatus({ silent: false });
          }, "Failed to start trial");
        } else if (action === "upgrade") {
          await withMembershipAction(async () => {
            const { tenantId, role, planKey } = getMembershipActionContext(selectedPlanKey);
            if (!tenantId) {
              throw new Error("Select workspace first");
            }
            if (!["owner", "admin"].includes(role)) {
              throw new Error("Only owner/admin can upgrade plan");
            }
            if (!planKey) {
              throw new Error("Select a plan first");
            }
            await openMembershipCheckout({ tenantId, planKey });
          }, "Failed to create checkout session");
        }
      });

      elements.membershipPlanCards.addEventListener("keydown", (event) => {
        const card = event.target.closest("[data-plan-key]");
        if (!card || !["Enter", " "].includes(event.key)) {
          return;
        }
        if (event.target.closest("[data-plan-action]")) {
          return;
        }
        event.preventDefault();
        selectPlanFromCard(card);
        updateMembershipActionState();
      });
    }
  };

  const getMembershipActionContext = (planKeyOverride = "") => {
    const context = state.membershipContext || {};
    const tenantId = String(context.tenant_id || state.saas?.selectedTenantId || "").trim();
    const role = String(context.role || "").toLowerCase();
    const selectedPlanKey = String(
      planKeyOverride || getMembershipSelectedPlanKey() || context.plan_key || ""
    ).trim();
    const selectedPlan = getMembershipPlanByKey(context.plans, selectedPlanKey);
    return {
      tenantId,
      role,
      planKey: selectedPlan?.plan_key || selectedPlanKey,
      selectedPlan,
      plans: Array.isArray(context.plans) ? context.plans : [],
      can_manage_billing: Boolean(context.can_manage_billing),
      can_start_trial: Boolean(context.can_start_trial),
      can_upgrade: Boolean(context.can_upgrade),
      currentPlanKey: String(context.current_plan_key || context.plan_key || "").trim()
    };
  };

  const openMembershipCheckout = async ({ tenantId, planKey }) => {
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
    window.location.href = url;
  };

  const openMembershipCustomerPortal = async ({ tenantId }) => {
    const response = await fetchJson(
      `${API_BASE}/admin/saas/tenants/${encodeURIComponent(tenantId)}/customer-portal`,
      {
        method: "POST",
        body: JSON.stringify({})
      }
    );
    const url = String(response?.url || "").trim();
    if (!url) {
      throw new Error("Customer portal URL was not returned");
    }
    window.location.href = url;
  };

  const withMembershipAction = async (callback, fallbackErrorMessage) => {
    setMembershipButtonsDisabled(true);
    try {
      await callback();
    } catch (err) {
      if (elements.membershipStatusMessage) {
        elements.membershipStatusMessage.textContent =
          err?.message || fallbackErrorMessage || "Membership action failed";
      }
    } finally {
      updateMembershipActionState();
    }
  };

  const bindMembershipActions = () => {
    if (!elements.membershipPanel || elements.membershipPanel.dataset.actionsBound === "1") {
      return;
    }
    elements.membershipPanel.dataset.actionsBound = "1";

    if (elements.membershipPrimaryActionBtn) {
      elements.membershipPrimaryActionBtn.addEventListener("click", async () => {
        const action = String(elements.membershipPrimaryActionBtn.dataset.action || "").trim().toLowerCase();
        if (!action || elements.membershipPrimaryActionBtn.disabled) {
          return;
        }
        await withMembershipAction(async () => {
          if (action === "trial") {
            const { tenantId, role } = getMembershipActionContext();
            if (!tenantId) {
              throw new Error("Select workspace first");
            }
            if (!["owner", "admin"].includes(role)) {
              throw new Error("Only owner/admin can start a trial");
            }
            await fetchJson(`${API_BASE}/admin/saas/tenants/${encodeURIComponent(tenantId)}/trial`, {
              method: "POST",
              body: JSON.stringify({})
            });
            await loadMembershipStatus({ silent: false });
            return;
          }

          if (action === "upgrade") {
            const context = state.membershipContext || {};
            const chosenPlan =
              getMembershipActionContext().selectedPlan ||
              pickSaasUpgradePlan(context.plans, context.current_plan_key || context.plan_key || "");
            const { tenantId, role } = getMembershipActionContext(chosenPlan?.plan_key || "");
            if (!tenantId) {
              throw new Error("Select workspace first");
            }
            if (!["owner", "admin"].includes(role)) {
              throw new Error("Only owner/admin can upgrade plan");
            }
            if (!chosenPlan?.plan_key) {
              throw new Error("No upgrade plan is available");
            }
            await openMembershipCheckout({ tenantId, planKey: chosenPlan.plan_key });
            return;
          }

          if (action === "billing") {
            const { tenantId, role } = getMembershipActionContext();
            if (!tenantId) {
              throw new Error("Select workspace first");
            }
            if (!["owner", "admin"].includes(role)) {
              throw new Error("Only owner/admin can manage billing");
            }
            await openMembershipCustomerPortal({ tenantId });
            return;
          }

          if (action === "install") {
            openInstallGuide();
            return;
          }

          if (action === "refresh") {
            await loadMembershipStatus({ silent: false });
          }
        }, "Failed to complete workspace action");
      });
    }

    if (elements.membershipBillingBtn) {
      elements.membershipBillingBtn.addEventListener("click", async () => {
        await withMembershipAction(async () => {
          const { tenantId, role } = getMembershipActionContext();
          if (!tenantId) {
            throw new Error("Select workspace first");
          }
          if (!["owner", "admin"].includes(role)) {
            throw new Error("Only owner/admin can manage billing");
          }
          await openMembershipCustomerPortal({ tenantId });
        }, "Failed to open billing");
      });
    }

    if (elements.membershipInstallBtn) {
      elements.membershipInstallBtn.addEventListener("click", async () => {
        await withMembershipAction(async () => {
          const context = state.membershipContext || {};
          if (!context.workspace_ready || !context.entitled) {
            throw new Error("Workspace is not ready to install yet");
          }
          openInstallGuide();
        }, "Failed to open install guide");
      });
    }

    if (elements.membershipWorkspacePortalBtn) {
      elements.membershipWorkspacePortalBtn.addEventListener("click", async () => {
        await withMembershipAction(async () => {
          openWorkspaceHub();
        }, "Failed to open workspace hub");
      });
    }
  };

    const loadMembershipStatus = async ({ silent = true } = {}) => {
    if (!elements.membershipPanel) {
      return;
    }

    const memberships = Array.isArray(state.saas?.memberships) ? state.saas.memberships : [];
    const selectedTenantId = String(state.saas?.selectedTenantId || "").trim();
    const selectedMembership = memberships.find(
      (membership) => String(membership?.tenant_id || "") === selectedTenantId
    );
    const membershipRole = String(selectedMembership?.role || "").toLowerCase();

    state.membershipContext = {
      tenant_id: selectedTenantId,
      role: membershipRole,
      customer_state: "",
      plan_status: "",
      plan_key: "",
      plans: [],
      workspace_ready: false,
      workspace_reason: "",
      entitled: false,
      paywall: null,
      next_action: "none",
      setup_state: "not_started",
      billing_state: "none",
      billing_source: "none",
      launch_allowed: false,
      launch_target_url: "",
      workspace_portal_url: getWorkspaceHubUrl()
    };
    setMembershipSelectedPlanKey("", { plans: [], currentPlanKey: "" });

    if (elements.membershipWorkspaceName) {
      elements.membershipWorkspaceName.textContent = getMembershipDisplayName({
        membershipName: selectedMembership?.name,
        tenantId: selectedTenantId
      });
    }
    if (elements.membershipWorkspaceId) {
      elements.membershipWorkspaceId.textContent = selectedTenantId || "-";
      elements.membershipWorkspaceId.className = "badge neutral";
    }

    if (!state.saas?.enabled) {
      setMembershipBadge(elements.membershipConnectionBadge, "Disconnected", "warning");
      setMembershipBadge(elements.membershipConnectionBadgeHero, "Disconnected", "warning");
      setMembershipBadge(elements.membershipProductBadge, "Not available", "neutral");
      setMembershipBadge(elements.membershipReadyBadge, "N/A", "neutral");
      setMembershipBadge(elements.membershipEntitlementBadge, "N/A", "neutral");
      setMembershipBadge(elements.membershipEntitlementBadgeHero, "SaaS disabled", "neutral");
      setMembershipBadge(elements.membershipRoleBadge, formatMembershipText(membershipRole || "member"), "neutral");
      if (elements.membershipReadyTitle) {
        elements.membershipReadyTitle.textContent = "SaaS disabled";
      }
      if (elements.membershipReadyReason) {
        elements.membershipReadyReason.textContent = "Enable SaaS integration to see subscription details.";
      }
      if (elements.membershipPlanLabel) {
        elements.membershipPlanLabel.textContent = "-";
      }
      if (elements.membershipStatusMessage) {
        elements.membershipStatusMessage.textContent = "SaaS Core integration is disabled in this environment.";
      }
      setMembershipTimeline({
        label: "Timeline",
        value: "Unavailable",
        meta: "Enable SaaS to load plan details."
      });
      renderMembershipList(elements.membershipProductsList, [], "No status");
      renderMembershipList(elements.membershipFlagsList, [], "No actions");
      renderMembershipList(elements.membershipLimitsList, [], "No notes");
      renderMembershipChecklist([]);
      renderMembershipPlanOptions({ plans: [], selectedPlanKey: "" });
      syncMembershipPlanSelectionUI();
      updateMembershipActionState();
      return;
    }

    if (!selectedTenantId) {
      setMembershipBadge(elements.membershipConnectionBadge, "Not connected", "warning");
      setMembershipBadge(elements.membershipConnectionBadgeHero, "Not connected", "warning");
      setMembershipBadge(elements.membershipProductBadge, "Unknown", "neutral");
      setMembershipBadge(elements.membershipReadyBadge, "Unknown", "neutral");
      setMembershipBadge(elements.membershipEntitlementBadge, "Unknown", "neutral");
      setMembershipBadge(elements.membershipEntitlementBadgeHero, "No plan loaded", "neutral");
      setMembershipBadge(elements.membershipRoleBadge, formatMembershipText(membershipRole || "member"), "neutral");
      if (elements.membershipReadyTitle) {
        elements.membershipReadyTitle.textContent = "Select a workspace";
      }
      if (elements.membershipReadyReason) {
        elements.membershipReadyReason.textContent = "Choose a workspace in the header.";
      }
      if (elements.membershipPlanLabel) {
        elements.membershipPlanLabel.textContent = "-";
      }
      if (elements.membershipStatusMessage) {
        elements.membershipStatusMessage.textContent = "Select a workspace to see its trial, billing status, and next steps.";
      }
      setMembershipTimeline({
        label: "Timeline",
        value: "Waiting for workspace",
        meta: "Select a workspace to load billing dates."
      });
      renderMembershipList(elements.membershipProductsList, [], "No status");
      renderMembershipList(elements.membershipFlagsList, [], "No actions");
      renderMembershipList(elements.membershipLimitsList, [], "No notes");
      renderMembershipChecklist([]);
      renderMembershipPlanOptions({ plans: [], selectedPlanKey: "" });
      syncMembershipPlanSelectionUI();
      updateMembershipActionState();
      return;
    }

    setMembershipBadge(elements.membershipConnectionBadge, "Checking...", "neutral");
    setMembershipBadge(elements.membershipConnectionBadgeHero, "Checking...", "neutral");
    setMembershipBadge(elements.membershipRoleBadge, formatMembershipText(membershipRole || "member"), "neutral");
    if (elements.membershipStatusMessage) {
      elements.membershipStatusMessage.textContent = "Loading workspace plan and access details...";
    }
    setMembershipTimeline({
      label: "Timeline",
      value: "Loading...",
      meta: "Loading workspace plan and access."
    });

    try {
      const safeTenantId = encodeURIComponent(selectedTenantId);
      const overviewData = await fetchJson(`${API_BASE}/admin/saas/tenants/${safeTenantId}/overview`);
      const overview = overviewData?.overview && typeof overviewData.overview === "object" ? overviewData.overview : {};
      const workspaceSummary =
        overview?.summary && typeof overview.summary === "object" ? overview.summary : {};
      const products = Array.isArray(overview.products) ? overview.products : [];
      const productSummary =
        products.find(
          (item) => String(item?.product_key || "").trim().toLowerCase() === String(state.saas?.productKey || "chat_widget").trim().toLowerCase()
        ) || products[0] || {};
      const onboarding =
        overview?.onboarding && typeof overview.onboarding === "object" ? overview.onboarding : {};
      const billing =
        overview?.billing && typeof overview.billing === "object" ? overview.billing : {};

      const workspaceName = getMembershipDisplayName({
        workspaceName: String(overview?.workspace?.name || "").trim(),
        membershipName: selectedMembership?.name,
        tenantId: selectedTenantId
      });
      const workspaceId = String(overview?.workspace?.id || selectedTenantId || "").trim();
      const customerState = String(productSummary?.customer_state || workspaceSummary?.customer_state || "no_access").trim();
      const setupState = String(productSummary?.setup_state || workspaceSummary?.setup_state || "not_started").trim();
      const currentPlan = String(productSummary?.current_plan || workspaceSummary?.current_plan || "").trim();
      const displayMessage = String(productSummary?.display_message || workspaceSummary?.display_message || "").trim();
      const canManageBilling = Boolean(productSummary?.can_manage_billing || workspaceSummary?.can_manage_billing || billing?.can_manage_billing);
      const canStartTrial = Boolean(productSummary?.can_start_trial || workspaceSummary?.can_start_trial);
      const canUpgrade = Boolean(productSummary?.can_upgrade || workspaceSummary?.can_upgrade);
      const billingState = String(productSummary?.billing_state || billing?.billing_state || workspaceSummary?.billing_state || "none").trim();
      const billingSource = String(productSummary?.billing_source || billing?.billing_source || workspaceSummary?.billing_source || "none").trim();
      const nextAction = String(productSummary?.next_action || billing?.next_action || workspaceSummary?.next_action || "none").trim();
      const periodStartRaw = productSummary?.period_start || billing?.period_start || workspaceSummary?.period_start || null;
      const periodEndRaw = productSummary?.period_end || billing?.period_end || workspaceSummary?.period_end || null;
      const periodEndText = formatMembershipDate(periodEndRaw);
      const daysRemaining = getMembershipDaysRemaining(periodEndRaw);
      const launchAllowed = Boolean(productSummary?.launch_allowed);
      const launchTargetUrl = String(productSummary?.launch_target_url || "").trim();
      const billingTone = ["active", "paid", "current", "trialing", "trial_active"].includes(billingState)
        ? "success"
        : ["past_due", "suspended", "unpaid"].includes(billingState)
          ? "warning"
          : "neutral";
      const plansSource = Array.isArray(productSummary?.plans) && productSummary.plans.length
        ? productSummary.plans
        : Array.isArray(state.saas?.plans)
          ? state.saas.plans
          : [];
      const plans = plansSource
        .map((plan) => {
          const planKey = String(plan?.plan_key || plan?.key || "").trim();
          if (!planKey) {
            return null;
          }
          return {
            plan_key: planKey,
            name: String(plan?.display_name || plan?.name || planKey || "Plan").trim(),
            status: String(plan?.tenant_status || plan?.status || "").trim().toLowerCase(),
            trial_days: Number(plan?.trial_days || 0) || 0,
            recommended:
              plan?.recommended === true ||
              String(plan?.recommended || "").trim().toLowerCase() === "true",
            is_trial:
              Number(plan?.trial_days || 0) > 0 || planKey.toLowerCase() === "trial",
            action_type: String(plan?.action?.type || plan?.action_type || "").trim().toLowerCase()
          };
        })
        .filter(Boolean);
      const selectedPlanKey = setMembershipSelectedPlanKey(getMembershipSelectedPlanKey(), {
        plans,
        currentPlanKey: String(currentPlan || "").trim()
      });
      const workspaceReady = Boolean(productSummary?.workspace_ready) || setupState === "ready";
      const workspaceReason = displayMessage || (workspaceReady ? "Workspace is connected and ready." : "Workspace is not ready yet.");

      setMembershipBadge(elements.membershipConnectionBadge, "Connected", "success");
      setMembershipBadge(elements.membershipConnectionBadgeHero, "Connected", "success");
      setMembershipBadge(
        elements.membershipProductBadge,
        customerState.replace(/_/g, " "),
        ["active", "trial_active"].includes(customerState) ? "success" : "warning"
      );
      setMembershipBadge(
        elements.membershipReadyBadge,
        setupState.replace(/_/g, " "),
        workspaceReady ? "success" : "warning"
      );
      setMembershipBadge(
        elements.membershipEntitlementBadge,
        billingState.replace(/_/g, " "),
        billingTone
      );
      setMembershipBadge(
        elements.membershipEntitlementBadgeHero,
        billingState.replace(/_/g, " "),
        billingTone
      );
      setMembershipBadge(
        elements.membershipRoleBadge,
        formatMembershipText(membershipRole || "member"),
        ["owner", "admin"].includes(membershipRole) ? "success" : "neutral"
      );

      if (elements.membershipWorkspaceName) {
        elements.membershipWorkspaceName.textContent = workspaceName;
      }
      if (elements.membershipWorkspaceId) {
        elements.membershipWorkspaceId.textContent = workspaceId || "-";
        elements.membershipWorkspaceId.className = "badge neutral";
      }
      if (elements.membershipProductName) {
        elements.membershipProductName.textContent = String(productSummary?.label || productSummary?.name || "Chat Widget");
      }
      if (elements.membershipReadyTitle) {
        elements.membershipReadyTitle.textContent = setupState.replace(/_/g, " ") || "Unknown";
      }
      if (elements.membershipReadyReason) {
        elements.membershipReadyReason.textContent = workspaceReason;
      }
      if (elements.membershipPlanLabel) {
        elements.membershipPlanLabel.textContent = formatMembershipPlanName(currentPlan, "-");
      }
      if (elements.membershipStatusMessage) {
        elements.membershipStatusMessage.textContent =
          resolveSaasStatusMessage({
            surface: "membership",
            role: membershipRole,
            customerState,
            nextAction,
            displayMessage,
            periodEndText
          });
      }

      if (customerState.startsWith("trial")) {
        setMembershipTimeline({
          label: "Trial countdown",
          value:
            daysRemaining === null
              ? periodEndText
              : daysRemaining > 0
                ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`
                : daysRemaining === 0
                  ? "Ends today"
                  : "Trial ended",
          meta: periodEndRaw
            ? `${periodStartRaw ? `Started ${formatMembershipDate(periodStartRaw)}. ` : ""}Trial ends ${periodEndText}.`
            : "Trial date not available."
        });
      } else if (periodEndRaw) {
        setMembershipTimeline({
          label: "Renewal",
          value:
            daysRemaining === null
              ? periodEndText
              : daysRemaining > 0
                ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} until renewal`
                : daysRemaining === 0
                  ? "Renews today"
                  : `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? "" : "s"} overdue`,
          meta: `${periodStartRaw ? `Active from ${formatMembershipDate(periodStartRaw)}. ` : ""}Renews ${periodEndText}. Next: ${formatMembershipText(nextAction, "None")}.`
        });
      } else {
        setMembershipTimeline({
          label: "Timeline",
          value: formatMembershipText(nextAction, "No billing event"),
          meta: "No renewal date yet."
        });
      }

      const productItems = [
        {
          label: formatMembershipText(customerState, "Unknown"),
          tone: ["active", "trial_active"].includes(customerState) ? "success" : "neutral"
        },
        {
          label: currentPlan ? `Plan ${formatMembershipPlanName(currentPlan, currentPlan)}` : "No plan selected",
          tone: "neutral"
        },
        {
          label: periodEndText === "-" ? "No end date" : `Until ${periodEndText}`,
          tone: "neutral"
        }
      ];

      const actionItems = [
        {
          label: `Next: ${formatMembershipText(nextAction, "None")}`,
          tone: nextAction && nextAction !== "none" ? "success" : "neutral"
        },
        {
          label: launchAllowed ? "Install ready" : "Install blocked",
          tone: launchAllowed ? "success" : "neutral"
        },
        {
          label: `Billing via ${formatMembershipText(billingSource, "None")}`,
          tone: billingSource && billingSource !== "none" ? "success" : "neutral"
        }
      ];

      const diagnosticsItems = (Array.isArray(workspaceSummary?.attention_flags) ? workspaceSummary.attention_flags : [])
        .slice(0, 3)
        .map((flag) => ({
          label: formatMembershipText(flag, String(flag || "").trim() || "Flag"),
          tone: String(flag || "").includes("payment") || String(flag || "").includes("blocked") ? "warning" : "neutral"
        }));

      const nextStepKey = String(onboarding?.next_step?.key || "").trim();
      const checklistItems = Array.isArray(onboarding?.steps) && onboarding.steps.length
        ? onboarding.steps.map((step) => {
            const actionKey = String(step?.action || "").trim().toLowerCase();
            const isComplete = Boolean(step?.completed);
            return {
              state: isComplete ? "done" : String(step?.key || "").trim() === nextStepKey ? "pending" : "locked",
              icon:
                isComplete
                  ? "done"
                  : actionKey === "launch"
                    ? "launch"
                    : actionKey === "products"
                      ? "billing"
                      : actionKey === "team"
                        ? "access"
                        : "pending",
              title: String(step?.label || step?.key || "Next step").trim(),
              text: isComplete ? "Done." : String(step?.description || "Continue in this workspace.").trim()
            };
          })
        : [
            {
              state: workspaceReady ? "done" : "pending",
              icon: workspaceReady ? "done" : "pending",
              title: "Workspace",
              text: workspaceReady ? "Connected." : workspaceReason || "Finish setup."
            }
          ];

      state.membershipContext = {
        tenant_id: selectedTenantId,
        role: membershipRole,
        customer_state: customerState,
        plan_status: customerState,
        plan_key: selectedPlanKey,
        current_plan_key: String(currentPlan || "").trim(),
        plans,
        workspace_ready: workspaceReady,
        workspace_reason: workspaceReason,
        entitled: !["no_access", "archived"].includes(customerState),
        paywall: null,
        can_manage_billing: canManageBilling,
        can_start_trial: canStartTrial,
        can_upgrade: canUpgrade,
        billing_state: billingState,
        billing_source: billingSource,
        next_action: nextAction,
        setup_state: setupState,
        period_start: periodStartRaw,
        period_end: periodEndRaw,
        launch_allowed: launchAllowed,
        launch_target_url: launchTargetUrl,
        workspace_portal_url: getWorkspaceHubUrl(),
        summary: productSummary
      };

      renderMembershipPlanOptions({ plans, selectedPlanKey });
      syncMembershipPlanSelectionUI();
      renderMembershipList(elements.membershipProductsList, productItems, "No status");
      renderMembershipList(elements.membershipFlagsList, actionItems, "No actions");
      renderMembershipList(
        elements.membershipLimitsList,
        diagnosticsItems.length ? diagnosticsItems : [{ label: "See Developer > Advanced if needed", tone: "neutral" }],
        "No notes"
      );
      renderMembershipChecklist(checklistItems);
      updateMembershipActionState();
    } catch (err) {
      state.membershipContext = {
        tenant_id: selectedTenantId,
        role: membershipRole,
        customer_state: "",
        plan_status: "",
        plan_key: "",
        current_plan_key: "",
        plans: [],
        workspace_ready: false,
        workspace_reason: "",
        entitled: false,
        paywall: null,
        next_action: "none",
        setup_state: "not_started",
        billing_state: "none",
        billing_source: "none",
        launch_allowed: false,
        launch_target_url: "",
        workspace_portal_url: getWorkspaceHubUrl()
      };
      setMembershipSelectedPlanKey("", { plans: [], currentPlanKey: "" });
      setMembershipBadge(elements.membershipConnectionBadge, "Error", "error");
      setMembershipBadge(elements.membershipConnectionBadgeHero, "Error", "error");
      setMembershipBadge(elements.membershipProductBadge, "Unknown", "neutral");
      setMembershipBadge(elements.membershipReadyBadge, "Unknown", "neutral");
      setMembershipBadge(elements.membershipEntitlementBadge, "Unknown", "neutral");
      setMembershipBadge(elements.membershipEntitlementBadgeHero, "Unknown", "neutral");
      setMembershipBadge(elements.membershipRoleBadge, formatMembershipText(membershipRole || "member"), "neutral");
      if (elements.membershipReadyTitle) {
        elements.membershipReadyTitle.textContent = "Failed to load";
      }
      if (elements.membershipReadyReason) {
        elements.membershipReadyReason.textContent = "";
      }
      if (elements.membershipPlanLabel) {
        elements.membershipPlanLabel.textContent = "-";
      }
      if (elements.membershipStatusMessage) {
        elements.membershipStatusMessage.textContent = err?.message || "Failed to load workspace plan and access details.";
      }
      setMembershipTimeline({
        label: "Timeline",
        value: "Unavailable",
        meta: "Could not load plan details."
      });
      renderMembershipList(elements.membershipProductsList, [], "No status");
      renderMembershipList(elements.membershipFlagsList, [], "No actions");
      renderMembershipList(elements.membershipLimitsList, [], "No notes");
      renderMembershipChecklist([]);
      renderMembershipPlanOptions({ plans: [], selectedPlanKey: "" });
      syncMembershipPlanSelectionUI();
      updateMembershipActionState();
      if (!silent) {
        throw err;
      }
    }
  };

  const applyWidgetIconTemplate = (style) => {
    const next = normalizeWidgetIconStyle(style);
    if (elements.settingIconStyle) {
      elements.settingIconStyle.value = next;
    }
    if (elements.widgetIconTemplates) {
      const chips = elements.widgetIconTemplates.querySelectorAll("[data-style]");
      chips.forEach((chip) => {
        const isActive = chip.dataset.style === next;
        chip.classList.toggle("is-active", isActive);
        chip.setAttribute("aria-checked", isActive ? "true" : "false");
      });
    }
    if (elements.previewLauncher) {
      const className = `style-${next}`;
      elements.previewLauncher.classList.remove(
        ...widgetIconStyles.map((item) => `style-${item}`)
      );
      elements.previewLauncher.classList.add(className);
    }
  };

  const bindWidgetIconTemplatePicker = () => {
    if (!elements.widgetIconTemplates || elements.widgetIconTemplates.dataset.bound === "1") {
      return;
    }
    elements.widgetIconTemplates.dataset.bound = "1";
    elements.widgetIconTemplates.addEventListener("click", (event) => {
      const button = event.target.closest("[data-style]");
      if (!button) {
        return;
      }
      const next = normalizeWidgetIconStyle(button.dataset.style);
      applyWidgetIconTemplate(next);
      markSettingsDirty();
      updateWidgetPreview();
    });
  };

  const applyWidgetIconShape = (shape) => {
    const next = normalizeWidgetIconShape(shape);
    if (elements.settingIconShape) {
      elements.settingIconShape.value = next;
    }
    if (elements.widgetShapeTemplates) {
      const chips = elements.widgetShapeTemplates.querySelectorAll("[data-shape]");
      chips.forEach((chip) => {
        const isActive = chip.dataset.shape === next;
        chip.classList.toggle("is-active", isActive);
        chip.setAttribute("aria-checked", isActive ? "true" : "false");
      });
    }
    if (elements.previewLauncher) {
      elements.previewLauncher.classList.remove(
        "shape-circle",
        "shape-rounded",
        "shape-square",
        "shape-pill"
      );
      elements.previewLauncher.classList.add(`shape-${next}`);
    }
  };

  const bindWidgetIconShapePicker = () => {
    if (!elements.widgetShapeTemplates || elements.widgetShapeTemplates.dataset.bound === "1") {
      return;
    }
    elements.widgetShapeTemplates.dataset.bound = "1";
    elements.widgetShapeTemplates.addEventListener("click", (event) => {
      const button = event.target.closest("[data-shape]");
      if (!button) {
        return;
      }
      applyWidgetIconShape(button.dataset.shape);
      markSettingsDirty();
      updateWidgetPreview();
    });
  };

  const applyWidgetIconGlyph = (glyph) => {
    const next = normalizeWidgetIconGlyph(glyph);
    if (elements.settingIconGlyph) {
      elements.settingIconGlyph.value = next;
    }
    if (elements.widgetGlyphTemplates) {
      const chips = elements.widgetGlyphTemplates.querySelectorAll("[data-glyph]");
      chips.forEach((chip) => {
        const isActive = chip.dataset.glyph === next;
        chip.classList.toggle("is-active", isActive);
        chip.setAttribute("aria-checked", isActive ? "true" : "false");
      });
    }
    if (elements.previewLauncher) {
      elements.previewLauncher.dataset.glyph = next;
    }
    if (elements.previewLauncherGlyph) {
      elements.previewLauncherGlyph.innerHTML = previewGlyphSvg[next] || previewGlyphSvg.chat;
    }
  };

  const bindWidgetIconGlyphPicker = () => {
    if (!elements.widgetGlyphTemplates || elements.widgetGlyphTemplates.dataset.bound === "1") {
      return;
    }
    elements.widgetGlyphTemplates.dataset.bound = "1";
    elements.widgetGlyphTemplates.addEventListener("click", (event) => {
      const button = event.target.closest("[data-glyph]");
      if (!button) {
        return;
      }
      applyWidgetIconGlyph(button.dataset.glyph);
      markSettingsDirty();
      updateWidgetPreview();
    });
  };

  const previewState = {
    open: false,
    replyTimer: null,
    typingTimer: null
  };

  const clearPreviewTimers = () => {
    if (previewState.replyTimer) {
      clearTimeout(previewState.replyTimer);
      previewState.replyTimer = null;
    }
    if (previewState.typingTimer) {
      clearTimeout(previewState.typingTimer);
      previewState.typingTimer = null;
    }
  };

  const isPreviewOnline = () => Boolean(elements.statusToggle?.checked);

  const getPreviewGreetingText = () => {
    const onlineGreeting = elements.settingsForm?.greeting_online_message?.value?.trim();
    const offlineGreeting = elements.settingsForm?.greeting_offline_message?.value?.trim();
    if (isPreviewOnline()) {
      return onlineGreeting || "Hi! How can we help today?";
    }
    return offlineGreeting || onlineGreeting || "Thanks for reaching out!";
  };

  const setPreviewOpen = (open) => {
    const next = Boolean(open);
    previewState.open = next;
    if (elements.widgetPreview) {
      elements.widgetPreview.classList.toggle("is-open", next);
    }
    if (elements.previewChat) {
      elements.previewChat.setAttribute("aria-hidden", next ? "false" : "true");
    }
    if (elements.previewLauncher) {
      elements.previewLauncher.setAttribute("aria-expanded", next ? "true" : "false");
    }
  };

  const ensurePreviewGreetingBubble = () => {
    if (!elements.previewMessages) {
      return null;
    }
    let bubble = elements.previewMessages.querySelector("#preview-greeting") || elements.previewGreeting;
    if (!bubble) {
      bubble = document.createElement("div");
      bubble.id = "preview-greeting";
    }
    if (!bubble.isConnected) {
      elements.previewMessages.appendChild(bubble);
    }
    bubble.className = "widget-preview-bubble is-agent";
    bubble.textContent = getPreviewGreetingText();
    return bubble;
  };

  const resetPreviewConversation = ({ keepOpen = false } = {}) => {
    clearPreviewTimers();
    if (!elements.previewMessages) {
      return;
    }
    elements.previewMessages.innerHTML = "";
    const greeting = ensurePreviewGreetingBubble();
    if (greeting && greeting.parentElement !== elements.previewMessages) {
      elements.previewMessages.appendChild(greeting);
    }
    if (elements.previewInput) {
      elements.previewInput.value = "";
    }
    if (elements.previewVoiceDraft) {
      elements.previewVoiceDraft.hidden = !Boolean(elements.settingsVoiceEnabled?.checked);
    }
    if (elements.previewVoiceReplay) {
      elements.previewVoiceReplay.hidden = !Boolean(elements.settingsVoiceEnabled?.checked);
    }
    elements.previewMessages.scrollTop = elements.previewMessages.scrollHeight;
    if (keepOpen) {
      setPreviewOpen(true);
    }
  };

  const removePreviewTypingBubble = () => {
    if (!elements.previewMessages) {
      return;
    }
    const typing = elements.previewMessages.querySelector(".widget-preview-bubble.is-typing");
    if (typing) {
      typing.remove();
    }
  };

  const appendPreviewBubble = (text, sender, extraClass = "") => {
    if (!elements.previewMessages) {
      return null;
    }
    const bubble = document.createElement("div");
    bubble.className = `widget-preview-bubble ${sender === "user" ? "is-user" : "is-agent"} ${extraClass}`.trim();
    bubble.textContent = text;
    elements.previewMessages.appendChild(bubble);
    elements.previewMessages.scrollTop = elements.previewMessages.scrollHeight;
    return bubble;
  };

  const buildPreviewReply = (visitorText) => {
    const text = String(visitorText || "").toLowerCase();
    if (/price|pricing|cost|quote|how much/.test(text)) {
      return "For an accurate quote, share quantity and delivery country. I can prepare next steps right away.";
    }
    if (/delivery|ship|shipping|timeline|when/.test(text)) {
      return "Delivery depends on destination and production slot. Share your country and deadline, and I will confirm timing.";
    }
    if (/human|agent|person|call/.test(text)) {
      return "Sure. I can hand this over to a human agent and they will continue with you.";
    }
    if (!isPreviewOnline()) {
      const offline = elements.settingsForm?.offline_message?.value?.trim();
      return offline || "We are currently offline. Leave your details and we will reply soon.";
    }
    return "Thanks for your message. This is a live preview reply so you can test design and flow before saving.";
  };

  const sendPreviewMessage = () => {
    if (!elements.previewInput || !elements.previewMessages) {
      return;
    }
    const message = elements.previewInput.value.trim();
    if (!message) {
      return;
    }
    setPreviewOpen(true);
    appendPreviewBubble(message, "user");
    elements.previewInput.value = "";
    removePreviewTypingBubble();
    appendPreviewBubble("Typing...", "agent", "is-typing");
    clearPreviewTimers();
    const reply = buildPreviewReply(message);
    const delay = Math.max(450, Math.min(1700, 380 + message.length * 11));
    previewState.replyTimer = setTimeout(() => {
      removePreviewTypingBubble();
      appendPreviewBubble(reply, "agent");
      previewState.replyTimer = null;
    }, delay);
  };

  const bindWidgetPreviewSandbox = () => {
    if (!elements.widgetPreview || elements.widgetPreview.dataset.bound === "1") {
      return;
    }
    elements.widgetPreview.dataset.bound = "1";
    if (elements.previewLauncher) {
      elements.previewLauncher.addEventListener("click", () => {
        setPreviewOpen(!previewState.open);
      });
    }
    if (elements.previewClose) {
      elements.previewClose.addEventListener("click", () => setPreviewOpen(false));
    }
    if (elements.previewForm) {
      elements.previewForm.addEventListener("submit", (event) => {
        event.preventDefault();
        sendPreviewMessage();
      });
    }
    if (elements.previewVoice) {
      elements.previewVoice.addEventListener("click", () => {
        if (elements.previewVoice.hidden) {
          return;
        }
        setPreviewOpen(true);
        if (elements.previewVoiceDraft) {
          elements.previewVoiceDraft.hidden = false;
        }
        if (elements.previewInput) {
          elements.previewInput.value = "Voice draft ready - review before send.";
        }
        appendPreviewBubble("Voice mode preview is visual only. Record on the website, then review the transcript before sending it.", "agent");
      });
    }
    if (elements.previewVoiceReplay) {
      elements.previewVoiceReplay.addEventListener("click", () => {
        if (elements.previewVoiceReplay.hidden) {
          return;
        }
        setPreviewOpen(true);
        appendPreviewBubble("Spoken replies appear after the visitor sends the message. The live widget uses compact playback icons.", "agent");
      });
    }
    if (elements.previewReset) {
      elements.previewReset.addEventListener("click", () => resetPreviewConversation({ keepOpen: true }));
    }
    resetPreviewConversation();
  };

  const updateSoundToggle = () => {
    if (elements.soundToggle) {
      const label = state.soundEnabled ? "Sound: On" : "Sound: Off";
      elements.soundToggle.setAttribute("aria-label", label);
      elements.soundToggle.setAttribute("title", label);
      elements.soundToggle.classList.toggle("is-on", state.soundEnabled);
    }
    if (elements.settingsSound) {
      elements.settingsSound.checked = state.soundEnabled;
    }
  };

  const updateDesktopToggle = () => {
    if (elements.settingsDesktop) {
      elements.settingsDesktop.checked = state.desktopEnabled;
    }
  };

  const updatePollSelect = () => {
    if (elements.settingsPoll) {
      elements.settingsPoll.value = String(state.pollIntervalMs);
    }
  };

  const requestDesktopPermission = async () => {
    if (!("Notification" in window)) {
      return false;
    }
    if (Notification.permission === "granted") {
      return true;
    }
    if (Notification.permission === "denied") {
      return false;
    }
    const permission = await Notification.requestPermission();
    return permission === "granted";
  };

  const getWidgetBaseDefault = () => {
    const origin = window.location.origin;
    const path = window.location.pathname;
    const adminIndex = path.indexOf("/admin");
    const rootPath = adminIndex >= 0 ? path.slice(0, adminIndex) : path.replace(/\/[^/]*$/, "");
    return `${origin}${rootPath}/widget`;
  };

  const getEmbedDefaults = () => {
    const apiBase = localStorage.getItem("oc_embed_api_base") || API_BASE;
    const widgetBase = localStorage.getItem("oc_embed_widget_base") || getWidgetBaseDefault();
    const position = localStorage.getItem("oc_embed_position") || "right";
    const inlineCss = localStorage.getItem("oc_embed_inline_css") === "true";
    const maxUploadMb = Number(localStorage.getItem("oc_embed_max_upload_mb") || 5);
    return { apiBase, widgetBase, position, inlineCss, maxUploadMb };
  };

  const getEmbedConfig = () => {
    const defaults = getEmbedDefaults();
    const apiBase = (elements.embedApiBase?.value || "").trim() || defaults.apiBase;
    const widgetBase = (elements.embedWidgetBase?.value || "").trim() || defaults.widgetBase;
    const position = elements.embedPosition?.value || defaults.position;
    const maxUploadMb = Number(elements.embedMaxUpload?.value || defaults.maxUploadMb || 5);
    const inlineCss = Boolean(elements.embedInlineCss?.checked);
    return {
      apiBase,
      widgetBase,
      position,
      inlineCss,
      maxUploadMb: Number.isFinite(maxUploadMb) ? Math.max(1, Math.min(maxUploadMb, 25)) : 5
    };
  };

  const buildEmbedCode = () => {
    const config = getEmbedConfig();
    const widgetBase = config.widgetBase.replace(/\/$/, "");
    const maxUploadBytes = config.maxUploadMb * 1024 * 1024;
    const websiteKey = state.currentWebsiteKey || "YOUR_WEBSITE_KEY";
    const inlineCss = config.inlineCss ? "true" : "false";
    const versionToken = "20260219-1";
    return `<script>
  window.OnlineChatConfig = {
    websiteKey: "${websiteKey}",
    apiBase: "${config.apiBase}",
    widgetBase: "${widgetBase}",
    position: "${config.position}",
    maxUploadBytes: ${maxUploadBytes},
    inlineCss: ${inlineCss}
  };
</script>
<script src="${widgetBase}/widget.js?v=${versionToken}" async></script>`;
  };

  const updateEmbedInputs = () => {
    if (!elements.embedApiBase) {
      return;
    }
    const defaults = getEmbedDefaults();
    elements.embedApiBase.value = defaults.apiBase;
    elements.embedWidgetBase.value = defaults.widgetBase;
    if (elements.embedWebsiteKey) {
      elements.embedWebsiteKey.value = state.currentWebsiteKey || "";
    }
    elements.embedPosition.value = defaults.position;
    elements.embedInlineCss.checked = defaults.inlineCss;
    elements.embedMaxUpload.value = String(defaults.maxUploadMb);
  };

  const updateEmbedCode = () => {
    if (!elements.embedCode) {
      return;
    }
    const code = buildEmbedCode();
    elements.embedCode.textContent = code;
    const config = getEmbedConfig();
    localStorage.setItem("oc_embed_api_base", config.apiBase);
    localStorage.setItem("oc_embed_widget_base", config.widgetBase);
    localStorage.setItem("oc_embed_position", config.position);
    localStorage.setItem("oc_embed_inline_css", config.inlineCss ? "true" : "false");
    localStorage.setItem("oc_embed_max_upload_mb", String(config.maxUploadMb));
  };

  const updateVoiceSettingsControls = () => {
    const openaiAvailable = Boolean(state.settings?.voice_openai_available);
    const voiceEnabled = openaiAvailable && Boolean(elements.settingsVoiceEnabled?.checked);
    if (elements.settingsVoiceEnabled) {
      elements.settingsVoiceEnabled.disabled = !openaiAvailable;
    }
    if (elements.settingsVoiceSelect) {
      elements.settingsVoiceSelect.disabled = !voiceEnabled;
    }
    if (elements.settingsVoiceLanguageMode) {
      elements.settingsVoiceLanguageMode.disabled = !voiceEnabled;
    }
    if (elements.settingsVoiceSendMode) {
      elements.settingsVoiceSendMode.disabled = !voiceEnabled;
    }
    if (elements.settingsVoiceLanguage) {
      elements.settingsVoiceLanguage.disabled = !voiceEnabled;
    }
    if (elements.settingsVoiceSpeed) {
      elements.settingsVoiceSpeed.disabled = !voiceEnabled;
    }
    if (elements.settingsVoiceGlossary) {
      elements.settingsVoiceGlossary.disabled = !voiceEnabled;
    }
    if (elements.settingsVoiceSample) {
      elements.settingsVoiceSample.disabled = !openaiAvailable;
    }
    if (elements.settingsVoiceNote) {
      if (!openaiAvailable) {
        elements.settingsVoiceNote.textContent = "Add a valid OpenAI API key on the server to enable voice mode.";
      } else if (!voiceEnabled) {
        elements.settingsVoiceNote.textContent =
          "Voice uses OpenAI transcription and spoken replies. Visitors can still type normally.";
      } else {
        const language = normalizeVoiceInputLanguage(elements.settingsVoiceLanguage?.value || "en");
        const mode = normalizeVoiceInputLanguageMode(elements.settingsVoiceLanguageMode?.value || "auto");
        const sendMode = normalizeVoiceSendMode(elements.settingsVoiceSendMode?.value || "auto_send");
        const glossary = String(elements.settingsVoiceGlossary?.value || "").trim();
        const label =
          voiceInputLanguageOptions.find((option) => option.value === language)?.label || language.toUpperCase();
        elements.settingsVoiceNote.textContent =
          `${mode === "preferred" ? "Preferred first" : "Auto + preferred fallback"} for ${label}.` +
          ` ${sendMode === "auto_send" ? "Voice sends automatically after transcription." : "Visitors review the transcript before sending."}` +
          `${glossary ? " Glossary terms help preserve brand and product names." : " Add glossary terms for brand-heavy sites."}`;
      }
    }
  };

  const stopVoiceSamplePreview = () => {
    if (state.voiceSampleAudio) {
      state.voiceSampleAudio.pause();
      state.voiceSampleAudio.src = "";
      state.voiceSampleAudio = null;
    }
    if (state.voiceSampleUrl) {
      try {
        URL.revokeObjectURL(state.voiceSampleUrl);
      } catch (err) {
        // Ignore URL cleanup errors in preview-only UI.
      }
      state.voiceSampleUrl = "";
    }
    if (elements.settingsVoiceSample) {
      elements.settingsVoiceSample.classList.remove("is-playing");
      elements.settingsVoiceSample.textContent = "Play sample";
    }
  };

  const playVoiceSamplePreview = async () => {
    if (!elements.settingsVoiceSample || elements.settingsVoiceSample.disabled) {
      return;
    }
    stopVoiceSamplePreview();
    elements.settingsVoiceSample.textContent = "Loading...";
    const response = await fetchWithAuth(`${API_BASE}/admin/settings/voice-preview`, {
      method: "POST",
      body: JSON.stringify({
        voice: elements.settingsVoiceSelect?.value || "alloy",
        language: normalizeVoiceInputLanguage(elements.settingsVoiceLanguage?.value || "en"),
        speed: normalizeVoiceReplySpeed(elements.settingsVoiceSpeed?.value || 1)
      })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to generate voice sample");
    }
    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    state.voiceSampleUrl = audioUrl;
    state.voiceSampleAudio = audio;
    elements.settingsVoiceSample.textContent = "Stop sample";
    elements.settingsVoiceSample.classList.add("is-playing");
    audio.onended = () => stopVoiceSamplePreview();
    audio.onerror = () => stopVoiceSamplePreview();
    try {
      await audio.play();
    } catch (err) {
      stopVoiceSamplePreview();
      throw err;
    }
  };

  const updateWidgetPreview = () => {
    if (!elements.widgetPreview) {
      return;
    }
    bindWidgetPreviewSandbox();
    const company = elements.settingsForm?.company_name?.value?.trim() || "OnlineChat";
    const color = elements.settingsForm?.widget_color?.value?.trim() || "";
    const online = isPreviewOnline();
    const greeting = getPreviewGreetingText();
    if (elements.previewCompany) {
      elements.previewCompany.textContent = company;
    }
    const greetingBubble = ensurePreviewGreetingBubble();
    if (greetingBubble && greetingBubble.textContent !== greeting) {
      greetingBubble.textContent = greeting;
    }
    if (elements.previewStatus) {
      elements.previewStatus.textContent = online ? "Online" : "Offline";
    }
    const voiceEnabled = Boolean(elements.settingsVoiceEnabled?.checked);
    const voiceLanguage = normalizeVoiceInputLanguage(elements.settingsVoiceLanguage?.value || "en");
    const voiceLanguageLabel =
      voiceInputLanguageOptions.find((option) => option.value === voiceLanguage)?.label || voiceLanguage.toUpperCase();
    const voiceMode = normalizeVoiceInputLanguageMode(elements.settingsVoiceLanguageMode?.value || "auto");
    const voiceSendMode = normalizeVoiceSendMode(elements.settingsVoiceSendMode?.value || "auto_send");
    const voiceSpeed = normalizeVoiceReplySpeed(elements.settingsVoiceSpeed?.value || 1);
    if (elements.previewVoice) {
      elements.previewVoice.hidden = !voiceEnabled;
      elements.previewVoice.disabled = !voiceEnabled;
      elements.previewVoice.setAttribute("aria-hidden", voiceEnabled ? "false" : "true");
    }
    if (elements.previewVoiceDraft) {
      elements.previewVoiceDraft.hidden = !voiceEnabled;
      elements.previewVoiceDraft.textContent = voiceEnabled
        ? voiceSendMode === "auto_send"
          ? `Voice sends automatically after transcription (${voiceLanguageLabel})`
          : `Voice draft -> review, edit, then send (${voiceLanguageLabel})`
        : "";
    }
    if (elements.previewVoiceReplay) {
      elements.previewVoiceReplay.hidden = !voiceEnabled;
    }
    if (elements.previewInput) {
      elements.previewInput.placeholder = voiceEnabled ? "Type or review a voice draft..." : "Type a test message...";
    }
    if (elements.previewVoiceNote) {
      elements.previewVoiceNote.textContent = voiceEnabled
        ? `${voiceMode === "preferred" ? "Preferred language first" : "Auto + preferred fallback"}, ${voiceSendMode === "auto_send" ? "auto-send enabled" : "review before send"}, reply speed ${voiceSpeed.toFixed(2)}x. Live recording works on the website widget.`
        : "Interactive test preview (works before saving)";
    }
    if (color && /^#([0-9a-fA-F]{3}){1,2}$/.test(color)) {
      elements.widgetPreview.style.setProperty("--preview-accent", color);
      if (elements.widgetIconTemplates) {
        elements.widgetIconTemplates.style.setProperty("--preview-accent", color);
      }
      if (elements.widgetShapeTemplates) {
        elements.widgetShapeTemplates.style.setProperty("--preview-accent", color);
      }
      if (elements.widgetGlyphTemplates) {
        elements.widgetGlyphTemplates.style.setProperty("--preview-accent", color);
      }
    }
    applyWidgetIconTemplate(elements.settingIconStyle?.value || "classic");
    applyWidgetIconShape(elements.settingIconShape?.value || "circle");
    applyWidgetIconGlyph(elements.settingIconGlyph?.value || "chat");
    updateVoiceSettingsControls();
  };

  const renderProfileAvatar = (user) => {
    if (!elements.profileAvatar) {
      return;
    }
    elements.profileAvatar.innerHTML = "";
    if (user && user.avatar_url) {
      const img = document.createElement("img");
      img.src = user.avatar_url;
      img.alt = user.name ? `${user.name} avatar` : "Profile avatar";
      elements.profileAvatar.appendChild(img);
    } else {
      elements.profileAvatar.textContent = getInitials(user && user.name, "OC");
    }
  };

  const renderProfileMeta = (user) => {
    if (!elements.profileMeta) {
      return;
    }
    const meta = [];
    if (user && user.workspace_role) {
      meta.push(`Workspace role: ${user.workspace_role}`);
    } else if (user && user.role) {
      meta.push(`Role: ${user.role}`);
    }
    if (user && user.membership_role) {
      meta.push(`SaaS role: ${user.membership_role}`);
    }
    if (user && user.created_at) {
      meta.push(`Member since ${formatDate(user.created_at)}`);
    }
    elements.profileMeta.textContent = meta.join(" | ");
  };

  const normalizeCurrentUser = (user = {}) => {
    const workspaceRole = String(user.workspace_role || "").toLowerCase();
    const effectiveRole = workspaceRole || String(user.role || "").toLowerCase() || "agent";
    const capabilities =
      user.capabilities && typeof user.capabilities === "object"
        ? user.capabilities
        : {
            manage_workspace: effectiveRole === "admin",
            manage_users: effectiveRole === "admin",
            manage_settings: effectiveRole === "admin",
            manage_ai: effectiveRole === "admin",
            manage_billing: ["owner", "admin"].includes(String(user.membership_role || "").toLowerCase()),
            read_only: effectiveRole !== "admin"
          };
    return {
      ...user,
      role: effectiveRole,
      workspace_role: workspaceRole || effectiveRole,
      membership_role: String(user.membership_role || "").toLowerCase(),
      capabilities
    };
  };

  const applyCurrentUser = (user) => {
    if (!user) {
      return;
    }
    const normalizedUser = normalizeCurrentUser(user);
    state.currentUser = normalizedUser;
    if (elements.profileName) {
      elements.profileName.value = normalizedUser.name || "";
    }
    if (elements.profileEmail) {
      elements.profileEmail.value = normalizedUser.email || "";
    }
    if (elements.profileRole) {
      elements.profileRole.value = normalizedUser.workspace_role || normalizedUser.role || "";
    }
    renderProfileAvatar(normalizedUser);
    renderProfileMeta(normalizedUser);
    if (elements.teamPanel) {
      elements.teamPanel.hidden = normalizedUser.role !== "admin";
    }
    if (elements.companyPanel) {
      elements.companyPanel.hidden = normalizedUser.role !== "admin";
    }
    if (elements.companySwitcherPanel) {
      elements.companySwitcherPanel.hidden = false;
    }
    if (elements.companyAddBtn) {
      elements.companyAddBtn.disabled = normalizedUser.role !== "admin";
    }
    if (elements.websiteAddBtn) {
      elements.websiteAddBtn.disabled = normalizedUser.role !== "admin";
    }
    if (normalizedUser.role !== "admin" && localStorage.getItem(settingsTabStorageKey) === "team") {
      applySettingsTab("company");
    }
  };

  const renderAiAvatar = (settings) => {
    if (!elements.aiAvatar) {
      return;
    }
    const name = settings?.ai_name || "AI Assistant";
    elements.aiAvatar.innerHTML = "";
    if (settings && settings.ai_avatar_url) {
      const img = document.createElement("img");
      img.src = settings.ai_avatar_url;
      img.alt = `${name} avatar`;
      elements.aiAvatar.appendChild(img);
      return;
    }
    elements.aiAvatar.textContent = getInitials(name, "AI");
  };

  const canManageUsers = () =>
    Boolean(
      state.currentUser &&
        ((state.currentUser.capabilities && state.currentUser.capabilities.manage_users) ||
          state.currentUser.role === "admin")
    );

  const buildHoursGrid = (hours) => {
    const days = [
      { key: "mon", label: "Mon" },
      { key: "tue", label: "Tue" },
      { key: "wed", label: "Wed" },
      { key: "thu", label: "Thu" },
      { key: "fri", label: "Fri" },
      { key: "sat", label: "Sat" },
      { key: "sun", label: "Sun" }
    ];
    elements.hoursGrid.innerHTML = "";
    days.forEach((day) => {
      const config = hours[day.key] || { enabled: false, start: "09:00", end: "18:00" };
      const row = document.createElement("div");
      row.className = "hours-row";
      row.dataset.day = day.key;
      row.innerHTML = `
        <label>${day.label}</label>
        <input type="checkbox" class="day-enabled" ${config.enabled ? "checked" : ""} />
        <input type="time" class="day-start" value="${config.start || "09:00"}" />
        <input type="time" class="day-end" value="${config.end || "18:00"}" />
      `;
      elements.hoursGrid.appendChild(row);
    });
  };

  const collectHours = () => {
    const hours = {};
    elements.hoursGrid.querySelectorAll(".hours-row").forEach((row) => {
      const day = row.dataset.day;
      const enabled = row.querySelector(".day-enabled").checked;
      const start = row.querySelector(".day-start").value || "09:00";
      const end = row.querySelector(".day-end").value || "18:00";
      hours[day] = { enabled, start, end };
    });
    return hours;
  };

  const renderCannedReplies = () => {
    elements.cannedList.innerHTML = "";
    if (!state.cannedReplies.length) {
      elements.cannedList.innerHTML = "<p class='chat-meta'>No canned replies yet.</p>";
      return;
    }
    state.cannedReplies.forEach((reply) => {
      const item = document.createElement("div");
      item.className = "popup-item";
      item.innerHTML = `
        <header>
          <h4>${safe(reply.title)}</h4>
          <span class="badge">${safe(reply.shortcut || "No shortcut")}</span>
        </header>
        <p>${safe(reply.content)}</p>
        <div class="popup-actions">
          <button type="button" class="danger" data-action="delete">Delete</button>
        </div>
      `;
      item.querySelector("[data-action='delete']").addEventListener("click", async () => {
        if (!window.confirm("Delete this canned reply")) {
          return;
        }
        await fetchJson(`${API_BASE}/admin/canned-replies/${reply.id}`, { method: "DELETE" });
        await loadCannedReplies();
      });
      elements.cannedList.appendChild(item);
    });
  };

  const renderCannedSelect = () => {
    if (!elements.cannedSelect) {
      return;
    }
    elements.cannedSelect.innerHTML = "";
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "Quick replies";
    elements.cannedSelect.appendChild(empty);
    state.cannedReplies.forEach((reply) => {
      const option = document.createElement("option");
      option.value = String(reply.id);
      option.textContent = reply.title;
      elements.cannedSelect.appendChild(option);
    });
  };

  const loadCannedReplies = async () => {
    const data = await fetchJson(`${API_BASE}/admin/canned-replies`);
    state.cannedReplies = data.replies || [];
    renderCannedReplies();
    renderCannedSelect();
  };

  const uploadUserAvatar = async (userId, file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await fetchWithAuth(`${API_BASE}/admin/users/${userId}/avatar`, {
      method: "POST",
      skipJsonContentType: true,
      body: formData
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Failed to upload avatar");
    }
    return data;
  };

  const updateUser = async (userId, payload) => {
    await fetchJson(`${API_BASE}/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  };

  const getWebsiteOptions = () =>
    (state.websites || [])
      .map((site) => ({
        id: Number(site.id || 0),
        label: site.name || site.domain || `Website ${site.id}`
      }))
      .filter((site) => site.id > 0);

  const normalizeWebsiteIds = (value) => {
    const source = Array.isArray(value) ? value : [];
    return Array.from(
      new Set(
        source
          .map((item) => Number(item))
          .filter((item) => Number.isFinite(item) && item > 0)
      )
    );
  };

  const collectWebsiteIds = (root) => {
    if (!root) {
      return [];
    }
    const selected = Array.from(root.querySelectorAll("input[name='website_ids']:checked")).map((input) =>
      Number(input.value || 0)
    );
    return normalizeWebsiteIds(selected);
  };

  const renderWebsiteAccessChecks = ({
    container,
    websiteOptions,
    selectedIds,
    disabled,
    idPrefix = "website-access"
  }) => {
    if (!container) {
      return;
    }
    container.innerHTML = "";
    if (!websiteOptions.length) {
      container.innerHTML = "<p class='chat-meta'>No websites available for this company.</p>";
      return;
    }
    websiteOptions.forEach((site) => {
      const label = document.createElement("label");
      label.className = "website-access-item";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "website_ids";
      checkbox.value = String(site.id);
      checkbox.id = `${idPrefix}-${site.id}`;
      checkbox.checked = selectedIds.includes(site.id);
      checkbox.disabled = disabled;
      const text = document.createElement("span");
      text.textContent = site.label;
      label.appendChild(checkbox);
      label.appendChild(text);
      container.appendChild(label);
    });
  };

  const renderTeamUserFormAccess = () => {
    if (!elements.userWebsiteAccessList) {
      return;
    }
    if (elements.userForm && elements.userForm.dataset.websiteAccessBound !== "1") {
      elements.userForm.dataset.websiteAccessBound = "1";
      if (elements.userRole) {
        elements.userRole.addEventListener("change", renderTeamUserFormAccess);
      }
      if (elements.userWebsiteAccessMode) {
        elements.userWebsiteAccessMode.addEventListener("change", renderTeamUserFormAccess);
      }
    }
    const websiteOptions = getWebsiteOptions();
    const selectedBefore = collectWebsiteIds(elements.userWebsiteAccessList);
    const role = elements.userRole ? elements.userRole.value : "agent";
    const modeInput = elements.userWebsiteAccessMode;
    const mode = modeInput ? modeInput.value : "all";
    const isAdminRole = role === "admin";
    const isSelectedMode = mode === "selected" && !isAdminRole;

    if (elements.userWebsiteAccessWrap) {
      elements.userWebsiteAccessWrap.classList.toggle("is-admin-role", isAdminRole);
    }
    if (modeInput) {
      modeInput.disabled = isAdminRole || websiteOptions.length <= 1;
      if (isAdminRole) {
        modeInput.value = "all";
      }
    }

    let selectedIds = selectedBefore;
    if (!selectedIds.length) {
      selectedIds = websiteOptions.map((site) => site.id);
    }
    if (isSelectedMode && !selectedIds.length && websiteOptions.length) {
      selectedIds = [websiteOptions[0].id];
    }

    renderWebsiteAccessChecks({
      container: elements.userWebsiteAccessList,
      websiteOptions,
      selectedIds,
      disabled: !isSelectedMode,
      idPrefix: "new-user-website"
    });

    if (elements.userWebsiteAccessHelp) {
      if (isAdminRole) {
        elements.userWebsiteAccessHelp.textContent = "Admin users always have access to all websites.";
      } else if (!websiteOptions.length) {
        elements.userWebsiteAccessHelp.textContent = "Add a website to assign agent access.";
      } else if (!isSelectedMode) {
        elements.userWebsiteAccessHelp.textContent = "This agent will have access to all websites in this company.";
      } else {
        elements.userWebsiteAccessHelp.textContent =
          "Select one or more websites this agent can access.";
      }
    }
  };

  const renderUsers = () => {
    elements.userList.innerHTML = "";
    if (!state.users.length) {
      elements.userList.innerHTML = "<p class='chat-meta'>No agents yet.</p>";
      renderTeamUserFormAccess();
      return;
    }
    const websiteOptions = getWebsiteOptions();
    state.users.forEach((user) => {
      const card = document.createElement("div");
      card.className = "user-card";
      const initials = getInitials(user.name, "AG");

      const avatar = document.createElement("div");
      avatar.className = "user-avatar";
      if (user.avatar_url) {
        const img = document.createElement("img");
        img.src = user.avatar_url;
        img.alt = user.name || "Agent avatar";
        avatar.appendChild(img);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "user-avatar-placeholder";
        placeholder.textContent = initials;
        avatar.appendChild(placeholder);
      }
      const uploadInput = document.createElement("input");
      uploadInput.type = "file";
      uploadInput.accept = "image/*";
      uploadInput.hidden = true;
      const uploadBtn = document.createElement("button");
      uploadBtn.type = "button";
      uploadBtn.className = "user-upload";
      uploadBtn.textContent = "Upload";
      uploadBtn.addEventListener("click", () => uploadInput.click());
      uploadInput.addEventListener("change", async () => {
        const file = uploadInput.files && uploadInput.files[0];
        uploadInput.value = "";
        if (!file) {
          return;
        }
        try {
          await uploadUserAvatar(user.id, file);
          await loadUsers();
        } catch (err) {
          window.alert(err.message);
        }
      });

      const details = document.createElement("div");
      details.className = "user-details";
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.value = user.name || "";
      const emailInput = document.createElement("input");
      emailInput.type = "email";
      emailInput.value = user.email || "";
      const roleSelect = document.createElement("select");
      roleSelect.innerHTML = `
        <option value="admin">Admin</option>
        <option value="agent">Agent</option>
      `;
      roleSelect.value = user.role || "agent";
      const activeToggle = document.createElement("select");
      activeToggle.innerHTML = `
        <option value="1">Active</option>
        <option value="0">Inactive</option>
      `;
      activeToggle.value = String(user.is_active ? 1 : 0);
      const websiteAccessMode = document.createElement("select");
      websiteAccessMode.innerHTML = `
        <option value="all">All websites</option>
        <option value="selected">Selected websites</option>
      `;
      websiteAccessMode.value = user.website_access_mode === "selected" ? "selected" : "all";
      const websiteAccessWrap = document.createElement("div");
      websiteAccessWrap.className = "user-website-access";
      const websiteAccessLabel = document.createElement("label");
      websiteAccessLabel.className = "user-website-access-label";
      websiteAccessLabel.textContent = "Website access";
      const websiteAccessModeWrap = document.createElement("div");
      websiteAccessModeWrap.className = "user-website-mode";
      const websiteAccessModeLabel = document.createElement("label");
      websiteAccessModeLabel.className = "user-website-access-label";
      websiteAccessModeLabel.textContent = "Access mode";
      websiteAccessModeWrap.appendChild(websiteAccessModeLabel);
      websiteAccessModeWrap.appendChild(websiteAccessMode);
      const websiteChecks = document.createElement("div");
      websiteChecks.className = "website-access-list";
      const selectedWebsiteIds = normalizeWebsiteIds(user.website_ids);

      const renderUserWebsiteAccess = () => {
        const isAdmin = roleSelect.value === "admin";
        const selectedMode = websiteAccessMode.value === "selected" && !isAdmin;
        websiteAccessMode.disabled = isAdmin || websiteOptions.length <= 1;
        if (isAdmin) {
          websiteAccessMode.value = "all";
        }
        let checkedIds = collectWebsiteIds(websiteChecks);
        if (!checkedIds.length) {
          checkedIds = selectedWebsiteIds.length
            ? selectedWebsiteIds
            : websiteOptions.map((site) => site.id);
        }
        if (selectedMode && !checkedIds.length && websiteOptions.length) {
          checkedIds = [websiteOptions[0].id];
        }
        renderWebsiteAccessChecks({
          container: websiteChecks,
          websiteOptions,
          selectedIds: checkedIds,
          disabled: !selectedMode,
          idPrefix: `user-${user.id}-website`
        });
      };
      renderUserWebsiteAccess();
      roleSelect.addEventListener("change", renderUserWebsiteAccess);
      websiteAccessMode.addEventListener("change", renderUserWebsiteAccess);

      const fields = document.createElement("div");
      fields.className = "user-fields";
      fields.appendChild(nameInput);
      fields.appendChild(emailInput);
      fields.appendChild(roleSelect);
      fields.appendChild(activeToggle);
      fields.appendChild(websiteAccessModeWrap);
      websiteAccessWrap.appendChild(websiteAccessLabel);
      websiteAccessWrap.appendChild(websiteChecks);
      fields.appendChild(websiteAccessWrap);

      const actions = document.createElement("div");
      actions.className = "user-actions";
      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.textContent = "Save";
      saveBtn.addEventListener("click", async () => {
        const payload = {
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          role: roleSelect.value,
          is_active: Number(activeToggle.value || 1),
          website_access_mode: roleSelect.value === "admin" ? "all" : websiteAccessMode.value,
          website_ids:
            roleSelect.value === "admin" || websiteAccessMode.value !== "selected"
              ? []
              : collectWebsiteIds(websiteChecks)
        };
        if (
          payload.role === "agent" &&
          payload.website_access_mode === "selected" &&
          !payload.website_ids.length
        ) {
          window.alert("Select at least one website for this agent.");
          return;
        }
        try {
          await updateUser(user.id, payload);
          await loadUsers();
        } catch (err) {
          window.alert(err.message);
        }
      });

      actions.appendChild(saveBtn);
      details.appendChild(fields);
      details.appendChild(actions);

      card.appendChild(avatar);
      card.appendChild(details);
      card.appendChild(uploadBtn);
      card.appendChild(uploadInput);
      elements.userList.appendChild(card);
    });
    renderTeamUserFormAccess();
  };

  const getCurrentCompany = () =>
    state.companies.find((company) => Number(company.id) === Number(state.currentCompanyId || 0));

  const getCurrentWebsite = () =>
    state.websites.find((site) => Number(site.id) === Number(state.currentWebsiteId || 0));

  const getCompanyDraft = () =>
    state.companyDraft && state.companyDraft.mode === "new" ? state.companyDraft : null;

  const renderCompanyEditor = () => {
    if (!elements.companyEditName) {
      return;
    }
    const draft = getCompanyDraft();
    const company = getCurrentCompany();
    if (draft) {
      elements.companyEditName.disabled = false;
      elements.companyEditName.value = String(draft.name || "");
      if (elements.companyEditTimezone) {
        elements.companyEditTimezone.disabled = true;
        elements.companyEditTimezone.value = "UTC";
      }
      if (elements.companySaveBtn) {
        elements.companySaveBtn.disabled = false;
      }
      if (elements.companyDeleteBtn) {
        elements.companyDeleteBtn.disabled = true;
      }
      if (elements.companySaveStatus && !elements.companySaveStatus.textContent.trim()) {
        elements.companySaveStatus.textContent = "Add company name and website domain, then save.";
        elements.companySaveStatus.classList.remove("is-saved");
      }
      return;
    }
    if (!company) {
      elements.companyEditName.value = "";
      elements.companyEditName.disabled = true;
      if (elements.companyEditTimezone) {
        elements.companyEditTimezone.value = "";
        elements.companyEditTimezone.disabled = true;
      }
      if (elements.companySaveBtn) {
        elements.companySaveBtn.disabled = true;
      }
      if (elements.companyDeleteBtn) {
        elements.companyDeleteBtn.disabled = true;
      }
      return;
    }
    elements.companyEditName.disabled = false;
    elements.companyEditName.value = company.name || "";
    if (elements.companyEditTimezone) {
      elements.companyEditTimezone.disabled = false;
      elements.companyEditTimezone.value = company.timezone || "UTC";
    }
    if (elements.companySaveBtn) {
      elements.companySaveBtn.disabled = false;
    }
    if (elements.companyDeleteBtn) {
      elements.companyDeleteBtn.disabled = false;
    }
  };

  const renderWebsiteEditor = () => {
    if (!elements.websiteEditDomain || !elements.websiteEditKey) {
      return;
    }
    const draft = getCompanyDraft();
    const site = getCurrentWebsite();
    if (draft) {
      elements.websiteEditDomain.disabled = false;
      elements.websiteEditDomain.value = String(draft.domain || "");
      elements.websiteEditKey.disabled = true;
      elements.websiteEditKey.value = "";
      if (elements.websiteSaveBtn) {
        elements.websiteSaveBtn.disabled = true;
      }
      if (elements.websiteCopyBtn) {
        elements.websiteCopyBtn.disabled = true;
      }
      if (elements.websiteLimitNote) {
        elements.websiteLimitNote.textContent = "Your first website will be created when you save the company.";
      }
      return;
    }
    const hasWebsite = Boolean(site);
    elements.websiteEditDomain.disabled = !hasWebsite;
    elements.websiteEditKey.disabled = !hasWebsite;
    if (elements.websiteSaveBtn) {
      elements.websiteSaveBtn.disabled = !hasWebsite;
    }
    if (elements.websiteCopyBtn) {
      elements.websiteCopyBtn.disabled = !hasWebsite;
    }
    if (!site) {
      elements.websiteEditDomain.value = "";
      elements.websiteEditKey.value = "";
      if (elements.websiteLimitNote) {
        elements.websiteLimitNote.textContent = "Add a website to configure this company.";
      }
      return;
    }
    elements.websiteEditDomain.value = site.domain || "";
    elements.websiteEditKey.value = site.widget_key || "";
    if (elements.websiteLimitNote) {
      const hasMultiple = state.websites.length > 1;
      elements.websiteLimitNote.textContent = hasMultiple
        ? "Multiple websites detected. This company should keep only one website."
        : "Edit the main website for this company.";
    }
  };

  const updateCompanyContext = () => {
    if (!elements.companyContextName) {
      return;
    }
    const company = getCurrentCompany();
    const site = getCurrentWebsite();
    elements.companyContextName.textContent = company?.name || "Select a company";
    if (elements.companyContextDomain) {
      const domain = site?.domain ? `- ${site.domain}` : "";
      elements.companyContextDomain.textContent = domain;
    }
    if (elements.companyContextNote) {
      elements.companyContextNote.textContent = company
        ? "All settings below apply only to this company."
        : "Choose a company to edit its settings.";
    }
    if (elements.aiContextName) {
      elements.aiContextName.textContent = company?.name || "Select a company";
    }
    if (elements.aiContextNote) {
      elements.aiContextNote.textContent = company
        ? "AI settings apply only to this company."
        : "Select a company to edit AI settings.";
    }
  };

  const syncTenantEditors = () => {
    renderCompanyEditor();
    renderWebsiteEditor();
    updateCompanyContext();
    renderTeamUserFormAccess();
  };

  const renderCompanies = () => {
    const hasList = Boolean(elements.companyList);
    const hasSwitcher = Boolean(elements.companySwitcher);
    if (!hasList && !hasSwitcher) {
      return;
    }
    if (hasList) {
      elements.companyList.innerHTML = "";
      if (!state.companies.length) {
        elements.companyList.innerHTML = "<p class='chat-meta'>No companies yet.</p>";
      }
    }
    const allowAdd = state.currentUser && state.currentUser.role === "admin";
    if (hasSwitcher) {
      elements.companySwitcher.innerHTML = "";
      if (!state.companies.length) {
        elements.companySwitcher.innerHTML = "<span class='switcher-empty'>No companies yet.</span>";
      }
    }
    state.companies.forEach((company) => {
      if (hasSwitcher) {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "switcher-chip";
        chip.dataset.companyId = String(company.id);
        chip.innerHTML = `
          <span class="chip-avatar">${getInitials(company.name || "C")}</span>
          <span>${safe(company.name || "Company")}</span>
        `;
        const isActive = Number(company.id) === Number(state.currentCompanyId || 0);
        chip.classList.toggle("is-active", isActive);
        chip.setAttribute("aria-pressed", isActive ? "true" : "false");
        elements.companySwitcher.appendChild(chip);
      }
      if (!hasList) {
        return;
      }
      const item = document.createElement("div");
      item.className = "popup-item";
      item.innerHTML = `
        <header>
          <h4>${safe(company.name || "Company")}</h4>
          <span class="badge">${safe(company.timezone || "UTC")}</span>
        </header>
        <div class="popup-actions">
          <button type="button" data-action="edit">Edit</button>
        </div>
      `;
      item.querySelector("[data-action='edit']").addEventListener("click", async () => {
        const name = window.prompt("Company name", company.name || "");
        if (!name) {
          return;
        }
        const timezone = window.prompt("Timezone", company.timezone || "UTC") || company.timezone || "UTC";
        try {
          await fetchJson(`${API_BASE}/admin/companies/${company.id}`, {
            method: "PUT",
            body: JSON.stringify({ name: name.trim(), timezone: timezone.trim() })
          });
          await loadCompanies();
        } catch (err) {
          window.alert(err.message);
        }
      });
      elements.companyList.appendChild(item);
    });
    if (hasSwitcher && allowAdd) {
      const addChip = document.createElement("button");
      addChip.type = "button";
      addChip.className = "switcher-chip switcher-add";
      addChip.dataset.companyAdd = "1";
      addChip.innerHTML = `
        <span class="chip-avatar">+</span>
        <span>Add company</span>
      `;
      elements.companySwitcher.appendChild(addChip);
    }
    renderCompanyEditor();
    updateCompanyContext();
  };

  const renderWebsites = () => {
    const hasList = Boolean(elements.websiteList);
    const hasSwitcher = Boolean(elements.websiteSwitcher);
    const hasEditor = Boolean(elements.websiteEditDomain || elements.websiteEditKey || elements.embedWebsiteKey);
    if (!hasList && !hasSwitcher && !hasEditor) {
      return;
    }
    if (hasList) {
      elements.websiteList.innerHTML = "";
      if (!state.websites.length) {
        elements.websiteList.innerHTML = "<p class='chat-meta'>No websites yet.</p>";
      }
    }
    const allowAdd = state.currentUser && state.currentUser.role === "admin";
    if (hasSwitcher) {
      elements.websiteSwitcher.innerHTML = "";
      if (!state.websites.length) {
        elements.websiteSwitcher.innerHTML = "<span class='switcher-empty'>No websites yet.</span>";
      }
    }
    state.websites.forEach((site) => {
      if (hasSwitcher) {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "switcher-chip";
        chip.dataset.websiteId = String(site.id);
        chip.innerHTML = `
          <span class="chip-avatar">${getInitials(site.name || "W")}</span>
          <span>${safe(site.name || "Website")}${site.domain ? ` - ${safe(site.domain)}` : ""}</span>
        `;
        chip.classList.toggle("is-active", Number(site.id) === Number(state.currentWebsiteId || 0));
        elements.websiteSwitcher.appendChild(chip);
      }
      if (!hasList) {
        return;
      }
      const item = document.createElement("div");
      item.className = "popup-item";
      item.innerHTML = `
        <header>
          <h4>${safe(site.name || "Website")}</h4>
          <span class="badge">${safe(site.domain || "No domain")}</span>
        </header>
        <p class="chat-meta">Key: <code>${safe(site.widget_key)}</code></p>
        <div class="popup-actions">
          <button type="button" data-action="copy">Copy key</button>
          <button type="button" data-action="edit">Edit</button>
        </div>
      `;
      item.querySelector("[data-action='copy']").addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(site.widget_key);
          item.querySelector("[data-action='copy']").textContent = "Copied";
          setTimeout(() => {
            item.querySelector("[data-action='copy']").textContent = "Copy key";
          }, 1200);
        } catch (err) {
          window.prompt("Copy website key:", site.widget_key);
        }
      });
      item.querySelector("[data-action='edit']").addEventListener("click", async () => {
        const name = window.prompt("Website name", site.name || "");
        if (!name) {
          return;
        }
        const domain = window.prompt("Domain (optional)", site.domain || "") || "";
        try {
          await fetchJson(`${API_BASE}/admin/websites/${site.id}`, {
            method: "PUT",
            body: JSON.stringify({ name: name.trim(), domain: domain.trim() })
          });
          await loadWebsites(state.currentCompanyId);
        } catch (err) {
          window.alert(err.message);
        }
      });
      elements.websiteList.appendChild(item);
    });
    if (hasSwitcher && allowAdd) {
      if (!state.websites.length) {
        const addChip = document.createElement("button");
        addChip.type = "button";
        addChip.className = "switcher-chip switcher-add";
        addChip.dataset.websiteAdd = "1";
        addChip.innerHTML = `
          <span class="chip-avatar">+</span>
          <span>Add website</span>
        `;
        elements.websiteSwitcher.appendChild(addChip);
      }
    }
    if (elements.websiteAddBtn) {
      const disableAdd = !allowAdd || state.websites.length > 0;
      elements.websiteAddBtn.disabled = disableAdd;
      elements.websiteAddBtn.textContent = disableAdd ? "Website added" : "Add website";
    }
    renderWebsiteEditor();
    updateCompanyContext();
  };

  const loadUsers = async () => {
    if (!elements.userList) {
      return;
    }
    if (!canManageUsers()) {
      return;
    }
    const data = await fetchJson(`${API_BASE}/admin/users`);
    state.users = data.users || [];
    renderUsers();
  };

  const loadCompanies = async () => {
    if (!elements.companyList && !elements.companySwitcher) {
      return;
    }
    const data = await fetchJson(`${API_BASE}/admin/companies`);
    state.companies = data.companies || [];
    const validCompanyIds = state.companies.map((company) => Number(company.id || 0)).filter(Boolean);
    if (!validCompanyIds.length) {
      syncTenantSelection(0, 0);
      state.websites = [];
    } else if (!validCompanyIds.includes(Number(state.currentCompanyId || 0))) {
      syncTenantSelection(validCompanyIds[0], 0);
      state.websites = [];
    }
    state.companyDirty = false;
    if (elements.companySaveStatus) {
      elements.companySaveStatus.textContent = "";
      elements.companySaveStatus.classList.remove("is-saved");
    }
    renderCompanies();
  };

  const loadWebsites = async (companyId) => {
    const hasEditor = Boolean(elements.websiteEditDomain || elements.websiteEditKey || elements.embedWebsiteKey);
    if (!elements.websiteList && !elements.websiteSwitcher && !hasEditor) {
      return;
    }
    const id = Number(companyId || state.currentCompanyId || 0);
    if (!id) {
      state.websites = [];
      syncTenantSelection(0, 0);
      renderWebsites();
      return;
    }
    const data = await fetchJson(`${API_BASE}/admin/websites?company_id=${id}`);
    state.websites = data.websites || [];
    const validWebsiteIds = state.websites.map((website) => Number(website.id || 0)).filter(Boolean);
    const nextWebsiteId = validWebsiteIds.includes(Number(state.currentWebsiteId || 0))
      ? Number(state.currentWebsiteId || 0)
      : validWebsiteIds[0] || 0;
    syncTenantSelection(id, nextWebsiteId);
    renderWebsites();
  };

  const createCompany = async (payload) => {
    return fetchJson(`${API_BASE}/admin/companies`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  };

  const createWebsite = async (payload) => {
    return fetchJson(`${API_BASE}/admin/websites`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  };

  const uploadProfileAvatar = async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await fetchWithAuth(`${API_BASE}/admin/me/avatar`, {
      method: "POST",
      skipJsonContentType: true,
      body: formData
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Failed to upload avatar");
    }
    return data;
  };

  const uploadAiAvatar = async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await fetchWithAuth(`${API_BASE}/admin/ai/avatar`, {
      method: "POST",
      skipJsonContentType: true,
      body: formData
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Failed to upload AI avatar");
    }
    return data;
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!elements.profileForm) {
      return;
    }
    const name = elements.profileName.value.trim();
    const email = elements.profileEmail.value.trim();
    const currentPassword = elements.profileCurrentPassword.value.trim();
    const newPassword = elements.profileNewPassword.value.trim();
    const confirmPassword = elements.profileConfirmPassword.value.trim();

    if (!name || !email) {
      window.alert("Name and email are required.");
      return;
    }
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        window.alert("New passwords do not match.");
        return;
      }
      if (!currentPassword) {
        window.alert("Enter your current password to change it.");
        return;
      }
    }

    const payload = { name, email };
    if (newPassword) {
      payload.current_password = currentPassword;
      payload.password = newPassword;
    }

    try {
      const data = await fetchJson(`${API_BASE}/admin/me`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      elements.profileCurrentPassword.value = "";
      elements.profileNewPassword.value = "";
      elements.profileConfirmPassword.value = "";
      applyCurrentUser(data.user);
    } catch (err) {
      window.alert(err.message);
    }
  };

  const loadSettings = async () => {
    bindMembershipRefresh();
    bindMembershipActions();
    bindMembershipPlanPicker();
    const data = await fetchJson(`${API_BASE}/admin/settings`);
    const settings = data.settings || {};
    state.settings = settings;
    stopVoiceSamplePreview();
    elements.settingsForm.company_name.value = settings.company_name || "";
    elements.settingsForm.widget_color.value = settings.widget_color || "";
    bindWidgetIconTemplatePicker();
    bindWidgetIconShapePicker();
    bindWidgetIconGlyphPicker();
    applyWidgetIconTemplate(settings.widget_icon_style || "classic");
    applyWidgetIconShape(settings.widget_icon_shape || "circle");
    applyWidgetIconGlyph(settings.widget_icon_glyph || "chat");
    elements.settingsForm.greeting_online_message.value =
      settings.greeting_online_message || settings.greeting_message || "";
    elements.settingsForm.greeting_offline_message.value =
      settings.greeting_offline_message || settings.greeting_message || "";
    elements.settingsForm.offline_message.value = settings.offline_message || "";
    elements.settingsForm.lead_capture_mode.value = settings.lead_capture_mode || "after";
    if (elements.settingsOfflineAiContactPrompt) {
      elements.settingsOfflineAiContactPrompt.checked = Boolean(Number(settings.offline_ai_contact_prompt || 0));
    }
    if (elements.settingsVoiceEnabled) {
      elements.settingsVoiceEnabled.checked = Boolean(Number(settings.voice_mode_enabled || 0));
      elements.settingsVoiceEnabled.disabled = !Boolean(settings.voice_openai_available);
    }
    if (elements.settingsVoiceSelect) {
      elements.settingsVoiceSelect.value = settings.voice_reply_voice || "alloy";
    }
    if (elements.settingsVoiceSendMode) {
      elements.settingsVoiceSendMode.value = normalizeVoiceSendMode(settings.voice_send_mode || "auto_send");
    }
    if (elements.settingsVoiceSpeed) {
      elements.settingsVoiceSpeed.value = String(normalizeVoiceReplySpeed(settings.voice_reply_speed));
    }
    if (elements.settingsVoiceLanguageMode) {
      elements.settingsVoiceLanguageMode.value = normalizeVoiceInputLanguageMode(
        settings.voice_input_language_mode || "auto"
      );
    }
    if (elements.settingsVoiceLanguage) {
      elements.settingsVoiceLanguage.value = normalizeVoiceInputLanguage(settings.voice_input_language || "en");
    }
    if (elements.settingsVoiceGlossary) {
      elements.settingsVoiceGlossary.value = settings.voice_input_glossary || "";
    }
    elements.statusToggle.checked = Boolean(settings.is_online);
    elements.statusLabel.textContent = settings.is_online ? "Online" : "Offline";
    elements.statusLabel.classList.toggle("is-online", Boolean(settings.is_online));
    setAiEnabled(Boolean(settings.ai_enabled));
    if (elements.aiProvider) {
      elements.aiProvider.value = settings.ai_provider || "openai";
    }
    if (elements.aiModel) {
      const provider = elements.aiProvider ? elements.aiProvider.value : settings.ai_provider || "openai";
      const nextModel =
        provider === "openai"
          ? settings.ai_model && settings.ai_model !== "qwen3:8b"
            ? settings.ai_model
            : "gpt-5.4"
          : settings.ai_model || "qwen3:8b";
      if (
        elements.aiModel.tagName === "SELECT" &&
        nextModel &&
        !Array.from(elements.aiModel.options || []).some((option) => option.value === nextModel)
      ) {
        const customOption = document.createElement("option");
        customOption.value = nextModel;
        customOption.textContent = `${nextModel} (custom)`;
        elements.aiModel.appendChild(customOption);
      }
      elements.aiModel.value = nextModel;
    }
    if (elements.aiName) {
      elements.aiName.value = settings.ai_name || "AI Assistant";
    }
    renderAiAvatar(settings);
    if (elements.aiSystemPrompt) {
      elements.aiSystemPrompt.value = settings.ai_system_prompt || "";
    }
    if (elements.aiFallback) {
      elements.aiFallback.value =
        settings.ai_fallback_message || "Thanks for your message. A human agent will reply soon.";
    }
    if (elements.aiTemperature) {
      const temperature = clampNumber(settings.ai_temperature, 0, 2, 0.2);
      elements.aiTemperature.value = String(temperature);
    }
    if (elements.aiTopP) {
      const topP = clampNumber(settings.ai_top_p, 0.1, 1, 0.9);
      elements.aiTopP.value = String(topP);
    }
    if (elements.aiMaxTokens) {
      const maxTokens = clampNumber(settings.ai_max_tokens, 16, 2000, 160);
      elements.aiMaxTokens.value = String(Math.round(maxTokens));
    }
    elements.statusLabel.classList.toggle("is-online", Boolean(settings.is_online));
    if (elements.hoursEnabled) {
      elements.hoursEnabled.checked = Boolean(settings.business_hours_enabled);
    }
    if (elements.timezoneInput) {
      elements.timezoneInput.value = settings.business_timezone || "UTC";
    }
    try {
      state.businessHours = settings.business_hours_json
        ? JSON.parse(settings.business_hours_json)
        : {};
    } catch (err) {
      state.businessHours = {};
    }
    if (elements.hoursGrid) {
      buildHoursGrid(state.businessHours);
    }
    if (elements.settingsVoiceEnabled && !elements.settingsVoiceEnabled.dataset.bound) {
      elements.settingsVoiceEnabled.dataset.bound = "1";
      elements.settingsVoiceEnabled.addEventListener("change", () => {
        updateVoiceSettingsControls();
        updateWidgetPreview();
      });
    }
    if (elements.settingsVoiceLanguageMode && !elements.settingsVoiceLanguageMode.dataset.bound) {
      elements.settingsVoiceLanguageMode.dataset.bound = "1";
      elements.settingsVoiceLanguageMode.addEventListener("change", () => {
        updateVoiceSettingsControls();
        updateWidgetPreview();
      });
    }
    if (elements.settingsVoiceSendMode && !elements.settingsVoiceSendMode.dataset.bound) {
      elements.settingsVoiceSendMode.dataset.bound = "1";
      elements.settingsVoiceSendMode.addEventListener("change", () => {
        updateVoiceSettingsControls();
        updateWidgetPreview();
      });
    }
    if (elements.settingsVoiceLanguage && !elements.settingsVoiceLanguage.dataset.bound) {
      elements.settingsVoiceLanguage.dataset.bound = "1";
      elements.settingsVoiceLanguage.addEventListener("change", () => {
        updateVoiceSettingsControls();
        updateWidgetPreview();
      });
    }
    if (elements.settingsVoiceSpeed && !elements.settingsVoiceSpeed.dataset.bound) {
      elements.settingsVoiceSpeed.dataset.bound = "1";
      elements.settingsVoiceSpeed.addEventListener("change", () => {
        updateVoiceSettingsControls();
        updateWidgetPreview();
      });
    }
    if (elements.settingsVoiceGlossary && !elements.settingsVoiceGlossary.dataset.bound) {
      elements.settingsVoiceGlossary.dataset.bound = "1";
      elements.settingsVoiceGlossary.addEventListener("input", updateVoiceSettingsControls);
    }
    if (elements.settingsVoiceSelect && !elements.settingsVoiceSelect.dataset.bound) {
      elements.settingsVoiceSelect.dataset.bound = "1";
      elements.settingsVoiceSelect.addEventListener("change", updateVoiceSettingsControls);
    }
    if (elements.settingsVoiceSample && !elements.settingsVoiceSample.dataset.bound) {
      elements.settingsVoiceSample.dataset.bound = "1";
      elements.settingsVoiceSample.addEventListener("click", async () => {
        try {
          if (state.voiceSampleAudio) {
            stopVoiceSamplePreview();
            return;
          }
          await playVoiceSamplePreview();
        } catch (err) {
          stopVoiceSamplePreview();
          window.alert(err.message || "Failed to preview voice sample.");
        }
      });
    }
    updateWidgetPreview();
    resetPreviewConversation();
    setPreviewOpen(false);
    state.settingsDirty = false;
    state.aiSettingsDirty = false;
    if (elements.settingsSaveStatus) {
      elements.settingsSaveStatus.textContent = "";
      elements.settingsSaveStatus.classList.remove("is-saved");
    }
    await loadMembershipStatus({ silent: true });
  };

  const persistSettings = async () => {
    const formData = new FormData(elements.settingsForm);
    const payload = Object.fromEntries(formData.entries());
    if (elements.settingsOfflineAiContactPrompt) {
      payload.offline_ai_contact_prompt = Boolean(elements.settingsOfflineAiContactPrompt.checked);
    }
    payload.is_online = elements.statusToggle.checked;
    payload.business_hours_enabled = elements.hoursEnabled ? elements.hoursEnabled.checked : false;
    payload.business_timezone = elements.timezoneInput
      ? elements.timezoneInput.value.trim() || "UTC"
      : state.settings.business_timezone || "UTC";
    payload.business_hours_json = elements.hoursGrid ? JSON.stringify(collectHours()) : "{}";
    if (elements.settingsVoiceEnabled) {
      payload.voice_mode_enabled = Boolean(elements.settingsVoiceEnabled.checked);
    }
    if (elements.settingsVoiceSelect) {
      payload.voice_reply_voice = elements.settingsVoiceSelect.value || "alloy";
    }
    if (elements.settingsVoiceSendMode) {
      payload.voice_send_mode = normalizeVoiceSendMode(elements.settingsVoiceSendMode.value || "auto_send");
    }
    if (elements.settingsVoiceSpeed) {
      payload.voice_reply_speed = normalizeVoiceReplySpeed(elements.settingsVoiceSpeed.value || 1);
    }
    if (elements.settingsVoiceLanguageMode) {
      payload.voice_input_language_mode = normalizeVoiceInputLanguageMode(
        elements.settingsVoiceLanguageMode.value || "auto"
      );
    }
    if (elements.settingsVoiceLanguage) {
      payload.voice_input_language = normalizeVoiceInputLanguage(elements.settingsVoiceLanguage.value || "en");
    }
    if (elements.settingsVoiceGlossary) {
      payload.voice_input_glossary = elements.settingsVoiceGlossary.value.trim();
    }
    if (!payload.greeting_message && payload.greeting_online_message) {
      payload.greeting_message = payload.greeting_online_message;
    }
    await fetchJson(`${API_BASE}/admin/settings`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    await persistSettings();
    await loadSettings();
    if (elements.settingsSaveStatus) {
      elements.settingsSaveStatus.textContent = "Saved";
      elements.settingsSaveStatus.classList.add("is-saved");
      clearTimeout(elements.settingsSaveStatus._timer);
      elements.settingsSaveStatus._timer = setTimeout(() => {
        elements.settingsSaveStatus.textContent = "";
        elements.settingsSaveStatus.classList.remove("is-saved");
      }, 2000);
    }
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

  const parsePopupActions = (value) => {
    if (value === undefined || value === null || value === "") {
      return [];
    }
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 6);
    }
    const raw = String(value || "").trim();
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 6);
    } catch (err) {
      return [];
    }
  };

  const applyPopupLocaleFormState = (localePath) => {
    const normalized = normalizePopupLocalePath(localePath);
    if (elements.popupLocale) {
      elements.popupLocale.value = normalized;
    }
    if (!elements.popupLanguageTarget) {
      return;
    }
    if (!normalized) {
      elements.popupLanguageTarget.value = "all";
      if (elements.popupLanguageCode) {
        elements.popupLanguageCode.value = "/en";
      }
      if (elements.popupLanguageCustom) {
        elements.popupLanguageCustom.value = "";
      }
      elements.popupLanguageTarget.dispatchEvent(new Event("change"));
      return;
    }

    elements.popupLanguageTarget.value = "specific";
    elements.popupLanguageTarget.dispatchEvent(new Event("change"));
    if (elements.popupLanguageCode) {
      const hasPreset = Array.from(elements.popupLanguageCode.options || []).some(
        (option) => option.value === normalized
      );
      elements.popupLanguageCode.value = hasPreset ? normalized : "custom";
      elements.popupLanguageCode.dispatchEvent(new Event("change"));
    }
    if (elements.popupLanguageCustom && elements.popupLanguageCode?.value === "custom") {
      elements.popupLanguageCustom.value = normalized;
      elements.popupLanguageCustom.dispatchEvent(new Event("input"));
    }
  };

  const renderPopupRules = () => {
    elements.popupList.innerHTML = "";
    if (!state.popupRules.length) {
      elements.popupList.innerHTML = "<p class='chat-meta'>No popup rules yet.</p>";
      return;
    }
    state.popupRules.forEach((rule) => {
      const item = document.createElement("div");
      item.className = "popup-item";
      const localeLabel = normalizePopupLocalePath(rule.locale_path);
      const popupActions = parsePopupActions(
        rule.popup_actions !== undefined ? rule.popup_actions : rule.popup_actions_json
      );
      const quickRepliesHtml = popupActions.length
        ? `<div class="popup-rule-replies"><span class="chat-meta">Quick replies:</span>${popupActions
            .map((action) => `<span class="badge badge-language">${safe(action)}</span>`)
            .join("")}</div>`
        : "";
      item.innerHTML = `
        <header>
          <h4>${safe(rule.name)}</h4>
          <span class="badge-row">
            <span class="badge badge-language">${localeLabel || "All"}</span>
            <span class="badge">${rule.is_active ? "Active" : "Paused"}</span>
          </span>
        </header>
        <p>${safe(rule.message)}</p>
        ${quickRepliesHtml}
        <p>Match: ${safe(rule.match_type)} ${safe(rule.match_value)} / ${safe(rule.audience_status)} / ${safe(
        rule.audience_returning
      )} / ${safe(rule.delay_seconds)}s</p>
        <div class="popup-actions popup-actions-compact">
          <button type="button" data-action="duplicate">Use as template</button>
          <button type="button" data-action="toggle">${rule.is_active ? "Pause rule" : "Enable rule"}</button>
          <button type="button" class="danger" data-action="delete">Remove</button>
        </div>
      `;
      item.querySelector("[data-action='duplicate']").addEventListener("click", () => {
        const form = elements.popupForm;
        if (!form) {
          return;
        }
        const nameInput = form.querySelector("#popup-name");
        const messageInput = form.querySelector("#popup-message");
        const matchTypeInput = form.querySelector("#popup-match");
        const matchValueInput = form.querySelector("#popup-value");
        const statusInput = form.querySelector("#popup-status");
        const visitorInput = form.querySelector("#popup-visitor");
        const delayInput = form.querySelector("#popup-delay");
        if (nameInput) {
          nameInput.value = rule.name || "";
        }
        if (messageInput) {
          messageInput.value = rule.message || "";
        }
        if (matchTypeInput) {
          matchTypeInput.value = rule.match_type || "contains";
        }
        if (matchValueInput) {
          matchValueInput.value = rule.match_value || "/";
        }
        if (statusInput) {
          statusInput.value = rule.audience_status || "any";
        }
        if (visitorInput) {
          visitorInput.value = rule.audience_returning || "any";
        }
        if (delayInput) {
          delayInput.value = String(rule.delay_seconds || 6);
        }
        if (elements.popupActionsJson) {
          elements.popupActionsJson.value = popupActions.length ? JSON.stringify(popupActions) : "";
          elements.popupActionsJson.dispatchEvent(new Event("change"));
        }
        if (elements.popupPreset) {
          elements.popupPreset.value = "custom";
        }
        applyPopupLocaleFormState(rule.locale_path);
        if (nameInput && nameInput.focus) {
          nameInput.focus();
        }
      });
      item.querySelector("[data-action='toggle']").addEventListener("click", async () => {
        await fetchJson(`${API_BASE}/admin/popup-rules/${rule.id}`, {
          method: "PUT",
          body: JSON.stringify({ is_active: rule.is_active ? 0 : 1 })
        });
        await loadPopupRules();
      });
      item.querySelector("[data-action='delete']").addEventListener("click", async () => {
        if (!window.confirm("Delete this popup rule")) {
          return;
        }
        await fetchJson(`${API_BASE}/admin/popup-rules/${rule.id}`, { method: "DELETE" });
        await loadPopupRules();
      });
      elements.popupList.appendChild(item);
    });
  };

  const loadPopupRules = async () => {
    const data = await fetchJson(`${API_BASE}/admin/popup-rules`);
    state.popupRules = data.rules || [];
    renderPopupRules();
  };

  return {
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
  };
};

