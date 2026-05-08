const ALGO = 'AES-GCM';
const getKey = async (password) => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode('shiftsync-salt-v1'), iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: ALGO, length: 256 }, false, ['encrypt', 'decrypt']);
};

export const encryptData = async (data, password) => {
  try {
    const key = await getKey(password);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const encrypted = await crypto.subtle.encrypt({ name: ALGO, iv }, key, encoded);
    return JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) });
  } catch (e) { console.error('Encryption failed:', e); return null; }
};

export const decryptData = async (encryptedStr, password) => {
  try {
    const key = await getKey(password);
    const { iv, data } = JSON.parse(encryptedStr);
    const decrypted = await crypto.subtle.decrypt({ name: ALGO, iv: new Uint8Array(iv) }, key, new Uint8Array(data));
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (e) { console.error('Decryption failed:', e); return null; }
};
