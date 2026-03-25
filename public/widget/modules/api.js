(() => {
  const widget = window.__ocWidget || (window.__ocWidget = {});
  const { config, state, storage } = widget;
  const { getPageContext, sleep } = widget;
  const { updateTypingIndicator, consumePendingEcho, getTypingDelay, addMessage } = widget;

  const ensureWebsiteContext = async (attempts = 8, waitMs = 120) => {
    const refreshContext =
      typeof widget.refreshWebsiteContext === "function"
        ? widget.refreshWebsiteContext
        : () => Boolean(config.websiteKey);
    for (let index = 0; index < attempts; index += 1) {
      if (refreshContext()) {
        return true;
      }
      if (index < attempts - 1) {
        await sleep(waitMs);
      }
    }
    return Boolean(config.websiteKey);
  };

  const parseError = async (response, fallback) => {
    try {
      const data = await response.json();
      if (data && data.error) {
        return String(data.error);
      }
    } catch (err) {
      // ignore and fall back
    }
    return fallback;
  };

  const getWebsitePayload = () => ({
    website_key: config.websiteKey || undefined,
    website_domain: config.websiteDomain || undefined
  });

  const withWebsiteQuery = (path, extras = {}) => {
    const params = new URLSearchParams();
    if (config.websiteKey) {
      params.set("website_key", config.websiteKey);
    }
    if (config.websiteDomain) {
      params.set("website_domain", config.websiteDomain);
    }
    Object.entries(extras || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });
    const query = params.toString();
    return `${config.apiBase}${path}${query ? `?${query}` : ""}`;
  };

  const fetchSettings = async () => {
    await ensureWebsiteContext();
    if (!config.websiteKey) {
      throw new Error("Widget website key is missing");
    }
    const url = withWebsiteQuery("/settings");
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(await parseError(response, "Failed to load settings"));
    }
    return response.json();
  };

  const initVisitor = async () => {
    const page = getPageContext();
    const response = await fetch(withWebsiteQuery("/visitor/init"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...getWebsitePayload(),
        visitorId: state.visitorId,
        sessionId: state.sessionId,
        url: page.url,
        path: page.path,
        title: page.title,
        referrer: page.referrer
      })
    });
    const data = await response.json();
    state.visitorId = data.visitorId;
    state.sessionId = data.sessionId;
    state.assignedAgent = data.assigned_agent || state.assignedAgent;
    storage.set("oc_visitor_id", state.visitorId);
    storage.set("oc_session_id", state.sessionId);
    return data;
  };

  const sendTrackEvent = async (eventType, payload = {}, preferBeacon = false) => {
    if (!state.sessionId) {
      return;
    }
    const body = JSON.stringify({
      ...getWebsitePayload(),
      visitorId: state.visitorId,
      sessionId: state.sessionId,
      event: eventType,
      ...payload
    });
    if (preferBeacon && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(withWebsiteQuery("/visitor/track"), blob);
      return;
    }
    await fetch(withWebsiteQuery("/visitor/track"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: preferBeacon
    });
  };

  const loadMessages = async (panel, sinceId = 0, options = {}) => {
    if (!state.sessionId) {
      return;
    }
    const response = await fetch(
      withWebsiteQuery("/messages", {
        sessionId: state.sessionId,
        sinceId
      })
    );
    const data = await response.json();
    const messages = data.messages || [];
    state.serverTyping = data.typing || null;
    updateTypingIndicator(panel);
    const simulateTyping = Boolean(options.simulateTyping && sinceId > 0);
    if (messages.length) {
      let hasAiReply = false;
      for (const msg of messages) {
        if (msg.sender_type === "visitor" && consumePendingEcho(msg.content)) {
          state.lastMessageId = Math.max(state.lastMessageId, msg.id);
          continue;
        }
        if (msg.sender_type === "system") {
          hasAiReply = true;
        }
        if (simulateTyping && msg.sender_type !== "visitor") {
          const delay = getTypingDelay(msg);
          if (delay > 0) {
            await sleep(delay);
          }
        }
        addMessage(panel, msg, { autoPlayVoice: Boolean(options.autoPlayVoice && sinceId > 0) });
        state.lastMessageId = Math.max(state.lastMessageId, msg.id);
      }
      if (hasAiReply) {
        state.aiTyping = false;
        if (state.aiTypingTimer) {
          clearTimeout(state.aiTypingTimer);
          state.aiTypingTimer = null;
        }
      }
      updateTypingIndicator(panel);
    }
    if (typeof options.onNewMessages === "function") {
      options.onNewMessages(messages);
    }
  };

  const sendMessage = async (content, meta = {}) => {
    const response = await fetch(withWebsiteQuery("/messages"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...getWebsitePayload(),
        sessionId: state.sessionId,
        content,
        ...(meta.voiceLanguage ? { voice_language: meta.voiceLanguage } : {})
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to send");
    }
    return data;
  };

  const submitLead = async (payload) => {
    const response = await fetch(withWebsiteQuery("/leads"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...getWebsitePayload(), ...payload, sessionId: state.sessionId })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to submit lead");
    }
    return data;
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("sessionId", state.sessionId);
    if (config.websiteKey) {
      formData.append("website_key", config.websiteKey);
    }
    if (config.websiteDomain) {
      formData.append("website_domain", config.websiteDomain);
    }
    formData.append("file", file);
    const response = await fetch(withWebsiteQuery("/upload"), {
      method: "POST",
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to upload file");
    }
    return data;
  };

  const transcribeVoiceMessage = async (audioBlob, meta = {}) => {
    const formData = new FormData();
    formData.append("sessionId", state.sessionId);
    if (config.websiteKey) {
      formData.append("website_key", config.websiteKey);
    }
    if (config.websiteDomain) {
      formData.append("website_domain", config.websiteDomain);
    }
    if (meta.durationMs) {
      formData.append("audio_duration_ms", String(meta.durationMs));
    }
    if (meta.languageHint) {
      formData.append("voice_language", String(meta.languageHint));
    }
    formData.append("audio", audioBlob, meta.fileName || "voice-message.webm");
    const response = await fetch(withWebsiteQuery("/voice/transcribe"), {
      method: "POST",
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to transcribe voice message");
    }
    return data;
  };

  const sendVoiceMessage = async (audioBlob, meta = {}) => {
    const formData = new FormData();
    formData.append("sessionId", state.sessionId);
    if (config.websiteKey) {
      formData.append("website_key", config.websiteKey);
    }
    if (config.websiteDomain) {
      formData.append("website_domain", config.websiteDomain);
    }
    if (meta.durationMs) {
      formData.append("audio_duration_ms", String(meta.durationMs));
    }
    if (meta.languageHint) {
      formData.append("voice_language", String(meta.languageHint));
    }
    formData.append("audio", audioBlob, meta.fileName || "voice-message.webm");
    const response = await fetch(withWebsiteQuery("/voice/message"), {
      method: "POST",
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to send voice message");
    }
    return data;
  };

  const fetchReplyAudio = async (messageId) => {
    const response = await fetch(withWebsiteQuery("/voice/reply-audio"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...getWebsitePayload(),
        sessionId: state.sessionId,
        messageId
      })
    });
    if (!response.ok) {
      throw new Error(await parseError(response, "Failed to load voice reply"));
    }
    return response.blob();
  };

  widget.fetchSettings = fetchSettings;
  widget.initVisitor = initVisitor;
  widget.sendTrackEvent = sendTrackEvent;
  widget.loadMessages = loadMessages;
  widget.sendMessage = sendMessage;
  widget.submitLead = submitLead;
  widget.uploadFile = uploadFile;
  widget.transcribeVoiceMessage = transcribeVoiceMessage;
  widget.sendVoiceMessage = sendVoiceMessage;
  widget.fetchReplyAudio = fetchReplyAudio;
})();
