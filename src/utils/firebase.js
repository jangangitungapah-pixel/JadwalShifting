import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// =============================================================
// 🔥 FIREBASE CONFIG — Ganti dengan config dari Firebase Console
// =============================================================
// Cara mendapatkan config:
// 1. Buka https://console.firebase.google.com/
// 2. Buat project baru (gratis)
// 3. Klik "Add app" → Web (</>)
// 4. Copy config object dan paste di bawah ini
// =============================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let app = null;
let database = null;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
} catch (err) {
  console.warn('Firebase init failed:', err.message);
}

export { database };
export const isFirebaseReady = () => !!database && !firebaseConfig.apiKey.startsWith('YOUR_');
