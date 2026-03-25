(() => {
  const widget = window.__ocWidget || (window.__ocWidget = {});
  const { config, state, storage } = widget;
  const { injectStyles, createRoot, setBrandColor, setLauncherStyle, setLauncherShape, setLauncherGlyph } = widget;
  const { fetchSettings, initVisitor, loadMessages, sendMessage, submitLead, uploadFile, transcribeVoiceMessage, fetchReplyAudio } = widget;
  const { addMessage, updateTypingIndicator, startAiTyping, stopAiTyping, rememberPendingEcho } = widget;
  const { hasSeenPopup, markPopupSeen, pickPopupRule } = widget;
  const { truncateText } = widget;
  const { startTracking } = widget;
  const { startPolling, stopPolling } = widget;

  const initWidget = async () => {
    injectStyles();
    const root = createRoot();

    const toggleBtn = root.querySelector(".oc-button");
    const panel = root.querySelector(".oc-panel");
    const closeBtn = root.querySelector(".oc-close");
    const body = root.querySelector(".oc-body");
    const title = root.querySelector(".oc-title");
    const subtitle = root.querySelector(".oc-subtitle");
    const avatar = root.querySelector(".oc-avatar");
    const statusDot = root.querySelector(".oc-dot");
    const statusText = root.querySelector(".oc-status-text");
    const popup = root.querySelector(".oc-popup");
    const popupAvatar = root.querySelector(".oc-popup-avatar");
    const popupMeta = root.querySelector(".oc-popup-meta");
    const popupMessage = root.querySelector(".oc-popup-message");
    const popupActions = root.querySelector(".oc-popup-actions");
    const popupClose = root.querySelector(".oc-popup-close");
    const uploadBtn = root.querySelector(".oc-upload");
    const voiceBtn = root.querySelector(".oc-voice");
    const fileInput = root.querySelector(".oc-file");
    const input = root.querySelector("textarea");
    const sendBtn = root.querySelector(".oc-send");
    const voiceMeta = root.querySelector(".oc-voice-meta");
    const voiceStatus = root.querySelector(".oc-voice-status");
    const voiceDraft = root.querySelector(".oc-voice-draft");
    const voiceDraftRerecord = root.querySelector(".oc-voice-draft-rerecord");
    const voiceDraftClear = root.querySelector(".oc-voice-draft-clear");
    const leadBox = root.querySelector(".oc-lead");
    const leadForm = leadBox.querySelector("form");
    const leadHint = leadBox.querySelector(".oc-hint");
    const leadSkip = leadBox.querySelector(".oc-skip");

    const setAvatarElement = (element, label, imageUrl) => {
      if (!element) {
        return;
      }
      const initials = String(label || "OC")
        .trim()
        .slice(0, 2)
        .toUpperCase();
      element.textContent = initials || "OC";
      if (imageUrl) {
        element.style.backgroundImage = `url("${imageUrl}")`;
        element.classList.add("has-image");
      } else {
        element.style.backgroundImage = "";
        element.classList.remove("has-image");
      }
    };

    const setAvatar = (label, imageUrl) => {
      setAvatarElement(avatar, label, imageUrl);
    };

    const setPopupAvatar = (label, imageUrl) => {
      setAvatarElement(popupAvatar, label, imageUrl);
    };

    const isSecureVoiceContext = () =>
      window.isSecureContext ||
      ["localhost", "127.0.0.1", "::1"].includes(String(window.location.hostname || "").trim().toLowerCase());

    const getVoiceLanguageHint = () => {
      const pageLanguage = String(document.documentElement?.lang || "").trim();
      if (pageLanguage) {
        return pageLanguage;
      }
      if (Array.isArray(navigator.languages) && navigator.languages.length) {
        const preferred = String(navigator.languages[0] || "").trim();
        if (preferred) {
          return preferred;
        }
      }
      return String(navigator.language || "").trim();
    };

    const getVoiceLanguagePrimary = (value) =>
      String(value || "")
        .trim()
        .split("-")[0]
        .toLowerCase();

    const getVoiceSendMode = () =>
      String(state.settings?.voice_send_mode || "auto_send")
        .trim()
        .toLowerCase() === "review_first"
        ? "review_first"
        : "auto_send";

    const getPreferredVoiceMimeType = () => {
      if (typeof window.MediaRecorder === "undefined" || typeof window.MediaRecorder.isTypeSupported !== "function") {
        return "";
      }
      const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/mp4;codecs=mp4a.40.2"
      ];
      return candidates.find((value) => window.MediaRecorder.isTypeSupported(value)) || "";
    };

    const clearVoiceStatusTimer = () => {
      if (state.voiceStatusTimer) {
        clearTimeout(state.voiceStatusTimer);
        state.voiceStatusTimer = null;
      }
    };

    const stopActiveReplyAudio = () => {
      if (state.activeReplyAudio) {
        state.activeReplyAudio.pause();
        state.activeReplyAudio.src = "";
        state.activeReplyAudio = null;
      }
      if (state.activeReplyAudioButton) {
        state.activeReplyAudioButton.classList.remove("is-playing", "is-error");
        state.activeReplyAudioButton.setAttribute("aria-label", "Play voice reply");
        state.activeReplyAudioButton.setAttribute("title", "Play voice reply");
        state.activeReplyAudioButton = null;
      }
      state.voicePlaying = false;
    };

    const updateVoiceDraftUi = () => {
      const hasDraft = Boolean(state.voiceDraft && state.voiceDraft.text);
      if (voiceDraft) {
        voiceDraft.hidden = !state.voiceModeEnabled || !hasDraft;
      }
      root.classList.toggle("oc-has-voice-draft", hasDraft);
    };

    const setVoiceStatus = (text = "", options = {}) => {
      state.voiceStatus = String(text || "").trim();
      if (!voiceMeta || !voiceStatus) {
        return;
      }
      const hasVoiceUi = Boolean(state.voiceModeEnabled && state.voiceSupported);
      voiceMeta.hidden = !hasVoiceUi;
      voiceStatus.hidden = !state.voiceStatus;
      voiceStatus.textContent = state.voiceStatus;
      voiceStatus.classList.toggle("is-warning", Boolean(options.warning));
      voiceStatus.classList.toggle("is-error", Boolean(options.error));
      root.classList.toggle("oc-voice-recording", Boolean(options.recording));
      root.classList.toggle("oc-voice-processing", Boolean(options.processing));
      updateVoiceDraftUi();
      clearVoiceStatusTimer();
      if (state.voiceStatus && options.autoClearMs) {
        state.voiceStatusTimer = setTimeout(() => {
          setVoiceStatus("");
        }, options.autoClearMs);
      }
    };

    const clearVoiceDraft = ({ clearInput = false } = {}) => {
      state.voiceDraft = null;
      if (clearInput && input && input.value.trim()) {
        input.value = "";
      }
      updateVoiceDraftUi();
    };

    const applyVoiceDraft = (draft = {}) => {
      const transcript = String(draft.transcript || "").trim();
      if (!transcript) {
        clearVoiceDraft();
        return;
      }
      state.voiceDraft = {
        text: transcript,
        detectedLanguage: String(draft.detectedLanguage || "").trim(),
        resolvedLanguage: String(draft.resolvedLanguage || "").trim(),
        retried: Boolean(draft.retried)
      };
      if (input) {
        input.value = transcript;
        input.focus();
        input.setSelectionRange(transcript.length, transcript.length);
      }
      updateVoiceDraftUi();
      const detectedPrimary = getVoiceLanguagePrimary(draft.detectedLanguage || "");
      const resolvedPrimary = getVoiceLanguagePrimary(draft.resolvedLanguage || "");
      const needsReview =
        Boolean(draft.retried) ||
        (detectedPrimary && resolvedPrimary && detectedPrimary !== resolvedPrimary);
      setVoiceStatus(needsReview ? "Check transcript before sending" : "Voice draft ready", {
        autoClearMs: needsReview ? 3200 : 2200,
        warning: needsReview
      });
    };

    const clearVoiceReplyCache = () => {
      if (!state.voiceReplyCache || typeof state.voiceReplyCache.forEach !== "function") {
        state.voiceReplyCache = new Map();
        return;
      }
      state.voiceReplyCache.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (err) {
          // ignore
        }
      });
      state.voiceReplyCache.clear();
    };

    const updateVoiceControls = () => {
      const browserSupported =
        Boolean(window.navigator?.mediaDevices?.getUserMedia) &&
        typeof window.MediaRecorder !== "undefined" &&
        isSecureVoiceContext();
      state.voiceSupported = browserSupported;
      state.voiceModeEnabled = Boolean(Number(state.settings?.voice_mode_enabled || 0)) && browserSupported;
      if (voiceBtn) {
        voiceBtn.hidden = !state.voiceModeEnabled;
        voiceBtn.disabled = !state.voiceModeEnabled || state.voiceProcessing;
        voiceBtn.setAttribute(
          "aria-label",
          state.voiceRecording ? "Stop voice message" : "Start voice message"
        );
        voiceBtn.classList.toggle("is-recording", state.voiceRecording);
      }
      if (uploadBtn) {
        uploadBtn.disabled = state.voiceRecording || state.voiceProcessing;
      }
      if (sendBtn) {
        sendBtn.disabled = state.voiceRecording || state.voiceProcessing;
      }
      if (input) {
        input.disabled = state.voiceRecording || state.voiceProcessing;
      }
      if (voiceMeta) {
        voiceMeta.hidden = !state.voiceModeEnabled;
      }
      if (!browserSupported && Number(state.settings?.voice_mode_enabled || 0)) {
        setVoiceStatus("Mic blocked", { warning: true, autoClearMs: 2400 });
      } else if (!state.voiceRecording && !state.voiceProcessing && state.voiceStatus === "Mic blocked") {
        setVoiceStatus("");
      }
    };

    const finalizeVoiceMessage = async () => {
      const chunks = Array.isArray(state.voiceChunks) ? state.voiceChunks.slice() : [];
      const mimeType = state.voiceMimeType || chunks[0]?.type || "audio/webm";
      cleanupVoiceRecorder();
      if (!chunks.length) {
        setVoiceStatus("No audio captured", { autoClearMs: 2200 });
        return;
      }
      const blob = new Blob(chunks, { type: mimeType });
      if (!blob.size) {
        setVoiceStatus("No audio captured", { autoClearMs: 2200 });
        return;
      }
      state.voiceProcessing = true;
      updateVoiceControls();
      setVoiceStatus("Transcribing", { processing: true });
      try {
        if (!state.sessionId) {
          await initVisitor();
          applyHeader();
        }
        const durationMs = Number(state.voiceStartedAt ? Date.now() - state.voiceStartedAt : 0);
        const result = await transcribeVoiceMessage(blob, {
          fileName: mimeType.includes("mp4") ? "voice-message.m4a" : "voice-message.webm",
          durationMs,
          languageHint: getVoiceLanguageHint()
        });
        const transcript = String(result?.transcript || "").trim();
        const voiceDraftMeta = {
          transcript,
          detectedLanguage: result?.detected_language || "",
          resolvedLanguage: result?.resolved_language || "",
          retried: Boolean(result?.retried)
        };
        state.voiceAutoPlay = true;
        if (getVoiceSendMode() === "review_first") {
          applyVoiceDraft(voiceDraftMeta);
        } else {
          setVoiceStatus("Sending", { processing: true });
          const sendResult = await handleSend(transcript, {
            voiceDraftMeta,
            voiceAutoSend: true
          });
          if (sendResult === "sent") {
            setVoiceStatus("Voice sent", { autoClearMs: 1600 });
          } else if (sendResult === "lead_prompted") {
            setVoiceStatus("Share details first", {
              warning: true,
              autoClearMs: 2400
            });
          } else {
            setVoiceStatus("Check transcript before sending", {
              warning: true,
              autoClearMs: 3200
            });
          }
        }
      } catch (err) {
        const message = err?.message || "Voice draft failed";
        setVoiceStatus(message, {
          error: true,
          autoClearMs: 3200
        });
      } finally {
        state.voiceProcessing = false;
        updateVoiceControls();
      }
    };

    const toggleVoiceRecording = async () => {
      if (!state.voiceModeEnabled) {
        setVoiceStatus("Mic blocked", { warning: true, autoClearMs: 2200 });
        return;
      }
      if (shouldPromptLeadBeforeSending()) {
        leadBox.hidden = false;
        leadHint.hidden = true;
        state.leadPrompted = true;
        storage.set("oc_lead_prompted", "true");
        setVoiceStatus("Share details first", { warning: true, autoClearMs: 1800 });
        return;
      }
      if (state.voiceProcessing) {
        return;
      }
      if (state.voiceRecording && state.voiceRecorder) {
        setVoiceStatus("Transcribing", { processing: true });
        state.voiceRecorder.stop();
        return;
      }
      try {
        clearVoiceDraft();
        const mimeType = getPreferredVoiceMimeType();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        state.voiceChunks = [];
        state.voiceStream = stream;
        state.voiceRecorder = recorder;
        state.voiceMimeType = recorder.mimeType || mimeType || "audio/webm";
        state.voiceRecording = true;
        state.voiceStartedAt = Date.now();
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            state.voiceChunks.push(event.data);
          }
        };
        recorder.onerror = () => {
          cleanupVoiceRecorder();
          setVoiceStatus("Mic blocked", { error: true, autoClearMs: 2400 });
        };
        recorder.onstop = () => {
          finalizeVoiceMessage().catch(() => null);
        };
        recorder.start();
        updateVoiceControls();
        setVoiceStatus("Listening", { recording: true });
      } catch (err) {
        cleanupVoiceRecorder();
        setVoiceStatus("Mic blocked", { error: true, autoClearMs: 2400 });
      }
    };

    const shouldPromptLeadBeforeSending = () => {
      const humanOnlineValue =
        state.settings && state.settings.human_online !== undefined
          ? state.settings.human_online
          : state.settings && state.settings.is_online;
      const isOfflineAiFlow =
        !Boolean(Number(humanOnlineValue || 0)) &&
        Boolean(Number((state.settings && state.settings.ai_enabled) || 0));
      return (
        !state.leadCaptured &&
        state.settings?.lead_capture_mode === "before" &&
        (!isOfflineAiFlow || Boolean(Number((state.settings && state.settings.offline_ai_contact_prompt) || 0))) &&
        !state.leadPrompted
      );
    };

    const cleanupVoiceRecorder = () => {
      if (state.voiceRecorder) {
        state.voiceRecorder.ondataavailable = null;
        state.voiceRecorder.onstop = null;
        state.voiceRecorder.onerror = null;
        state.voiceRecorder = null;
      }
      if (state.voiceStream) {
        state.voiceStream.getTracks().forEach((track) => track.stop());
        state.voiceStream = null;
      }
      state.voiceChunks = [];
      state.voiceRecording = false;
      updateVoiceControls();
    };

    const playReplyAudio = async (message, triggerButton = null) => {
      const messageId = Number(message?.id || 0);
      if (!messageId) {
        throw new Error("Reply audio is unavailable");
      }
      stopActiveReplyAudio();
      let audioUrl = state.voiceReplyCache.get(messageId) || "";
      if (!audioUrl) {
        setVoiceStatus("Playing reply", { processing: true });
        const blob = await fetchReplyAudio(messageId);
        audioUrl = URL.createObjectURL(blob);
        state.voiceReplyCache.set(messageId, audioUrl);
      } else {
        setVoiceStatus("Playing reply");
      }
      const audio = new Audio(audioUrl);
      state.activeReplyAudio = audio;
      state.activeReplyAudioButton = triggerButton || null;
      if (triggerButton) {
        triggerButton.classList.remove("is-error");
        triggerButton.classList.add("is-playing");
        triggerButton.setAttribute("aria-label", "Playing voice reply");
        triggerButton.setAttribute("title", "Playing voice reply");
      }
      state.voicePlaying = true;
      audio.onended = () => {
        stopActiveReplyAudio();
        setVoiceStatus("", { autoClearMs: 0 });
      };
      audio.onerror = () => {
        stopActiveReplyAudio();
        setVoiceStatus("Playback failed", { error: true, autoClearMs: 2200 });
      };
      try {
        await audio.play();
      } catch (err) {
        stopActiveReplyAudio();
        setVoiceStatus("Playback failed", { error: true, autoClearMs: 2200 });
        throw err;
      }
      updateVoiceControls();
    };

    widget.playReplyAudio = playReplyAudio;

    const styleQuickReplyButton = (button) => {
      if (!button) {
        return;
      }
      button.style.setProperty("all", "unset", "important");
      button.style.setProperty("box-sizing", "border-box", "important");
      button.style.setProperty("display", "inline-flex", "important");
      button.style.setProperty("align-items", "center", "important");
      button.style.setProperty("justify-content", "center", "important");
      button.style.setProperty("-webkit-appearance", "none", "important");
      button.style.setProperty("appearance", "none", "important");
      button.style.setProperty("border", "1px solid rgba(var(--oc-brand-rgb), 0.38)", "important");
      button.style.setProperty(
        "background",
        "linear-gradient(145deg, rgba(var(--oc-brand-rgb), 0.34), rgba(var(--oc-brand-rgb), 0.18))",
        "important"
      );
      button.style.setProperty("color", "#ffffff", "important");
      button.style.setProperty("border-radius", "999px", "important");
      button.style.setProperty("padding", "9px 14px", "important");
      button.style.setProperty("font-family", "inherit", "important");
      button.style.setProperty("font-size", "12px", "important");
      button.style.setProperty("line-height", "1.2", "important");
      button.style.setProperty("font-weight", "700", "important");
      button.style.setProperty("letter-spacing", "0.01em", "important");
      button.style.setProperty("cursor", "pointer", "important");
      button.style.setProperty("white-space", "nowrap", "important");
      button.style.setProperty("box-shadow", "inset 0 0 0 1px rgba(255,255,255,0.08)", "important");
    };

    const suppressAutomationPrompt = (ruleId = null) => {
      const targetRuleId =
        ruleId ||
        (state.lastAutomationPrompt && state.lastAutomationPrompt.ruleId) ||
        (state.pendingPopup && state.pendingPopup.ruleId) ||
        null;
      if (targetRuleId) {
        markPopupSeen(targetRuleId);
      }
      if (!targetRuleId) {
        state.lastAutomationPrompt = null;
        state.pendingPopup = null;
        return;
      }
      if (state.lastAutomationPrompt && state.lastAutomationPrompt.ruleId === targetRuleId) {
        state.lastAutomationPrompt = null;
      }
      if (state.pendingPopup && state.pendingPopup.ruleId === targetRuleId) {
        state.pendingPopup = null;
      }
    };

    const showPopup = ({ message, meta = "", type = "automation", ruleId = null, actions = [] }) => {
      if (!popup) {
        return;
      }
      const normalizedActions = Array.isArray(actions)
        ? actions
            .map((item) => String(item || "").trim())
            .filter(Boolean)
            .slice(0, 6)
        : [];
      state.popupContext = { type, ruleId, message, actions: normalizedActions };
      if (type === "automation" && message) {
        state.lastAutomationPrompt = {
          message: String(message),
          actions: normalizedActions.slice(0, 6),
          ruleId: ruleId || null
        };
      }
      if (popupMeta) {
        popupMeta.textContent = meta;
        popupMeta.hidden = !meta;
      }
      popupMessage.textContent = message;
      if (popupActions) {
        popupActions.innerHTML = "";
        if (normalizedActions.length) {
          normalizedActions.forEach((action) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "oc-popup-action";
            button.textContent = action;
            button.dataset.popupAction = action;
            button.dataset.quickReply = "1";
            styleQuickReplyButton(button);
            popupActions.appendChild(button);
          });
          popupActions.hidden = false;
        } else {
          popupActions.hidden = true;
        }
      }
      popup.hidden = false;
      requestAnimationFrame(() => popup.classList.add("is-visible"));
    };

    const hidePopup = () => {
      if (!popup) {
        return;
      }
      popup.classList.remove("is-visible");
      setTimeout(() => {
        popup.hidden = true;
        if (popupMeta) {
          popupMeta.hidden = true;
        }
        if (popupActions) {
          popupActions.hidden = true;
          popupActions.innerHTML = "";
        }
        state.popupContext = null;
      }, 180);
    };

    const applyHeader = () => {
      const companyName = (state.settings && state.settings.company_name) || "OnlineChat";
      const agent = state.assignedAgent;
      const aiEnabled = Boolean(state.settings && state.settings.ai_enabled);
      const aiName =
        (state.settings && state.settings.ai_name) || (agent && agent.is_ai ? agent.name : "") || "AI Assistant";
      if (agent && agent.name && !agent.is_ai) {
        title.textContent = agent.name;
        subtitle.textContent = companyName;
        subtitle.hidden = false;
        setAvatar(agent.name, agent.avatar_url);
        setPopupAvatar(agent.name, agent.avatar_url);
      } else if (aiEnabled) {
        title.textContent = aiName;
        subtitle.textContent = companyName;
        subtitle.hidden = false;
        const aiAvatar = (state.settings && state.settings.ai_avatar_url) || null;
        setAvatar(aiName, aiAvatar);
        setPopupAvatar(aiName, aiAvatar);
      } else {
        title.textContent = companyName;
        subtitle.textContent = "";
        subtitle.hidden = true;
        setAvatar(companyName, null);
        setPopupAvatar(companyName, null);
      }
    };

    state.settings = await fetchSettings();
    setBrandColor(root, state.settings.widget_color || "#1f6b75");
    setLauncherStyle(root, state.settings.widget_icon_style || "classic");
    setLauncherShape(root, state.settings.widget_icon_shape || "circle");
    setLauncherGlyph(root, state.settings.widget_icon_glyph || "chat");
    updateVoiceControls();
    applyHeader();
    try {
      await initVisitor();
      applyHeader();
    } catch (err) {
      /* ignore init tracking errors */
    }

    if (state.settings.is_online) {
      statusText.textContent = "Online";
      statusDot.classList.remove("offline");
    } else {
      statusText.textContent = "Offline";
      statusDot.classList.add("offline");
    }
    updateVoiceControls();

    const handlePopupDismiss = () => {
      if (state.popupContext && state.popupContext.type === "automation") {
        suppressAutomationPrompt(state.popupContext.ruleId || null);
      }
      hidePopup();
    };

    const handlePopupOpen = () => {
      const popupContext = state.popupContext ? { ...state.popupContext } : null;
      if (popupContext && popupContext.type === "automation" && popupContext.message) {
        state.pendingPopup = {
          message: popupContext.message,
          ruleId: popupContext.ruleId || null,
          actions: Array.isArray(popupContext.actions) ? popupContext.actions.slice(0, 6) : []
        };
      }
      hidePopup();
      if (state.isOpen) {
        return;
      }
      toggleBtn.click();
    };

    const handlePopupAction = (actionText) => {
      const text = String(actionText || "").trim();
      if (!text) {
        return;
      }
      const popupContext = state.popupContext ? { ...state.popupContext } : null;
      state.pendingQuickReply = text;
      if (popupContext && popupContext.type === "automation" && popupContext.message) {
        state.pendingPopup = {
          message: popupContext.message,
          ruleId: popupContext.ruleId || null,
          actions: Array.isArray(popupContext.actions) ? popupContext.actions.slice(0, 6) : []
        };
      }
      hidePopup();
      if (!state.isOpen) {
        toggleBtn.click();
      }
    };

    popupClose.addEventListener("click", (event) => {
      event.stopPropagation();
      handlePopupDismiss();
    });

    popup.addEventListener("click", (event) => {
      if (event.target === popupClose) {
        return;
      }
      const actionButton = event.target.closest("[data-popup-action]");
      if (actionButton) {
        event.preventDefault();
        event.stopPropagation();
        handlePopupAction(actionButton.dataset.popupAction || "");
        return;
      }
      handlePopupOpen();
    });

    const schedulePopup = () => {
      if (state.popupTimer) {
        clearTimeout(state.popupTimer);
        state.popupTimer = null;
      }
      if (state.popupContext && state.popupContext.type === "message") {
        return;
      }
      const rules = state.settings.popup_rules || [];
      const status = state.settings.is_online ? "online" : "offline";
      const url = window.location.href;
      const rule = pickPopupRule(rules, url, status, state.visitorType);
      if (!rule) {
        return;
      }
      const delay = Math.max(0, Math.min(Number(rule.delay_seconds || 0), 60)) * 1000;
      state.popupTimer = window.setTimeout(() => {
        if (state.isOpen || state.hasInteracted) {
          return;
        }
        if (state.popupContext && state.popupContext.type === "message") {
          return;
        }
        const companyName = (state.settings && state.settings.company_name) || "OnlineChat";
        const agent = state.assignedAgent;
        if (agent && agent.name) {
          setPopupAvatar(agent.name, agent.avatar_url);
        } else {
          setPopupAvatar(companyName, null);
        }
        showPopup({
          message: rule.message,
          type: "automation",
          ruleId: rule.id,
          actions: rule.popup_actions || []
        });
      }, delay);
    };

    const getAgentLabel = (message) =>
      message.sender_name ||
      (state.assignedAgent && state.assignedAgent.name) ||
      (state.settings && state.settings.company_name) ||
      "Agent";

    const getMessagePreview = (message) => {
      if (message.message_type === "file") {
        return message.file_name || message.content || "Sent an attachment";
      }
      return message.content || "";
    };

    const notifyNewMessages = (messages) => {
      if (!messages.length || state.isOpen) {
        return;
      }
      const agentMessages = messages.filter((msg) => msg.sender_type !== "visitor");
      if (!agentMessages.length) {
        return;
      }
      const latest = agentMessages[agentMessages.length - 1];
      const preview = getMessagePreview(latest);
      const agentLabel = getAgentLabel(latest);
      const avatarUrl =
        latest.sender_type === "system"
          ? latest.sender_avatar || (state.settings && state.settings.ai_avatar_url) || null
          : latest.sender_avatar || (state.assignedAgent && state.assignedAgent.avatar_url) || null;
      setPopupAvatar(agentLabel, avatarUrl);
      showPopup({
        message: truncateText(preview, 140),
        meta: `New reply from ${agentLabel}`,
        type: "message"
      });
      state.hasInteracted = true;
    };

    const startBackgroundPolling = () => {
      if (!state.sessionId || state.backgroundTimer) {
        return;
      }
      state.backgroundTimer = setInterval(() => {
        if (state.backgroundPolling) {
          return;
        }
        state.backgroundPolling = true;
        loadMessages(body, state.lastMessageId, { onNewMessages: notifyNewMessages })
          .catch(() => null)
          .finally(() => {
            state.backgroundPolling = false;
          });
      }, 6000);
    };

    const stopBackgroundPolling = () => {
      if (state.backgroundTimer) {
        clearInterval(state.backgroundTimer);
        state.backgroundTimer = null;
      }
      state.backgroundPolling = false;
    };

    schedulePopup();
    startTracking();
    startBackgroundPolling();

    const renderInlinePopupActions = (actions = []) => {
      const normalized = Array.isArray(actions)
        ? actions
            .map((item) => String(item || "").trim())
            .filter(Boolean)
            .slice(0, 6)
        : [];
      if (!normalized.length) {
        return;
      }
      const wrap = document.createElement("div");
      wrap.className = "oc-inline-popup-actions";
      normalized.forEach((action) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "oc-inline-popup-action";
        button.textContent = action;
        button.dataset.quickReply = "1";
        styleQuickReplyButton(button);
        button.addEventListener("click", async () => {
          button.disabled = true;
          wrap.remove();
          await handleSend(action, { bypassLead: true });
        });
        wrap.appendChild(button);
      });
      body.appendChild(wrap);
      body.scrollTop = body.scrollHeight;
    };

    toggleBtn.addEventListener("click", async () => {
      state.isOpen = !state.isOpen;
      panel.classList.toggle("is-open", state.isOpen);
      toggleBtn.setAttribute("aria-label", state.isOpen ? "Close chat" : "Open chat");
      if (state.isOpen) {
        const popupContextOnOpen = state.popupContext && state.popupContext.type === "automation" ? { ...state.popupContext } : null;
        if (popupContextOnOpen && popupContextOnOpen.message && !state.pendingPopup) {
          state.pendingPopup = {
            message: popupContextOnOpen.message,
            ruleId: popupContextOnOpen.ruleId || null,
            actions: Array.isArray(popupContextOnOpen.actions) ? popupContextOnOpen.actions.slice(0, 6) : []
          };
        }
        state.hasInteracted = true;
        hidePopup();
        stopBackgroundPolling();
        if (!state.sessionId || !state.assignedAgent) {
          await initVisitor();
          applyHeader();
        }
        body.innerHTML = "";
        state.lastMessageId = 0;
        state.pendingEchoes = [];
        let loadFailed = false;
        try {
          await loadMessages(body, 0);
        } catch (err) {
          loadFailed = true;
        }
        const hasPendingAutomationPopup = Boolean(state.pendingPopup && state.pendingPopup.message);
        if (hasPendingAutomationPopup) {
          const popupActionsForChat =
            state.pendingPopup && Array.isArray(state.pendingPopup.actions) ? state.pendingPopup.actions.slice(0, 6) : [];
          addMessage(body, {
            sender_type: "agent",
            content: String(state.pendingPopup.message || ""),
            created_at: new Date().toISOString()
          });
          renderInlinePopupActions(popupActionsForChat);
          state.lastAutomationPrompt = {
            message: String(state.pendingPopup.message || ""),
            actions: popupActionsForChat,
            ruleId: state.pendingPopup.ruleId || null
          };
          state.pendingPopup = null;
        } else {
          const hasMessagesInChat = Boolean(body.querySelector(".oc-message-row"));
          const automationRuleId = state.lastAutomationPrompt && state.lastAutomationPrompt.ruleId;
          const automationStillActive = !automationRuleId || !hasSeenPopup(automationRuleId);
          if ((!hasMessagesInChat || loadFailed) && automationStillActive && state.lastAutomationPrompt && state.lastAutomationPrompt.message) {
            addMessage(body, {
              sender_type: "agent",
              content: String(state.lastAutomationPrompt.message || ""),
              created_at: new Date().toISOString()
            });
            renderInlinePopupActions(
              Array.isArray(state.lastAutomationPrompt.actions) ? state.lastAutomationPrompt.actions.slice(0, 6) : []
            );
          }
        }
        if (state.pendingQuickReply) {
          const quickReply = state.pendingQuickReply;
          state.pendingQuickReply = null;
          await handleSend(quickReply);
        }
        startPolling(body);
      } else {
        stopPolling();
        stopActiveReplyAudio();
        if (state.voiceRecording && state.voiceRecorder) {
          state.voiceRecorder.stop();
        }
        startBackgroundPolling();
      }
    });

    closeBtn.addEventListener("click", () => {
      state.isOpen = false;
      panel.classList.remove("is-open");
      toggleBtn.setAttribute("aria-label", "Open chat");
      stopPolling();
      stopActiveReplyAudio();
      if (state.voiceRecording && state.voiceRecorder) {
        state.voiceRecorder.stop();
      }
    });

    const handleSend = async (overrideContent = "", options = {}) => {
      const content = (overrideContent || input.value).trim();
      if (!content) {
        return "empty";
      }
      const voiceDraftMeta = options.voiceDraftMeta
        ? { ...options.voiceDraftMeta }
        : state.voiceDraft
          ? { ...state.voiceDraft }
          : null;
      state.hasInteracted = true;
      if (!state.sessionId) {
        await initVisitor();
      }
      const humanOnlineValue =
        state.settings && state.settings.human_online !== undefined
          ? state.settings.human_online
          : state.settings && state.settings.is_online;
      const isOfflineAiFlow =
        !Boolean(Number(humanOnlineValue || 0)) &&
        Boolean(Number((state.settings && state.settings.ai_enabled) || 0));
      const shouldPromptLeadInCurrentFlow =
        !isOfflineAiFlow || Boolean(Number((state.settings && state.settings.offline_ai_contact_prompt) || 0));
      if (
        !options.bypassLead &&
        !state.leadCaptured &&
        state.settings.lead_capture_mode === "before" &&
        shouldPromptLeadInCurrentFlow &&
        !state.leadPrompted
      ) {
        state.pendingMessage = content;
        leadBox.hidden = false;
        leadHint.hidden = true;
        state.leadPrompted = true;
        storage.set("oc_lead_prompted", "true");
        input.value = "";
        return "lead_prompted";
      }

      if (state.lastAutomationPrompt) {
        suppressAutomationPrompt(state.lastAutomationPrompt.ruleId || null);
      }

      input.value = "";
      clearVoiceDraft();
      rememberPendingEcho(content);
      addMessage(body, { sender_type: "visitor", content, created_at: new Date().toISOString() });
      startAiTyping(panel);
      try {
        const result = await sendMessage(content, {
          voiceLanguage:
            voiceDraftMeta?.resolvedLanguage || voiceDraftMeta?.detectedLanguage || ""
        });
        if (result.messageId) {
          state.lastMessageId = Math.max(state.lastMessageId, Number(result.messageId));
        }
        if (
          !state.leadCaptured &&
          state.settings.lead_capture_mode === "after" &&
          shouldPromptLeadInCurrentFlow &&
          !state.leadPrompted
        ) {
          leadBox.hidden = false;
          leadHint.hidden = true;
          state.leadPrompted = true;
          storage.set("oc_lead_prompted", "true");
        }
        if (!state.settings.is_online && !state.settings.ai_enabled && state.settings.offline_message) {
          addMessage(body, {
            sender_type: "agent",
            content: state.settings.offline_message,
            created_at: new Date().toISOString()
          });
          updateTypingIndicator(panel);
        }
        return "sent";
      } catch (err) {
        if (input) {
          input.value = content;
        }
        if (voiceDraftMeta) {
          state.voiceDraft = voiceDraftMeta;
          updateVoiceDraftUi();
        }
        addMessage(body, {
          sender_type: "agent",
          content: "Message failed. Please try again.",
          created_at: new Date().toISOString()
        });
        stopAiTyping(panel);
        updateTypingIndicator(panel);
        return "failed";
      }
    };

    sendBtn.addEventListener("click", () => {
      if (state.voiceRecording || state.voiceProcessing) {
        return;
      }
      handleSend();
    });

    uploadBtn.addEventListener("click", () => {
      if (state.voiceRecording || state.voiceProcessing) {
        return;
      }
      fileInput.click();
    });

    if (voiceBtn) {
      voiceBtn.addEventListener("click", async () => {
        await toggleVoiceRecording();
      });
    }
    if (voiceDraftRerecord) {
      voiceDraftRerecord.addEventListener("click", async () => {
        clearVoiceDraft({ clearInput: true });
        await toggleVoiceRecording();
      });
    }
    if (voiceDraftClear) {
      voiceDraftClear.addEventListener("click", () => {
        clearVoiceDraft({ clearInput: true });
        setVoiceStatus("", { autoClearMs: 0 });
      });
    }

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = "";
      if (!file) {
        return;
      }
      if (file.size > config.maxUploadBytes) {
        addMessage(body, {
          sender_type: "agent",
          content: "File is too large to upload.",
          created_at: new Date().toISOString()
        });
        return;
      }
      state.hasInteracted = true;
      if (!state.sessionId) {
        await initVisitor();
      }
      try {
        const result = await uploadFile(file);
        if (result.message) {
          addMessage(body, result.message);
          if (result.message.id) {
            state.lastMessageId = Math.max(state.lastMessageId, Number(result.message.id));
          }
        }
        if (!state.settings.is_online && !state.settings.ai_enabled && state.settings.offline_message) {
          addMessage(body, {
            sender_type: "agent",
            content: state.settings.offline_message,
            created_at: new Date().toISOString()
          });
          updateTypingIndicator(panel);
        }
      } catch (err) {
        addMessage(body, {
          sender_type: "agent",
          content: "File upload failed. Please try again.",
          created_at: new Date().toISOString()
        });
        updateTypingIndicator(panel);
      }
    });

    input.addEventListener("keydown", (event) => {
      if (state.voiceRecording || state.voiceProcessing) {
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendBtn.click();
      }
    });

    leadForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(leadForm);
      const payload = {
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        company: String(formData.get("company") || "").trim()
      };
      leadHint.hidden = true;
      try {
        await submitLead(payload);
        state.leadCaptured = true;
        storage.set("oc_lead_captured", "true");
        state.leadPrompted = true;
        storage.set("oc_lead_prompted", "true");
        leadBox.hidden = true;
        if (state.pendingMessage) {
          const pending = state.pendingMessage;
          state.pendingMessage = null;
          handleSend(pending, { bypassLead: true });
        }
      } catch (err) {
        leadHint.hidden = false;
        leadHint.textContent = "Please check your details and try again.";
      }
    });

    leadSkip.addEventListener("click", () => {
      leadBox.hidden = true;
      leadHint.hidden = true;
      if (state.pendingMessage) {
        const pending = state.pendingMessage;
        state.pendingMessage = null;
        handleSend(pending, { bypassLead: true });
      }
    });
  };

  widget.initWidget = initWidget;
  widget.bootstrap = () => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initWidget);
    } else {
      initWidget();
    }
  };
})();
