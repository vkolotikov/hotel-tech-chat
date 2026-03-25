(() => {
  const widget = window.__ocWidget || (window.__ocWidget = {});
  const bootstrap = window.__ocWidgetBootstrap || {};
  const getScriptFromDom = () => {
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    for (let index = scripts.length - 1; index >= 0; index -= 1) {
      const src = String(scripts[index].getAttribute("src") || "");
      if (src.includes("/widget/widget.js")) {
        return scripts[index];
      }
    }
    return null;
  };
  const getRuntimeGlobalConfig = () => window.OnlineChatConfig || window.onlineChatConfig || {};
  const normalizeText = (value) => String(value || "").trim();
  const readScriptParam = (sourceScript, names) => {
    if (!sourceScript?.src) {
      return "";
    }
    try {
      const url = new URL(sourceScript.src, window.location.href);
      for (const name of names) {
        const value = normalizeText(url.searchParams.get(name));
        if (value) {
          return value;
        }
      }
    } catch (err) {
      return "";
    }
    return "";
  };
  const getScriptCandidate = () => bootstrap.scriptEl || document.currentScript || getScriptFromDom();
  const getInferredBase = (sourceScript) =>
    sourceScript && sourceScript.src ? sourceScript.src.split("/").slice(0, -1).join("/") : "";
  const getWebsiteKey = (sourceScript, runtimeConfig) =>
    normalizeText(
      sourceScript?.dataset.websiteKey ||
        sourceScript?.dataset.websitekey ||
        runtimeConfig.websiteKey ||
        runtimeConfig.website_key ||
        readScriptParam(sourceScript, ["website_key", "websiteKey", "key"])
    );
  const getWebsiteDomain = (sourceScript, runtimeConfig) =>
    normalizeText(
      sourceScript?.dataset.websiteDomain ||
        runtimeConfig.websiteDomain ||
        runtimeConfig.website_domain ||
        readScriptParam(sourceScript, ["website_domain", "websiteDomain", "domain"])
    );
  const normalizeUrl = (value) => String(value || "").trim().replace(/\/+$/, "");
  const deriveApiBase = (sourceScript, runtimeConfig, fallback = "") => {
    const inferredBase = getInferredBase(sourceScript);
    const explicit = normalizeUrl(
      sourceScript?.dataset.apiBase || runtimeConfig.apiBase || runtimeConfig.api_base
    );
    if (explicit) {
      return explicit;
    }
    const widgetBase = normalizeUrl(
      sourceScript?.dataset.widgetBase ||
        runtimeConfig.widgetBase ||
        runtimeConfig.widget_base ||
        inferredBase
    );
    if (widgetBase) {
      try {
        const origin = new URL(widgetBase, window.location.href).origin;
        if (origin) {
          return `${origin}/api`;
        }
      } catch (err) {
        // fallback below
      }
    }
    return fallback || "http://localhost/hotel-tech/apps/chat/api/public/api";
  };
  const scriptEl = getScriptCandidate();
  const inferredBase = getInferredBase(scriptEl);
  const globalConfig = bootstrap.globalConfig || getRuntimeGlobalConfig();

  const config = {
    apiBase: deriveApiBase(scriptEl, globalConfig),
    widgetBase: scriptEl?.dataset.widgetBase || globalConfig.widgetBase || inferredBase,
    position: scriptEl?.dataset.position || globalConfig.position || "right",
    maxUploadBytes: Number(
      scriptEl?.dataset.maxUploadBytes || globalConfig.maxUploadBytes || 5 * 1024 * 1024
    ),
    websiteKey: getWebsiteKey(scriptEl, globalConfig),
    websiteDomain: getWebsiteDomain(scriptEl, globalConfig)
  };

  const refreshWebsiteContext = () => {
    const nextGlobalConfig = getRuntimeGlobalConfig();
    const nextScriptEl = getScriptCandidate() || scriptEl;
    const nextWebsiteKey = getWebsiteKey(nextScriptEl, nextGlobalConfig);
    const nextWebsiteDomain = getWebsiteDomain(nextScriptEl, nextGlobalConfig);
    const nextApiBase = deriveApiBase(nextScriptEl, nextGlobalConfig, config.apiBase);
    if (nextWebsiteKey) {
      config.websiteKey = nextWebsiteKey;
    }
    if (nextWebsiteDomain) {
      config.websiteDomain = nextWebsiteDomain;
    }
    if (nextApiBase) {
      config.apiBase = nextApiBase;
    }
    widget.scriptEl = nextScriptEl;
    widget.globalConfig = nextGlobalConfig;
    return Boolean(config.websiteKey);
  };

  const storage = {
    get: (key) => {
      try {
        return localStorage.getItem(key);
      } catch (err) {
        return null;
      }
    },
    set: (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch (err) {
        return null;
      }
    }
  };

  const hasVisited = storage.get("oc_has_visited") === "true";
  storage.set("oc_has_visited", "true");

  const state = {
    isOpen: false,
    settings: null,
    assignedAgent: null,
    visitorId: storage.get("oc_visitor_id"),
    sessionId: storage.get("oc_session_id"),
    leadCaptured: storage.get("oc_lead_captured") === "true",
    leadPrompted: storage.get("oc_lead_prompted") === "true",
    visitorType: hasVisited ? "returning" : "first",
    pendingMessage: null,
    pendingEchoes: [],
    lastMessageId: 0,
    greetingShown: false,
    pollTimer: null,
    polling: false,
    backgroundTimer: null,
    backgroundPolling: false,
    popupTimer: null,
    popupContext: null,
    pendingPopup: null,
    lastAutomationPrompt: null,
    pendingQuickReply: null,
    hasInteracted: false,
    lastTrackedUrl: "",
    trackTimer: null,
    historyPatched: false,
    typingTimeout: null,
    aiTyping: false,
    aiTypingTimer: null,
    serverTyping: null,
    voiceSupported: false,
    voiceModeEnabled: false,
    voiceRecording: false,
    voiceProcessing: false,
    voicePlaying: false,
    voiceAutoPlay: false,
    voiceRecorder: null,
    voiceStream: null,
    voiceChunks: [],
    voiceMimeType: "",
    voiceStatus: "",
    voiceStatusTimer: null,
    voiceDraft: null,
    voiceReplyCache: new Map(),
    activeReplyAudio: null,
    activeReplyAudioButton: null
  };

  widget.scriptEl = scriptEl;
  widget.inferredBase = inferredBase;
  widget.globalConfig = globalConfig;
  widget.config = config;
  widget.refreshWebsiteContext = refreshWebsiteContext;
  widget.storage = storage;
  widget.state = state;
})();
