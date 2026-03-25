(() => {
  const widget = window.__ocWidget || (window.__ocWidget = {});
  const { storage } = widget;

  const hasSeenPopup = (ruleId) => storage.get(`oc_popup_seen_${ruleId}`) === "true";

  const markPopupSeen = (ruleId) => storage.set(`oc_popup_seen_${ruleId}`, "true");

  const isPopupMatch = (rule, url) => {
    const value = (rule.match_value || "").trim();
    if (!value || value === "*") {
      return true;
    }
    if (rule.match_type === "exact") {
      const path = window.location.pathname || "";
      return url === value || path === value;
    }
    if (rule.match_type === "regex") {
      try {
        return new RegExp(value).test(url);
      } catch (err) {
        return false;
      }
    }
    return url.includes(value);
  };

  const normalizeLocalePath = (value) => {
    let next = String(value || "").trim().toLowerCase();
    if (!next) {
      return "";
    }
    if (!next.startsWith("/")) {
      next = `/${next}`;
    }
    if (next.length > 1) {
      next = next.replace(/\/+$/, "");
    }
    return /^\/[a-z]{2}(?:-[a-z]{2})?$/.test(next) ? next : "";
  };

  const getCurrentPath = () => String(window.location.pathname || "/").toLowerCase();

  const isLocaleRuleMatch = (rule, path) => {
    const localePath = normalizeLocalePath(rule.locale_path);
    if (!localePath) {
      return false;
    }
    return path === localePath || path.startsWith(`${localePath}/`);
  };

  const isGenericLocaleRule = (rule) => !normalizeLocalePath(rule.locale_path);

  const pickPopupRule = (rules, url, status, visitorType) => {
    if (!Array.isArray(rules)) {
      return null;
    }
    const path = getCurrentPath();
    const candidates = rules.filter((rule) => {
      if (!rule || !rule.id) {
        return false;
      }
      if (hasSeenPopup(rule.id)) {
        return false;
      }
      if (rule.audience_status && rule.audience_status !== "any" && rule.audience_status !== status) {
        return false;
      }
      if (
        rule.audience_returning &&
        rule.audience_returning !== "any" &&
        rule.audience_returning !== visitorType
      ) {
        return false;
      }
      return isPopupMatch(rule, url);
    });
    if (!candidates.length) {
      return null;
    }

    const localized = candidates.find((rule) => isLocaleRuleMatch(rule, path));
    if (localized) {
      return localized;
    }

    return candidates.find((rule) => isGenericLocaleRule(rule)) || null;
  };

  widget.hasSeenPopup = hasSeenPopup;
  widget.markPopupSeen = markPopupSeen;
  widget.isPopupMatch = isPopupMatch;
  widget.pickPopupRule = pickPopupRule;
})();
