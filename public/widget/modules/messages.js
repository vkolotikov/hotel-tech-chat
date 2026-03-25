(() => {
  const widget = window.__ocWidget || (window.__ocWidget = {});
  const { state } = widget;
  const { formatTime, formatFileSize, getInitials } = widget;

  const createMessageAvatar = (name, imageUrl) => {
    const avatar = document.createElement("div");
    avatar.className = "oc-message-avatar";
    if (imageUrl) {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = name ? `${name} avatar` : "Agent avatar";
      avatar.appendChild(img);
    } else {
      avatar.textContent = getInitials(name, "AG");
    }
    return avatar;
  };

  const getAiLabel = () =>
    (state.settings && state.settings.ai_name) ||
    (state.assignedAgent && state.assignedAgent.is_ai && state.assignedAgent.name) ||
    "AI Assistant";

  const getSenderName = (message) => {
    if (message && message.sender_name) {
      return message.sender_name;
    }
    if (message && message.sender_type === "system") {
      return (state.settings && state.settings.ai_name) || "AI Assistant";
    }
    return (
      (state.assignedAgent && state.assignedAgent.name) ||
      (state.settings && state.settings.company_name) ||
      "Agent"
    );
  };

  const getTypingDelay = (message) => {
    if (!message || message.sender_type === "visitor") {
      return 0;
    }
    if (message.message_type === "file") {
      return 600;
    }
    const length = String(message.content || "").length;
    const base = 420;
    const perChar = 12;
    const delay = base + length * perChar;
    return Math.max(500, Math.min(delay, 2600));
  };

  const getGreetingMessage = () => {
    if (!state.settings) {
      return "";
    }
    if (state.settings.is_online) {
      return (
        state.settings.greeting_online_message ||
        state.settings.greeting_message ||
        state.settings.greeting_offline_message ||
        ""
      );
    }
    return (
      state.settings.greeting_offline_message ||
      state.settings.greeting_message ||
      state.settings.greeting_online_message ||
      ""
    );
  };

  const buildReplayButton = () => {
    const replayBtn = document.createElement("button");
    replayBtn.type = "button";
    replayBtn.className = "oc-replay";
    replayBtn.setAttribute("aria-label", "Play voice reply");
    replayBtn.setAttribute("title", "Play voice reply");
    replayBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 15.2V8.8a1 1 0 0 1 1.6-.8l5 3.7a1 1 0 0 1 0 1.6l-5 3.7a1 1 0 0 1-1.6-.8Z" fill="currentColor"></path>
        <path d="M14.8 8.5a5.3 5.3 0 0 1 0 7M17.6 6.2a8.4 8.4 0 0 1 0 11.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path>
      </svg>
    `;
    return replayBtn;
  };

  const addMessage = (container, message, options = {}) => {
    const senderType = message.sender_type === "visitor" ? "visitor" : "agent";
    const isAi = message.sender_type === "system";
    const row = document.createElement("div");
    row.className = `oc-message-row ${senderType}`;
    if (senderType === "agent") {
      const agentName = getSenderName(message);
      const avatarUrl = isAi
        ? message.sender_avatar || (state.settings && state.settings.ai_avatar_url) || null
        : message.sender_avatar || (state.assignedAgent && state.assignedAgent.avatar_url) || null;
      row.appendChild(createMessageAvatar(agentName, avatarUrl));
    }

    const bubble = document.createElement("div");
    bubble.className = `oc-message ${senderType}`;
    if (senderType === "agent") {
      const roleLabel = isAi ? "AI" : "Agent";
      const displayName = getSenderName(message);
      const tag = document.createElement("div");
      tag.className = `oc-message-tag ${isAi ? "ai" : "agent"}`;
      tag.textContent = displayName ? `${displayName} - ${roleLabel}` : roleLabel;
      bubble.appendChild(tag);
    }
    if (message.message_type === "file" && message.file_url) {
      const attachment = document.createElement("div");
      attachment.className = "oc-attachment";
      const icon = document.createElement("div");
      icon.className = "oc-attachment-icon";
      icon.textContent = "DL";
      const meta = document.createElement("div");
      const link = document.createElement("a");
      link.className = "oc-attachment-link";
      link.href = message.file_url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = message.file_name || message.content || "Download file";
      const size = document.createElement("div");
      size.className = "oc-attachment-size";
      size.textContent = formatFileSize(message.file_size);
      meta.appendChild(link);
      if (size.textContent) {
        meta.appendChild(size);
      }
      attachment.appendChild(icon);
      attachment.appendChild(meta);
      bubble.appendChild(attachment);
    } else {
      const text = document.createElement("div");
      text.className = "oc-message-text";
      text.textContent = message.content;
      bubble.appendChild(text);
    }
    const metaRow = document.createElement("div");
    metaRow.className = "oc-message-meta";
    const time = document.createElement("span");
    time.className = "oc-time";
    time.textContent = formatTime(message.created_at);
    metaRow.appendChild(time);
    const canReplay =
      senderType === "agent" &&
      state.voiceModeEnabled &&
      message.message_type !== "file" &&
      Number(message.id || 0) > 0 &&
      typeof widget.playReplyAudio === "function";
    if (canReplay) {
      const replayBtn = buildReplayButton();
      replayBtn.addEventListener("click", async () => {
        try {
          replayBtn.classList.remove("is-error");
          replayBtn.setAttribute("aria-label", "Play voice reply");
          replayBtn.setAttribute("title", "Play voice reply");
          await widget.playReplyAudio(message, replayBtn);
        } catch (err) {
          replayBtn.classList.add("is-error");
          replayBtn.setAttribute("aria-label", "Retry voice playback");
          replayBtn.setAttribute("title", "Retry voice playback");
        }
      });
      metaRow.appendChild(replayBtn);
      if (options.autoPlayVoice && state.voiceAutoPlay) {
        setTimeout(() => {
          widget.playReplyAudio(message, replayBtn).catch(() => null);
        }, 80);
      }
    }
    bubble.appendChild(metaRow);
    row.appendChild(bubble);
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
  };

  const setTyping = (panel, visible, label) => {
    const typing = panel.querySelector(".oc-typing");
    if (!typing) {
      return;
    }
    const labelEl = typing.querySelector(".oc-typing-label");
    if (labelEl && label) {
      labelEl.textContent = label;
    }
    typing.hidden = !visible;
    if (state.typingTimeout) {
      clearTimeout(state.typingTimeout);
      state.typingTimeout = null;
    }
    if (visible) {
      state.typingTimeout = setTimeout(() => {
        setTyping(panel, false);
      }, 10000);
    }
  };

  const updateTypingIndicator = (panel) => {
    const serverTyping = state.serverTyping;
    if (serverTyping && serverTyping.name) {
      setTyping(panel, true, `${serverTyping.name} is typing`);
      return;
    }
    if (state.aiTyping) {
      setTyping(panel, true, `${getAiLabel()} is typing`);
      return;
    }
    setTyping(panel, false);
  };

  const startAiTyping = (panel) => {
    if (!state.settings || !state.settings.ai_enabled) {
      return;
    }
    state.aiTyping = true;
    if (state.aiTypingTimer) {
      clearTimeout(state.aiTypingTimer);
    }
    state.aiTypingTimer = setTimeout(() => {
      state.aiTyping = false;
      updateTypingIndicator(panel);
    }, 15000);
    updateTypingIndicator(panel);
  };

  const stopAiTyping = (panel) => {
    state.aiTyping = false;
    if (state.aiTypingTimer) {
      clearTimeout(state.aiTypingTimer);
      state.aiTypingTimer = null;
    }
    updateTypingIndicator(panel);
  };

  const normalizeEchoText = (content) => String(content || "").replace(/\s+/g, " ").trim();

  const rememberPendingEcho = (content) => {
    const text = normalizeEchoText(content);
    if (!text) {
      return;
    }
    state.pendingEchoes.push({ content: text, time: Date.now() });
    if (state.pendingEchoes.length > 6) {
      state.pendingEchoes.shift();
    }
  };

  const consumePendingEcho = (content) => {
    const text = normalizeEchoText(content);
    if (!text) {
      return false;
    }
    const now = Date.now();
    const index = state.pendingEchoes.findIndex(
      (item) => item.content === text && now - item.time < 15000
    );
    if (index === -1) {
      return false;
    }
    state.pendingEchoes.splice(index, 1);
    return true;
  };

  widget.createMessageAvatar = createMessageAvatar;
  widget.getAiLabel = getAiLabel;
  widget.getSenderName = getSenderName;
  widget.getTypingDelay = getTypingDelay;
  widget.getGreetingMessage = getGreetingMessage;
  widget.addMessage = addMessage;
  widget.setTyping = setTyping;
  widget.updateTypingIndicator = updateTypingIndicator;
  widget.startAiTyping = startAiTyping;
  widget.stopAiTyping = stopAiTyping;
  widget.normalizeEchoText = normalizeEchoText;
  widget.rememberPendingEcho = rememberPendingEcho;
  widget.consumePendingEcho = consumePendingEcho;
})();
