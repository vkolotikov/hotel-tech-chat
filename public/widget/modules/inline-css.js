(() => {
  const widget = window.__ocWidget || (window.__ocWidget = {});
  const INLINE_CSS = `@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap");

:root {
  --oc-brand: #1f6b75;
  --oc-brand-rgb: 31, 107, 117;
  --oc-brand-dark: #15525a;
  --oc-ink: #f8fafc;
  --oc-muted: #94a3b8;
  --oc-surface: #0b1118;
  --oc-border: rgba(148, 163, 184, 0.18);
  --oc-shadow: 0 32px 70px rgba(0, 0, 0, 0.55);
  --oc-radius: 20px;
}

#oc-root {
  position: fixed;
  bottom: 22px;
  right: 22px;
  z-index: 2147483000;
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
}

#oc-root.oc-left {
  right: auto;
  left: 22px;
}

#oc-root.oc-left .oc-panel {
  right: auto;
  left: 0;
}

#oc-root.oc-left .oc-popup {
  right: auto;
  left: 0;
}

#oc-root.oc-left .oc-popup-content::after {
  right: auto;
  left: 20px;
}

#oc-root * {
  box-sizing: border-box;
}

.oc-button {
  width: 56px;
  height: 56px;
  border-radius: var(--oc-launcher-radius, 999px);
  border: none;
  cursor: pointer;
  background: var(
    --oc-launcher-bg,
    radial-gradient(circle at 20% 20%, rgba(var(--oc-brand-rgb), 0.9), var(--oc-brand))
  );
  color: var(--oc-launcher-color, #ffffff);
  box-shadow: var(
    --oc-launcher-shadow,
    0 16px 36px rgba(var(--oc-brand-rgb), 0.4), 0 0 0 4px rgba(var(--oc-brand-rgb), 0.12)
  );
  display: grid;
  place-items: center;
  position: relative;
  backdrop-filter: var(--oc-launcher-blur, none);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: var(--oc-launcher-anim, none);
}

.oc-button.style-classic {
  --oc-launcher-radius: 999px;
  --oc-launcher-bg: radial-gradient(circle at 24% 20%, rgba(255, 255, 255, 0.26), rgba(var(--oc-brand-rgb), 0.92) 28%, var(--oc-brand) 74%);
  --oc-launcher-shadow: 0 18px 36px rgba(var(--oc-brand-rgb), 0.42),
    0 0 0 5px rgba(var(--oc-brand-rgb), 0.12);
  --oc-launcher-anim: oc-pulse 4s ease-in-out infinite;
  --oc-launcher-hover-shadow: 0 22px 40px rgba(var(--oc-brand-rgb), 0.5),
    0 0 0 6px rgba(var(--oc-brand-rgb), 0.2);
}

.oc-button.style-classic::before {
  content: "";
  position: absolute;
  top: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #ef4444;
  border: 2px solid rgba(11, 17, 24, 0.9);
}

.oc-button.style-glass {
  width: 60px;
  height: 60px;
  --oc-launcher-radius: 999px;
  --oc-launcher-bg: linear-gradient(
    145deg,
    rgba(34, 211, 238, 0.4),
    rgba(59, 130, 246, 0.78) 38%,
    rgba(30, 64, 175, 0.8) 78%
  );
  --oc-launcher-shadow: 0 20px 38px rgba(2, 6, 23, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    0 0 0 1px rgba(125, 211, 252, 0.38);
  --oc-launcher-blur: blur(14px) saturate(145%);
  --oc-launcher-hover-shadow: 0 24px 42px rgba(2, 6, 23, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.34),
    0 0 0 1px rgba(125, 211, 252, 0.52);
  border: 1px solid rgba(255, 255, 255, 0.22);
}

.oc-button.style-solid {
  width: 64px;
  height: 54px;
  --oc-launcher-radius: 999px;
  --oc-launcher-bg: linear-gradient(135deg, rgba(var(--oc-brand-rgb), 1), rgba(var(--oc-brand-rgb), 0.86));
  --oc-launcher-shadow: 0 16px 34px rgba(var(--oc-brand-rgb), 0.5);
  --oc-launcher-hover-shadow: 0 20px 38px rgba(var(--oc-brand-rgb), 0.58);
  border: none;
}

.oc-button.style-solid svg {
  transform: translateX(0.5px);
  filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.2));
}

.oc-button.style-minimal {
  width: 50px;
  height: 50px;
  --oc-launcher-radius: 999px;
  --oc-launcher-bg: rgba(12, 24, 40, 0.92);
  --oc-launcher-color: #e2e8f0;
  --oc-launcher-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.34), 0 12px 24px rgba(2, 6, 23, 0.42);
  --oc-launcher-hover-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.5), 0 16px 26px rgba(2, 6, 23, 0.5);
  border: none;
}

.oc-button.style-square {
  width: 58px;
  height: 58px;
  --oc-launcher-radius: 16px;
  --oc-launcher-bg: linear-gradient(145deg, rgba(59, 130, 246, 0.95), rgba(14, 116, 144, 0.9));
  --oc-launcher-shadow: 0 18px 30px rgba(8, 47, 73, 0.5);
  --oc-launcher-hover-shadow: 0 22px 36px rgba(8, 47, 73, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.oc-button.style-halo {
  width: 60px;
  height: 60px;
  --oc-launcher-radius: 999px;
  --oc-launcher-bg: radial-gradient(circle at 50% 52%, rgba(var(--oc-brand-rgb), 0.98), rgba(16, 185, 129, 0.92) 48%, rgba(14, 165, 233, 0.88));
  --oc-launcher-shadow: 0 20px 36px rgba(6, 182, 212, 0.34), 0 0 0 5px rgba(34, 211, 238, 0.16);
  --oc-launcher-hover-shadow: 0 24px 42px rgba(6, 182, 212, 0.4), 0 0 0 7px rgba(34, 211, 238, 0.2);
  --oc-launcher-anim: oc-pulse 3.6s ease-in-out infinite;
}

.oc-button.style-halo::before {
  content: "";
  position: absolute;
  inset: -6px;
  border-radius: calc(var(--oc-launcher-radius, 999px) + 6px);
  border: 1px solid rgba(45, 212, 191, 0.34);
}

.oc-button.style-midnight {
  width: 58px;
  height: 58px;
  --oc-launcher-radius: 999px;
  --oc-launcher-bg: linear-gradient(165deg, rgba(6, 10, 23, 0.98), rgba(15, 23, 42, 0.96));
  --oc-launcher-color: #e2f3ff;
  --oc-launcher-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.28), 0 16px 30px rgba(2, 6, 23, 0.68);
  --oc-launcher-hover-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.45), 0 20px 36px rgba(2, 6, 23, 0.78);
  --oc-launcher-border: 1px solid rgba(56, 189, 248, 0.32);
}

.oc-button.style-midnight::before {
  content: "";
  position: absolute;
  inset: 4px;
  border-radius: calc(var(--oc-launcher-radius, 999px) - 4px);
  border: 1px solid rgba(34, 211, 238, 0.28);
}

.oc-button.style-duotone {
  width: 60px;
  height: 60px;
  --oc-launcher-radius: 16px;
  --oc-launcher-bg: linear-gradient(145deg, rgba(var(--oc-brand-rgb), 0.98), rgba(168, 85, 247, 0.94));
  --oc-launcher-shadow: 0 20px 34px rgba(79, 70, 229, 0.34), 0 0 0 4px rgba(147, 51, 234, 0.14);
  --oc-launcher-hover-shadow: 0 24px 40px rgba(79, 70, 229, 0.44), 0 0 0 6px rgba(147, 51, 234, 0.2);
  --oc-launcher-border: 1px solid rgba(191, 219, 254, 0.28);
}

.oc-button.style-aurora {
  width: 60px;
  height: 60px;
  --oc-launcher-radius: 999px;
  --oc-launcher-bg: conic-gradient(from 220deg at 50% 50%, rgba(14, 165, 233, 0.96), rgba(99, 102, 241, 0.96), rgba(236, 72, 153, 0.92), rgba(45, 212, 191, 0.96), rgba(14, 165, 233, 0.96));
  --oc-launcher-shadow: 0 18px 34px rgba(56, 189, 248, 0.32), 0 0 0 4px rgba(99, 102, 241, 0.14);
  --oc-launcher-hover-shadow: 0 24px 40px rgba(99, 102, 241, 0.44), 0 0 0 6px rgba(236, 72, 153, 0.16);
  --oc-launcher-anim: oc-pulse 3.2s ease-in-out infinite;
}

.oc-button.style-aurora::before {
  content: "";
  position: absolute;
  inset: 2px;
  border-radius: calc(var(--oc-launcher-radius, 999px) - 2px);
  background: radial-gradient(circle at 22% 18%, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0) 46%);
}

.oc-button.style-outline {
  width: 58px;
  height: 58px;
  --oc-launcher-radius: 999px;
  --oc-launcher-bg: linear-gradient(165deg, rgba(7, 15, 29, 0.94), rgba(8, 19, 35, 0.98));
  --oc-launcher-color: #e5f8ff;
  --oc-launcher-shadow: 0 14px 26px rgba(2, 6, 23, 0.56), inset 0 0 0 1px rgba(125, 211, 252, 0.34);
  --oc-launcher-hover-shadow: 0 18px 34px rgba(2, 6, 23, 0.62), inset 0 0 0 1px rgba(45, 212, 191, 0.52);
  border: 1px solid rgba(125, 211, 252, 0.36);
}

.oc-button.style-outline::before {
  content: "";
  position: absolute;
  inset: 4px;
  border-radius: calc(var(--oc-launcher-radius, 999px) - 4px);
  border: 1px solid rgba(45, 212, 191, 0.36);
}

.oc-button.style-neon {
  width: 60px;
  height: 60px;
  --oc-launcher-radius: 999px;
  --oc-launcher-bg: linear-gradient(145deg, rgba(6, 14, 30, 0.96), rgba(7, 18, 38, 0.94));
  --oc-launcher-color: #dcf8ff;
  --oc-launcher-shadow: 0 18px 34px rgba(2, 6, 23, 0.6), 0 0 0 1px rgba(34, 211, 238, 0.55), 0 0 28px rgba(34, 211, 238, 0.28);
  --oc-launcher-hover-shadow: 0 22px 40px rgba(2, 6, 23, 0.68), 0 0 0 1px rgba(45, 212, 191, 0.7), 0 0 34px rgba(56, 189, 248, 0.4);
  border: 1px solid rgba(56, 189, 248, 0.6);
}

.oc-button.style-neon::before {
  content: "";
  position: absolute;
  inset: 4px;
  border-radius: calc(var(--oc-launcher-radius, 999px) - 4px);
  border: 1px solid rgba(167, 243, 208, 0.52);
  box-shadow: inset 0 0 14px rgba(34, 211, 238, 0.35);
}

.oc-button.style-sunset {
  width: 60px;
  height: 60px;
  --oc-launcher-radius: 999px;
  --oc-launcher-bg: linear-gradient(145deg, rgba(251, 146, 60, 0.98), rgba(244, 63, 94, 0.94) 55%, rgba(249, 115, 22, 0.96));
  --oc-launcher-shadow: 0 18px 34px rgba(190, 24, 93, 0.32), 0 0 0 4px rgba(251, 146, 60, 0.16);
  --oc-launcher-hover-shadow: 0 22px 40px rgba(190, 24, 93, 0.42), 0 0 0 6px rgba(251, 146, 60, 0.22);
}

.oc-button.style-sunset::before {
  content: "";
  position: absolute;
  inset: 2px;
  border-radius: calc(var(--oc-launcher-radius, 999px) - 2px);
  background: radial-gradient(circle at 22% 18%, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0) 48%);
}

.oc-button::after {
  content: "";
  position: absolute;
  inset: -7px;
  border-radius: calc(var(--oc-launcher-radius, 999px) + 6px);
  border: 1px solid rgba(var(--oc-brand-rgb), 0.25);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.oc-button.style-glass::before,
.oc-button.style-square::before {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: calc(var(--oc-launcher-radius, 999px) - 1px);
  pointer-events: none;
}

.oc-button.style-glass::before {
  background: linear-gradient(170deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0) 56%);
}

.oc-button.style-square::before {
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0) 46%);
}

.oc-button:hover {
  transform: translateY(-2px);
  box-shadow: var(
    --oc-launcher-hover-shadow,
    0 18px 36px rgba(var(--oc-brand-rgb), 0.45), 0 0 0 5px rgba(var(--oc-brand-rgb), 0.2)
  );
}

.oc-button:hover::after {
  opacity: 1;
}

.oc-button.style-minimal:hover::after,
.oc-button.style-solid:hover::after {
  opacity: 0;
}

.oc-button.shape-circle {
  border-radius: 999px !important;
  width: 56px !important;
  height: 56px !important;
}

.oc-button.shape-rounded {
  border-radius: 16px !important;
  width: 58px !important;
  height: 56px !important;
}

.oc-button.shape-square {
  border-radius: 10px !important;
  width: 56px !important;
  height: 56px !important;
}

.oc-button.shape-pill {
  border-radius: 999px !important;
  width: 84px !important;
  height: 48px !important;
}

.oc-button:focus-visible {
  outline: 3px solid rgba(var(--oc-brand-rgb), 0.4);
  outline-offset: 2px;
}

.oc-button svg {
  width: 26px;
  height: 26px;
}

.oc-button.shape-pill svg {
  width: 22px;
  height: 22px;
}

.oc-popup {
  position: absolute;
  bottom: 76px;
  right: 0;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  max-width: min(360px, 82vw);
  padding: 0;
  color: var(--oc-ink);
  background: transparent;
  border: none;
  box-shadow: none;
  opacity: 0;
  transform: translateY(10px) scale(0.98);
  pointer-events: none;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.oc-popup-avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--oc-brand), rgba(var(--oc-brand-rgb), 0.6));
  display: grid;
  place-items: center;
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 12px 24px rgba(var(--oc-brand-rgb), 0.25);
  flex: 0 0 auto;
}

.oc-popup-avatar.has-image {
  background-size: cover;
  background-position: center;
  color: transparent;
}

.oc-popup-content {
  position: relative;
  width: min(320px, 78vw);
  min-width: 220px;
  padding: 12px 38px 12px 12px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid var(--oc-border);
  box-shadow: var(--oc-shadow);
  display: grid;
  gap: 6px;
}

.oc-popup-meta {
  font-size: 11px;
  color: var(--oc-muted);
}

.oc-popup-content::after {
  content: "";
  position: absolute;
  bottom: -6px;
  right: 24px;
  width: 12px;
  height: 12px;
  background: rgba(15, 23, 42, 0.92);
  border-right: 1px solid var(--oc-border);
  border-bottom: 1px solid var(--oc-border);
  transform: rotate(45deg);
}

.oc-popup.is-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.oc-popup-message {
  font-size: 13px;
  line-height: 1.5;
}

.oc-popup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.oc-popup-action {
  -webkit-appearance: none;
  appearance: none;
  border: 1px solid rgba(var(--oc-brand-rgb), 0.34);
  background: linear-gradient(145deg, rgba(var(--oc-brand-rgb), 0.28), rgba(var(--oc-brand-rgb), 0.14));
  color: #ffffff;
  border-radius: 999px;
  padding: 9px 14px;
  font-size: 12px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  font-family: inherit;
  white-space: nowrap;
}

#oc-root button[data-quick-reply] {
  all: unset;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  -webkit-appearance: none !important;
  appearance: none !important;
  border: 1px solid rgba(var(--oc-brand-rgb), 0.34) !important;
  background: linear-gradient(145deg, rgba(var(--oc-brand-rgb), 0.28), rgba(var(--oc-brand-rgb), 0.14)) !important;
  color: #ffffff !important;
  border-radius: 999px !important;
  padding: 9px 14px !important;
  font: inherit !important;
  font-size: 12px !important;
  line-height: 1.2 !important;
  font-weight: 700 !important;
  letter-spacing: 0.01em !important;
  cursor: pointer !important;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06) !important;
  white-space: nowrap;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.oc-popup-action:hover,
#oc-root button[data-quick-reply]:hover:not(:disabled) {
  border-color: rgba(var(--oc-brand-rgb), 0.62) !important;
  background: linear-gradient(145deg, rgba(var(--oc-brand-rgb), 0.42), rgba(var(--oc-brand-rgb), 0.24)) !important;
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.24) !important;
}

.oc-popup-action:focus-visible,
#oc-root button[data-quick-reply]:focus-visible {
  outline: none !important;
  border-color: rgba(var(--oc-brand-rgb), 0.92) !important;
  box-shadow: 0 0 0 2px rgba(var(--oc-brand-rgb), 0.26) !important;
}

.oc-inline-popup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 0 2px;
}

.oc-inline-popup-action {
  -webkit-appearance: none;
  appearance: none;
  border: 1px solid rgba(var(--oc-brand-rgb), 0.34);
  background: linear-gradient(145deg, rgba(var(--oc-brand-rgb), 0.26), rgba(var(--oc-brand-rgb), 0.12));
  color: #ffffff;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.oc-inline-popup-action:hover:not(:disabled) {
  border-color: rgba(var(--oc-brand-rgb), 0.6);
  background: linear-gradient(145deg, rgba(var(--oc-brand-rgb), 0.38), rgba(var(--oc-brand-rgb), 0.22));
  transform: translateY(-1px);
  box-shadow: 0 8px 14px rgba(0, 0, 0, 0.24);
}

.oc-inline-popup-action:focus-visible {
  outline: none;
  border-color: rgba(var(--oc-brand-rgb), 0.9);
  box-shadow: 0 0 0 2px rgba(var(--oc-brand-rgb), 0.24);
}

.oc-inline-popup-action:disabled {
  opacity: 0.6;
  cursor: default;
}

.oc-popup-close {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: none;
  background: rgba(148, 163, 184, 0.12);
  color: var(--oc-muted);
  cursor: pointer;
  display: grid;
  place-items: center;
}

.oc-popup-close:hover {
  color: #ffffff;
  background: rgba(148, 163, 184, 0.24);
}

.oc-panel {
  position: absolute;
  bottom: 72px;
  right: 0;
  width: 360px;
  height: 520px;
  background: linear-gradient(160deg, rgba(17, 24, 39, 0.96), rgba(11, 15, 20, 0.98));
  border-radius: var(--oc-radius);
  border: 1px solid var(--oc-border);
  box-shadow: var(--oc-shadow), 0 0 40px rgba(var(--oc-brand-rgb), 0.15);
  backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateY(16px) scale(0.98);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.oc-panel.is-open {
  transform: translateY(0) scale(1);
  opacity: 1;
  pointer-events: auto;
}

.oc-header {
  padding: 16px 18px;
  background: linear-gradient(135deg, rgba(var(--oc-brand-rgb), 0.28), rgba(17, 24, 39, 0.8));
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--oc-border);
  position: relative;
}

.oc-company {
  display: flex;
  gap: 12px;
  align-items: center;
}

.oc-avatar {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--oc-brand), rgba(var(--oc-brand-rgb), 0.6));
  display: grid;
  place-items: center;
  color: #ffffff;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.oc-avatar.has-image {
  background-size: cover;
  background-position: center;
  color: transparent;
}

.oc-title {
  font-weight: 600;
  color: var(--oc-ink);
}

.oc-subtitle {
  font-size: 12px;
  color: var(--oc-muted);
  margin-top: 2px;
}

.oc-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--oc-muted);
  background: rgba(15, 23, 42, 0.6);
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.oc-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #16a34a;
}

.oc-dot.offline {
  background: #f97316;
}

.oc-close {
  border: none;
  background: rgba(15, 23, 42, 0.5);
  width: 32px;
  height: 32px;
  border-radius: 999px;
  font-size: 18px;
  cursor: pointer;
  color: var(--oc-muted);
  display: grid;
  place-items: center;
  transition: background 0.2s ease, color 0.2s ease;
}

.oc-close:hover {
  color: #ffffff;
  background: rgba(148, 163, 184, 0.2);
}

.oc-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.1));
}

.oc-message-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.oc-message-row.visitor {
  justify-content: flex-end;
}

.oc-message-row.agent {
  justify-content: flex-start;
}

.oc-message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: rgba(148, 163, 184, 0.18);
  color: var(--oc-ink);
  font-size: 11px;
  font-weight: 600;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.oc-message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.oc-message {
  max-width: 80%;
  padding: 10px 12px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.4;
  position: relative;
}

.oc-message.agent {
  align-self: flex-start;
  background: rgba(148, 163, 184, 0.12);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: var(--oc-ink);
}

.oc-message.visitor {
  align-self: flex-end;
  background: linear-gradient(135deg, rgba(var(--oc-brand-rgb), 0.95), var(--oc-brand-dark));
  box-shadow: 0 12px 26px rgba(var(--oc-brand-rgb), 0.35);
  color: #ffffff;
}

.oc-message .oc-time {
  display: block;
  font-size: 11px;
  margin-top: 6px;
  opacity: 0.7;
}

.oc-message-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--oc-muted);
  margin-bottom: 6px;
}

.oc-message-tag.ai {
  color: rgba(129, 230, 217, 0.9);
}

.oc-message-tag.agent {
  color: rgba(148, 163, 184, 0.9);
}

.oc-message-text {
  white-space: pre-wrap;
}

.oc-typing-label {
  font-weight: 500;
}

.oc-typing {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--oc-muted);
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.12);
  border: 1px solid rgba(148, 163, 184, 0.2);
  align-self: flex-start;
}

.oc-typing-dots {
  display: inline-flex;
  gap: 3px;
}

.oc-typing-dots span {
  width: 4px;
  height: 4px;
  background: var(--oc-muted);
  border-radius: 999px;
  display: inline-block;
  opacity: 0.4;
  animation: oc-bounce 1s infinite;
}

.oc-typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.oc-typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

.oc-lead {
  border-top: 1px solid var(--oc-border);
  padding: 14px 16px;
  background: rgba(15, 23, 42, 0.7);
}

.oc-lead h4 {
  margin: 0 0 6px 0;
  font-size: 14px;
  color: var(--oc-ink);
}

.oc-lead p {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: var(--oc-muted);
}

.oc-lead form {
  display: grid;
  gap: 8px;
}

.oc-lead input {
  padding: 9px 10px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(11, 15, 20, 0.8);
  color: var(--oc-ink);
  font-size: 13px;
  font-family: inherit;
}

.oc-lead input::placeholder {
  color: rgba(148, 163, 184, 0.7);
}

.oc-lead .oc-lead-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.oc-lead button {
  padding: 8px 12px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-family: inherit;
}

.oc-lead .oc-submit {
  background: linear-gradient(135deg, rgba(var(--oc-brand-rgb), 0.95), var(--oc-brand-dark));
  color: #ffffff;
}

.oc-lead .oc-skip {
  background: rgba(148, 163, 184, 0.08);
  color: var(--oc-muted);
}

.oc-input {
  border-top: 1px solid var(--oc-border);
  padding: 12px;
  display: flex;
  gap: 8px;
  align-items: center;
  background: rgba(11, 15, 20, 0.85);
}

.oc-upload {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.7);
  color: var(--oc-muted);
  cursor: pointer;
  display: grid;
  place-items: center;
}

.oc-upload svg {
  width: 18px;
  height: 18px;
}

.oc-upload:hover {
  color: #ffffff;
  border-color: rgba(var(--oc-brand-rgb), 0.6);
}

.oc-attachment {
  display: flex;
  gap: 10px;
  align-items: center;
}

.oc-attachment-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(148, 163, 184, 0.18);
  display: grid;
  place-items: center;
  color: var(--oc-ink);
  font-size: 14px;
}

.oc-attachment-link {
  color: inherit;
  text-decoration: none;
  font-weight: 600;
  font-size: 13px;
  display: block;
}

.oc-attachment-size {
  font-size: 11px;
  color: var(--oc-muted);
}

.oc-input textarea {
  flex: 1;
  resize: none;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 12px;
  padding: 10px;
  font-size: 14px;
  font-family: inherit;
  height: 44px;
  background: rgba(15, 23, 42, 0.8);
  color: var(--oc-ink);
}

.oc-input textarea::placeholder {
  color: rgba(148, 163, 184, 0.7);
}

.oc-input textarea:focus {
  outline: none;
  border-color: rgba(var(--oc-brand-rgb), 0.6);
  box-shadow: 0 0 0 3px rgba(var(--oc-brand-rgb), 0.2);
}

.oc-input .oc-send {
  border: none;
  background: linear-gradient(135deg, rgba(var(--oc-brand-rgb), 0.95), var(--oc-brand-dark));
  color: #ffffff;
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 0 8px 18px rgba(var(--oc-brand-rgb), 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.oc-input .oc-send:hover {
  box-shadow: 0 12px 22px rgba(var(--oc-brand-rgb), 0.4);
  transform: translateY(-1px);
}

.oc-input .oc-send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.oc-hint {
  font-size: 11px;
  color: var(--oc-muted);
  margin-top: 6px;
}

@keyframes oc-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes oc-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

@media (max-width: 520px) {
  .oc-panel {
    width: min(94vw, 380px);
    height: min(78vh, 560px);
    right: 0;
  }
}
`;

  widget.INLINE_CSS = INLINE_CSS;
})();
