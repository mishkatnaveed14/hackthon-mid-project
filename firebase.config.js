import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Apni Firebase credentials yahan add karein
  const firebaseConfig = {
    apiKey: "AIzaSyAvZc5kUc_dEXpUMf9RJweJprsE2acrOi8",
    authDomain: "mid-hackathon-project-c7e0a.firebaseapp.com",
    projectId: "mid-hackathon-project-c7e0a",
    storageBucket: "mid-hackathon-project-c7e0a.firebasestorage.app",
    messagingSenderId: "583423653697",
    appId: "1:583423653697:web:639fca58e623f6c7cd53c0"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const facebookProvider = new FacebookAuthProvider();