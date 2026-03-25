(() => {
  const widget = window.__ocWidget || (window.__ocWidget = {});

  const formatTime = (value) => {
    const date = new Date(value);
    return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
  };

  const formatFileSize = (bytes) => {
    const size = Number(bytes || 0);
    if (!size) {
      return "";
    }
    if (size < 1024) {
      return `${size} B`;
    }
    if (size < 1024 * 1024) {
      return `${Math.round(size / 102.4) / 10} KB`;
    }
    return `${Math.round(size / (1024 * 102.4)) / 10} MB`;
  };

  const truncateText = (value, maxLen = 140) => {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }
    if (text.length <= maxLen) {
      return text;
    }
    return `${text.slice(0, maxLen - 1)}ƒ?İ`;
  };

  const getPageContext = () => ({
    url: window.location.href,
    path: window.location.pathname || "/",
    title: document.title || "",
    referrer: document.referrer || ""
  });

  const getInitials = (label, fallback = "OC") => {
    const value = String(label || "").trim();
    if (!value) {
      return fallback;
    }
    const parts = value.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const sleep = (ms) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  widget.formatTime = formatTime;
  widget.formatFileSize = formatFileSize;
  widget.truncateText = truncateText;
  widget.getPageContext = getPageContext;
  widget.getInitials = getInitials;
  widget.sleep = sleep;
})();
