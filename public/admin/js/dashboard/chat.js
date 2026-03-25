const createChatModule = (context) => {
  const {
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
  } = context;

  const safe = (value) => (escapeHtml ? escapeHtml(value) : String(value || ""));
  const CHAT_FILTER_STORAGE_KEYS = {
    scope: "oc_chat_filter_scope",
    presence: "oc_chat_filter_presence",
    range: "oc_chat_filter_range"
  };
  const INBOX_UI_STORAGE_KEYS = {
    leftCollapsed: "oc_inbox_left_collapsed",
    leftTab: "oc_inbox_left_tab",
    chatSearch: "oc_chat_search"
  };
  const normalizeSearch = (value) => String(value || "").trim().toLowerCase();
  const summarizeAlertPayload = (data = {}) => {
    const chats = Array.isArray(data?.chats) ? data.chats : [];
    const totalUnread = Number(data?.total_unread);
    const companyCount = Number(data?.company_count);
    const fallbackCompanyIds = new Set(
      chats
        .map((chat) => Number(chat?.company_id || 0))
        .filter((companyId) => companyId > 0)
    );
    const fallbackCompanyNames = Array.from(
      new Set(
        chats
          .map((chat) => String(chat?.company_name || "").trim())
          .filter(Boolean)
      )
    );
    return {
      chats,
      totalUnread: Number.isFinite(totalUnread)
        ? totalUnread
        : chats.reduce((sum, chat) => sum + (Number(chat?.unread_count || 0) || 0), 0),
      companyCount: Number.isFinite(companyCount)
        ? companyCount
        : fallbackCompanyIds.size || fallbackCompanyNames.length,
      scope:
        String(data?.scope || "").trim() ||
        ((Number.isFinite(companyCount) ? companyCount : fallbackCompanyIds.size || fallbackCompanyNames.length) > 1
          ? "multi_company"
          : "single_company")
    };
  };
  const buildGlobalAlertBannerText = ({ totalUnread = 0, companyCount = 0, scope = "single_company" } = {}) => {
    const count = Number(totalUnread || 0);
    if (count <= 0) {
      return "";
    }
    if (String(scope || "").trim() === "multi_company" && Number(companyCount || 0) > 1) {
      return `${count} unread message${count === 1 ? "" : "s"} across ${companyCount} compan${companyCount === 1 ? "y" : "ies"}. Click to view.`;
    }
    return `${count} unread message${count === 1 ? "" : "s"}. Click to view.`;
  };
  const chatMatchesSearch = (chat, query) => {
    if (!query) {
      return true;
    }
    const haystack = [
      chat.name,
      chat.email,
      chat.company,
      chat.assigned_name
    ]
      .map((value) => String(value || "").toLowerCase())
      .join(" ");
    return haystack.includes(query);
  };
  const getChatTimestamp = (chat) => {
    const raw = chat.last_message_at || chat.created_at || null;
    const ts = raw ? new Date(raw).getTime() : NaN;
    return Number.isFinite(ts) ? ts : null;
  };
  const isChatOnline = (chat) =>
    Boolean(state.visitors.find((active) => Number(active.session_id) === Number(chat.id)));
  const isAcceptedChat = (chat) =>
    Number(chat.assigned_user_id || 0) > 0 || Number(chat.has_agent_or_ai_reply || 0) > 0;
  const setLeftRailCollapsed = (collapsed, { persist = true } = {}) => {
    const next = Boolean(collapsed);
    if (elements.inboxLayout) {
      elements.inboxLayout.classList.toggle("is-rail-collapsed", next);
    }
    if (elements.inboxLeftToggle) {
      elements.inboxLeftToggle.setAttribute("aria-expanded", String(!next));
    }
    if (elements.inboxLeftReopen) {
      elements.inboxLeftReopen.hidden = !next;
      elements.inboxLeftReopen.setAttribute("aria-expanded", String(next));
    }
    if (persist) {
      localStorage.setItem(INBOX_UI_STORAGE_KEYS.leftCollapsed, next ? "true" : "false");
    }
  };
  const setInboxTab = (tab, { persist = true } = {}) => {
    const next = tab === "live" ? "live" : "chats";
    if (elements.inboxTabChats) {
      const active = next === "chats";
      elements.inboxTabChats.classList.toggle("is-active", active);
      elements.inboxTabChats.setAttribute("aria-selected", String(active));
    }
    if (elements.inboxTabLive) {
      const active = next === "live";
      elements.inboxTabLive.classList.toggle("is-active", active);
      elements.inboxTabLive.setAttribute("aria-selected", String(active));
    }
    if (elements.inboxPaneChats) {
      elements.inboxPaneChats.classList.toggle("is-active", next === "chats");
    }
    if (elements.inboxPaneLive) {
      elements.inboxPaneLive.classList.toggle("is-active", next === "live");
    }
    if (persist) {
      localStorage.setItem(INBOX_UI_STORAGE_KEYS.leftTab, next);
    }
  };
  const updateInboxTabCounts = (filteredChatsCount = null) => {
    if (elements.inboxTabCountChats) {
      const count =
        typeof filteredChatsCount === "number" && Number.isFinite(filteredChatsCount)
          ? filteredChatsCount
          : getFilteredChats().length;
      elements.inboxTabCountChats.textContent = String(Math.max(count, 0));
    }
    if (elements.inboxTabCountLive) {
      elements.inboxTabCountLive.textContent = String(Number(state.visitors.length || 0));
    }
  };
  const initInboxWorkspaceUi = () => {
    const savedCollapsed = localStorage.getItem(INBOX_UI_STORAGE_KEYS.leftCollapsed);
    const savedTab = localStorage.getItem(INBOX_UI_STORAGE_KEYS.leftTab);
    const savedSearch = localStorage.getItem(INBOX_UI_STORAGE_KEYS.chatSearch) || "";

    if (elements.chatSearch) {
      elements.chatSearch.value = savedSearch;
      elements.chatSearch.addEventListener("input", () => {
        localStorage.setItem(INBOX_UI_STORAGE_KEYS.chatSearch, elements.chatSearch.value || "");
        renderChats();
      });
    }

    if (elements.inboxLeftToggle) {
      elements.inboxLeftToggle.addEventListener("click", () => {
        setLeftRailCollapsed(true);
      });
    }
    if (elements.inboxLeftReopen) {
      elements.inboxLeftReopen.addEventListener("click", () => {
        setLeftRailCollapsed(false);
      });
    }
    if (elements.inboxTabChats) {
      elements.inboxTabChats.addEventListener("click", () => setInboxTab("chats"));
    }
    if (elements.inboxTabLive) {
      elements.inboxTabLive.addEventListener("click", () => setInboxTab("live"));
    }

    setInboxTab(savedTab === "live" ? "live" : "chats", { persist: false });
    setLeftRailCollapsed(savedCollapsed === "true", { persist: false });
    updateInboxTabCounts(0);
  };
  const getFilteredChats = () => {
    const scope = elements.chatFilterScope ? elements.chatFilterScope.value : "accepted";
    const presence = elements.chatFilterPresence ? elements.chatFilterPresence.value : "all";
    const range = elements.chatFilterRange ? elements.chatFilterRange.value : "all";
    const searchQuery = normalizeSearch(elements.chatSearch ? elements.chatSearch.value : "");
    let minTs = null;
    if (range === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      minTs = start.getTime();
    } else if (range === "week") {
      minTs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    } else if (range === "month") {
      minTs = Date.now() - 30 * 24 * 60 * 60 * 1000;
    }
    return state.chats.filter((chat) => {
      if (scope !== "all" && !isAcceptedChat(chat)) {
        return false;
      }
      // In "All chats" view, hide empty sessions (no messages yet) to reduce noise.
      if (scope === "all" && !chat.last_message_at) {
        return false;
      }
      const online = isChatOnline(chat);
      if (presence === "online" && !online) {
        return false;
      }
      if (presence === "offline" && online) {
        return false;
      }
      if (minTs !== null) {
        const chatTs = getChatTimestamp(chat);
        if (!chatTs || chatTs < minTs) {
          return false;
        }
      }
      if (!chatMatchesSearch(chat, searchQuery)) {
        return false;
      }
      return true;
    });
  };
  const resetAlertState = ({ clearBanner = false } = {}) => {
    state.lastUnreadByChat = new Map();
    state.lastUnreadGlobalByChat = new Map();
    state.globalAlertsEnabled = false;
    if (clearBanner) {
      showAlertBanner(false);
      setSignal("No new alerts", false);
    }
  };
  const updateChatFilterMeta = (visibleCount) => {
    if (!elements.chatFilterMeta) {
      return;
    }
    const total = Number(state.chats.length || 0);
    elements.chatFilterMeta.textContent = `${visibleCount} of ${total} chats shown`;
  };

  const renderChats = () => {
    elements.chatList.innerHTML = "";
    if (!state.chats.length) {
      elements.chatList.innerHTML = "<div class='chat-meta'>No active chats.</div>";
      updateChatFilterMeta(0);
      updateInboxTabCounts(0);
      return;
    }
    const scope = elements.chatFilterScope ? elements.chatFilterScope.value : "accepted";
    elements.chatList.dataset.scope = scope;
    const filteredChats = getFilteredChats();
    if (!filteredChats.length) {
      elements.chatList.innerHTML = "<div class='chat-meta'>No chats match current filters.</div>";
      updateChatFilterMeta(0);
      updateInboxTabCounts(0);
      return;
    }
    updateChatFilterMeta(filteredChats.length);
    updateInboxTabCounts(filteredChats.length);
    filteredChats.forEach((chat) => {
      const item = document.createElement("div");
      const hasUnread = Number(chat.unread_count || 0) > 0;
      const isImportant = Number(chat.is_important || 0) === 1;
      const isAccepted = isAcceptedChat(chat);
      item.className = `chat-item ${state.activeChatId === chat.id ? "active" : ""} ${
        hasUnread ? "unread" : ""
      } ${isImportant ? "important" : ""}`;
      item.dataset.chatId = chat.id;
      const visitor = state.visitors.find((active) => Number(active.session_id) === Number(chat.id));
      const isOnline = isChatOnline(chat);
      const livePath = visitor ? visitor.current_path || getPathFromUrl(visitor.current_url) : "";
      const liveTime = visitor ? formatDuration(visitor.time_on_site_seconds) : "";
      const name = safe(chat.name || "Visitor");
      const email = safe(chat.email || "Unknown email");
      const company = chat.company ? ` / ${safe(chat.company)}` : "";
      const assignedCompact = chat.assigned_name ? safe(chat.assigned_name) : "Unassigned";
      const livePathSafe = safe(livePath || "Unknown");
      const liveTimeSafe = safe(liveTime || "0s");
      const liveLine = visitor ? `Now: ${livePathSafe} - ${liveTimeSafe}` : "";
      const metaTitle = liveLine ? safe(liveLine) : "";
      const lastMessageLabel = chat.last_message_at ? safe(formatDate(chat.last_message_at)) : "";
      item.innerHTML = `
        <div class="chat-row1">
          <div class="chat-title">
          <span class="presence-dot ${isOnline ? "online" : "offline"}"></span>
          <strong>${name}</strong>
          </div>
          <div class="chat-badges">
            ${lastMessageLabel ? `<span class="chat-time">${lastMessageLabel}</span>` : ""}
            ${!isAccepted ? `<span class="badge chat-new">New</span>` : `<span class="badge chat-accepted">Accepted</span>`}
            ${isImportant ? `<span class="badge important">Important</span>` : ""}
            ${chat.unread_count ? `<span class="badge">${chat.unread_count} unread</span>` : ""}
          </div>
        </div>
        <div class="chat-row2" title="${metaTitle}">
          <span class="chat-meta-line">${email}${company}</span>
          <span class="chat-sep">&bull;</span>
          <span class="chat-meta-line">Assg: ${assignedCompact}</span>
        </div>
      `;
      item.addEventListener("click", () => selectChat(chat.id));
      elements.chatList.appendChild(item);
    });
  };

  const setChatDetailsEnabled = (enabled) => {
    const controls = [
      elements.chatName,
      elements.chatEmail,
      elements.chatCompany,
      elements.chatPhone,
      elements.chatNotes,
      elements.chatImportant,
      elements.chatSaveDetails,
      elements.chatDelete
    ];
    controls.forEach((control) => {
      if (control) {
        control.disabled = !enabled;
      }
    });
    if (elements.detailsToggle) {
      elements.detailsToggle.disabled = !enabled;
    }
  };

  const populateChatDetails = (chat) => {
    if (!elements.chatName) {
      return;
    }
    if (!chat) {
      elements.chatName.value = "";
      elements.chatEmail.value = "";
      if (elements.chatCompany) {
        elements.chatCompany.value = "";
      }
      elements.chatPhone.value = "";
      elements.chatNotes.value = "";
      elements.chatImportant.checked = false;
      setChatDetailsEnabled(false);
      setDetailsDrawer(false);
      return;
    }
    elements.chatName.value = chat.name || "";
    elements.chatEmail.value = chat.email || "";
    if (elements.chatCompany) {
      elements.chatCompany.value = chat.company || "";
    }
    elements.chatPhone.value = chat.phone || "";
    elements.chatNotes.value = chat.notes || "";
    elements.chatImportant.checked = Number(chat.is_important || 0) === 1;
    setChatDetailsEnabled(true);
  };

  const saveAiFeedback = async (messageId, rating, note, correctedReply) => {
    const payload = {
      message_id: messageId,
      rating,
      note: note || "",
      corrected_reply: correctedReply || ""
    };
    await fetchJson(`${API_BASE}/admin/ai/feedback`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  };

  const updateFeedbackToggleState = (messageId, ratingValue) => {
    if (!elements.chatMessages) {
      return;
    }
    const btn = elements.chatMessages.querySelector(
      `.ai-feedback-toggle[data-message-id="${messageId}"]`
    );
    if (!btn) {
      return;
    }
    btn.classList.toggle("is-helpful", ratingValue === 1);
    btn.classList.toggle("is-needs", ratingValue === -1);
  };

  const setFeedbackModalState = (ratingValue) => {
    if (!elements.aiFeedbackModal) {
      return;
    }
    elements.aiFeedbackModal.dataset.rating = String(ratingValue || "");
    if (elements.aiFeedbackHelpful) {
      elements.aiFeedbackHelpful.classList.toggle("active", ratingValue === 1);
    }
    if (elements.aiFeedbackNeeds) {
      elements.aiFeedbackNeeds.classList.toggle("active", ratingValue === -1);
    }
    if (elements.aiFeedbackCorrectedWrap) {
      elements.aiFeedbackCorrectedWrap.hidden = ratingValue !== -1;
    }
  };

  const closeAiFeedbackModal = () => {
    if (!elements.aiFeedbackModal) {
      return;
    }
    elements.aiFeedbackModal.hidden = true;
    elements.aiFeedbackModal.dataset.messageId = "";
    elements.aiFeedbackModal.dataset.rating = "";
    state.feedbackMessageId = null;
    updateFeedbackEditing();
  };

  const getActiveFeedbackId = () => {
    if (elements.aiFeedbackModal) {
      return Number(elements.aiFeedbackModal.dataset.messageId || 0);
    }
    return Number(state.feedbackMessageId || 0);
  };

  const openAiFeedbackModal = (msg) => {
    if (!elements.aiFeedbackModal || !msg) {
      return;
    }
    const draft = getFeedbackDraft(msg.id);
    const draftRating =
      draft && typeof draft.rating !== "undefined" ? Number(draft.rating || 0) : 0;
    const initialRating =
      draftRating === 1 || draftRating === -1
        ? draftRating
        : Number(msg.feedback_rating || 0);
    const noteValue =
      draft && typeof draft.note === "string" ? draft.note : msg.feedback_note || "";
    const correctedValue =
      draft && typeof draft.corrected_reply === "string"
        ? draft.corrected_reply
        : msg.feedback_corrected || "";

    state.feedbackMessageId = msg.id;
    elements.aiFeedbackModal.dataset.messageId = String(msg.id);
    elements.aiFeedbackMessage.textContent =
      msg.message_type === "file"
        ? msg.file_name || msg.content || "Attachment"
        : msg.content || "";
    if (elements.aiFeedbackNote) {
      elements.aiFeedbackNote.value = noteValue;
    }
    if (elements.aiFeedbackCorrected) {
      elements.aiFeedbackCorrected.value = correctedValue;
    }
    setFeedbackModalState(initialRating);
    elements.aiFeedbackModal.hidden = false;
    setTimeout(() => {
      elements.aiFeedbackNote?.focus();
      updateFeedbackEditing();
    }, 0);
  };

  const renderMessages = (messages, options = {}) => {
    const container = elements.chatMessages;
    if (!container) {
      return;
    }
    const preserveScroll = Boolean(options.preserveScroll);
    const prevScrollTop = container.scrollTop;
    const prevScrollHeight = container.scrollHeight;
    const wasNearBottom =
      prevScrollTop + container.clientHeight >= prevScrollHeight - 40;

    container.innerHTML = "";
    messages.forEach((msg) => {
      const wrapper = document.createElement("div");
      wrapper.className = `chat-message ${msg.sender_type === "visitor" ? "visitor" : "agent"}`;

      const bubble = document.createElement("div");
      bubble.className = `chat-bubble ${msg.sender_type === "visitor" ? "visitor" : "agent"}`;
      if (msg.message_type === "file" && msg.file_url) {
        const link = document.createElement("a");
        link.href = msg.file_url;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = msg.file_name || msg.content || "Download file";
        const size = document.createElement("div");
        size.className = "chat-meta";
        size.textContent = formatFileSize(msg.file_size);
        bubble.appendChild(link);
        if (size.textContent) {
          bubble.appendChild(size);
        }
      } else {
        bubble.textContent = msg.content;
      }
      wrapper.appendChild(bubble);

      const meta = document.createElement("div");
      meta.className = "chat-meta";
      meta.textContent = formatDate(msg.created_at);
      wrapper.appendChild(meta);

      if (msg.sender_type === "system") {
        const feedback = document.createElement("div");
        feedback.className = "ai-feedback";

        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "ai-feedback-toggle";
        toggleBtn.dataset.messageId = String(msg.id);
        toggleBtn.setAttribute("aria-expanded", "false");
        toggleBtn.setAttribute("title", "AI feedback");
        toggleBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/>
            <path d="M12 10v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M12 7h.01" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        `;

        const draft = getFeedbackDraft(msg.id);
        const draftRating =
          draft && typeof draft.rating !== "undefined" ? Number(draft.rating || 0) : 0;
        const initialRating =
          draftRating === 1 || draftRating === -1
            ? draftRating
            : Number(msg.feedback_rating || 0);

        toggleBtn.classList.toggle("is-helpful", initialRating === 1);
        toggleBtn.classList.toggle("is-needs", initialRating === -1);

        toggleBtn.addEventListener("click", () => {
          openAiFeedbackModal(msg);
        });

        feedback.appendChild(toggleBtn);
        wrapper.appendChild(feedback);
      }

      container.appendChild(wrapper);
    });
    if (preserveScroll && !wasNearBottom) {
      const nextMax = container.scrollHeight - container.clientHeight;
      container.scrollTop = Math.min(prevScrollTop, Math.max(nextMax, 0));
      return;
    }
    container.scrollTop = container.scrollHeight;
  };

  const loadChats = async (options = {}) => {
    const suppressAlerts =
      Object.prototype.hasOwnProperty.call(options, "suppressAlerts")
        ? options.suppressAlerts
        : Boolean(state.globalAlertsEnabled);
    const data = await fetchJson(`${API_BASE}/admin/chats`);
    state.chats = data.chats || [];
    const newAlerts = [];
    let totalUnread = 0;
    state.chats.forEach((chat) => {
      const unreadCount = Number(chat.unread_count || 0);
      totalUnread += unreadCount;
      const prev = state.lastUnreadByChat?.get(chat.id) || 0;
      if (unreadCount > prev) {
        newAlerts.push({ chat, delta: unreadCount - prev });
      }
    });
    state.lastUnreadByChat = new Map(
      state.chats.map((chat) => [chat.id, Number(chat.unread_count || 0)])
    );
    renderChats();
    if (state.activeChatId && !state.chats.find((chat) => chat.id === state.activeChatId)) {
      state.activeChatId = null;
      elements.chatMeta.textContent = "Select a chat to view messages.";
      elements.chatMessages.innerHTML = "";
      elements.assignAgent.value = "";
      populateChatDetails(null);
    }
    if (!suppressAlerts) {
      if (totalUnread > 0) {
        const bannerText = `${totalUnread} unread message${totalUnread === 1 ? "" : "s"}. Click to view.`;
        showAlertBanner(true, bannerText);
        setSignal(`${totalUnread} unread`, true);
      } else {
        showAlertBanner(false);
        setSignal("No new alerts", false);
      }
      if (newAlerts.length) {
        if (state.soundEnabled) {
          playSound();
        }
        if (state.desktopEnabled) {
          newAlerts.slice(0, 2).forEach((item) => {
            const name = item.chat.name || "Visitor";
            const body = item.chat.email || "New message received";
            showDesktopNotification(`New message from ${name}`, body);
          });
        }
        newAlerts.slice(0, 3).forEach((item) => {
          const name = item.chat.name || "Visitor";
          const detail = `${item.delta} new message${item.delta === 1 ? "" : "s"} from ${
            item.chat.email || "unknown email"
          }`;
          showToast(`New message from ${name}`, detail, () => {
            setView("inbox");
            selectChat(item.chat.id);
          });
        });
      }
    }
  };

  const loadChatAlerts = async () => {
    try {
      const data = await fetchJson(`${API_BASE}/admin/chats/alerts`);
      const { chats, totalUnread, companyCount, scope } = summarizeAlertPayload(data);
      state.globalAlertsEnabled = true;
      const newAlerts = [];
      chats.forEach((chat) => {
        const unreadCount = Number(chat.unread_count || 0);
        const prev = state.lastUnreadGlobalByChat?.get(chat.id) || 0;
        if (unreadCount > prev) {
          newAlerts.push({ chat, delta: unreadCount - prev });
        }
      });
      state.lastUnreadGlobalByChat = new Map(
        chats.map((chat) => [chat.id, Number(chat.unread_count || 0)])
      );
      if (totalUnread > 0) {
        const bannerText = buildGlobalAlertBannerText({ totalUnread, companyCount, scope });
        showAlertBanner(true, bannerText);
        setSignal(`${totalUnread} unread`, true);
      } else {
        showAlertBanner(false);
        setSignal("No new alerts", false);
      }
      if (newAlerts.length) {
        if (state.soundEnabled) {
          playSound();
        }
        if (state.desktopEnabled) {
          newAlerts.slice(0, 2).forEach((item) => {
            const name = item.chat.name || "Visitor";
            const companyName = item.chat.company_name || "Company";
            const body = item.chat.email || companyName || "New message received";
            showDesktopNotification(`New message from ${name}`, body);
          });
        }
        newAlerts.slice(0, 3).forEach((item) => {
          const name = item.chat.name || "Visitor";
          const companyName = item.chat.company_name || "Company";
          const email = item.chat.email || "unknown email";
          const detail = `${item.delta} new message${item.delta === 1 ? "" : "s"} from ${email} - ${companyName}`;
          showToast(`New message from ${name}`, detail, () => {
            setView("inbox");
            if (Number(item.chat.company_id) === Number(state.currentCompanyId || 0)) {
              selectChat(item.chat.id);
            }
          });
        });
      }
      return true;
    } catch (err) {
      state.globalAlertsEnabled = false;
      throw err;
    }
  };
  const renderAgentOptions = () => {
    elements.assignAgent.innerHTML = "";
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "Unassigned";
    elements.assignAgent.appendChild(empty);
    state.agents.forEach((agent) => {
      const option = document.createElement("option");
      option.value = String(agent.id);
      option.textContent = `${agent.name} (${agent.role})`;
      elements.assignAgent.appendChild(option);
    });
  };

  const renderVisitors = () => {
    updateInboxTabCounts();
    if (!elements.visitorList) {
      return;
    }
    elements.visitorList.innerHTML = "";
    if (elements.visitorCount) {
      elements.visitorCount.textContent = String(state.visitors.length);
    }
    if (!state.visitors.length) {
      elements.visitorList.innerHTML = "<p class='chat-meta'>No active visitors right now.</p>";
      if (elements.visitorFlow) {
        elements.visitorFlow.innerHTML = "";
      }
      if (elements.visitorFlowMeta) {
        elements.visitorFlowMeta.textContent = "Select a visitor to see their path.";
      }
      return;
    }

    state.visitors.forEach((visitor) => {
      const item = document.createElement("div");
      item.className = `visitor-item ${
        state.activeVisitorSessionId === visitor.session_id ? "active" : ""
      }`;
      const displayName = safe(
        visitor.name || visitor.email || `Visitor ${String(visitor.visitor_uuid || "").slice(0, 6)}`
      );
      const currentPath = safe(
        visitor.current_path || getPathFromUrl(visitor.current_url) || "Unknown"
      );
      const landingAlias = safe(getPathAlias(visitor.entry_url) || "Landing");
      const landingUrl = visitor.entry_url || visitor.current_url || "";
      const referrerHost = safe(getHostFromUrl(visitor.entry_referrer || visitor.current_referrer));
      const timeOnSite = safe(formatDuration(visitor.time_on_site_seconds));
      const pagesCount = Number(visitor.pages_count || 0);
      const location = safe([visitor.city, visitor.country].filter(Boolean).join(", "));

      item.innerHTML = `
        <h4>${displayName}</h4>
        <div class="visitor-path">Current: ${currentPath}</div>
        <div class="visitor-chips">
          <span class="visitor-chip">Landing <a class="visitor-link" href="${safe(
            landingUrl
          )}" target="_blank" rel="noopener">${landingAlias}</a></span>
          ${pagesCount ? `<span class="visitor-chip">${pagesCount} page${pagesCount === 1 ? "" : "s"}</span>` : ""}
          <span class="visitor-chip">${timeOnSite}</span>
          ${location ? `<span class="visitor-chip">${location}</span>` : ""}
          ${referrerHost ? `<span class="visitor-chip">${referrerHost}</span>` : "<span class='visitor-chip'>Direct</span>"}
        </div>
      `;
      item.addEventListener("click", () => selectVisitor(visitor.session_id));
      elements.visitorList.appendChild(item);
    });
  };

  const renderVisitorFlow = (data) => {
    if (!elements.visitorFlow) {
      return;
    }
    const session = data.session || {};
    const pages = data.pages || [];
    const displayName = safe(
      session.name || session.email || `Visitor ${String(session.visitor_uuid || "").slice(0, 6)}`
    );
    const referrerHost = safe(getHostFromUrl(session.entry_referrer));
    const timeOnSite = safe(formatDuration(session.time_on_site_seconds));
    const landingAlias = safe(getPathAlias(session.entry_url) || "Landing");
    const landingUrl = session.entry_url || "";
    const location = [session.city, session.country].filter(Boolean).join(", ");
    const locationText = location ? `Location ${location}` : "Location n/a";
    if (elements.visitorFlowMeta) {
      const refText = referrerHost ? `From ${referrerHost}` : "Direct";
      const landingHtml = landingUrl
        ? `<a class="visitor-link" href="${safe(landingUrl)}" target="_blank" rel="noopener">${landingAlias}</a>`
        : landingAlias;
      elements.visitorFlowMeta.innerHTML = `${displayName} - ${timeOnSite} on site - Landing ${landingHtml} - ${safe(
        locationText
      )} - ${safe(refText)}`;
    }
    elements.visitorFlow.innerHTML = "";
    if (!pages.length) {
      elements.visitorFlow.innerHTML = "<p class='chat-meta'>No page data yet.</p>";
      return;
    }
    pages.forEach((page, index) => {
      const row = document.createElement("div");
      row.className = `flow-item ${page.is_active ? "active" : ""}`;
      const label = safe(page.title || page.path || page.url || `Page ${index + 1}`);
      const duration = safe(formatDuration(page.duration_seconds));
      const referrer = safe(getHostFromUrl(page.referrer));
      row.innerHTML = `
        <h5>${label}</h5>
        <div class="flow-meta">
          <span>${duration}</span>
          ${referrer ? `<span>${referrer}</span>` : "<span>Direct</span>"}
        </div>
      `;
      elements.visitorFlow.appendChild(row);
    });
  };

  const selectVisitor = async (sessionId) => {
    state.activeVisitorSessionId = sessionId;
    renderVisitors();
    if (!sessionId) {
      if (elements.visitorFlow) {
        elements.visitorFlow.innerHTML = "";
      }
      if (elements.visitorFlowMeta) {
        elements.visitorFlowMeta.textContent = "Select a visitor to see their path.";
      }
      return;
    }
    const data = await fetchJson(`${API_BASE}/admin/visitors/${sessionId}/flow`);
    renderVisitorFlow(data);
  };

  const loadVisitors = async () => {
    if (!elements.visitorList) {
      return;
    }
    const data = await fetchJson(`${API_BASE}/admin/visitors/active`);
    state.visitors = data.visitors || [];
    if (
      state.activeVisitorSessionId &&
      !state.visitors.some((item) => item.session_id === state.activeVisitorSessionId)
    ) {
      state.activeVisitorSessionId = null;
    }
    renderVisitors();
    if (state.chats.length) {
      renderChats();
    }
    if (state.activeVisitorSessionId) {
      await selectVisitor(state.activeVisitorSessionId);
    }
  };

  const bindChatFilters = () => {
    const applyScopeButtonState = () => {
      const current = elements.chatFilterScope ? elements.chatFilterScope.value : "accepted";
      const buttons = document.querySelectorAll(".chat-scope-toggle .scope-btn");
      buttons.forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.scope === current);
      });
    };
    if (elements.chatFilterScope) {
      const savedScope = localStorage.getItem(CHAT_FILTER_STORAGE_KEYS.scope);
      const allowed = new Set(["accepted", "all"]);
      elements.chatFilterScope.value = allowed.has(savedScope)
        ? savedScope
        : elements.chatFilterScope.value || "accepted";
    }
    if (elements.chatFilterPresence) {
      const savedPresence = localStorage.getItem(CHAT_FILTER_STORAGE_KEYS.presence);
      const allowed = new Set(["all", "online", "offline"]);
      elements.chatFilterPresence.value = allowed.has(savedPresence)
        ? savedPresence
        : elements.chatFilterPresence.value || "all";
    }
    if (elements.chatFilterRange) {
      const savedRange = localStorage.getItem(CHAT_FILTER_STORAGE_KEYS.range);
      const allowed = new Set(["today", "week", "month", "all"]);
      elements.chatFilterRange.value = allowed.has(savedRange)
        ? savedRange
        : elements.chatFilterRange.value || "today";
    }
    [elements.chatFilterScope, elements.chatFilterPresence, elements.chatFilterRange]
      .filter(Boolean)
      .forEach((control) => {
        control.addEventListener("change", () => {
          if (control === elements.chatFilterScope) {
            localStorage.setItem(CHAT_FILTER_STORAGE_KEYS.scope, elements.chatFilterScope.value);
            applyScopeButtonState();
          } else if (control === elements.chatFilterPresence) {
            localStorage.setItem(CHAT_FILTER_STORAGE_KEYS.presence, elements.chatFilterPresence.value);
          } else if (control === elements.chatFilterRange) {
            localStorage.setItem(CHAT_FILTER_STORAGE_KEYS.range, elements.chatFilterRange.value);
          }
          renderChats();
        });
      });

    // Scope buttons (Accepted / All chats) drive the hidden select for stable behavior.
    document.querySelectorAll(".chat-scope-toggle .scope-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!elements.chatFilterScope) {
          return;
        }
        const next = btn.dataset.scope || "accepted";
        if (elements.chatFilterScope.value === next) {
          return;
        }
        elements.chatFilterScope.value = next;
        localStorage.setItem(CHAT_FILTER_STORAGE_KEYS.scope, elements.chatFilterScope.value);
        applyScopeButtonState();
        renderChats();
      });
    });

    applyScopeButtonState();
    renderChats();
  };

  const uploadChatFile = async (file) => {
    if (!state.activeChatId) {
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetchWithAuth(`${API_BASE}/admin/chats/${state.activeChatId}/upload`, {
      method: "POST",
      skipJsonContentType: true,
      body: formData
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Failed to upload file");
    }
    return data;
  };

  const selectChat = async (chatId, options = {}) => {
    const shouldAutoCollapse = Object.prototype.hasOwnProperty.call(options, "autoCollapse")
      ? Boolean(options.autoCollapse)
      : !Boolean(options.preserveScroll);
    if (state.activeChatId && state.activeChatId !== chatId) {
      stopTyping(state.activeChatId);
    }
    state.feedbackEditing = false;
    state.detailsEditing = false;
    closeAiFeedbackModal();
    state.activeChatId = chatId;
    if (shouldAutoCollapse) {
      setLeftRailCollapsed(true);
    }
    renderChats();
    const chat = state.chats.find((item) => item.id === chatId);
    if (chat) {
      elements.chatMeta.textContent = `${chat.name || "Visitor"} - ${chat.email || "Unknown email"}`;
      elements.assignAgent.value = chat.assigned_user_id ? String(chat.assigned_user_id) : "";
      populateChatDetails(chat);
    }
    const data = await fetchJson(`${API_BASE}/admin/chats/${chatId}/messages`);
    renderMessages(data.messages || [], { preserveScroll: Boolean(options.preserveScroll) });
    try {
      await selectVisitor(chatId);
    } catch (err) {
      console.warn("OnlineChat admin visitor flow failed", err);
    }
    await loadChats();
  };

  const saveChatDetails = async (event) => {
    event.preventDefault();
    if (!state.activeChatId) {
      return;
    }
    const payload = {
      name: elements.chatName.value.trim(),
      email: elements.chatEmail.value.trim(),
      company: elements.chatCompany ? elements.chatCompany.value.trim() : "",
      phone: elements.chatPhone.value.trim(),
      notes: elements.chatNotes.value.trim(),
      is_important: elements.chatImportant.checked
    };
    try {
      await fetchJson(`${API_BASE}/admin/chats/${state.activeChatId}/details`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      state.detailsEditing = false;
      await loadChats();
      const refreshed = state.chats.find((item) => item.id === state.activeChatId);
      if (refreshed) {
        populateChatDetails(refreshed);
      }
    } catch (err) {
      window.alert(err.message);
    }
  };

  const deleteChat = async () => {
    if (!state.activeChatId) {
      return;
    }
    if (!window.confirm("Delete this chat and its messages?")) {
      return;
    }
    try {
      stopTyping(state.activeChatId);
      await fetchJson(`${API_BASE}/admin/chats/${state.activeChatId}`, { method: "DELETE" });
      state.activeChatId = null;
      elements.chatMeta.textContent = "Select a chat to view messages.";
      elements.chatMessages.innerHTML = "";
      elements.assignAgent.value = "";
      populateChatDetails(null);
      await loadChats();
      await loadVisitors();
    } catch (err) {
      window.alert(err.message);
    }
  };

  const sendReply = async () => {
    const content = elements.chatReply.value.trim();
    if (!content || !state.activeChatId) {
      return;
    }
    elements.chatReply.value = "";
    await fetchJson(`${API_BASE}/admin/chats/${state.activeChatId}/reply`, {
      method: "POST",
      body: JSON.stringify({ content })
    });
    await selectChat(state.activeChatId);
  };

  const resolveChat = async () => {
    if (!state.activeChatId) {
      return;
    }
    stopTyping(state.activeChatId);
    await fetchJson(`${API_BASE}/admin/chats/${state.activeChatId}/resolve`, {
      method: "POST"
    });
    state.activeChatId = null;
    elements.chatMeta.textContent = "Select a chat to view messages.";
    elements.chatMessages.innerHTML = "";
    await loadChats();
  };

  return {
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
  };
};
