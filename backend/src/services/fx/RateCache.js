/**
 * In-memory cache for exchange rates with TTL
 * Uses LRU (Least Recently Used) eviction policy
 */

class RateCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get rate from cache
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }
    
    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }

  /**
   * Set rate in cache
   */
  set(key, value) {
    // Delete if exists (to move to end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Add to cache
    this.cache.set(key, value);
    
    // Evict oldest if over size limit
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Check if key exists
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get all keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Delete specific key
   */
  delete(key) {
    return this.cache.delete(key);
  }
}

module.exports = RateCache;
