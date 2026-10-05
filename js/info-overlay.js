(() => {
  const DATA_URL = "/content/info.json?v=info-live2";
  const PATH = "/info.html";
  const ROOT_ID = "info-frost-root";

  /** @type {any} */
  let data = null;
  let open = false;
  let previousUrl = "/";
  let built = false;

  const qs = (sel, root = document) => root.querySelector(sel);

  function isInfoHref(href) {
    if (!href) return false;
    try {
      const u = new URL(href, location.origin);
      if (u.origin !== location.origin) return false;
      const path = u.pathname.replace(/\/+$/, "") || "/";
      return path === "/info" || path === "/info.html" || path.endsWith("/info.html");
    } catch {
      return false;
    }
  }

  function ensureRoot() {
    let root = document.getElementById(ROOT_ID);
    if (root) return root;
    root = document.createElement("div");
    root.id = ROOT_ID;
    root.className = "info-frost";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="info-frost__veil" data-info-close tabindex="-1"></div>
      <button class="info-frost__close" type="button" data-info-close aria-label="Close info">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M3 3l8 8M11 3L3 11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="info-frost__stack" role="dialog" aria-modal="true" aria-labelledby="info-frost-title" data-info-sheet>
        <div data-info-body></div>
      </div>
    `;
    document.body.appendChild(root);
    let ptr = null;
    root.addEventListener("pointerdown", (e) => {
      const t = e.target;
      ptr = {
        x: e.clientX,
        y: e.clientY,
        card: !!(t && t.closest && t.closest(".info-frost__card")),
      };
    });
    root.addEventListener("click", (e) => {
      const t = e.target;
      if (!t || !t.closest) return;
      if (t.closest("[data-info-close]")) {
        closeInfo();
        return;
      }
      if (t.closest(".info-frost__card")) return;
      if (ptr && ptr.card) return;
      if (ptr && Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y) > 8) return;
      closeInfo();
    });
    return root;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function contactId(c) {
    const blob = `${c.id || ""} ${c.label || ""} ${c.href || ""}`.toLowerCase();
    if (blob.includes("linkedin")) return "linkedin";
    if (blob.includes("mailto:") || blob.includes("email")) return "email";
    if (blob.includes("instagram")) return "instagram";
    if (blob.includes("are.na") || blob.includes("arena")) return "arena";
    return "link";
  }

  function contactIcon(id) {
    if (id === "email") {
      return `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M4 7.5h16v9H4z"/><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M5 8.2 12 13l7-4.8"/></svg>`;
    }
    if (id === "instagram") {
      return `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="4.5" y="4.5" width="15" height="15" rx="4.2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="16.6" cy="7.4" r="0.9" fill="currentColor"/></svg>`;
    }
    if (id === "arena") {
      return `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="9" cy="12" r="4.1" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="15" cy="12" r="4.1" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
    }
    return `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M7 17 17 7M9 7h8v8"/></svg>`;
  }

  function orbHtml(orb) {
    if (!orb) return "";
    const src = orb.src || orb.remote;
    const alt = escapeHtml(orb.alt || "Andrea Fanelli");
    const fallback = escapeHtml(orb.remote || src);
    return `<div class="info-frost__orb">
      <img src="${escapeHtml(src)}" alt="${alt}" width="72" height="72" decoding="async"${orb.remote ? ` onerror="this.onerror=null;this.src='${fallback}'"` : ""} />
    </div>`;
  }

  function footerHtml(contacts) {
    const items = (contacts || []).filter((c) => {
      const id = contactId(c);
      return id !== "linkedin" && (id === "email" || id === "instagram" || id === "arena");
    });
    if (!items.length) return "";
    return `<nav class="info-frost__footer" aria-label="Contacts">
      ${items
        .map((c) => {
          const id = contactId(c);
          const label = escapeHtml(c.label || id);
          const href = escapeHtml(c.href || "#");
          const external = href.startsWith("http");
          return `<a class="info-frost__footer-link" href="${href}"${external ? ' target="_blank" rel="noreferrer"' : ""}>${contactIcon(id)}<span>${label}</span></a>`;
        })
        .join("")}
    </nav>`;
  }

  function card(inner, extraClass = "") {
    return `<section class="info-frost__card ${extraClass}">
      ${inner}
    </section>`;
  }

  function render(body, d) {
    const orb = d.orb || (d.photos && d.photos[0]) || null;
    const philo = (d.philosophy && d.philosophy.points) || [];
    const skills = (d.skills && d.skills.groups) || [];
    const contacts = (d.contacts && d.contacts.items) || [];

    const about = `
      ${orbHtml(orb)}
      <h1 class="info-frost__greeting" id="info-frost-title">${escapeHtml(d.greeting || d.name || "Info")}</h1>
      ${d.basedIn ? `<p class="info-frost__meta">${escapeHtml(d.basedIn)}</p>` : ""}
      ${d.intro ? `<p class="info-frost__intro">${escapeHtml(d.intro)}</p>` : ""}
    `;

    const philosophy = philo.map((p) => `<p class="info-frost__point">${escapeHtml(p)}</p>`).join("");

    const skillsInner = `
      <div class="info-frost__skills">
        ${skills
          .map(
            (g) => `
          <div>
            <p class="info-frost__skill-label">${escapeHtml(g.label)}</p>
            <ul class="info-frost__skill-list">
              ${(g.items || []).map((i) => `<li>${escapeHtml(i)}</li>`).join("")}
            </ul>
          </div>`
          )
          .join("")}
      </div>
    `;

    const lastInner = `
      ${d.tagline ? `<p class="info-frost__tagline">${escapeHtml(d.tagline)}</p>` : ""}
      ${footerHtml(contacts)}
    `;

    body.innerHTML = [
      card(about, "info-frost__card--about"),
      card(philosophy),
      card(skillsInner),
      card(lastInner, "info-frost__card--last"),
    ].join("");
  }

  async function loadData() {
    if (data) return data;
    const res = await fetch(DATA_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error("info.json missing");
    data = await res.json();
    return data;
  }

  async function build() {
    if (built) return ensureRoot();
    const root = ensureRoot();
    const d = await loadData();
    render(qs("[data-info-body]", root), d);
    built = true;
    return root;
  }

  async function openInfo({ push = true } = {}) {
    const root = await build();
    if (open) return;
    if (push && !isInfoHref(location.href)) {
      previousUrl = location.pathname + location.search + location.hash;
      history.pushState({ afInfo: true }, "", PATH);
    }
    open = true;
    document.body.classList.add("is-info-open");
    root.classList.add("is-open");
    root.setAttribute("aria-hidden", "false");
    const closeBtn = qs("[data-info-close].info-frost__close", root);
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closeInfo({ historyNav = true } = {}) {
    const wasOpen = open;
    open = false;
    const root = document.getElementById(ROOT_ID);
    const active = document.activeElement;
    if (root) {
      root.classList.remove("is-open");
      root.setAttribute("aria-hidden", "true");
      if (active && root.contains(active)) active.blur();
    }
    document.body.classList.remove("is-info-open");
    if (!wasOpen) return;
    if (historyNav && isInfoHref(location.href)) {
      const fallback = previousUrl && !isInfoHref(previousUrl) ? previousUrl : "/";
      history.pushState({ afInfo: false }, "", fallback);
    }
    window.Site?.markDock?.();
    const dockToggle = document.querySelector(".dock-toggle");
    if (dockToggle) {
      dockToggle.focus({ preventScroll: true });
      dockToggle.blur();
    }
  }

  function onDocClick(e) {
    const a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
    if (a.closest(".info-frost__footer")) return;
    if (!isInfoHref(a.getAttribute("href"))) return;
    e.preventDefault();
    e.stopPropagation();
    openInfo({ push: true });
  }

  function onKey(e) {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      closeInfo();
    }
  }

  function onPop() {
    if (isInfoHref(location.href)) openInfo({ push: false });
    else closeInfo({ historyNav: false });
  }

  async function init() {
    ensureRoot();
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);

    const page = document.body && document.body.dataset.page;
    if (page === "info" || isInfoHref(location.href)) {
      previousUrl = document.referrer && document.referrer.includes(location.host)
        ? new URL(document.referrer).pathname
        : "/";
      await openInfo({ push: false });
      if (!isInfoHref(location.href)) {
        history.replaceState({ afInfo: true }, "", PATH);
      }
    }

    window.AFInfo = { open: openInfo, close: closeInfo };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
