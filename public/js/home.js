import { store } from "./store.js";
import { SERVICE_CATEGORIES } from "./config.js";
import {
  $, $$, mountChrome, mountFooter, stars, money, catName, catIcon, esc,
} from "./ui.js";

const state = { providers: [], category: "", location: "", q: "", sort: "rating" };

const HOW_STEPS = [
  { icon: "bi-search", title: "Search & compare", text: "Browse vetted local pros, compare ratings, prices and experience side by side." },
  { icon: "bi-calendar-check", title: "Book instantly", text: "Pick a date and describe your job. Send a request in under a minute." },
  { icon: "bi-emoji-smile", title: "Relax & review", text: "Track progress in your dashboard, then rate your pro when the job's done." },
];

await mountChrome("home");

function renderCategories() {
  const strip = $("#categoryStrip");
  strip.innerHTML = SERVICE_CATEGORIES.map((c) => `
    <div class="col-4 col-md-2">
      <button class="w-100 border-0 bg-transparent text-center py-2 cat-btn" data-cat="${c.id}" style="cursor:pointer">
        <span class="feature-icon mx-auto mb-2"><i class="bi ${c.icon}" style="font-size:1.3rem"></i></span>
        <div class="fw-semibold" style="font-size:.9rem">${c.name}</div>
      </button>
    </div>`).join("");
  $$(".cat-btn", strip).forEach((b) =>
    b.addEventListener("click", () => {
      state.category = state.category === b.dataset.cat ? "" : b.dataset.cat;
      syncChips();
      applyFilters();
      document.getElementById("services").scrollIntoView({ behavior: "smooth" });
    }));
}

function renderChips() {
  const row = $("#chipRow");
  row.innerHTML =
    `<button class="chip" data-cat="">All</button>` +
    SERVICE_CATEGORIES.map((c) => `<button class="chip" data-cat="${c.id}"><i class="bi ${c.icon} me-1"></i>${c.name}</button>`).join("");
  $$(".chip", row).forEach((chip) =>
    chip.addEventListener("click", () => {
      state.category = chip.dataset.cat;
      syncChips();
      applyFilters();
    }));
  syncChips();
}
function syncChips() {
  $$("#chipRow .chip").forEach((c) => c.classList.toggle("active", c.dataset.cat === state.category));
}

function renderHow() {
  $("#howGrid").innerHTML = HOW_STEPS.map((s, i) => `
    <div class="col-md-4" data-how>
      <div class="surface p-4 h-100">
        <div class="d-flex align-items-center gap-3 mb-3">
          <span class="feature-icon"><i class="bi ${s.icon}" style="font-size:1.3rem"></i></span>
          <span class="display" style="font-weight:800;font-size:1.6rem;color:var(--border)">0${i + 1}</span>
        </div>
        <h5 class="fw-bold">${s.title}</h5>
        <p class="text-muted-2 mb-0">${s.text}</p>
      </div>
    </div>`).join("");
}

function providerCard(p) {
  return `
  <div class="col-sm-6 col-lg-4" data-card>
    <a class="text-decoration-none provider-card d-block" href="provider.html?id=${encodeURIComponent(p.id)}">
      <div class="thumb"><img src="${esc(p.photoURL || "images/og-cover.png")}" alt="${esc(p.name)}" loading="lazy"></div>
      <div class="body">
        <span class="cat-tag"><i class="bi ${catIcon(p.category)} me-1"></i>${catName(p.category)}</span>
        <h5 class="fw-bold mb-0 mt-1" style="color:var(--ink)">${esc(p.name)}</h5>
        <div class="d-flex align-items-center gap-2">
          ${stars(p.rating)}
          <span class="fw-bold" style="color:var(--ink)">${(p.rating || 0).toFixed(1)}</span>
          <span class="count small">(${p.ratingCount || 0})</span>
        </div>
        <div class="meta-row"><i class="bi bi-geo-alt"></i> ${esc(p.location || "Local area")} · <i class="bi bi-briefcase"></i> ${p.experience || 1} yrs</div>
        <p class="text-muted-2 small mb-0" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(p.bio || "")}</p>
        <hr class="divider-x my-2">
        <div class="d-flex align-items-center justify-content-between">
          <span class="price-tag">${money(p.price)} <span>/ hour</span></span>
          <span class="btn btn-brand btn-sm">View & book</span>
        </div>
      </div>
    </a>
  </div>`;
}

function applyFilters() {
  let list = state.providers.filter((p) => p.published !== false);
  if (state.category) list = list.filter((p) => p.category === state.category);
  if (state.location) list = list.filter((p) => p.location === state.location);
  if (state.q) {
    const q = state.q.toLowerCase();
    list = list.filter((p) =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.bio || "").toLowerCase().includes(q) ||
      catName(p.category).toLowerCase().includes(q));
  }
  const sorters = {
    rating: (a, b) => (b.rating || 0) - (a.rating || 0),
    price_low: (a, b) => a.price - b.price,
    price_high: (a, b) => b.price - a.price,
    exp: (a, b) => (b.experience || 0) - (a.experience || 0),
  };
  list.sort(sorters[state.sort]);

  const grid = $("#providerGrid");
  $("#resultCount").textContent = `${list.length} professional${list.length === 1 ? "" : "s"} found`;
  if (!list.length) {
    grid.innerHTML = `<div class="col-12"><div class="empty-state surface"><div class="icon"><i class="bi bi-search"></i></div><h5 class="fw-bold">No matches</h5><p class="mb-0">Try a different category, location or search term.</p></div></div>`;
    return;
  }
  grid.innerHTML = list.map(providerCard).join("");
  if (window.gsap) {
    gsap.from("#providerGrid [data-card]", { opacity: 0, y: 24, duration: .5, stagger: .06, ease: "power2.out" });
  }
}

function renderFeatured() {
  const top = [...state.providers].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);
  $("#featuredGrid").innerHTML = top.map((p) => `
    <div class="col-sm-6">
      <a href="provider.html?id=${encodeURIComponent(p.id)}" class="surface p-3 d-flex align-items-center gap-3 text-decoration-none h-100" style="border-radius:14px">
        <img src="${esc(p.photoURL)}" class="avatar" alt="${esc(p.name)}">
        <div class="flex-grow-1">
          <div class="fw-bold" style="color:var(--ink)">${esc(p.name)}</div>
          <div class="small text-muted-2">${catName(p.category)}</div>
          <div class="small">${stars(p.rating)} <span class="fw-bold">${(p.rating || 0).toFixed(1)}</span></div>
        </div>
        <i class="bi bi-chevron-right text-muted-2"></i>
      </a>
    </div>`).join("");
}

function populateLocations() {
  const locs = [...new Set(state.providers.map((p) => p.location).filter(Boolean))].sort();
  $("#locationFilter").insertAdjacentHTML("beforeend", locs.map((l) => `<option value="${esc(l)}">${esc(l)}</option>`).join(""));
}

function heroAnimation() {
  if (!window.gsap) return;
  gsap.from("[data-hero]", { opacity: 0, y: 26, duration: .7, stagger: .12, ease: "power3.out" });
  gsap.from("[data-anim='hero-right']", { opacity: 0, x: 40, duration: .9, ease: "power3.out" });

  // count-up stats
  $$("[data-count]").forEach((el) => {
    const target = +el.dataset.count;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: "power1.out",
      onUpdate: () => { el.textContent = Math.floor(obj.v).toLocaleString() + (target >= 1000 ? "+" : ""); },
    });
  });

  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray("[data-how]").forEach((el) => {
      gsap.from(el, { opacity: 0, y: 30, duration: .6, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%" } });
    });
  }
}

// ---- wire inputs ----
$("#searchInput").addEventListener("input", (e) => { state.q = e.target.value; applyFilters(); });
$("#locationFilter").addEventListener("change", (e) => { state.location = e.target.value; applyFilters(); });
$("#sortSelect").addEventListener("change", (e) => { state.sort = e.target.value; applyFilters(); });

// ---- boot ----
renderCategories();
renderChips();
renderHow();

const back = await store();
state.providers = await back.getProviders();
populateLocations();
renderFeatured();
applyFilters();
heroAnimation();
mountFooter();
