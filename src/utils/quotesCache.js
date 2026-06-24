const CACHE_PREFIX = "cinemate_quotes_";
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds


const cleanExpiredOrExcessCache = () => {
  try {
    const keys = [];
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keys.push(key);
      }
    }

    const activeEntries = [];
    keys.forEach((key) => {
      try {
        const itemStr = localStorage.getItem(key);
        if (itemStr) {
          const item = JSON.parse(itemStr);
          if (now - item.timestamp > CACHE_TTL) {
            localStorage.removeItem(key);
          } else {
            activeEntries.push({ key, timestamp: item.timestamp });
          }
        }
      } catch (e) {
        localStorage.removeItem(key);
      }
    });

    const MAX_ENTRIES = 100;
    if (activeEntries.length > MAX_ENTRIES) {
      activeEntries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemoveCount = activeEntries.length - MAX_ENTRIES;
      for (let i = 0; i < toRemoveCount; i++) {
        localStorage.removeItem(activeEntries[i].key);
      }
    }
  } catch (e) {
    console.warn("[QUOTES CACHE] Cache cleanup error:", e);
  }
};


export const getQuotesFromCache = (id) => {
  if (!id) return null;
  try {
    const itemStr = localStorage.getItem(CACHE_PREFIX + id);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    const now = Date.now();

    if (now - item.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_PREFIX + id);
      return null;
    }
    return item.data;
  } catch (e) {
    console.warn("[QUOTES CACHE] Error reading from localStorage:", e);
    return null;
  }
};


export const saveQuotesToCache = (id, data) => {
  if (!id || !data) return;
  try {
    cleanExpiredOrExcessCache();

    const item = {
      timestamp: Date.now(),
      data: data,
    };
    localStorage.setItem(CACHE_PREFIX + id, JSON.stringify(item));
  } catch (e) {
    console.warn("[QUOTES CACHE] Error writing to localStorage:", e);
  }
};


export const clearQuotesCache = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    console.log("[QUOTES CACHE] Persistent cache cleared successfully");
  } catch (e) {
    console.error("[QUOTES CACHE] Failed to clear persistent cache:", e);
  }
};
