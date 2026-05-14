/**
 * Safe localStorage wrapper with quota protection
 * and PIN hashing utilities.
 */

// ── SHA-256 Hashing for PIN ──
export const hashPin = async (pin) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'shiftsync-salt-v2');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const verifyPin = async (inputPin, storedHash) => {
  const inputHash = await hashPin(inputPin);
  return inputHash === storedHash;
};

// ── Safe localStorage with quota protection ──
const QUOTA_WARNING_THRESHOLD = 0.85; // 85%

export const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
      console.error(`[Storage] Quota exceeded when saving "${key}". Trying cleanup...`);
      // Try to free space by removing old auto-backups
      try {
        const versions = JSON.parse(localStorage.getItem('shift_version_history') || '[]');
        if (versions.length > 3) {
          const trimmed = versions.slice(0, 3);
          localStorage.setItem('shift_version_history', JSON.stringify(trimmed));
          // Retry
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          console.warn('[Storage] Freed space by trimming version history.');
          return true;
        }
      } catch { /* ignore */ }
      console.error('[Storage] Could not free enough space.');
      return false;
    }
    console.error(`[Storage] Error saving "${key}":`, e);
    return false;
  }
};

export const safeGetItem = (key, fallback = null) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    return item;
  } catch (e) {
    console.error(`[Storage] Error reading "${key}":`, e);
    return fallback;
  }
};

export const safeGetJSON = (key, fallback = null) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    return JSON.parse(item);
  } catch (e) {
    console.error(`[Storage] Error parsing "${key}":`, e);
    return fallback;
  }
};

export const getStorageUsage = () => {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    total += (key.length + value.length) * 2; // UTF-16
  }
  return {
    usedBytes: total,
    usedMB: (total / (1024 * 1024)).toFixed(2),
    isNearQuota: total > (5 * 1024 * 1024 * QUOTA_WARNING_THRESHOLD)
  };
};
