// Firebase app initialization and shared exports.
//
// After creating your Firebase project, replace the placeholder values below.
// Firebase Console → Project Settings → Your apps → Web app → SDK setup and configuration
//
// The web config object is intentionally public — it is safe to commit.
// Do NOT commit service account JSON (that is for the import script only).

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDYC3L0DxcTQ3bHcoadyS91M7QTeUs1btY",
  authDomain: "everyday-altar.firebaseapp.com",
  projectId: "everyday-altar",
  storageBucket: "everyday-altar.firebasestorage.app",
  messagingSenderId: "10860827701",
  appId: "1:10860827701:web:e09b07e19481581d790d7c"
};

const app = initializeApp(firebaseConfig);

export const db      = getFirestore(app);
export const storage = getStorage(app);
