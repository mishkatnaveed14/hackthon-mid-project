// =============================================================
//  QuickServe — Data layer
//  One API, two backends:
//   • Firebase (Auth + Firestore) when config is provided
//   • localStorage demo mode otherwise (so the preview always works)
// =============================================================
import { firebaseConfig, firebaseReady } from "./config.js";
import { SEED_PROVIDERS } from "./seed.js";

const uid = () => "u_" + Math.random().toString(36).slice(2, 10);
export const bookingCode = () =>
  "BK-" + Date.now().toString(36).toUpperCase().slice(-4) + Math.random().toString(36).slice(2, 4).toUpperCase();

// ------------------------------------------------------------------
//  Firebase implementation (lazy loaded)
// ------------------------------------------------------------------
async function firebaseBackend() {
  const appMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
  const authMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
  const dbMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

  const app = appMod.initializeApp(firebaseConfig);
  const auth = authMod.getAuth(app);
  const db = dbMod.getFirestore(app);
  const {
    createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
    onAuthStateChanged, updateProfile,
  } = authMod;
  const {
    collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc,
    query, where, orderBy, serverTimestamp, runTransaction,
  } = dbMod;

  async function ensureSeed() {
    const snap = await getDocs(collection(db, "providers"));
    if (snap.empty) {
      await Promise.all(
        SEED_PROVIDERS.map((p) => setDoc(doc(db, "providers", p.id), p))
      );
    }
  }
  await ensureSeed();

  return {
    mode: "firebase",
    onAuth(cb) {
      return onAuthStateChanged(auth, async (u) => {
        if (!u) return cb(null);
        const profile = await getDoc(doc(db, "users", u.uid));
        cb({ uid: u.uid, email: u.email, ...(profile.exists() ? profile.data() : {}) });
      });
    },
    async register({ name, email, password, role, phone }) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      const profile = { uid: cred.user.uid, name, email, role, phone: phone || "", photoURL: "", createdAt: Date.now() };
      await setDoc(doc(db, "users", cred.user.uid), profile);
      if (role === "provider") {
        await setDoc(doc(db, "providers", cred.user.uid), {
          id: cred.user.uid, name, email, photoURL: "",
          category: "plumbing", location: "", price: 40, experience: 1,
          bio: "", rating: 0, ratingCount: 0, jobs: 0, published: false, createdAt: Date.now(),
        });
      }
      return profile;
    },
    async login(email, password) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getDoc(doc(db, "users", cred.user.uid));
      return { uid: cred.user.uid, email, ...(profile.exists() ? profile.data() : {}) };
    },
    logout() { return signOut(auth); },
    async getProviders() {
      const snap = await getDocs(collection(db, "providers"));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
    async getProvider(id) {
      const d = await getDoc(doc(db, "providers", id));
      return d.exists() ? { id: d.id, ...d.data() } : null;
    },
    async saveProvider(id, data) { await updateDoc(doc(db, "providers", id), data); },
    async saveUser(id, data) { await updateDoc(doc(db, "users", id), data); },
    async createBooking(data) {
      const ref = await addDoc(collection(db, "bookings"), data);
      return { id: ref.id, ...data };
    },
    async getBookingsForCustomer(cid) {
      const q = query(collection(db, "bookings"), where("customerId", "==", cid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt);
    },
    async getBookingsForProvider(pid) {
      const q = query(collection(db, "bookings"), where("providerId", "==", pid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt);
    },
    async updateBooking(id, data) { await updateDoc(doc(db, "bookings", id), data); },
    async addReview(review) {
      await addDoc(collection(db, "reviews"), review);
      const pref = doc(db, "providers", review.providerId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(pref);
        const p = snap.data() || { rating: 0, ratingCount: 0 };
        const count = (p.ratingCount || 0) + 1;
        const rating = ((p.rating || 0) * (p.ratingCount || 0) + review.rating) / count;
        tx.update(pref, { rating: Math.round(rating * 10) / 10, ratingCount: count });
      });
    },
    async getReviews(pid) {
      const q = query(collection(db, "reviews"), where("providerId", "==", pid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data()).sort((a, b) => b.createdAt - a.createdAt);
    },
  };
}

// ------------------------------------------------------------------
//  localStorage implementation (demo mode)
// ------------------------------------------------------------------
function localBackend() {
  const KEY = "quickserve_db_v1";
  const read = () => JSON.parse(localStorage.getItem(KEY) || "null");
  const write = (d) => localStorage.setItem(KEY, JSON.stringify(d));
  const normalizeImage = (url = "") => url.replace(/^\/images\//, "images/");

  let db = read();
  if (!db) {
    // Seed providers as data + create matching login accounts (demo password).
    const users = {};
    const providers = {};
    SEED_PROVIDERS.forEach((p) => {
      providers[p.id] = { ...p };
      users[p.id] = {
        uid: p.id, name: p.name, email: p.email, password: "demo1234",
        role: "provider", phone: "", photoURL: p.photoURL,
      };
    });
    db = { users, providers, bookings: [], reviews: [], session: null };
    write(db);
  } else {
    Object.values(db.providers || {}).forEach((p) => { p.photoURL = normalizeImage(p.photoURL); });
    Object.values(db.users || {}).forEach((u) => { u.photoURL = normalizeImage(u.photoURL); });
    db.bookings?.forEach((b) => { b.providerPhoto = normalizeImage(b.providerPhoto); });
    write(db);
  }

  const listeners = new Set();
  const emit = () => {
    const s = db.session ? sanitize(db.users[db.session]) : null;
    listeners.forEach((cb) => cb(s));
  };
  const sanitize = (u) => { if (!u) return null; const { password, ...rest } = u; return rest; };
  const save = () => { write(db); };

  return {
    mode: "local",
    onAuth(cb) {
      listeners.add(cb);
      cb(db.session ? sanitize(db.users[db.session]) : null);
      return () => listeners.delete(cb);
    },
    async register({ name, email, password, role, phone }) {
      email = email.toLowerCase().trim();
      if (Object.values(db.users).some((u) => u.email === email)) {
        throw new Error("An account with this email already exists.");
      }
      const id = uid();
      db.users[id] = { uid: id, name, email, password, role, phone: phone || "", photoURL: "" };
      if (role === "provider") {
        db.providers[id] = {
          id, name, email, photoURL: "", category: "plumbing", location: "",
          price: 40, experience: 1, bio: "", rating: 0, ratingCount: 0, jobs: 0,
          published: false, createdAt: Date.now(),
        };
      }
      db.session = id; save(); emit();
      return sanitize(db.users[id]);
    },
    async login(email, password) {
      email = email.toLowerCase().trim();
      const u = Object.values(db.users).find((x) => x.email === email);
      if (!u || u.password !== password) throw new Error("Invalid email or password.");
      db.session = u.uid; save(); emit();
      return sanitize(u);
    },
    async logout() { db.session = null; save(); emit(); },
    async getProviders() { return Object.values(db.providers); },
    async getProvider(id) { return db.providers[id] || null; },
    async saveProvider(id, data) { db.providers[id] = { ...db.providers[id], ...data }; save(); },
    async saveUser(id, data) {
      db.users[id] = { ...db.users[id], ...data }; save();
      if (db.session === id) emit();
    },
    async createBooking(data) {
      const b = { id: "b_" + uid(), ...data };
      db.bookings.push(b); save();
      return b;
    },
    async getBookingsForCustomer(cid) {
      return db.bookings.filter((b) => b.customerId === cid).sort((a, b) => b.createdAt - a.createdAt);
    },
    async getBookingsForProvider(pid) {
      return db.bookings.filter((b) => b.providerId === pid).sort((a, b) => b.createdAt - a.createdAt);
    },
    async updateBooking(id, data) {
      const b = db.bookings.find((x) => x.id === id);
      if (b) Object.assign(b, data);
      save();
    },
    async addReview(review) {
      db.reviews.push(review);
      const p = db.providers[review.providerId];
      if (p) {
        const count = (p.ratingCount || 0) + 1;
        const rating = ((p.rating || 0) * (p.ratingCount || 0) + review.rating) / count;
        p.rating = Math.round(rating * 10) / 10;
        p.ratingCount = count;
      }
      save();
    },
    async getReviews(pid) {
      return db.reviews.filter((r) => r.providerId === pid).sort((a, b) => b.createdAt - a.createdAt);
    },
  };
}

// ------------------------------------------------------------------
//  Backend selection
// ------------------------------------------------------------------
let _backend = null;
export async function store() {
  if (_backend) return _backend;
  if (firebaseReady) {
    try {
      _backend = await firebaseBackend();
    } catch (error) {
      console.warn("Firebase unavailable; using local demo data.", error);
      _backend = localBackend();
    }
  } else {
    _backend = localBackend();
  }
  return _backend;
}
