// Loads extracted dashboard HTML fragments before app init.
(() => {
  const loadPartial = async (node) => {
    const url = node.getAttribute("data-include");
    if (!url) {
      return false;
    }
    try {
      const response = await fetch(url, { credentials: "same-origin" });
      if (!response.ok) {
        console.error("Failed to load partial:", url, response.status);
        return false;
      }
      const html = await response.text();
      node.insertAdjacentHTML("beforebegin", html);
      node.remove();
      return true;
    } catch (err) {
      console.error("Failed to load partial:", url, err);
      return false;
    }
  };

  const loadAll = async () => {
    let pending = Array.from(document.querySelectorAll("[data-include]"));
    while (pending.length) {
      for (const node of pending) {
        await loadPartial(node);
      }
      pending = Array.from(document.querySelectorAll("[data-include]"));
    }
  };

  window.OnlineChatPartialsReady = loadAll();
})();
