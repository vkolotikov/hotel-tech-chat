(() => {
  const widget = window.__ocWidget || (window.__ocWidget = {});
  const { state } = widget;
  const { loadMessages } = widget;

  const startPolling = (panel) => {
    stopPolling();
    state.pollTimer = setInterval(() => {
      if (state.polling) {
        return;
      }
      state.polling = true;
      loadMessages(panel, state.lastMessageId, { simulateTyping: true, autoPlayVoice: true })
        .catch(() => null)
        .finally(() => {
          state.polling = false;
        });
    }, 3000);
  };

  const stopPolling = () => {
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
      state.pollTimer = null;
    }
    state.polling = false;
  };

  widget.startPolling = startPolling;
  widget.stopPolling = stopPolling;
})();
