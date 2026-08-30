import { store, bookingCode } from "./store.js";
import {
  $, $$, mountChrome, mountFooter, stars, money, catName, catIcon, esc, toast, fmtDate,
} from "./ui.js";

await mountChrome();

const id = new URLSearchParams(location.search).get("id");
const back = await store();
let currentUser = null;
back.onAuth((u) => (currentUser = u));

const root = $("#providerRoot");
const provider = id ? await back.getProvider(id) : null;

if (!provider) {
  root.innerHTML = `<div class="empty-state surface"><div class="icon"><i class="bi bi-emoji-frown"></i></div><h4 class="fw-bold">Provider not found</h4><p>This professional may no longer be available.</p><a href="index.html" class="btn btn-brand mt-2">Back to home</a></div>`;
} else {
  const reviews = await back.getReviews(provider.id);
  renderProvider(provider, reviews);
}

function renderProvider(p, reviews) {
  root.innerHTML = `
  <nav class="mb-3 small"><a href="index.html" class="text-muted-2"><i class="bi bi-arrow-left me-1"></i>Back to marketplace</a></nav>
  <div class="row g-4">
    <div class="col-lg-8" data-detail>
      <div class="surface overflow-hidden mb-4">
        <div style="aspect-ratio:16/6;overflow:hidden;background:#eef2f7">
          <img src="${esc(p.photoURL || "images/og-cover.png")}" alt="${esc(p.name)}" style="width:100%;height:100%;object-fit:cover">
        </div>
        <div class="p-4">
          <div class="d-flex flex-wrap align-items-start gap-3">
            <img src="${esc(p.photoURL || "images/og-cover.png")}" class="avatar-lg" alt="${esc(p.name)}" style="margin-top:-56px">
            <div class="flex-grow-1">
              <span class="cat-tag"><i class="bi ${catIcon(p.category)} me-1"></i>${catName(p.category)}</span>
              <h2 class="fw-bold mb-1 mt-2">${esc(p.name)}</h2>
              <div class="d-flex align-items-center flex-wrap gap-3 text-muted-2">
                <span>${stars(p.rating)} <span class="fw-bold" style="color:var(--ink)">${(p.rating || 0).toFixed(1)}</span> <span class="small">(${p.ratingCount || 0} reviews)</span></span>
                <span><i class="bi bi-geo-alt"></i> ${esc(p.location || "Local area")}</span>
                <span><i class="bi bi-briefcase"></i> ${p.experience || 1} yrs experience</span>
                <span><i class="bi bi-check-circle"></i> ${p.jobs || 0} jobs done</span>
              </div>
            </div>
          </div>
          <hr class="divider-x my-4">
          <h5 class="fw-bold">About ${esc((p.name || "").split(" ")[0])}</h5>
          <p class="text-muted-2">${esc(p.bio || "This provider hasn't added a bio yet.")}</p>
        </div>
      </div>

      <div class="surface p-4" data-detail>
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h5 class="fw-bold mb-0">Customer reviews</h5>
          <span class="text-muted-2 small">${reviews.length} review${reviews.length === 1 ? "" : "s"}</span>
        </div>
        <div id="reviewList"></div>
      </div>
    </div>

    <div class="col-lg-4">
      <div class="surface p-4" style="position:sticky;top:90px" data-detail>
        <div class="d-flex align-items-baseline justify-content-between mb-1">
          <span class="price-tag" style="font-size:1.7rem">${money(p.price)} <span>/ hour</span></span>
        </div>
        <p class="text-muted-2 small">Typical response within a few hours. Free cancellation up to 24h before.</p>
        <button class="btn btn-brand btn-lg w-100 mb-2" id="openBooking"><i class="bi bi-calendar-check me-2"></i>Book now</button>
        <div class="d-flex flex-column gap-2 mt-3 small">
          <div class="d-flex align-items-center gap-2 text-muted-2"><i class="bi bi-shield-check" style="color:var(--success)"></i> Background verified</div>
          <div class="d-flex align-items-center gap-2 text-muted-2"><i class="bi bi-cash-coin" style="color:var(--success)"></i> Transparent pricing</div>
          <div class="d-flex align-items-center gap-2 text-muted-2"><i class="bi bi-chat-left-heart" style="color:var(--success)"></i> ${p.ratingCount || 0} verified reviews</div>
        </div>
      </div>
    </div>
  </div>`;

  renderReviews(reviews);
  wireBooking(p);
  if (window.gsap) gsap.from("[data-detail]", { opacity: 0, y: 24, duration: .5, stagger: .1, ease: "power2.out" });
}

function renderReviews(reviews) {
  const list = $("#reviewList");
  if (!reviews.length) {
    list.innerHTML = `<div class="empty-state py-4"><div class="icon"><i class="bi bi-chat-square-text"></i></div><p class="mb-0">No reviews yet. Be the first after your booking is completed!</p></div>`;
    return;
  }
  list.innerHTML = reviews.map((r) => `
    <div class="py-3" style="border-bottom:1px solid var(--border)">
      <div class="d-flex align-items-center gap-2 mb-1">
        <span class="avatar d-inline-grid" style="width:38px;height:38px;place-items:center;background:var(--brand-soft);color:var(--brand);font-weight:800">${esc((r.customerName || "U").charAt(0).toUpperCase())}</span>
        <div>
          <div class="fw-semibold" style="line-height:1.1">${esc(r.customerName || "Customer")}</div>
          <div class="small text-muted-2">${fmtDate(r.createdAt)}</div>
        </div>
        <span class="ms-auto">${stars(r.rating)}</span>
      </div>
      <p class="text-muted-2 mb-0 mt-1">${esc(r.comment || "")}</p>
    </div>`).join("");
}

function wireBooking(p) {
  const modalEl = $("#bookingModal");
  const modal = new bootstrap.Modal(modalEl);
  $("#bmAvatar").src = p.photoURL || "images/og-cover.png";
  $("#bmName").textContent = p.name;
  $("#bmCat").textContent = catName(p.category);
  $("#bmPrice").innerHTML = money(p.price) + " <span>/ hr</span>";

  $("#openBooking").addEventListener("click", () => {
    if (!currentUser) {
      toast("Please log in to book a provider.", "err");
      setTimeout(() => (location.href = "auth.html?redirect=" + encodeURIComponent(location.pathname + location.search)), 900);
      return;
    }
    if (currentUser.role === "provider") { toast("Switch to a customer account to book.", "err"); return; }
    modal.show();
  });

  const form = $("#bookingForm");
  const setErr = (f, m) => { const el = form.querySelector(`[data-error="${f}"]`); if (el) el.textContent = m || ""; };
  // min date = today
  form.date.min = new Date().toISOString().split("T")[0];

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    $$(".field-error", form).forEach((x) => (x.textContent = ""));
    let ok = true;
    if (!d.date) { setErr("date", "Choose a date."); ok = false; }
    if (!d.time) { setErr("time", "Choose a time."); ok = false; }
    if (!d.location || d.location.trim().length < 4) { setErr("location", "Enter the service address."); ok = false; }
    if (!d.description || d.description.trim().length < 8) { setErr("description", "Add a few details about the job."); ok = false; }
    if (!ok) return;

    const btn = $("#bookSubmit"); btn.disabled = true; btn.querySelector(".spinner-border").classList.remove("d-none");
    try {
      await back.createBooking({
        code: bookingCode(),
        customerId: currentUser.uid, customerName: currentUser.name, customerEmail: currentUser.email,
        providerId: p.id, providerName: p.name, providerPhoto: p.photoURL || "",
        category: p.category, price: p.price,
        date: d.date, time: d.time, location: d.location.trim(), description: d.description.trim(),
        status: "pending", reviewed: false, createdAt: Date.now(),
      });
      modal.hide();
      toast("Booking request sent! Track it in your dashboard.", "ok");
      setTimeout(() => (location.href = "dashboard.html"), 1100);
    } catch (err) {
      toast(err.message || "Could not create booking.", "err");
      btn.disabled = false; btn.querySelector(".spinner-border").classList.add("d-none");
    }
  });
}

mountFooter();
