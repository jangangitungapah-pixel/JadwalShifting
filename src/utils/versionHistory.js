const MAX_VERSIONS = 10;
const STORAGE_KEY = 'shift_version_history';

export const saveVersion = (shifts, label = '') => {
  const versions = getVersions();
  const version = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    label: label || `Versi ${versions.length + 1}`,
    data: JSON.stringify(shifts),
  };
  versions.unshift(version);
  if (versions.length > MAX_VERSIONS) versions.pop();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
  return version;
};

export const getVersions = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
};

export const restoreVersion = (versionId) => {
  const versions = getVersions();
  const v = versions.find(x => x.id === versionId);
  if (!v) return null;
  const data = JSON.parse(v.data);
  localStorage.setItem('shift_data', JSON.stringify(data));
  return data;
};

export const deleteVersion = (versionId) => {
  const versions = getVersions().filter(v => v.id !== versionId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
};

let autoBackupInterval = null;
export const startAutoBackup = (getShifts, intervalMs = 300000) => {
  stopAutoBackup();
  autoBackupInterval = setInterval(() => {
    const shifts = getShifts();
    if (shifts && Object.keys(shifts).length > 0) {
      saveVersion(shifts, `Auto-backup ${new Date().toLocaleTimeString('id-ID')}`);
    }
  }, intervalMs);
};
export const stopAutoBackup = () => { if (autoBackupInterval) { clearInterval(autoBackupInterval); autoBackupInterval = null; } };
