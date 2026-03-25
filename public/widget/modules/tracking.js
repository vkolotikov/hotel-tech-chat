(() => {
  const widget = window.__ocWidget || (window.__ocWidget = {});
  const { state } = widget;
  const { getPageContext } = widget;
  const { initVisitor, sendTrackEvent } = widget;

  const trackPageView = async () => {
    const page = getPageContext();
    if (page.url === state.lastTrackedUrl) {
      return;
    }
    if (!state.sessionId) {
      await initVisitor();
    }
    state.lastTrackedUrl = page.url;
    await sendTrackEvent("pageview", page);
  };

  const sendHeartbeat = async () => {
    const page = getPageContext();
    if (page.url !== state.lastTrackedUrl) {
      await trackPageView();
      return;
    }
    await sendTrackEvent("heartbeat", { url: page.url, path: page.path, title: page.title });
  };

  const startTracking = () => {
    if (state.trackTimer) {
      return;
    }
    trackPageView().catch(() => null);
    state.trackTimer = setInterval(() => {
      sendHeartbeat().catch(() => null);
    }, 15000);

    const handleNav = () => {
      trackPageView().catch(() => null);
    };

    window.addEventListener("popstate", handleNav);
    window.addEventListener("hashchange", handleNav);

    if (!state.historyPatched && window.history && window.history.pushState) {
      state.historyPatched = true;
      const originalPush = window.history.pushState;
      const originalReplace = window.history.replaceState;
      window.history.pushState = function (...args) {
        const result = originalPush.apply(this, args);
        handleNav();
        return result;
      };
      window.history.replaceState = function (...args) {
        const result = originalReplace.apply(this, args);
        handleNav();
        return result;
      };
    }

    const handleLeave = () => {
      const page = getPageContext();
      sendTrackEvent("leave", page, true).catch(() => null);
    };
    window.addEventListener("pagehide", handleLeave);
    window.addEventListener("beforeunload", handleLeave);
  };

  widget.trackPageView = trackPageView;
  widget.sendHeartbeat = sendHeartbeat;
  widget.startTracking = startTracking;
})();
