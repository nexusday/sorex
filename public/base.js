import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, update, get, onValue, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";



const firebaseConfig = {
  apiKey: "AIzaSyDtIYdqccolOWz1jfH8vXsYvwyQzuAV6E8",
  authDomain: "studio-5824860134-cb96e.firebaseapp.com",
  projectId: "studio-5824860134-cb96e",
  storageBucket: "studio-5824860134-cb96e.firebasestorage.app",
  messagingSenderId: "448337629415",
  appId: "1:448337629415:web:732fd03a1005e334919242",
  databaseURL: "https://studio-5824860134-cb96e-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getDatabase(app);

const loadUserProfile = async (uid) => {
  const snap = await get(ref(db, `users/${uid}`));
  return snap.exists() ? snap.val() : null;
};

const ensureUserProfile = async (user) => {
  const userRef = ref(db, `users/${user.uid}`);
  const existing = await loadUserProfile(user.uid);
  let username = existing?.username;

  if (!username) {
    const suggested = (user.displayName || user.email || "").split(" ")[0] || `user${user.uid.slice(0, 6)}`;
    const picker = typeof window.requestUsername === 'function'
      ? window.requestUsername
      : () => Promise.resolve(prompt("Elige un nombre de usuario", suggested) || suggested);
    const input = await picker(suggested);
    username = (input || suggested).trim() || suggested;
    await set(userRef, {
      username,
      displayName: username, 
      email: user.email || "",
      photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}`,
      createdAt: existing?.createdAt || Date.now(),
      lastLogin: Date.now()
    });
  } else {
    
    const updates = {
      email: user.email || "",
      lastLogin: Date.now()
    };
    
    
    if (existing?.displayName !== username) {
      updates.displayName = username;
    }
    
    
    if (!user.photoURL || (existing?.displayName && existing.displayName !== username)) {
      updates.photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}`;
    } else if (user.photoURL && user.photoURL !== existing?.photoURL) {
      updates.photoURL = user.photoURL;
    }
    
    await update(userRef, updates);
  }

  return { ...(existing || {}), username };
};

const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const profile = await ensureUserProfile(user);
  return { user, profile };
};

const signOutUser = async () => signOut(auth);


window.firebaseServices = {
  app,
  auth,
  db,
  signInWithGoogle,
  signOutUser,
  onAuthStateChanged,
  loadUserProfile,
  ref,
  set,
  update,
  onValue,
  push,
  get
};
