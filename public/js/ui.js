import { store } from "./store.js";
import { firebaseReady, cloudinaryReady, cloudinaryConfig, SERVICE_CATEGORIES } from "./config.js";

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const catName = (id) => (SERVICE_CATEGORIES.find((c) => c.id === id)?.name || id);
export const catIcon = (id) => (SERVICE_CATEGORIES.find((c) => c.id === id)?.icon || "bi-tools");
export const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const money = (n) => "$" + Number(n || 0).toFixed(0);
export function stars(rating, size = "") {
  const r = Number(rating) || 0;
  let out = "";
  for (let i = 1; i <= 5; i++) {
    if (r >= i) out += '<i class="bi bi-star-fill"></i>';
    else if (r >= i - 0.5) out += '<i class="bi bi-star-half"></i>';
    else out += '<i class="bi bi-star"></i>';
  }
  return `<span class="rating ${size}">${out}</span>`;
}

// ---------------- Toast ----------------
let toastRoot;
export function toast(message, type = "") {
  if (!toastRoot) {
    toastRoot = document.createElement("div");
    toastRoot.className = "toast-stack";
    document.body.appendChild(toastRoot);
  }
  const el = document.createElement("div");
  el.className = "toast-msg " + type;
  el.textContent = message;
  toastRoot.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity .3s, transform .3s";
    el.style.opacity = "0";
    el.style.transform = "translateX(20px)";
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

// ---------------- Navbar ----------------
export async function mountChrome(active = "") {
  const header = document.createElement("div");

  const banner = "";

  header.innerHTML = `${banner}
  <nav class="nav-shell">
    <div class="container-tight d-flex align-items-center justify-content-between py-3">
      <a class="brand-logo" href="index.html">
        <span class="mark"><i class="bi bi-tools"></i></span> QuickServe
      </a>
      <button class="navbar-toggler d-lg-none" type="button" aria-controls="quickserveNav" aria-expanded="false" aria-label="Open navigation">
        <i class="bi bi-list" aria-hidden="true"></i>
      </button>
      <div class="offcanvas offcanvas-end nav-drawer" tabindex="-1" id="quickserveNav" aria-labelledby="quickserveNavTitle">
        <div class="offcanvas-header">
          <h5 class="offcanvas-title" id="quickserveNavTitle">QuickServe menu</h5>
          <button type="button" class="btn-close" aria-label="Close navigation"></button>
        </div>
        <div class="offcanvas-body">
          <div class="d-flex flex-column flex-lg-row align-items-start align-items-lg-center gap-2 gap-lg-4">
            <a class="nav-link" data-bs-dismiss="offcanvas" href="index.html#services">Browse Services</a>
            <a class="nav-link" data-bs-dismiss="offcanvas" href="index.html#how">How it works</a>
            <a class="nav-link" data-bs-dismiss="offcanvas" href="index.html#featured">Top Rated</a>
          </div>
          <div class="d-flex align-items-center gap-2 mt-3 mt-lg-0 ms-lg-4" id="navAuth"></div>
        </div>
      </div>
    </div>
  </nav>`;
  document.body.prepend(header);

  const drawer = $("#quickserveNav", header);
  const toggle = $(".navbar-toggler", header);
  const closeDrawer = () => {
    drawer.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };
  toggle.addEventListener("click", () => {
    const isOpen = drawer.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
  $(".btn-close", drawer).addEventListener("click", closeDrawer);
  $$('[data-bs-dismiss="offcanvas"]', drawer).forEach((link) => link.addEventListener("click", closeDrawer));

  const back = await store();
  const navAuth = $("#navAuth", header);
  back.onAuth((user) => {
    if (!user) {
      navAuth.innerHTML = `
        <a class="btn btn-ghost" data-bs-dismiss="offcanvas" href="auth.html">Log in</a>
        <a class="btn btn-brand" href="auth.html?mode=register">Get started</a>`;
    } else {
      const dash = user.role === "provider" ? "provider-dashboard.html" : "dashboard.html";
      const initial = (user.name || user.email || "U").charAt(0).toUpperCase();
      const av = user.photoURL
        ? `<img src="${esc(user.photoURL)}" class="avatar" alt="">`
        : `<span class="avatar d-inline-grid" style="place-items:center;background:var(--brand-soft);color:var(--brand);font-weight:800;">${initial}</span>`;
      navAuth.innerHTML = `
        <a class="btn btn-outline-ink btn-sm" data-bs-dismiss="offcanvas" href="${dash}">
          <i class="bi bi-grid-1x2 me-1"></i>${user.role === "provider" ? "Provider" : "My"} Dashboard
        </a>
        <div class="dropdown">
          <a href="#" class="d-inline-flex align-items-center gap-2 text-decoration-none" data-bs-toggle="dropdown">
            ${av}
          </a>
          <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2" style="border-radius:14px;">
            <li class="px-3 py-2"><div class="fw-bold">${esc(user.name || "User")}</div><div class="small text-muted-2">${esc(user.email)}</div></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="${dash}"><i class="bi bi-grid-1x2 me-2"></i>Dashboard</a></li>
            <li><a class="dropdown-item text-danger" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Log out</a></li>
          </ul>
        </div>`;
      const lo = $("#logoutBtn", navAuth);
      lo && lo.addEventListener("click", async (e) => {
        e.preventDefault();
        await back.logout();
        toast("Signed out", "ok");
        setTimeout(() => (location.href = "index.html"), 500);
      });
    }
  });
}

export function mountFooter() {
  const f = document.createElement("footer");
  f.className = "footer";
  f.innerHTML = `
    <div class="container-tight">
      <div class="row g-4">
        <div class="col-lg-4">
          <a class="brand-logo mb-3 d-inline-flex" href="index.html"><span class="mark"><i class="bi bi-tools"></i></span> QuickServe</a>
          <p class="text-secondary" style="max-width:320px;">Book trusted local professionals for your home in minutes. Vetted providers, transparent pricing, real reviews.</p>
        </div>
        <div class="col-6 col-lg-2">
          <h6 class="text-white mb-3">Company</h6>
          <ul class="list-unstyled d-flex flex-column gap-2 small">
            <li><a href="index.html#how">How it works</a></li>
            <li><a href="index.html#featured">Top rated</a></li>
            <li><a href="auth.html?mode=register">Become a provider</a></li>
          </ul>
        </div>
        <div class="col-6 col-lg-2">
          <h6 class="text-white mb-3">Services</h6>
          <ul class="list-unstyled d-flex flex-column gap-2 small">
            ${SERVICE_CATEGORIES.slice(0, 4).map((c) => `<li><a href="index.html#services">${c.name}</a></li>`).join("")}
          </ul>
        </div>
        <div class="col-lg-4">
          <h6 class="text-white mb-3">Stay in the loop</h6>
          <p class="text-secondary small">Get new provider highlights and offers.</p>
          <form class="d-flex gap-2" onsubmit="return false;">
            <input type="email" class="form-control" placeholder="you@email.com">
            <button class="btn btn-brand">Subscribe</button>
          </form>
        </div>
      </div>
      <hr class="my-4" style="border-color:rgba(255,255,255,.12)">
      <div class="d-flex flex-column flex-md-row justify-content-between gap-2 small text-secondary">
        <span>© ${new Date().getFullYear()} QuickServe. All rights reserved.</span>
        <span>Built with HTML, Bootstrap, Firebase, Cloudinary & GSAP.</span>
      </div>
    </div>`;
  document.body.appendChild(f);
}

// ---------------- Cloudinary upload ----------------
export async function uploadImage(file) {
  if (!cloudinaryReady) {
    // Demo fallback: return a local object URL / data URL so previews still work.
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", cloudinaryConfig.uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
    method: "POST", body: form,
  });
  if (!res.ok) throw new Error("Image upload failed");
  const data = await res.json();
  return data.secure_url;
}

// ---------------- Auth guard ----------------
export async function requireAuth(role) {
  const back = await store();
  return new Promise((resolve) => {
    let settled = false;
    back.onAuth((user) => {
      if (settled) return;
      settled = true;
      if (!user) {
        location.href = "auth.html?redirect=" + encodeURIComponent(location.pathname);
      } else if (role && user.role !== role) {
        toast("You don't have access to that page.", "err");
        setTimeout(() => (location.href = user.role === "provider" ? "provider-dashboard.html" : "dashboard.html"), 800);
      } else {
        resolve({ user, back });
      }
    });
  });
}

export function fmtDate(d) {
  try { return new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }
  catch { return d; }
}
