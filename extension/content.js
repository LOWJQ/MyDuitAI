(function initMyDuitAI() {
  const BRAND_BLUE = "#1652F0";
  const OVERLAY_Z_INDEX = "2147483647";
  const TOAST_Z_INDEX = "2147483647";
  const FORECAST_URL = "http://localhost:5173";
  const STORAGE_KEY = "financialState";
  const TRIGGER_TEXT_REGEX = /spaylater/i;

  const defaultState = {
    userName: "Aisha",
    score: 48,
    zone: "Danger",
    bnplRatio: 38,
    peerAvgRatio: 22,
    monthlyBnplBurden: 456,
    projectedDecemberCash: -10,
    projectedScore: 41,
    activePlans: 4,
    monthlyIncome: 3000,
  };

  let financialState = { ...defaultState };
  let overlayDisplayed = false;
  let currentUrl = window.location.href;

  loadFinancialState();
  injectFloatingBadge();
  bootObservers();

  function loadFinancialState() {
    if (!chrome?.storage?.local) {
      return;
    }

    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (chrome.runtime?.lastError) {
        return;
      }

      if (result[STORAGE_KEY]) {
        financialState = { ...defaultState, ...result[STORAGE_KEY] };
      }
    });
  }

  function bootObservers() {
    maybeTriggerOverlay("initial-load");

    document.addEventListener(
      "click",
      (event) => {
        if (overlayDisplayed) {
          return;
        }

        const clickedText = getTextFromEvent(event);
        if (TRIGGER_TEXT_REGEX.test(clickedText)) {
          maybeTriggerOverlay("spaylater-click");
        }
      },
      true,
    );

    const observer = new MutationObserver(() => {
      maybeTriggerOverlay("dom-mutation");
      refreshBadgeState();
      detectUrlChange();
    });

    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });

    window.addEventListener("load", () => maybeTriggerOverlay("window-load"), { once: true });
    window.addEventListener("popstate", detectUrlChange);
    window.addEventListener("hashchange", detectUrlChange);

    setInterval(detectUrlChange, 1000);
  }

  function detectUrlChange() {
    if (window.location.href === currentUrl) {
      return;
    }

    currentUrl = window.location.href;
    maybeTriggerOverlay("url-change");
  }

  function maybeTriggerOverlay(reason) {
    if (overlayDisplayed) {
      return;
    }

    if (!isCheckoutUrl()) {
      return;
    }

    if (!pageContainsSpayLater()) {
      return;
    }

    showOverlay(reason);
  }

  function isCheckoutUrl() {
    return window.location.href.toLowerCase().includes("checkout");
  }

  function pageContainsSpayLater() {
    return documentContainsMatch(document.documentElement || document.body, TRIGGER_TEXT_REGEX);
  }

  function documentContainsMatch(root, regex) {
    if (!root) {
      return false;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node = walker.currentNode;

    while (node) {
      if (node.nodeType === Node.TEXT_NODE && regex.test(node.textContent || "")) {
        return true;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;
        if (regex.test(element.innerText || element.textContent || "")) {
          return true;
        }

        if (element.shadowRoot && documentContainsMatch(element.shadowRoot, regex)) {
          return true;
        }
      }

      node = walker.nextNode();
    }

    return false;
  }

  function getTextFromEvent(event) {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    const pieces = [];

    path.forEach((node) => {
      if (!node) {
        return;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        pieces.push(node.textContent || "");
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        pieces.push(node.innerText || node.textContent || "");
      }
    });

    return pieces.join(" ");
  }

  function injectFloatingBadge() {
    if (document.getElementById("myduitai-floating-badge")) {
      return;
    }

    const badge = document.createElement("div");
    badge.id = "myduitai-floating-badge";
    badge.textContent = "MyDuitAI Active";
    badge.setAttribute(
      "style",
      [
        "position:fixed",
        "right:20px",
        "bottom:20px",
        "z-index:2147483646",
        "padding:10px 14px",
        "border-radius:999px",
        "background:#1652F0",
        "color:#ffffff",
        "font:600 13px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        "box-shadow:0 16px 40px rgba(22,82,240,0.3)",
        "pointer-events:none",
        "letter-spacing:0.01em",
      ].join(";"),
    );

    (document.body || document.documentElement).appendChild(badge);
  }

  function refreshBadgeState() {
    const badge = document.getElementById("myduitai-floating-badge");
    if (!badge) {
      injectFloatingBadge();
      return;
    }

    badge.style.opacity = isCheckoutUrl() ? "1" : "0.92";
  }

  function showOverlay(reason) {
    overlayDisplayed = true;

    const existing = document.getElementById("myduitai-overlay-host");
    if (existing) {
      existing.remove();
    }

    const host = document.createElement("div");
    host.id = "myduitai-overlay-host";
    host.setAttribute("data-trigger-reason", reason);
    host.style.position = "fixed";
    host.style.inset = "0";
    host.style.zIndex = OVERLAY_Z_INDEX;

    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host {
          all: initial;
        }

        .myduitai-backdrop {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(0, 0, 0, 0.6);
          animation: myduitai-fade-in 180ms ease-out;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #111827;
        }

        .myduitai-card {
          width: min(100%, 480px);
          max-width: 480px;
          border-radius: 24px;
          padding: 32px;
          background: #ffffff;
          box-shadow: 0 30px 80px rgba(17, 24, 39, 0.28);
          animation: myduitai-scale-in 220ms ease-out;
        }

        .myduitai-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: #fff1f2;
          color: #b42318;
          font-size: 13px;
          font-weight: 700;
        }

        .myduitai-title {
          margin: 18px 0 8px;
          font-size: 31px;
          line-height: 1.05;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .myduitai-subtitle {
          margin: 0 0 22px;
          color: #4b5563;
          font-size: 14px;
          line-height: 1.6;
        }

        .myduitai-hero {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
          padding: 20px 24px;
          border: 1px solid #FECACA;
          border-radius: 20px;
          background: linear-gradient(135deg, #FFF0F0 0%, #FFF8F8 100%);
        }

        .myduitai-hero-label {
          margin: 0;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: #9CA3AF;
          text-transform: uppercase;
        }

        .myduitai-hero-score {
          margin: 10px 0 0;
          font-size: 64px;
          font-weight: 800;
          color: #C53030;
          letter-spacing: -0.04em;
          line-height: 1;
        }

        .myduitai-hero-zone {
          margin: 4px 0 0;
          font-size: 13px;
          font-weight: 700;
          color: #C53030;
        }

        .myduitai-danger-track {
          position: relative;
          width: 12px;
          height: 80px;
          border-radius: 6px;
          background: #F3F4F6;
          overflow: hidden;
          align-self: center;
          flex-shrink: 0;
        }

        .myduitai-danger-fill {
          position: absolute;
          bottom: 0;
          width: 100%;
          border-radius: 6px;
          background: linear-gradient(to top, #C53030, #F87171);
        }

        .myduitai-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }

        .myduitai-metric {
          border: 1px solid #f3f4f6;
          border-radius: 18px;
          padding: 16px;
          background: #fcfcfd;
        }

        .myduitai-metric-label {
          margin: 0 0 8px;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.4;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
        }

        .myduitai-metric-value {
          margin: 0;
          color: #c81e1e;
          font-size: 26px;
          line-height: 1.05;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .myduitai-metric-note {
          margin: 8px 0 0;
          color: #b42318;
          font-size: 12px;
          line-height: 1.45;
          font-weight: 700;
        }

        .myduitai-callout {
          margin: 0 0 20px;
          border: 1px solid #fde68a;
          border-radius: 18px;
          padding: 16px;
          background: #fff7d6;
          color: #7c5600;
          font-size: 14px;
          line-height: 1.6;
          font-weight: 600;
        }

        .myduitai-peer-box {
          border: 1px solid #F3F4F6;
          border-radius: 16px;
          padding: 14px 16px;
          margin-bottom: 16px;
          background: #FAFAFA;
        }

        .myduitai-peer-label {
          margin: 0 0 10px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #9CA3AF;
        }

        .myduitai-peer-row {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }

        .myduitai-peer-row:last-child {
          margin-bottom: 0;
        }

        .myduitai-peer-name {
          width: 80px;
          font-size: 12px;
          font-weight: 600;
          color: #111827;
        }

        .myduitai-peer-track {
          flex: 1;
          height: 8px;
          border-radius: 4px;
          background: #F3F4F6;
          margin: 0 10px;
          position: relative;
          overflow: hidden;
        }

        .myduitai-peer-fill {
          height: 100%;
          border-radius: 4px;
        }

        .myduitai-peer-value {
          width: 36px;
          text-align: right;
          font-size: 12px;
          font-weight: 700;
        }

        .myduitai-button {
          width: 100%;
          border: 0;
          border-radius: 16px;
          padding: 16px 18px;
          cursor: pointer;
          font-size: 16px;
          line-height: 1.2;
          font-weight: 700;
          transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
        }

        .myduitai-button:hover {
          transform: translateY(-1px);
        }

        .myduitai-button-primary {
          background: ${BRAND_BLUE};
          color: #ffffff;
          box-shadow: 0 18px 40px rgba(22, 82, 240, 0.28);
        }

        .myduitai-button-secondary {
          margin-top: 12px;
          border: 1.5px solid ${BRAND_BLUE};
          background: #ffffff;
          color: ${BRAND_BLUE};
        }

        .myduitai-button-caption {
          margin: 8px 0 0;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.4;
          font-weight: 600;
        }

        .myduitai-link {
          display: block;
          margin-top: 16px;
          border: 0;
          background: transparent;
          color: #6b7280;
          text-align: center;
          font-size: 13px;
          line-height: 1.5;
          font-weight: 700;
          cursor: pointer;
        }

        .myduitai-footer {
          margin-top: 20px;
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
          line-height: 1.5;
          font-weight: 600;
        }

        .myduitai-urgency {
          margin-top: 14px;
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          color: #9ca3af;
        }

        .myduitai-confirm {
          display: none;
        }

        .myduitai-confirm.is-visible {
          display: block;
        }

        .myduitai-main.is-hidden {
          display: none;
        }

        .myduitai-confirm-card {
          border: 1px solid #f3f4f6;
          border-radius: 20px;
          padding: 20px;
          background: #fafafa;
        }

        .myduitai-confirm-title {
          margin: 0;
          font-size: 22px;
          line-height: 1.2;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .myduitai-confirm-text {
          margin: 10px 0 0;
          color: #4b5563;
          font-size: 14px;
          line-height: 1.6;
        }

        .myduitai-confirm-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .myduitai-confirm-cancel {
          background: #ffffff;
          color: #111827;
          border: 1px solid #d1d5db;
        }

        .myduitai-confirm-proceed {
          background: #111827;
          color: #ffffff;
        }

        @keyframes myduitai-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes myduitai-scale-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (max-width: 540px) {
          .myduitai-backdrop {
            align-items: flex-end;
            padding: 16px;
          }

          .myduitai-card {
            width: 100%;
            padding: 24px;
            border-radius: 24px 24px 16px 16px;
          }

          .myduitai-hero {
            padding: 18px;
          }

          .myduitai-hero-score {
            font-size: 52px;
          }

          .myduitai-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
      <div class="myduitai-backdrop" role="presentation">
        <div class="myduitai-card" role="dialog" aria-modal="true" aria-labelledby="myduitai-title">
          <div class="myduitai-main">
            <div class="myduitai-badge">? MyDuitAI Intervention</div>
            <h1 class="myduitai-title" id="myduitai-title">Wait before you proceed</h1>
            <p class="myduitai-subtitle">This checkout pattern looks risky based on your current BNPL load and projected cash flow.</p>

            <div class="myduitai-hero">
              <div>
                <p class="myduitai-hero-label">FINANCIAL STRESS SCORE</p>
                <p class="myduitai-hero-score">${escapeHtml(String(financialState.score))}</p>
                <p class="myduitai-hero-zone">${escapeHtml(financialState.zone)} Zone</p>
              </div>
              <div class="myduitai-danger-track" aria-hidden="true">
                <div class="myduitai-danger-fill" style="height:${escapeHtml(String(financialState.score))}%"></div>
              </div>
            </div>

            <div class="myduitai-grid">
              <div class="myduitai-metric">
                <p class="myduitai-metric-label">May cash after this</p>
                <p class="myduitai-metric-value">RM ${escapeHtml(String(financialState.projectedDecemberCash))}</p>
              </div>
              <div class="myduitai-metric">
                <p class="myduitai-metric-label">Score after purchase</p>
                <p class="myduitai-metric-value">${escapeHtml(String(financialState.projectedScore))}</p>
                <p class="myduitai-metric-note">was ${escapeHtml(String(financialState.score))}</p>
              </div>
            </div>

            <div class="myduitai-callout" style="background:#FFF7D6;border-color:#FDE68A;color:#7C5600;">
              ? ${escapeHtml(financialState.userName)}, your BNPL is already ${escapeHtml(String(financialState.bnplRatio))}% of your income — peers your age average ${escapeHtml(String(financialState.peerAvgRatio))}%. This purchase leaves you RM${escapeHtml(String(financialState.projectedDecemberCash))} in May.
            </div>

            <div class="myduitai-peer-box">
              <p class="myduitai-peer-label">YOUR BNPL VS PEERS</p>
              <div class="myduitai-peer-row">
                <span class="myduitai-peer-name" style="color:#1652F0;">Peer avg</span>
                <div class="myduitai-peer-track">
                  <div class="myduitai-peer-fill" style="width:${escapeHtml(String(financialState.peerAvgRatio * 2))}%;background:#1652F0;"></div>
                </div>
                <span class="myduitai-peer-value" style="color:#1652F0;">${escapeHtml(String(financialState.peerAvgRatio))}%</span>
              </div>
              <div class="myduitai-peer-row">
                <span class="myduitai-peer-name" style="color:#C53030;">You</span>
                <div class="myduitai-peer-track">
                  <div class="myduitai-peer-fill" style="width:${escapeHtml(String(financialState.bnplRatio * 2))}%;background:#C53030;"></div>
                </div>
                <span class="myduitai-peer-value" style="color:#C53030;">${escapeHtml(String(financialState.bnplRatio))}%</span>
              </div>
            </div>

            <button class="myduitai-button myduitai-button-primary" id="myduitai-pause-button" type="button">? Pause — Think It Over</button>
            <p class="myduitai-button-caption">Recommended by MyDuitAI · Safer default</p>
            <button class="myduitai-button myduitai-button-secondary" id="myduitai-forecast-button" type="button">?? See What Happens Next</button>
            <button class="myduitai-link" id="myduitai-proceed-link" type="button">I understand the risk — proceed anyway</button>
            <p class="myduitai-urgency">?? MyDuitAI pauses by default to protect you</p>
            <p class="myduitai-footer">MyDuitAI · Protecting Malaysian youth from BNPL debt</p>
          </div>

          <div class="myduitai-confirm" id="myduitai-confirm-panel">
            <div class="myduitai-confirm-card">
              <h2 class="myduitai-confirm-title">Are you sure? This adds RM166/month for 3 months.</h2>
              <p class="myduitai-confirm-text">A short pause now could reduce financial strain later. You can still continue if you understand the impact.</p>
              <div class="myduitai-confirm-actions">
                <button class="myduitai-button myduitai-confirm-cancel" id="myduitai-cancel-confirm" type="button">Cancel</button>
                <button class="myduitai-button myduitai-confirm-proceed" id="myduitai-confirm-proceed" type="button">Confirm</button>
              </div>
            </div>
            <p class="myduitai-footer">MyDuitAI · Protecting Malaysian youth from BNPL debt</p>
          </div>
        </div>
      </div>
    `;

    (document.body || document.documentElement).appendChild(host);

    const mainPanel = shadow.querySelector(".myduitai-main");
    const confirmPanel = shadow.getElementById("myduitai-confirm-panel");

    shadow.getElementById("myduitai-pause-button")?.addEventListener("click", () => {
      closeOverlay();
      showToast("Good call. Come back tomorrow with a clear head.");
    });

    shadow.getElementById("myduitai-forecast-button")?.addEventListener("click", () => {
      window.open(FORECAST_URL, "_blank", "noopener,noreferrer");
    });

    shadow.getElementById("myduitai-proceed-link")?.addEventListener("click", () => {
      mainPanel?.classList.add("is-hidden");
      confirmPanel?.classList.add("is-visible");
    });

    shadow.getElementById("myduitai-cancel-confirm")?.addEventListener("click", () => {
      confirmPanel?.classList.remove("is-visible");
      mainPanel?.classList.remove("is-hidden");
    });

    shadow.getElementById("myduitai-confirm-proceed")?.addEventListener("click", () => {
      closeOverlay();
    });

    const escListener = (event) => {
      if (event.key === "Escape") {
        closeOverlay();
      }
    };

    window.addEventListener("keydown", escListener, true);
    host.dataset.escListenerAttached = "true";
    host._myduitaiEscListener = escListener;
  }

  function closeOverlay() {
    const host = document.getElementById("myduitai-overlay-host");
    if (!host) {
      return;
    }

    if (host._myduitaiEscListener) {
      window.removeEventListener("keydown", host._myduitaiEscListener, true);
    }

    host.remove();
  }

  function showToast(message) {
    const existingToast = document.getElementById("myduitai-toast");
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement("div");
    toast.id = "myduitai-toast";
    toast.textContent = message;
    toast.setAttribute(
      "style",
      [
        "position:fixed",
        "left:50%",
        "bottom:32px",
        "transform:translateX(-50%)",
        "z-index:" + TOAST_Z_INDEX,
        "padding:14px 18px",
        "border-radius:999px",
        "background:#16a34a",
        "color:#ffffff",
        "font:700 14px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        "box-shadow:0 18px 40px rgba(22,163,74,0.28)",
      ].join(";"),
    );

    (document.body || document.documentElement).appendChild(toast);

    window.setTimeout(() => {
      toast.remove();
    }, 3200);
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
})();

