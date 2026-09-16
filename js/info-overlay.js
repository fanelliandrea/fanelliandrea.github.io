(() => {
  const DATA_URL = "/content/info.json";
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
    root.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.closest && t.closest("[data-info-close]")) closeInfo();
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

  function orbHtml(orb) {
    if (!orb) return "";
    const src = orb.src || orb.remote;
    const alt = escapeHtml(orb.alt || "Andrea Fanelli");
    const fallback = escapeHtml(orb.remote || src);
    return `<div class="info-frost__orb" aria-hidden="${orb.alt ? "false" : "true"}">
      <span class="info-frost__orb-glow"></span>
      <img src="${escapeHtml(src)}" alt="${alt}" width="72" height="72" decoding="async" onerror="this.onerror=null;this.src='${fallback}'" />
    </div>`;
  }

  function card(kicker, inner, extraClass = "") {
    return `<section class="info-frost__card ${extraClass}">
      <p class="info-frost__kicker">${escapeHtml(kicker)}</p>
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

    const philosophy = `
      <h2 class="info-frost__section-title">${escapeHtml((d.philosophy && d.philosophy.title) || "Philosophy")}</h2>
      ${philo.map((p) => `<p class="info-frost__point">${escapeHtml(p)}</p>`).join("")}
    `;

    const skillsInner = `
      <h2 class="info-frost__section-title">${escapeHtml((d.skills && d.skills.title) || "Skills")}</h2>
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
      ${d.tagline ? `<p class="info-frost__tagline">${escapeHtml(d.tagline)}</p>` : ""}
    `;

    const contactsInner = `
      <h2 class="info-frost__section-title">${escapeHtml((d.contacts && d.contacts.title) || "Contacts")}</h2>
      <dl class="info-frost__contacts">
        ${contacts
          .map(
            (c) => `
          <div class="info-frost__contact">
            <dt>${escapeHtml(c.label)}</dt>
            <dd><a href="${escapeHtml(c.href)}">${escapeHtml(c.value || c.label)}</a></dd>
          </div>`
          )
          .join("")}
      </dl>
    `;

    body.innerHTML = [
      card("info", about, "info-frost__card--about"),
      card("philosophy", philosophy),
      card("skills", skillsInner),
      card("contacts", contactsInner, "info-frost__card--last"),
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
    if (!open) return;
    open = false;
    const root = document.getElementById(ROOT_ID);
    if (root) {
      root.classList.remove("is-open");
      root.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("is-info-open");
    if (historyNav && isInfoHref(location.href)) {
      const fallback = previousUrl && !isInfoHref(previousUrl) ? previousUrl : "/";
      history.pushState({ afInfo: false }, "", fallback);
    }
    if (document.body.dataset.page === "info" && !isInfoHref(location.href)) {
      // stay on info shell until SPA/nav moves away
    }
  }

  function onDocClick(e) {
    const a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
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

    // Patch SPA navigations that swap main: keep intercepting Info
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

    // Expose for debugging / site.js hooks
    window.AFInfo = { open: openInfo, close: closeInfo };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
