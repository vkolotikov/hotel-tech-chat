var API_BASE =
  (window.OnlineChatAdminConfig && window.OnlineChatAdminConfig.apiBase) ||
  "http://localhost/hotel-tech/apps/chat/api/public/api";

const OC_SAAS_TENANT_KEY = "oc_saas_tenant_id";
let ocTokenCache = { token: "", expiresAt: 0 };

const getSelectedSaasTenantId = () =>
  String(localStorage.getItem(OC_SAAS_TENANT_KEY) || "").trim();

const setSelectedSaasTenantId = (tenantId) => {
  const value = String(tenantId || "").trim();
  if (!value) {
    localStorage.removeItem(OC_SAAS_TENANT_KEY);
    return;
  }
  localStorage.setItem(OC_SAAS_TENANT_KEY, value);
};

const getTenantHeaders = () => {
  const companyId = localStorage.getItem("oc_current_company_id");
  const websiteId = localStorage.getItem("oc_current_website_id");
  const saasTenantId = getSelectedSaasTenantId();
  const headers = {};
  if (companyId) {
    headers["X-Company-Id"] = companyId;
  }
  if (websiteId) {
    headers["X-Website-Id"] = websiteId;
  }
  if (saasTenantId) {
    headers["X-SaaS-Tenant-Id"] = saasTenantId;
  }
  return headers;
};

const resolveRawTokenValue = async (value) => {
  if (typeof value === "function") {
    return resolveRawTokenValue(await value());
  }
  if (value && typeof value.then === "function") {
    return resolveRawTokenValue(await value);
  }
  return String(value || "").trim();
};

const normalizeBearerToken = (value) => {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  if (text.toLowerCase().startsWith("bearer ")) {
    return text.slice(7).trim();
  }
  return text;
};

const tryResolveConfigToken = async () => {
  const cfg = window.OnlineChatAdminConfig || {};
  if (cfg.saasToken) {
    const raw = await resolveRawTokenValue(cfg.saasToken);
    return normalizeBearerToken(raw);
  }
  if (typeof cfg.getSaasToken === "function") {
    const raw = await resolveRawTokenValue(cfg.getSaasToken());
    return normalizeBearerToken(raw);
  }
  return "";
};

const getSaasBearerToken = async () => {
  const now = Date.now();
  if (ocTokenCache.token && ocTokenCache.expiresAt > now) {
    return ocTokenCache.token;
  }
  const token = await tryResolveConfigToken();
  if (!token) {
    ocTokenCache = { token: "", expiresAt: 0 };
    return "";
  }
  ocTokenCache = {
    token,
    expiresAt: now + 20 * 1000
  };
  return token;
};

const buildRequestHeaders = async (options = {}) => {
  const headers = {
    ...getTenantHeaders(),
    ...(options.headers || {})
  };
  if (!options.skipJsonContentType && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const token = await getSaasBearerToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const fetchWithAuth = async (url, options = {}) => {
  const headers = await buildRequestHeaders({
    headers: options.headers,
    skipJsonContentType: options.skipJsonContentType
  });
  const requestOptions = { ...options, headers };
  delete requestOptions.skipJsonContentType;
  return fetch(url, {
    credentials: "include",
    ...requestOptions
  });
};

const fetchJson = async (url, options = {}) => {
  const response = await fetchWithAuth(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.error || "Request failed");
    err.status = Number(response.status || 0);
    err.code = data?.code || "";
    err.reason = data?.reason || "";
    throw err;
  }
  return data;
};

const formatDate = (value) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

const formatUnixDate = (value) => {
  if (!value) {
    return "";
  }
  return formatDate(Number(value) * 1000);
};

const formatFileSize = (bytes) => {
  const size = Number(bytes || 0);
  if (!size) {
    return "";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${Math.round(size / 102.4) / 10} KB`;
  }
  return `${Math.round(size / (1024 * 102.4)) / 10} MB`;
};

const truncateText = (value, maxLen = 140) => {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  if (text.length <= maxLen) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLen - 3))}...`;
};

const clampNumber = (value, min, max, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
};

const formatDuration = (seconds) => {
  const total = Math.max(0, Math.floor(Number(seconds || 0)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

const getHostFromUrl = (value) => {
  if (!value) {
    return "";
  }
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "");
  } catch (err) {
    return String(value).replace(/^https?:\/\//, "").split("/")[0];
  }
};

const getPathFromUrl = (value) => {
  if (!value) {
    return "";
  }
  try {
    const url = new URL(value);
    const path = url.pathname || "/";
    return `${path}${url.search || ""}`.trim();
  } catch (err) {
    const text = String(value).trim();
    if (text.startsWith("/")) {
      return text;
    }
    const parts = text.split("/");
    return parts.length > 1 ? `/${parts.slice(1).join("/")}` : text;
  }
};

const getPathAlias = (value) => {
  const path = getPathFromUrl(value).split("?")[0].replace(/\/+$/, "");
  if (!path || path === "/") {
    return "Home";
  }
  const alias = path.split("/").pop() || path;
  return alias.length > 28 ? `${alias.slice(0, 26)}...` : alias;
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getInitials = (value, fallback = "OC") => {
  const text = String(value || "").trim();
  if (!text) {
    return fallback;
  }
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const isOwnerMembershipRole = (role) => ["owner", "admin"].includes(String(role || "").trim().toLowerCase());

const humanizeSaasValue = (value, fallback = "Unknown") => {
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

const pickSaasUpgradePlan = (plans = [], currentPlanKey = "") => {
  const normalizedCurrent = String(currentPlanKey || "").trim().toLowerCase();
  const activePlans = (Array.isArray(plans) ? plans : []).filter(
    (plan) =>
      !plan?.is_trial &&
      String(plan?.status || "").trim().toLowerCase() !== "inactive" &&
      String(plan?.plan_key || "").trim().toLowerCase() !== normalizedCurrent
  );
  return activePlans.find((plan) => Boolean(plan?.recommended)) || activePlans[0] || null;
};

const resolveSaasPrimaryAction = (options = {}) => {
  const enabled = Boolean(options.enabled);
  const hasTenant = Boolean(String(options.tenantId || "").trim());
  const isBusy = Boolean(options.busy);
  const isOwnerAdmin = isOwnerMembershipRole(options.role);
  const nextAction = String(options.nextAction || "").trim().toLowerCase();
  const customerState = String(options.customerState || "").trim().toLowerCase();
  const workspaceReady = Boolean(options.workspaceReady);
  const entitled = Boolean(options.entitled);
  const canStartTrial = Boolean(options.canStartTrial);
  const canUpgrade = Boolean(options.canUpgrade);
  const canManageBilling = Boolean(options.canManageBilling);
  const trialPlanAvailable = options.trialPlanAvailable !== false;
  const upgradePlanAvailable = options.upgradePlanAvailable !== false;

  if (!enabled || !hasTenant) {
    return {
      hidden: true,
      action: "",
      label: "Take action",
      disabled: true,
      title: "Select a workspace first"
    };
  }

  if (nextAction === "start_trial" && isOwnerAdmin && canStartTrial && trialPlanAvailable) {
    return { hidden: false, action: "trial", label: "Start free trial", disabled: isBusy, title: "" };
  }

  if (nextAction === "upgrade" && isOwnerAdmin && canUpgrade && upgradePlanAvailable) {
    return { hidden: false, action: "upgrade", label: "Upgrade plan", disabled: isBusy, title: "" };
  }

  if (nextAction === "manage_billing" && isOwnerAdmin && canManageBilling) {
    return { hidden: false, action: "billing", label: "Manage billing", disabled: isBusy, title: "" };
  }

  if (nextAction === "finish_setup" || (!workspaceReady && customerState === "setup_in_progress")) {
    return { hidden: false, action: "refresh", label: "Refresh status", disabled: isBusy, title: "" };
  }

  if (workspaceReady && entitled && !["payment_required", "suspended", "archived", "no_access"].includes(customerState)) {
    return { hidden: false, action: "install", label: "Install widget", disabled: isBusy, title: "" };
  }

  if (nextAction === "contact_support") {
    return {
      hidden: false,
      action: "",
      label: "Contact support",
      disabled: true,
      title: "Support-assisted activation only"
    };
  }

  return {
    hidden: true,
    action: "",
    label: "Take action",
    disabled: true,
    title: ""
  };
};

const resolveSaasStatusMessage = (options = {}) => {
  const surface = String(options.surface || "default").trim().toLowerCase();
  const displayMessage = String(options.displayMessage || "").trim();
  const customerState = String(options.customerState || "").trim().toLowerCase();
  const nextAction = String(options.nextAction || "").trim().toLowerCase();
  const isOwnerAdmin = isOwnerMembershipRole(options.role);
  const periodEndText = String(options.periodEndText || "").trim();

  if (
    !isOwnerAdmin &&
    ["no_access", "payment_required", "past_due", "suspended", "archived", "setup_in_progress"].includes(customerState)
  ) {
    return "Only workspace owner/admin can resolve billing or access for this workspace.";
  }

  if (displayMessage) {
    return displayMessage;
  }

  if (customerState === "trial_active") {
    return periodEndText
      ? `Trial is active until ${periodEndText}.`
      : "Trial is active for this workspace.";
  }

  if (customerState === "active") {
    if (surface === "membership" && nextAction && nextAction !== "none") {
      return `Workspace plan and access are up to date. Next: ${humanizeSaasValue(nextAction, "None")}.`;
    }
    return "Workspace access is active and ready.";
  }

  if (customerState === "setup_in_progress") {
    return "Workspace setup is still in progress.";
  }

  if (customerState === "payment_required" || customerState === "past_due") {
    return "Workspace billing is past due. Update payment details to continue.";
  }

  if (customerState === "suspended" || customerState === "archived") {
    return "Workspace access is suspended. Review billing or contact support.";
  }

  if (customerState === "no_access") {
    return "Chat Widget is not enabled for this workspace.";
  }

  if (surface === "membership" && nextAction && nextAction !== "none") {
    return `Next: ${humanizeSaasValue(nextAction, "None")}.`;
  }

  return "Workspace access is not ready.";
};

const applySaasButtonState = (button, options = {}) => {
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
  } else if (typeof button.removeAttribute === "function") {
    button.removeAttribute("title");
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
};

window.OnlineChatAdmin = {
  ...(window.OnlineChatAdmin || {}),
  getTenantHeaders,
  getSelectedSaasTenantId,
  setSelectedSaasTenantId,
  getSaasBearerToken,
  fetchWithAuth,
  pickSaasUpgradePlan,
  resolveSaasPrimaryAction,
  resolveSaasStatusMessage,
  applySaasButtonState,
  isOwnerMembershipRole
};

