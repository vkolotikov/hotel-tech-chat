(() => {
  const widget = window.__ocWidget || (window.__ocWidget = {});
  const { config, scriptEl, globalConfig } = widget;
  const INLINE_CSS = widget.INLINE_CSS;
  const LAUNCHER_VARIANT_CSS = `
.oc-button{
  width:var(--oc-launcher-w,56px)!important;
  height:var(--oc-launcher-h,56px)!important;
  border-radius:var(--oc-launcher-r,999px)!important;
  border:var(--oc-launcher-border,none)!important;
  background:var(--oc-launcher-bg,radial-gradient(circle at 20% 20%,rgba(var(--oc-brand-rgb),.9),var(--oc-brand)))!important;
  color:var(--oc-launcher-color,#fff)!important;
  box-shadow:var(--oc-launcher-shadow,0 16px 36px rgba(var(--oc-brand-rgb),.4),0 0 0 4px rgba(var(--oc-brand-rgb),.12))!important;
  backdrop-filter:var(--oc-launcher-blur,none)!important;
  animation:var(--oc-launcher-anim,none)!important;
  position:relative;
  display:grid;
  place-items:center;
}
.oc-button::after{
  content:"";
  position:absolute;
  inset:-7px;
  border-radius:calc(var(--oc-launcher-r,999px) + 6px);
  border:1px solid rgba(var(--oc-brand-rgb),.25);
  opacity:0;
  transition:opacity .2s ease;
}
.oc-button:hover{
  box-shadow:var(--oc-launcher-hover-shadow,var(--oc-launcher-shadow))!important;
}
.oc-button:hover::after{opacity:1}
.oc-button svg{width:26px;height:26px}

.oc-button.style-classic{
  --oc-launcher-w:58px;
  --oc-launcher-h:58px;
  --oc-launcher-r:999px;
  --oc-launcher-bg:radial-gradient(circle at 22% 16%,rgba(255,255,255,.42),rgba(var(--oc-brand-rgb),.98) 34%,rgba(30,64,175,.92) 92%);
  --oc-launcher-shadow:0 20px 40px rgba(var(--oc-brand-rgb),.48),0 0 0 5px rgba(var(--oc-brand-rgb),.16);
  --oc-launcher-anim:oc-pulse 4s ease-in-out infinite;
  --oc-launcher-hover-shadow:0 24px 48px rgba(var(--oc-brand-rgb),.58),0 0 0 7px rgba(var(--oc-brand-rgb),.22);
}
.oc-button.style-classic::before{
  content:"";
  position:absolute;
  top:-2px;
  right:-2px;
  width:13px;
  height:13px;
  border-radius:999px;
  background:#ef4444;
  border:2px solid rgba(11,17,24,.95);
  box-shadow:0 0 0 2px rgba(239,68,68,.24);
}
.oc-button.style-glass{
  --oc-launcher-w:60px;
  --oc-launcher-h:60px;
  --oc-launcher-r:999px;
  --oc-launcher-bg:linear-gradient(150deg,rgba(186,230,253,.5),rgba(59,130,246,.82) 46%,rgba(30,64,175,.88) 92%);
  --oc-launcher-shadow:0 20px 38px rgba(2,6,23,.48),inset 0 1px 0 rgba(255,255,255,.34),0 0 0 1px rgba(125,211,252,.46);
  --oc-launcher-blur:blur(14px) saturate(165%);
  --oc-launcher-border:1px solid rgba(255,255,255,.32);
  --oc-launcher-hover-shadow:0 26px 46px rgba(2,6,23,.58),inset 0 1px 0 rgba(255,255,255,.4),0 0 0 1px rgba(125,211,252,.58);
}
.oc-button.style-glass::before{
  content:"";
  position:absolute;
  inset:1px;
  border-radius:calc(var(--oc-launcher-r,999px) - 1px);
  background:linear-gradient(172deg,rgba(255,255,255,.54),rgba(255,255,255,0) 58%);
  pointer-events:none;
}
.oc-button.style-solid{
  --oc-launcher-w:58px;
  --oc-launcher-h:58px;
  --oc-launcher-r:999px;
  --oc-launcher-bg:linear-gradient(148deg,rgba(var(--oc-brand-rgb),1),rgba(59,130,246,.92));
  --oc-launcher-shadow:0 18px 36px rgba(var(--oc-brand-rgb),.52);
  --oc-launcher-hover-shadow:0 22px 40px rgba(var(--oc-brand-rgb),.62);
  --oc-launcher-border:1px solid rgba(255,255,255,.22);
}
.oc-button.style-solid svg{transform:translateX(.5px)}
.oc-button.style-minimal{
  --oc-launcher-w:54px;
  --oc-launcher-h:54px;
  --oc-launcher-r:999px;
  --oc-launcher-bg:linear-gradient(165deg,rgba(7,15,29,.96),rgba(12,24,40,.94));
  --oc-launcher-color:#e2e8f0;
  --oc-launcher-shadow:inset 0 0 0 1px rgba(148,163,184,.38),0 14px 26px rgba(2,6,23,.48);
  --oc-launcher-hover-shadow:inset 0 0 0 1px rgba(167,243,208,.54),0 18px 30px rgba(2,6,23,.56);
  --oc-launcher-border:1px solid rgba(148,163,184,.34);
}
.oc-button.style-minimal:hover::after{opacity:0}
.oc-button.style-square{
  --oc-launcher-w:58px;
  --oc-launcher-h:58px;
  --oc-launcher-r:14px;
  --oc-launcher-bg:linear-gradient(145deg,rgba(59,130,246,.98),rgba(14,165,233,.88));
  --oc-launcher-shadow:0 18px 32px rgba(8,47,73,.52);
  --oc-launcher-hover-shadow:0 22px 38px rgba(8,47,73,.64);
  --oc-launcher-border:1px solid rgba(255,255,255,.24);
}
.oc-button.style-square::before{
  content:"";
  position:absolute;
  inset:1px;
  border-radius:calc(var(--oc-launcher-r,999px) - 1px);
  background:linear-gradient(170deg,rgba(255,255,255,.22),rgba(255,255,255,0) 48%);
  pointer-events:none;
}
.oc-button.style-halo{
  --oc-launcher-w:60px;
  --oc-launcher-h:60px;
  --oc-launcher-r:999px;
  --oc-launcher-bg:radial-gradient(circle at 50% 50%,rgba(var(--oc-brand-rgb),1),rgba(34,211,238,.86) 54%,rgba(6,182,212,.76));
  --oc-launcher-shadow:0 20px 38px rgba(6,182,212,.36),0 0 0 6px rgba(34,211,238,.16);
  --oc-launcher-hover-shadow:0 24px 44px rgba(6,182,212,.44),0 0 0 8px rgba(34,211,238,.24);
  --oc-launcher-anim:oc-pulse 3.6s ease-in-out infinite;
}
.oc-button.style-halo::before{
  content:"";
  position:absolute;
  inset:-7px;
  border-radius:calc(var(--oc-launcher-r,999px) + 7px);
  border:1px solid rgba(45,212,191,.4);
  box-shadow:0 0 0 4px rgba(45,212,191,.12);
}
.oc-button.style-midnight{
  --oc-launcher-w:58px;
  --oc-launcher-h:58px;
  --oc-launcher-r:999px;
  --oc-launcher-bg:radial-gradient(circle at 30% 20%,rgba(30,41,59,.6),rgba(6,10,23,.98) 44%,rgba(3,7,18,.98));
  --oc-launcher-color:#e2f3ff;
  --oc-launcher-shadow:inset 0 0 0 1px rgba(56,189,248,.26),0 18px 32px rgba(2,6,23,.74);
  --oc-launcher-hover-shadow:inset 0 0 0 1px rgba(34,211,238,.44),0 22px 38px rgba(2,6,23,.82);
  --oc-launcher-border:1px solid rgba(56,189,248,.28);
}
.oc-button.style-midnight::before{
  content:"";
  position:absolute;
  inset:4px;
  border-radius:calc(var(--oc-launcher-r,999px) - 4px);
  border:1px solid rgba(34,211,238,.26);
}
.oc-button.style-duotone{
  --oc-launcher-w:60px;
  --oc-launcher-h:60px;
  --oc-launcher-r:18px;
  --oc-launcher-bg:linear-gradient(135deg,rgba(59,130,246,.98) 0%,rgba(99,102,241,.96) 48%,rgba(217,70,239,.92) 100%);
  --oc-launcher-shadow:0 20px 36px rgba(79,70,229,.38),0 0 0 4px rgba(147,51,234,.16);
  --oc-launcher-hover-shadow:0 24px 42px rgba(79,70,229,.48),0 0 0 6px rgba(147,51,234,.22);
  --oc-launcher-border:1px solid rgba(191,219,254,.34);
}
.oc-button.style-aurora{
  --oc-launcher-w:60px;
  --oc-launcher-h:60px;
  --oc-launcher-r:999px;
  --oc-launcher-bg:conic-gradient(from 240deg at 50% 50%,rgba(14,165,233,.98),rgba(99,102,241,.98),rgba(236,72,153,.95),rgba(45,212,191,.98),rgba(14,165,233,.98));
  --oc-launcher-shadow:0 20px 36px rgba(56,189,248,.34),0 0 0 4px rgba(99,102,241,.16);
  --oc-launcher-hover-shadow:0 24px 42px rgba(99,102,241,.46),0 0 0 6px rgba(236,72,153,.2);
  --oc-launcher-anim:oc-pulse 3.1s ease-in-out infinite;
}
.oc-button.style-aurora::before{
  content:"";
  position:absolute;
  inset:2px;
  border-radius:calc(var(--oc-launcher-r,999px) - 2px);
  background:radial-gradient(circle at 20% 16%,rgba(255,255,255,.4),rgba(255,255,255,0) 50%);
}
.oc-button.style-outline{
  --oc-launcher-w:58px;
  --oc-launcher-h:58px;
  --oc-launcher-r:999px;
  --oc-launcher-bg:linear-gradient(165deg,rgba(7,15,29,.92),rgba(8,19,35,.98));
  --oc-launcher-color:#e5f8ff;
  --oc-launcher-shadow:0 14px 28px rgba(2,6,23,.58),inset 0 0 0 1px rgba(125,211,252,.34);
  --oc-launcher-hover-shadow:0 18px 36px rgba(2,6,23,.64),inset 0 0 0 1px rgba(45,212,191,.56);
  --oc-launcher-border:1px solid rgba(125,211,252,.4);
}
.oc-button.style-outline::before{
  content:"";
  position:absolute;
  inset:4px;
  border-radius:calc(var(--oc-launcher-r,999px) - 4px);
  border:1px solid rgba(45,212,191,.42);
}
.oc-button.style-neon{
  --oc-launcher-w:60px;
  --oc-launcher-h:60px;
  --oc-launcher-r:999px;
  --oc-launcher-bg:linear-gradient(145deg,rgba(6,14,30,.96),rgba(7,18,38,.94));
  --oc-launcher-color:#dcf8ff;
  --oc-launcher-shadow:0 18px 36px rgba(2,6,23,.62),0 0 0 1px rgba(34,211,238,.6),0 0 30px rgba(34,211,238,.32);
  --oc-launcher-hover-shadow:0 22px 42px rgba(2,6,23,.7),0 0 0 1px rgba(45,212,191,.78),0 0 36px rgba(56,189,248,.44);
  --oc-launcher-border:1px solid rgba(56,189,248,.66);
}
.oc-button.style-neon::before{
  content:"";
  position:absolute;
  inset:4px;
  border-radius:calc(var(--oc-launcher-r,999px) - 4px);
  border:1px solid rgba(167,243,208,.56);
  box-shadow:inset 0 0 16px rgba(34,211,238,.38);
}
.oc-button.style-sunset{
  --oc-launcher-w:60px;
  --oc-launcher-h:60px;
  --oc-launcher-r:999px;
  --oc-launcher-bg:linear-gradient(145deg,rgba(251,146,60,.98),rgba(244,63,94,.94) 55%,rgba(249,115,22,.96));
  --oc-launcher-shadow:0 20px 36px rgba(190,24,93,.34),0 0 0 4px rgba(251,146,60,.18);
  --oc-launcher-hover-shadow:0 24px 42px rgba(190,24,93,.44),0 0 0 6px rgba(251,146,60,.24);
}
.oc-button.style-sunset::before{
  content:"";
  position:absolute;
  inset:2px;
  border-radius:calc(var(--oc-launcher-r,999px) - 2px);
  background:radial-gradient(circle at 20% 16%,rgba(255,255,255,.36),rgba(255,255,255,0) 50%);
}

.oc-button.shape-circle{
  --oc-launcher-r:999px;
  --oc-launcher-w:56px;
  --oc-launcher-h:56px;
}
.oc-button.shape-rounded{
  --oc-launcher-r:16px;
  --oc-launcher-w:58px;
  --oc-launcher-h:56px;
}
.oc-button.shape-square{
  --oc-launcher-r:10px;
  --oc-launcher-w:56px;
  --oc-launcher-h:56px;
}
.oc-button.shape-pill{
  --oc-launcher-r:999px;
  --oc-launcher-w:88px;
  --oc-launcher-h:48px;
}
.oc-button.shape-pill svg{width:22px;height:22px}
`;

  const ensureLauncherVariantStyles = () => {
    if (document.querySelector("style[data-oc-launcher-css]")) {
      return;
    }
    const style = document.createElement("style");
    style.setAttribute("data-oc-launcher-css", "true");
    style.textContent = LAUNCHER_VARIANT_CSS;
    document.head.appendChild(style);
  };

  const injectStyles = () => {
    if (document.querySelector("link[data-oc-css], style[data-oc-inline]")) {
      ensureLauncherVariantStyles();
      return;
    }

    const inlineFlag =
      (scriptEl && scriptEl.dataset.inlineCss === "true") || globalConfig.inlineCss === true;
    if (inlineFlag) {
      const style = document.createElement("style");
      style.setAttribute("data-oc-inline", "true");
      style.textContent = INLINE_CSS;
      document.head.appendChild(style);
      ensureLauncherVariantStyles();
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${config.widgetBase}/widget.css`;
    link.setAttribute("data-oc-css", "true");
    link.onerror = () => {
      if (document.querySelector("style[data-oc-inline]")) {
        ensureLauncherVariantStyles();
        return;
      }
      const style = document.createElement("style");
      style.setAttribute("data-oc-inline", "true");
      style.textContent = INLINE_CSS;
      document.head.appendChild(style);
      ensureLauncherVariantStyles();
    };
    document.head.appendChild(link);
    ensureLauncherVariantStyles();
  };

  const createRoot = () => {
    const root = document.createElement("div");
    root.id = "oc-root";
    if (config.position === "left") {
      root.classList.add("oc-left");
    }
    root.innerHTML = `
      <button class="oc-button" aria-label="Open chat" type="button">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 18.5V20l3.2-1.8h7.3c2.2 0 4-1.8 4-4v-6c0-2.2-1.8-4-4-4h-9c-2.2 0-4 1.8-4 4v6c0 1.8 1.2 3.4 2.9 3.8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path>
        </svg>
      </button>
      <div class="oc-popup" role="status" aria-live="polite" hidden>
        <div class="oc-popup-avatar" aria-hidden="true">OC</div>
        <div class="oc-popup-content">
          <div class="oc-popup-meta" hidden></div>
          <div class="oc-popup-message"></div>
          <div class="oc-popup-actions" hidden></div>
          <button class="oc-popup-close" type="button" aria-label="Dismiss popup">&times;</button>
        </div>
      </div>
      <section class="oc-panel" role="dialog" aria-label="Chat window">
        <div class="oc-header">
          <div class="oc-company">
            <div class="oc-avatar" aria-hidden="true">OC</div>
            <div>
              <div class="oc-title">OnlineChat</div>
              <div class="oc-subtitle"></div>
              <div class="oc-status">
                <span class="oc-dot"></span>
                <span class="oc-status-text">Online</span>
              </div>
            </div>
          </div>
          <button class="oc-close" aria-label="Close chat" type="button">&times;</button>
        </div>
        <div class="oc-body" aria-live="polite"></div>
        <div class="oc-typing" hidden>
          <span class="oc-typing-label">Agent is typing</span>
          <span class="oc-typing-dots">
            <span></span><span></span><span></span>
          </span>
        </div>
        <div class="oc-lead" hidden>
          <h4>Before we chat</h4>
          <p>Share your details so we can respond quickly.</p>
          <form>
            <input name="name" type="text" placeholder="Name" required />
            <input name="email" type="email" placeholder="Email" required />
            <input name="company" type="text" placeholder="Company (optional)" />
            <div class="oc-lead-actions">
              <button class="oc-submit" type="submit">Continue</button>
              <button class="oc-skip" type="button">Skip</button>
            </div>
          </form>
          <div class="oc-hint" hidden></div>
        </div>
        <div class="oc-input">
          <button class="oc-upload" type="button" aria-label="Attach file">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7.5 12.5l6.2-6.2a3 3 0 114.3 4.3l-7.1 7.1a4.5 4.5 0 01-6.4-6.4l7.2-7.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="oc-voice" type="button" aria-label="Start voice message" hidden>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5a2.8 2.8 0 0 1 2.8 2.8v4.4A2.8 2.8 0 0 1 12 15a2.8 2.8 0 0 1-2.8-2.8V7.8A2.8 2.8 0 0 1 12 5Z" stroke="currentColor" stroke-width="1.7"/>
              <path d="M6.8 11.8a5.2 5.2 0 0 0 10.4 0M12 17v2.3M9.2 19.3h5.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
            </svg>
          </button>
          <input class="oc-file" type="file" hidden />
          <textarea placeholder="Type your message..." rows="1"></textarea>
          <button class="oc-send" type="button">Send</button>
        </div>
        <div class="oc-voice-meta" hidden>
          <div class="oc-voice-meta-main">
            <span class="oc-voice-status" hidden></span>
            <div class="oc-voice-draft" hidden>
              <span class="oc-voice-draft-label">Voice draft ready</span>
              <div class="oc-voice-draft-actions">
                <button class="oc-voice-draft-rerecord" type="button" aria-label="Record again" title="Record again">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3M19.5 6v3.8h-3.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3M4.5 18v-3.8h3.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                </button>
                <button class="oc-voice-draft-clear" type="button" aria-label="Clear voice draft" title="Clear voice draft">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <span class="oc-voice-disclosure">AI voice replies</span>
        </div>
      </section>
    `;
    document.body.appendChild(root);
    return root;
  };

  const normalizeLauncherStyle = (value) => {
    const style = String(value || "").trim().toLowerCase();
    return [
      "classic",
      "glass",
      "solid",
      "minimal",
      "square",
      "halo",
      "midnight",
      "duotone",
      "aurora",
      "outline",
      "neon",
      "sunset"
    ].includes(style)
      ? style
      : "classic";
  };

  const normalizeLauncherShape = (value) => {
    const shape = String(value || "").trim().toLowerCase();
    return ["circle", "rounded", "square", "pill"].includes(shape) ? shape : "circle";
  };

  const normalizeLauncherGlyph = (value) => {
    const glyph = String(value || "").trim().toLowerCase();
    return ["chat", "message", "support", "quote", "question", "sales"].includes(glyph)
      ? glyph
      : "chat";
  };

  const launcherGlyphSvg = {
    chat:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7.8A3.8 3.8 0 018.8 4h6.4A3.8 3.8 0 0119 7.8v4.6a3.8 3.8 0 01-3.8 3.8h-4.1L7 19v-2.8A3.8 3.8 0 015 12.4V7.8z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path></svg>',
    message:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 6.5h15v9.8h-8.1L7 19v-2.7H4.5V6.5z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path></svg>',
    support:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.8 11.8a4.2 4.2 0 018.4 0v2.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path><rect x="4.3" y="13.4" width="3.9" height="5.5" rx="1.5" stroke="currentColor" stroke-width="1.5"></rect><rect x="15.8" y="13.4" width="3.9" height="5.5" rx="1.5" stroke="currentColor" stroke-width="1.5"></rect></svg>',
    quote:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 12h.01M12 12h.01M16 12h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></path></svg>',
    question:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9.7 9.1a2.3 2.3 0 114.6 0c0 1.6-2.3 1.8-2.3 3.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path><circle cx="12" cy="16.9" r="1" fill="currentColor"></circle></svg>',
    sales:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4.5" y="8" width="15" height="10.5" rx="2.2" stroke="currentColor" stroke-width="1.6"></rect><path d="M9 8V6.8A1.8 1.8 0 0110.8 5h2.4A1.8 1.8 0 0115 6.8V8M4.5 12h15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>'
  };

  const setLauncherStyle = (root, styleValue) => {
    if (!root) {
      return;
    }
    const launcher = root.querySelector(".oc-button");
    if (!launcher) {
      return;
    }
    const style = normalizeLauncherStyle(styleValue);
    launcher.classList.remove(
      "style-classic",
      "style-glass",
      "style-solid",
      "style-minimal",
      "style-square",
      "style-halo",
      "style-midnight",
      "style-duotone",
      "style-aurora",
      "style-outline",
      "style-neon",
      "style-sunset"
    );
    launcher.classList.add(`style-${style}`);
  };

  const setLauncherShape = (root, shapeValue) => {
    if (!root) {
      return;
    }
    const launcher = root.querySelector(".oc-button");
    if (!launcher) {
      return;
    }
    const shape = normalizeLauncherShape(shapeValue);
    launcher.classList.remove("shape-circle", "shape-rounded", "shape-square", "shape-pill");
    launcher.classList.add(`shape-${shape}`);
  };

  const setLauncherGlyph = (root, glyphValue) => {
    if (!root) {
      return;
    }
    const launcher = root.querySelector(".oc-button");
    if (!launcher) {
      return;
    }
    const glyph = normalizeLauncherGlyph(glyphValue);
    launcher.innerHTML = launcherGlyphSvg[glyph] || launcherGlyphSvg.chat;
    launcher.dataset.glyph = glyph;
  };

  const setBrandColor = (root, value) => {
    if (!value) {
      return;
    }
    root.style.setProperty("--oc-brand", value);
    const match = String(value).trim().match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (!match) {
      return;
    }
    const hex = match[1].length === 3 ? match[1].split("").map((c) => c + c).join("") : match[1];
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
      return;
    }
    root.style.setProperty("--oc-brand-rgb", `${r}, ${g}, ${b}`);
  };

  widget.injectStyles = injectStyles;
  widget.createRoot = createRoot;
  widget.setBrandColor = setBrandColor;
  widget.setLauncherStyle = setLauncherStyle;
  widget.setLauncherShape = setLauncherShape;
  widget.setLauncherGlyph = setLauncherGlyph;
})();
