/**
 * Write data to an API path
 */
export const syncToApi = async (path, data) => {
  try {
    const res = await fetch('/api/data/path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, data })
    });
    return res.ok;
  } catch (err) {
    console.warn(`API sync failed [${path}]:`, err.message);
    return false;
  }
};

/**
 * Sync ALL data to API at once
 */
export const syncAllToApi = async (allData) => {
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allData)
    });
    return res.ok;
  } catch (err) {
    console.warn('API bulk sync failed:', err.message);
    return false;
  }
};

/**
 * Load ALL data from API at once
 */
export const loadAllFromApi = async () => {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('API bulk load failed:', err.message);
    return null;
  }
};

/**
 * Polling for ALL data changes (simulating real-time)
 * Returns unsubscribe function
 */
export const subscribeToAllApi = (callback) => {
  let interval;
  const poll = async () => {
    try {
      const data = await loadAllFromApi();
      if (data) callback(data);
    } catch (err) {
      // ignore
    }
  };
  
  // Initial fetch and then poll every 3 seconds
  poll();
  interval = setInterval(poll, 3000);
  
  return () => clearInterval(interval);
};
