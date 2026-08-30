import { store } from "./store.js";
import { $, $$, mountFooter, toast } from "./ui.js";

const params = new URLSearchParams(location.search);
let mode = params.get("mode") === "register" ? "register" : "login";
let role = "customer";
const redirect = params.get("redirect");

const form = $("#authForm");
const els = {
  title: $("#authTitle"), sub: $("#authSub"), roleToggle: $("#roleToggle"),
  nameField: $("#nameField"), phoneField: $("#phoneField"),
  submitLabel: $("#submitBtn .label"), submitBtn: $("#submitBtn"),
  spinner: $("#submitBtn .spinner-border"),
  switchText: $("#switchText"), switchMode: $("#switchMode"),
};

// Redirect away if already signed in.
const back = await store();
let firstAuth = true;
back.onAuth((user) => {
  if (firstAuth && user) {
    location.href = redirect || (user.role === "provider" ? "provider-dashboard.html" : "dashboard.html");
  }
  firstAuth = false;
});

function render() {
  const isReg = mode === "register";
  els.title.textContent = isReg ? "Create your account" : "Welcome back";
  els.sub.textContent = isReg ? "Join QuickServe in less than a minute." : "Log in to manage your bookings.";
  els.roleToggle.hidden = !isReg;
  els.nameField.hidden = !isReg;
  els.phoneField.hidden = !(isReg && role === "provider");
  els.submitLabel.textContent = isReg ? "Create account" : "Log in";
  els.switchText.textContent = isReg ? "Already have an account?" : "New to QuickServe?";
  els.switchMode.textContent = isReg ? "Log in instead" : "Create an account";
  if (window.gsap) gsap.fromTo("[data-auth-card]", { opacity: .6, y: 8 }, { opacity: 1, y: 0, duration: .3 });
}

$$("#roleToggle button").forEach((b) =>
  b.addEventListener("click", () => {
    role = b.dataset.role;
    $$("#roleToggle button").forEach((x) => x.classList.toggle("active", x === b));
    els.phoneField.hidden = !(role === "provider");
  }));

els.switchMode.addEventListener("click", (e) => { e.preventDefault(); mode = mode === "login" ? "register" : "login"; render(); });

$("#togglePw").addEventListener("click", () => {
  const inp = form.password;
  inp.type = inp.type === "password" ? "text" : "password";
  $("#togglePw i").className = inp.type === "password" ? "bi bi-eye" : "bi bi-eye-slash";
});

function setError(field, msg) {
  const el = form.querySelector(`[data-error="${field}"]`);
  if (el) el.textContent = msg || "";
}
function clearErrors() { $$(".field-error", form).forEach((e) => (e.textContent = "")); }

function validate(data) {
  clearErrors();
  let ok = true;
  if (mode === "register" && (!data.name || data.name.trim().length < 2)) { setError("name", "Please enter your name."); ok = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || "")) { setError("email", "Enter a valid email address."); ok = false; }
  if (!data.password || data.password.length < 6) { setError("password", "Password must be at least 6 characters."); ok = false; }
  return ok;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  if (!validate(data)) return;

  els.submitBtn.disabled = true;
  els.spinner.classList.remove("d-none");
  try {
    let user;
    if (mode === "register") {
      user = await back.register({ name: data.name.trim(), email: data.email, password: data.password, role, phone: data.phone });
      toast("Account created — welcome to QuickServe!", "ok");
    } else {
      user = await back.login(data.email, data.password);
      toast("Signed in successfully.", "ok");
    }
    firstAuth = false;
    setTimeout(() => {
      location.href = redirect || (user.role === "provider" ? "provider-dashboard.html" : "dashboard.html");
    }, 500);
  } catch (err) {
    const msg = (err && err.message ? err.message : "Something went wrong.")
      .replace("Firebase:", "").replace(/\(auth.*\)\.?/, "").trim();
    toast(msg || "Authentication failed.", "err");
    els.submitBtn.disabled = false;
    els.spinner.classList.add("d-none");
  }
});

render();
mountFooter();
