/**
 * OnlineChat Admin Login — SaaS Platform Authentication
 *
 * Authenticates admin users via the SaaS platform token endpoint,
 * then provisions workspace access via the chat API.
 */

const POST_LOGIN_ONBOARDING_KEY = "oc_post_login_onboarding";

const mapFriendlyError = (err) => {
  const status = Number(err?.status || 0);
  const code = String(err?.code || "").toLowerCase();
  const text = String(err?.message || "").toLowerCase();
  if (status === 401 || code === "token_invalid" || text.includes("unauthorized")) {
    return "Invalid email or password.";
  }
  if (status === 403 && code === "entitlement_missing") {
    return "Your workspace does not have Chat Widget access yet.";
  }
  if (status === 403 && code === "entitlement_suspended") {
    return "Your workspace subscription is suspended.";
  }
  if (status === 403 && code === "past_due") {
    return "Your workspace billing is past due.";
  }
  if (status === 403 && code === "membership_missing") {
    return "No workspace access yet. Please complete onboarding first.";
  }
  if (status === 403 && code === "workspace_not_ready") {
    return err?.reason || "Workspace is being prepared. Try again in a moment.";
  }
  if (status === 429 || text.includes("rate limit") || text.includes("too many")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  return err?.message || "Sign in failed. Please try again.";
};

const storePostLoginOnboarding = (payload = {}) => {
  try {
    const selectedTenantId = String(payload?.selected_tenant_id || "").trim();
    const memberships = Array.isArray(payload?.memberships) ? payload.memberships : [];
    const selectedMembership =
      memberships.find((m) => String(m?.tenant_id || "") === selectedTenantId) || null;
    const snapshot = {
      selected_tenant_id: selectedTenantId,
      workspace_name: String(selectedMembership?.name || "").trim(),
      auto_provisioned: Boolean(payload?.auto_provisioned),
      onboarding_action_taken: String(payload?.onboarding_action_taken || "none"),
      plan_status: String(payload?.plan_status || ""),
      period_end: payload?.period_end || null,
      workspace_reason: String(payload?.workspace_reason || ""),
      membership_role: String(selectedMembership?.role || "").toLowerCase()
    };
    sessionStorage.setItem(POST_LOGIN_ONBOARDING_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore sessionStorage errors
  }
};

const initLogin = () => {
  const form = document.getElementById("login-form");
  const errorNode = document.getElementById("login-error");
  const submitBtn = document.getElementById("login-submit");
  const progressWrap = document.getElementById("auth-progress");
  const progressText = document.getElementById("auth-progress-text");

  if (!form || !errorNode) return;

  const setProgress = (label = "", visible = true) => {
    if (progressWrap) progressWrap.hidden = !visible;
    if (progressText) progressText.textContent = label || "";
    if (submitBtn) submitBtn.disabled = visible;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorNode.textContent = "";

    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();

    if (!email || !password) {
      errorNode.textContent = "Email and password are required.";
      return;
    }

    try {
      // Step 1: Authenticate with SaaS Platform
      setProgress("Authenticating...", true);

      const tokenResult = await fetchJson(`${API_BASE}/admin/login/saas`, {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      if (!tokenResult?.ok) {
        throw { message: tokenResult?.error || "Authentication failed", status: tokenResult?.status };
      }

      // Step 2: Store onboarding context
      storePostLoginOnboarding(tokenResult);

      // Success — redirect to dashboard
      setProgress("Opening workspace...", true);
      window.location.href = "dashboard.html";
    } catch (err) {
      setProgress("", false);
      errorNode.textContent = mapFriendlyError(err);
    }
  });

  // Load client config for links
  fetchJson(`${API_BASE}/admin/saas/client-config`)
    .then((cfg) => {
      const forgotLink = document.getElementById("forgot-password-link");
      const registerLink = document.getElementById("register-link");
      const platformUrl = String(cfg?.saas_base_url || "").trim();
      if (platformUrl) {
        if (forgotLink) forgotLink.href = `${platformUrl}/forgot-password`;
        if (registerLink) registerLink.href = `${platformUrl}/register`;
      }
    })
    .catch(() => {});
};
