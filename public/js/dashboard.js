import {
  $, $$, mountChrome, mountFooter, stars, money, catName, catIcon, esc, toast, fmtDate, requireAuth,
} from "./ui.js";

await mountChrome();
const { user, back } = await requireAuth("customer");

$("#welcome").textContent = `Welcome back, ${(user.name || "").split(" ")[0] || "there"}`;

let bookings = [];
let filter = "all";

const STATUS_LABEL = {
  pending: "Pending", accepted: "Accepted", in_progress: "In progress",
  completed: "Completed", rejected: "Declined",
};
const TABS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "rejected", label: "Declined" },
];

function renderTabs() {
  $("#filterTabs").innerHTML = TABS.map((t) =>
    `<button type="button" class="chip ${t.id === filter ? "active" : ""}" data-f="${t.id}" aria-pressed="${t.id === filter}">${t.label}</button>`).join("");
  $$("#filterTabs .chip").forEach((c) =>
    c.addEventListener("click", () => { filter = c.dataset.f; renderTabs(); renderList(); }));
}

function stats() {
  $("#statTotal").textContent = bookings.length;
  $("#statActive").textContent = bookings.filter((b) => ["pending", "accepted", "in_progress"].includes(b.status)).length;
  $("#statDone").textContent = bookings.filter((b) => b.status === "completed").length;
}

function matches(b) {
  if (filter === "all") return true;
  if (filter === "active") return ["pending", "accepted", "in_progress"].includes(b.status);
  return b.status === filter;
}

function bookingRow(b) {
  const canReview = b.status === "completed" && !b.reviewed;
  return `
  <div class="booking-row" data-row>
    <div class="d-flex flex-wrap align-items-start gap-3">
      <img src="${esc(b.providerPhoto || "images/og-cover.png")}" class="avatar" alt="${esc(b.providerName)}">
      <div class="flex-grow-1">
        <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
          <span class="booking-id">${esc(b.code || b.id)}</span>
          <span class="status status-${b.status}">${STATUS_LABEL[b.status] || b.status}</span>
        </div>
        <h6 class="fw-bold mb-1">${esc(b.providerName)} <span class="text-muted-2 fw-normal">· ${catName(b.category)}</span></h6>
        <div class="d-flex flex-wrap gap-3 text-muted-2 small mb-2">
          <span><i class="bi bi-calendar-event me-1"></i>${fmtDate(b.date)} at ${esc(b.time)}</span>
          <span><i class="bi bi-geo-alt me-1"></i>${esc(b.location)}</span>
          <span><i class="bi bi-cash me-1"></i>${money(b.price)}/hr</span>
        </div>
        <p class="text-muted-2 small mb-0">${esc(b.description)}</p>
      </div>
      <div class="d-flex flex-column gap-2">
        <a href="provider.html?id=${encodeURIComponent(b.providerId)}" class="btn btn-outline-ink btn-sm">View provider</a>
        ${canReview ? `<button class="btn btn-brand btn-sm" data-review="${b.id}"><i class="bi bi-star me-1"></i>Leave review</button>` : ""}
        ${b.reviewed ? `<span class="text-success small text-center"><i class="bi bi-check-circle-fill"></i> Reviewed</span>` : ""}
      </div>
    </div>
  </div>`;
}

function renderList() {
  const list = bookings.filter(matches);
  const wrap = $("#bookingList");
  if (!list.length) {
    const emptyText = filter === "all"
      ? "When you book a professional, it'll show up in this list."
      : `There are no ${filter === "active" ? "active" : filter} bookings right now.`;
    wrap.innerHTML = `<div class="empty-state surface"><div class="icon"><i class="bi bi-calendar-x"></i></div><h5 class="fw-bold">No bookings here</h5><p>${emptyText}</p><a href="index.html#services" class="btn btn-brand mt-2">Browse services</a></div>`;
    return;
  }
  wrap.innerHTML = list.map(bookingRow).join("");
  $$("[data-review]").forEach((btn) => btn.addEventListener("click", () => openReview(btn.dataset.review)));
  if (window.gsap) gsap.from("[data-row]", { opacity: 0, y: 18, duration: .4, stagger: .05, ease: "power2.out" });
}

// ---- Review modal ----
const reviewModal = new bootstrap.Modal($("#reviewModal"));
let reviewRating = 5;
let reviewBooking = null;

$$("#starInput i").forEach((star) => {
  star.addEventListener("mouseenter", () => paintStars(+star.dataset.v));
  star.addEventListener("click", () => { reviewRating = +star.dataset.v; paintStars(reviewRating); });
});
$("#starInput").addEventListener("mouseleave", () => paintStars(reviewRating));
function paintStars(v) { $$("#starInput i").forEach((s) => s.classList.toggle("on", +s.dataset.v <= v)); }

function openReview(bookingId) {
  reviewBooking = bookings.find((b) => b.id === bookingId);
  if (!reviewBooking) return;
  reviewRating = 5; paintStars(5);
  $("#reviewComment").value = "";
  $("#reviewFor").textContent = `How was your service with ${reviewBooking.providerName}?`;
  reviewModal.show();
}

$("#submitReview").addEventListener("click", async () => {
  if (!reviewBooking) return;
  const comment = $("#reviewComment").value.trim();
  const btn = $("#submitReview"); btn.disabled = true;
  try {
    await back.addReview({
      providerId: reviewBooking.providerId, bookingId: reviewBooking.id,
      customerName: user.name, customerId: user.uid,
      rating: reviewRating, comment, createdAt: Date.now(),
    });
    await back.updateBooking(reviewBooking.id, { reviewed: true });
    reviewBooking.reviewed = true;
    reviewModal.hide();
    toast("Thanks for your review!", "ok");
    renderList();
  } catch (err) {
    toast(err.message || "Could not submit review.", "err");
  } finally { btn.disabled = false; }
});

// ---- boot ----
renderTabs();
bookings = await back.getBookingsForCustomer(user.uid);
stats();
renderList();
if (window.gsap) gsap.from("[data-dash]", { opacity: 0, y: 20, duration: .5, ease: "power2.out" });
mountFooter();
