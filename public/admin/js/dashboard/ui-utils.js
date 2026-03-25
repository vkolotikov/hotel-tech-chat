(() => {
  // Extracted UI helpers to keep the dashboard bootstrap focused.
  const { state } = window.dashboardState;
  const { elements } = window.dashboardElements;
  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const safe = (value) => escapeHtml(value);

  const setSignal = (text, isAttention) => {
    if (!elements.signalPill) {
      return;
    }
    elements.signalPill.textContent = text;
    elements.signalPill.classList.toggle("attention", Boolean(isAttention));
  };

  const setDetailsDrawer = (open) => {
    if (!elements.detailsDrawer || !elements.detailsToggle) {
      return;
    }
    elements.detailsDrawer.classList.toggle("is-open", open);
    elements.detailsDrawer.setAttribute("aria-hidden", open ? "false" : "true");
    elements.detailsToggle.setAttribute("aria-expanded", open ? "true" : "false");
  };

  const toggleDetailsDrawer = () => {
    if (!elements.detailsDrawer) {
      return;
    }
    const nextOpen = !elements.detailsDrawer.classList.contains("is-open");
    if (!nextOpen) {
      state.detailsEditing = false;
    }
    setDetailsDrawer(nextOpen);
  };

  const showAlertBanner = (visible, text) => {
    if (!elements.alertBanner) {
      return;
    }
    if (text) {
      elements.alertBanner.textContent = text;
    }
    elements.alertBanner.hidden = !visible;
  };

  const showToast = (title, detail, onView) => {
    if (!elements.toastStack) {
      return;
    }
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <strong>${safe(title)}</strong>
      <div class="chat-meta">${safe(detail)}</div>
      <div class="toast-actions">
        <button type="button" data-action="view">View chat</button>
        <button type="button" data-action="dismiss">Dismiss</button>
      </div>
    `;
    toast.querySelector("[data-action='view']").addEventListener("click", () => {
      if (typeof onView === "function") {
        onView();
      }
      toast.remove();
    });
    toast.querySelector("[data-action='dismiss']").addEventListener("click", () => toast.remove());
    elements.toastStack.prepend(toast);
    const items = elements.toastStack.querySelectorAll(".toast");
    items.forEach((item, index) => {
      if (index > 3) {
        item.remove();
      }
    });
    setTimeout(() => {
      toast.remove();
    }, 12000);
  };

  const playSound = () => {
    if (!state.canPlaySound || !state.soundEnabled) {
      return;
    }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.value = 0.04;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        ctx.close();
      }, 160);
    } catch (err) {
      return;
    }
  };

  const showDesktopNotification = (title, body) => {
    if (!state.desktopEnabled || !("Notification" in window)) {
      return;
    }
    if (Notification.permission !== "granted") {
      return;
    }
    try {
      const notification = new Notification(title, {
        body,
        silent: !state.soundEnabled
      });
      setTimeout(() => notification.close(), 8000);
    } catch (err) {
      return;
    }
  };

  const updateFaviconBadge = (count) => {
    const link =
      document.querySelector("link[rel='icon']") ||
      document.querySelector("link[rel='shortcut icon']") ||
      (() => {
        const created = document.createElement("link");
        created.rel = "icon";
        document.head.appendChild(created);
        return created;
      })();

    if (!state.faviconOriginal) {
      state.faviconOriginal = link.href || "";
    }
    if (!count) {
      link.href = state.faviconOriginal;
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0b1118";
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = "#27a6b2";
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(count > 99 ? "99+" : count), 16, 16);
    link.href = canvas.toDataURL("image/png");
  };

  window.dashboardUiUtils = {
    showToast,
    playSound,
    showDesktopNotification,
    updateFaviconBadge,
    showAlertBanner,
    setSignal,
    setDetailsDrawer,
    toggleDetailsDrawer
  };
})();
