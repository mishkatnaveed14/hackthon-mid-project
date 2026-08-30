import { SERVICE_CATEGORIES } from "./config.js";
import {
  $, $$, mountChrome, mountFooter, money, catName, esc, toast, fmtDate, requireAuth, uploadImage,
} from "./ui.js";

await mountChrome();
const { user, back } = await requireAuth("provider");

$("#welcome").textContent = `Hi, ${(user.name || "").split(" ")[0] || "there"}`;

let profile = await back.getProvider(user.uid);
if (!profile) {
  // Safety net: create a profile if missing.
  profile = {
    id: user.uid, name: user.name, email: user.email, photoURL: user.photoURL || "",
    category: "plumbing", location: "", price: 40, experience: 1, bio: "",
    rating: 0, ratingCount: 0, jobs: 0, published: false, createdAt: Date.now(),
  };
  await back.saveProvider(user.uid, profile);
}

let bookings = [];
let filter = "new";
let pendingPhoto = profile.photoURL || "";

const STATUS_LABEL = {
  pending: "New request", accepted: "Accepted", in_progress: "In progress",
  completed: "Completed", rejected: "Declined",
};
const TABS = [
  { id: "new", label: "New", match: (b) => b.status === "pending" },
  { id: "active", label: "Active", match: (b) => ["accepted", "in_progress"].includes(b.status) },
  { id: "completed", label: "Completed", match: (b) => b.status === "completed" },
  { id: "rejected", label: "Declined", match: (b) => b.status === "rejected" },
  { id: "all", label: "All", match: () => true },
];

// ---------- Profile editor ----------
function fillCategories() {
  $("#categorySelect").innerHTML = SERVICE_CATEGORIES.map((c) =>
    `<option value="${c.id}">${c.name}</option>`).join("");
}
function fillProfileForm() {
  const f = $("#profileForm");
  f.category.value = profile.category || "plumbing";
  f.price.value = profile.price ?? 40;
  f.experience.value = profile.experience ?? 1;
  f.location.value = profile.location || "";
  f.bio.value = profile.bio || "";
  $("#publishSwitch").checked = profile.published !== false;
  $("#profilePreview").src = profile.photoURL || "images/og-cover.png";
  renderPubStatus(profile.published !== false);
}
function renderPubStatus(pub) {
  const el = $("#pubStatus");
  el.className = "status " + (pub ? "status-completed" : "status-pending");
  el.textContent = pub ? "Live" : "Hidden";
}

$("#photoInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  $("#uploadHint").textContent = "Uploading...";
  try {
    const url = await uploadImage(file);
    pendingPhoto = url;
    $("#profilePreview").src = url;
    $("#uploadHint").textContent = "Photo ready — save to apply.";
  } catch (err) {
    $("#uploadHint").textContent = "";
    toast("Image upload failed.", "err");
  }
});

$("#profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const btn = $("#saveProfile"); btn.disabled = true; btn.querySelector(".spinner-border").classList.remove("d-none");
  const data = {
    category: f.category.value,
    price: Math.max(1, +f.price.value || 40),
    experience: Math.max(0, +f.experience.value || 0),
    location: f.location.value.trim(),
    bio: f.bio.value.trim(),
    published: $("#publishSwitch").checked,
    photoURL: pendingPhoto || "",
    name: user.name,
  };
  try {
    await back.saveProvider(user.uid, data);
    if (pendingPhoto && pendingPhoto !== user.photoURL) await back.saveUser(user.uid, { photoURL: pendingPhoto });
    profile = { ...profile, ...data };
    renderPubStatus(data.published);
    $("#uploadHint").textContent = "";
    toast("Profile saved.", "ok");
  } catch (err) {
    toast(err.message || "Could not save profile.", "err");
  } finally {
    btn.disabled = false; btn.querySelector(".spinner-border").classList.add("d-none");
  }
});

// ---------- Bookings ----------
function renderTabs() {
  $("#filterTabs").innerHTML = TABS.map((t) => {
    const count = bookings.filter(t.match).length;
    return `<button class="chip ${t.id === filter ? "active" : ""}" data-f="${t.id}">${t.label}${count ? ` <span class="ms-1 opacity-75">${count}</span>` : ""}</button>`;
  }).join("");
  $$("#filterTabs .chip").forEach((c) =>
    c.addEventListener("click", () => { filter = c.dataset.f; renderTabs(); renderList(); }));
}

function stats() {
  $("#statNew").textContent = bookings.filter((b) => b.status === "pending").length;
  $("#statActive").textContent = bookings.filter((b) => ["accepted", "in_progress"].includes(b.status)).length;
  $("#statDone").textContent = bookings.filter((b) => b.status === "completed").length;
  $("#statRating").textContent = (profile.rating || 0).toFixed(1);
}

function actionButtons(b) {
  switch (b.status) {
    case "pending":
      return `<button class="btn btn-brand btn-sm" data-act="accepted" data-id="${b.id}"><i class="bi bi-check-lg me-1"></i>Accept</button>
              <button class="btn btn-outline-ink btn-sm text-danger" data-act="rejected" data-id="${b.id}">Decline</button>`;
    case "accepted":
      return `<button class="btn btn-brand btn-sm" data-act="in_progress" data-id="${b.id}"><i class="bi bi-play-fill me-1"></i>Start job</button>`;
    case "in_progress":
      return `<button class="btn btn-brand btn-sm" data-act="completed" data-id="${b.id}"><i class="bi bi-flag-fill me-1"></i>Mark complete</button>`;
    case "completed":
      return `<span class="text-success small"><i class="bi bi-check-circle-fill"></i> Completed</span>`;
    default:
      return `<span class="text-muted-2 small">No actions</span>`;
  }
}

function bookingRow(b) {
  return `
  <div class="booking-row" data-row>
    <div class="d-flex flex-wrap align-items-start gap-3">
      <span class="avatar d-inline-grid" style="place-items:center;background:var(--brand-soft);color:var(--brand);font-weight:800;font-size:1.1rem">${esc((b.customerName || "C").charAt(0).toUpperCase())}</span>
      <div class="flex-grow-1">
        <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
          <span class="booking-id">${esc(b.code || b.id)}</span>
          <span class="status status-${b.status}">${STATUS_LABEL[b.status] || b.status}</span>
        </div>
        <h6 class="fw-bold mb-1">${esc(b.customerName)} <span class="text-muted-2 fw-normal">· ${catName(b.category)}</span></h6>
        <div class="d-flex flex-wrap gap-3 text-muted-2 small mb-2">
          <span><i class="bi bi-calendar-event me-1"></i>${fmtDate(b.date)} at ${esc(b.time)}</span>
          <span><i class="bi bi-geo-alt me-1"></i>${esc(b.location)}</span>
          <span><i class="bi bi-cash me-1"></i>${money(b.price)}/hr</span>
        </div>
        <p class="text-muted-2 small mb-0">${esc(b.description)}</p>
      </div>
      <div class="d-flex flex-column gap-2 align-items-stretch">${actionButtons(b)}</div>
    </div>
  </div>`;
}

function renderList() {
  const tab = TABS.find((t) => t.id === filter);
  const list = bookings.filter(tab.match);
  const wrap = $("#bookingList");
  if (!list.length) {
    wrap.innerHTML = `<div class="empty-state surface"><div class="icon"><i class="bi bi-inbox"></i></div><h5 class="fw-bold">Nothing here yet</h5><p class="mb-0">${filter === "new" ? "New booking requests will appear here." : "No bookings in this category."}</p></div>`;
    return;
  }
  wrap.innerHTML = list.map(bookingRow).join("");
  $$("[data-act]").forEach((btn) =>
    btn.addEventListener("click", () => updateStatus(btn.dataset.id, btn.dataset.act)));
  if (window.gsap) gsap.from("[data-row]", { opacity: 0, y: 18, duration: .4, stagger: .05, ease: "power2.out" });
}

async function updateStatus(id, status) {
  const b = bookings.find((x) => x.id === id);
  if (!b) return;
  try {
    const patch = { status };
    if (status === "completed") { patch.completedAt = Date.now(); profile.jobs = (profile.jobs || 0) + 1; }
    await back.updateBooking(id, patch);
    if (status === "completed") await back.saveProvider(user.uid, { jobs: profile.jobs });
    Object.assign(b, patch);
    const labels = { accepted: "Booking accepted", rejected: "Booking declined", in_progress: "Job started", completed: "Job completed" };
    toast(labels[status] || "Updated", status === "rejected" ? "err" : "ok");
    stats(); renderTabs(); renderList();
  } catch (err) {
    toast(err.message || "Could not update booking.", "err");
  }
}

// ---------- boot ----------
fillCategories();
fillProfileForm();
renderTabs();
bookings = await back.getBookingsForProvider(user.uid);
stats();
renderList();
if (window.gsap) gsap.from("[data-dash]", { opacity: 0, y: 20, duration: .5, stagger: .1, ease: "power2.out" });
mountFooter();
