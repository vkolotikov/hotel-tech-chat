(() => {
  const scriptEl = document.currentScript;
  const inferredBase = scriptEl && scriptEl.src ? scriptEl.src.split("/").slice(0, -1).join("/") : "";
  const globalConfig = window.OnlineChatConfig || {};
  const widgetBase = scriptEl?.dataset.widgetBase || globalConfig.widgetBase || inferredBase;
  const explicitVersion = scriptEl?.dataset.version || globalConfig.version || "";
  const scriptVersion = (() => {
    if (!scriptEl?.src) {
      return "";
    }
    try {
      const url = new URL(scriptEl.src, window.location.href);
      return url.searchParams.get("v") || url.searchParams.get("version") || "";
    } catch (err) {
      return "";
    }
  })();
  const moduleVersion = explicitVersion || scriptVersion || "";

  window.__ocWidgetBootstrap = {
    scriptEl,
    inferredBase,
    globalConfig,
    widgetBase,
    moduleVersion
  };

  const moduleBase = widgetBase || inferredBase;
  const withVersion = (src) => {
    if (!moduleVersion) {
      return src;
    }
    const joiner = src.includes("?") ? "&" : "?";
    return `${src}${joiner}v=${encodeURIComponent(moduleVersion)}`;
  };
  // Split widget code into internal modules for readability while preserving load order.
  const modulePaths = [
    withVersion(`${moduleBase}/modules/inline-css.js`),
    withVersion(`${moduleBase}/modules/state.js`),
    withVersion(`${moduleBase}/modules/utils.js`),
    withVersion(`${moduleBase}/modules/dom.js`),
    withVersion(`${moduleBase}/modules/messages.js`),
    withVersion(`${moduleBase}/modules/popup.js`),
    withVersion(`${moduleBase}/modules/api.js`),
    withVersion(`${moduleBase}/modules/tracking.js`),
    withVersion(`${moduleBase}/modules/polling.js`),
    withVersion(`${moduleBase}/modules/init.js`)
  ];

  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      (document.head || document.body || document.documentElement).appendChild(script);
    });

  const loadAll = async () => {
    for (const src of modulePaths) {
      await loadScript(src);
    }
    if (window.__ocWidget && typeof window.__ocWidget.bootstrap === "function") {
      window.__ocWidget.bootstrap();
    }
  };

  loadAll().catch((err) => {
    console.error("OnlineChat widget failed to load", err);
  });
})();
