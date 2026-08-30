import { 
  registerUser, 
  loginUser, 
  loginWithGoogle, 
  updateUserProfile, 
  initAuthGuard 
} from "./firebase.js";

// --- Route Protection Setup ---
initAuthGuard({
  protectedRoutes: ["/html/user/profile.html", "/html/user/myorders.html"],
  adminRoutes: ["/html/admin/dashboard.html"],
  loginRedirect: "/",
  onUserLoaded: (user) => {
    if (user) {
      console.log("Logged in user:", user);
      // Populate fields automatically
      const nameElem = document.getElementById("name");
      if (nameElem) nameElem.value = user.name || "";
    }
  }
});

// --- Sign Up Event ---
document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const res = await registerUser(email.value, password.value, {
    name: name.value,
    contact: contact.value,
    country: country.value
  });
  alert(res.success ? res.message : res.error);
});

// --- Google Login ---
document.getElementById("googleBtn")?.addEventListener("click", async () => {
  const res = await loginWithGoogle();
  if (res.success) window.location.replace("/");
  else alert(res.error);
});

// --- Update Profile (with or without Image) ---
document.getElementById("updateBtn")?.addEventListener("click", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const fileInput = document.getElementById("imgInput");
  const file = fileInput?.files?.[0] || null;

  const res = await updateUserProfile(user.uid, {
    name: document.getElementById("name").value,
    contact: document.getElementById("contact").value
  }, file);

  if (res.success) alert("Profile updated successfully!");
});