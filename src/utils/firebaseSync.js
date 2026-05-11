import { ref, set, get, onValue, off } from 'firebase/database';
import { database, isFirebaseReady } from './firebase';

// Root path in Firebase for all ShiftSync data
const ROOT = 'shiftsync';

/**
 * Write data to a Firebase path
 */
export const syncToFirebase = async (path, data) => {
  if (!isFirebaseReady()) return false;
  try {
    await set(ref(database, `${ROOT}/${path}`), data);
    return true;
  } catch (err) {
    console.warn(`Firebase sync failed [${path}]:`, err.message);
    return false;
  }
};

/**
 * Read data from a Firebase path (one-time)
 */
export const loadFromFirebase = async (path) => {
  if (!isFirebaseReady()) return null;
  try {
    const snapshot = await get(ref(database, `${ROOT}/${path}`));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (err) {
    console.warn(`Firebase load failed [${path}]:`, err.message);
    return null;
  }
};

/**
 * Subscribe to real-time changes on a Firebase path
 * Returns unsubscribe function
 */
export const subscribeToFirebase = (path, callback) => {
  if (!isFirebaseReady()) return () => {};
  const dbRef = ref(database, `${ROOT}/${path}`);
  const listener = onValue(dbRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  }, (err) => {
    console.warn(`Firebase subscribe error [${path}]:`, err.message);
  });
  // Return unsubscribe function
  return () => off(dbRef, 'value', listener);
};

/**
 * Sync ALL data to Firebase at once
 */
export const syncAllToFirebase = async (allData) => {
  if (!isFirebaseReady()) return false;
  try {
    await set(ref(database, ROOT), allData);
    return true;
  } catch (err) {
    console.warn('Firebase bulk sync failed:', err.message);
    return false;
  }
};

/**
 * Load ALL data from Firebase at once
 */
export const loadAllFromFirebase = async () => {
  if (!isFirebaseReady()) return null;
  try {
    const snapshot = await get(ref(database, ROOT));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (err) {
    console.warn('Firebase bulk load failed:', err.message);
    return null;
  }
};

/**
 * Subscribe to ALL data changes (real-time)
 * Returns unsubscribe function
 */
export const subscribeToAll = (callback) => {
  if (!isFirebaseReady()) return () => {};
  const dbRef = ref(database, ROOT);
  const listener = onValue(dbRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  }, (err) => {
    console.warn('Firebase subscribe all error:', err.message);
  });
  return () => off(dbRef, 'value', listener);
};
