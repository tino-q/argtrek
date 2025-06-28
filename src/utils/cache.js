/**
 * Generic localStorage-based caching utility
 * Supports both time-based expiration and constant caching
 */

// Common cache durations
export const CACHE_DURATIONS = {
  CONSTANT: Number.MAX_SAFE_INTEGER,
  ONE_HOUR: 60 * 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  ONE_MINUTE: 60 * 1000,
};

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @param {number} maxAgeMs - Maximum age in milliseconds (use Number.MAX_SAFE_INTEGER for constant cache)
 * @returns {any|null} - Cached data or null if not found/expired
 */
export const getCachedData = (key, maxAgeMs = Number.MAX_SAFE_INTEGER) => {
  try {
    const dataStr = localStorage.getItem(key);
    const timestampStr = localStorage.getItem(`${key}_timestamp`);

    if (!dataStr) {
      return null;
    }

    // For constant cache, skip timestamp check
    if (maxAgeMs === Number.MAX_SAFE_INTEGER) {
      return JSON.parse(dataStr);
    }

    // Check timestamp for expiring caches
    if (!timestampStr) {
      // If no timestamp, treat as expired
      return null;
    }

    const timestamp = parseInt(timestampStr);
    const now = Date.now();

    if (now - timestamp > maxAgeMs) {
      // Cache expired, clean it up
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
      return null;
    }

    return JSON.parse(dataStr);
  } catch (error) {
    console.warn(`Failed to read cached data for key ${key}:`, error);
    // Clean up invalid cache entry
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_timestamp`);
    return null;
  }
};

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} maxAgeMs - Maximum age in milliseconds (use Number.MAX_SAFE_INTEGER for constant cache)
 */
export const setCachedData = (
  key,
  data,
  maxAgeMs = Number.MAX_SAFE_INTEGER
) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));

    // Only set timestamp for expiring caches
    if (maxAgeMs !== Number.MAX_SAFE_INTEGER) {
      localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    }
  } catch (error) {
    console.warn(`Failed to cache data for key ${key}:`, error);
  }
};

/**
 * Remove data from cache
 * @param {string} key - Cache key
 */
export const removeCachedData = (key) => {
  try {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_timestamp`);
  } catch (error) {
    console.warn(`Failed to remove cached data for key ${key}:`, error);
  }
};

/**
 * Clear all cached data (useful for logout)
 * @param {string[]} keys - Array of cache keys to clear
 */
export const clearCachedData = (keys) => {
  keys.forEach((key) => {
    removeCachedData(key);
  });
};
/**
 * Generic fetch with caching
 * @param {string} cacheKey - Cache key
 * @param {Function} fetchFn - Function that returns a Promise for fetching data
 * @param {number} maxAgeMs - Maximum age in milliseconds (use Number.MAX_SAFE_INTEGER for constant cache)
 * @returns {Promise<any>} - Cached or fresh data
 */
export const fetchWithLocalStorageCache = async (
  cacheKey,
  fetchFn,
  maxAgeMs = CACHE_DURATIONS.CONSTANT,
  refresh = false
) => {
  // Try to get cached data first
  const cachedData = getCachedData(cacheKey, maxAgeMs);
  if (cachedData !== null && !refresh) {
    return cachedData;
  }

  // Fetch fresh data
  const freshData = await fetchFn();

  // Cache the fresh data
  setCachedData(cacheKey, freshData, maxAgeMs);

  return freshData;
};
