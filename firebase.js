

import { auth, db, googleProvider, facebookProvider } from "./firebase.config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ==========================================
// 1. CLOUDINARY UPLOAD SERVICE
// ==========================================
export const uploadImageToCloudinary = async (file) => {
  if (!file) return null;
  const cloudName = "mlazbr7f"; // Apno Cloudinary Cloud Name
  const uploadPreset = "abcd1234"; // Apno Upload Preset

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    return data.secure_url || null;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};

// ==========================================
// 2. AUTHENTICATION SERVICES
// ==========================================

// --- Email/Password Sign Up ---
export const registerUser = async (email, password, additionalData = {}) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      name: additionalData.name || "",
      email: email,
      contact: additionalData.contact || "",
      country: additionalData.country || "",
      role: additionalData.role || "user",
      isActive: true,
      profileImg: additionalData.profileImg || "",
      createdAt: serverTimestamp()
    });

    // Send email verification link before sign-out
    await sendEmailVerification(user);
    await signOut(auth);
    return { success: true, message: "Registration successful! Verification email sent." };
  } catch (error) {
    console.error("SignUp Error:", error);
    return { success: false, error: error.message };
  }
};

// --- Email/Password Login ---
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      await sendEmailVerification(user);
      await signOut(auth);
      return { success: false, error: "Please verify your email first. A new link has been sent." };
    }

    return { success: true, user };
  } catch (error) {
    console.error("Login Error:", error);
    return { success: false, error: error.message };
  }
};

// --- Google Sign-In ---
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if doc exists, if not create default doc
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      await setDoc(userRef, {
        name: user.displayName || "",
        email: user.email,
        contact: "",
        country: "",
        role: "user",
        isActive: true,
        profileImg: user.photoURL || "",
        createdAt: serverTimestamp()
      });
    }

    return { success: true, user };
  } catch (error) {
    console.error("Google Auth Error:", error);
    return { success: false, error: error.message };
  }
};

// --- Facebook Sign-In ---
export const loginWithFacebook = async () => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      await setDoc(userRef, {
        name: user.displayName || "",
        email: user.email || "",
        contact: "",
        country: "",
        role: "user",
        isActive: true,
        profileImg: user.photoURL || "",
        createdAt: serverTimestamp()
      });
    }

    return { success: true, user };
  } catch (error) {
    console.error("Facebook Auth Error:", error);
    return { success: false, error: error.message };
  }
};

// --- Password Reset ---
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: "Password reset email sent!" };
  } catch (error) {
    console.error("Reset Password Error:", error);
    return { success: false, error: error.message };
  }
};

// --- Sign Out ---
export const logoutUser = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem("user");
    return { success: true };
  } catch (error) {
    console.error("Logout Error:", error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// 3. FIRESTORE GENERIC CRUD OPERATIONS
// ==========================================

// Create/Set Document
export const createData = async (collectionName, id, data) => {
  try {
    const docRef = id ? doc(db, collectionName, id) : doc(collection(db, collectionName));
    await setDoc(docRef, { ...data, timestamp: serverTimestamp() });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error(`Error adding to ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
};

// Read Single Document
export const getDataById = async (collectionName, id) => {
  try {
    const docSnap = await getDoc(doc(db, collectionName, id));
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: "Document does not exist." };
  } catch (error) {
    console.error(`Error getting doc from ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
};

// Read Collection Documents
export const getAllData = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const list = [];
    querySnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: list };
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
};

// Update Document
export const updateData = async (collectionName, id, updateObj) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, updateObj);
    return { success: true };
  } catch (error) {
    console.error(`Error updating ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
};

// Delete Document
export const deleteData = async (collectionName, id) => {
  try {
    await deleteDoc(doc(db, collectionName, id));
    return { success: true };
  } catch (error) {
    console.error(`Error deleting from ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// 4. USER PROFILE MANAGEMENT
// ==========================================
export const updateUserProfile = async (uid, updateFields, imageFile = null) => {
  try {
    let profileImgUrl = null;
    if (imageFile) {
      profileImgUrl = await uploadImageToCloudinary(imageFile);
    }

    const payload = { ...updateFields };
    if (profileImgUrl) payload.profileImg = profileImgUrl;

    await updateDoc(doc(db, "users", uid), payload);
    return { success: true, profileImgUrl };
  } catch (error) {
    console.error("Profile Update Error:", error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// 5. AUTH STATE & ROUTE GUARD INITIALIZER
// ==========================================
export const initAuthGuard = (config = {}) => {
  const {
    protectedRoutes = [],
    adminRoutes = [],
    loginRedirect = "/",
    unauthorizedRedirect = "/html/404.html",
    onUserLoaded = () => {}
  } = config;

  onAuthStateChanged(auth, async (user) => {
    const currentPath = window.location.pathname;

    if (user) {
      // User Signed In
      const userSnap = await getDoc(doc(db, "users", user.uid));
      let userData = userSnap.exists() ? userSnap.data() : {};
      const fullUser = { uid: user.uid, ...userData };

      localStorage.setItem("user", JSON.stringify(fullUser));

      // Admin Protection Check
      if (adminRoutes.includes(currentPath) && userData.role !== "admin") {
        window.location.replace(unauthorizedRedirect);
        return;
      }

      onUserLoaded(fullUser);
    } else {
      // User Signed Out
      localStorage.removeItem("user");

      // Protected Route Check
      if (protectedRoutes.includes(currentPath) || adminRoutes.includes(currentPath)) {
        window.location.replace(loginRedirect);
      }
      onUserLoaded(null);
    }
  });
};
