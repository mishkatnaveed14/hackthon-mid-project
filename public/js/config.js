// =============================================================
//  QuickServe — Configuration
// =============================================================

export const firebaseConfig = {
  apiKey: "AIzaSyCdVckxscetRZzlsIp1R6q4UFxWM8-mPfQ",
  authDomain: "femhack-template.firebaseapp.com",
  projectId: "femhack-template",
  storageBucket: "femhack-template.firebasestorage.app",
  messagingSenderId: "160729730748",
  appId: "1:160729730748:web:b865ad6dfb02170e408ab9"
};

// ---- Cloudinary (unsigned upload) — used for provider & profile images ----
// Create an unsigned upload preset in your Cloudinary dashboard and set it here.
export const cloudinaryConfig = {
  cloudName: "ie54wile",
  uploadPreset: "femhack",
};

// True when Firebase has real credentials (not the placeholders above).
// Keep the MVP usable from Live Server without depending on Firebase network
// access. Set this to true after confirming the Firebase project is configured.
export const firebaseReady = false;

export const cloudinaryReady =
  cloudinaryConfig.cloudName &&
  !cloudinaryConfig.cloudName.startsWith("YOUR_") &&
  cloudinaryConfig.uploadPreset &&
  !cloudinaryConfig.uploadPreset.startsWith("YOUR_");

export const SERVICE_CATEGORIES = [
  { id: "plumbing", name: "Plumbing", icon: "bi-droplet-half" },
  { id: "electrical", name: "Electrical", icon: "bi-lightning-charge" },
  { id: "cleaning", name: "Cleaning", icon: "bi-stars" },
  { id: "carpentry", name: "Carpentry", icon: "bi-hammer" },
  { id: "painting", name: "Painting", icon: "bi-brush" },
  { id: "gardening", name: "Gardening", icon: "bi-tree" },
];
