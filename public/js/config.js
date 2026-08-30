// =============================================================
//  QuickServe — Configuration
// =============================================================

export const firebaseConfig = {
  apiKey: "AIzaSyAvZc5kUc_dEXpUMf9RJweJprsE2acrOi8",
  authDomain: "mid-hackathon-project-c7e0a.firebaseapp.com",
  projectId: "mid-hackathon-project-c7e0a",
  storageBucket: "mid-hackathon-project-c7e0a.firebasestorage.app",
  messagingSenderId: "583423653697",
  appId: "1:583423653697:web:639fca58e623f6c7cd53c0"
};

// ---- Cloudinary (unsigned upload) — used for provider & profile images ----
// Create an unsigned upload preset in your Cloudinary dashboard and set it here.
export const cloudinaryConfig = {
  cloudName: "mlazbr7f",
  uploadPreset: "my_preset",
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
