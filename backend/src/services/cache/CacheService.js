/**
 * CacheService - Provides caching functionality
 * Uses Redis if available, falls back to in-memory cache
 * 
 * Performance: Implements caching strategy (Requirement 12.1, 12.2)
 */

// In-memory cache fallback
const memoryCache = new Map();

class CacheService {
  constructor() {
    this.redis = null;
    this.useRedis = false;
  }

  /**
   * Initialize Redis connection (optional)
   * @param {Object} redisClient - Redis client instance
   */
  initRedis(redisClient) {
    this.redis = redisClient;
    this.useRedis = true;
    console.log('✅ CacheService: Redis initialized');
  }

  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (optional)
   */
  async set(key, value, ttl = null) {
    const stringValue = JSON.stringify(value);

    if (this.useRedis && this.redis) {
      try {
        if (ttl) {
          await this.redis.setEx(key, ttl, stringValue);
        } else {
          await this.redis.set(key, stringValue);
        }
        return true;
      } catch (error) {
        console.error('Redis set error:', error);
        // Fallback to memory cache
        this._setMemory(key, value, ttl);
        return true;
      }
    } else {
      this._setMemory(key, value, ttl);
      return true;
    }
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} - Cached value or null
   */
  async get(key) {
    if (this.useRedis && this.redis) {
      try {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.error('Redis get error:', error);
        // Fallback to memory cache
        return this._getMemory(key);
      }
    } else {
      return this._getMemory(key);
    }
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   */
  async del(key) {
    if (this.useRedis && this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        console.error('Redis del error:', error);
      }
    }
    memoryCache.delete(key);
  }

  /**
   * Add value to a set
   * @param {string} key - Set key
   * @param {string} value - Value to add
   */
  async sadd(key, value) {
    if (this.useRedis && this.redis) {
      try {
        await this.redis.sAdd(key, value);
        return true;
      } catch (error) {
        console.error('Redis sadd error:', error);
        // Fallback to memory cache
        this._saddMemory(key, value);
        return true;
      }
    } else {
      this._saddMemory(key, value);
      return true;
    }
  }

  /**
   * Remove value from a set
   * @param {string} key - Set key
   * @param {string} value - Value to remove
   */
  async srem(key, value) {
    if (this.useRedis && this.redis) {
      try {
        await this.redis.sRem(key, value);
      } catch (error) {
        console.error('Redis srem error:', error);
      }
    }
    
    const set = memoryCache.get(key);
    if (set instanceof Set) {
      set.delete(value);
    }
  }

  /**
   * Get all members of a set
   * @param {string} key - Set key
   * @returns {Promise<Array>} - Array of set members
   */
  async smembers(key) {
    if (this.useRedis && this.redis) {
      try {
        return await this.redis.sMembers(key);
      } catch (error) {
        console.error('Redis smembers error:', error);
        // Fallback to memory cache
        return this._smembersMemory(key);
      }
    } else {
      return this._smembersMemory(key);
    }
  }

  /**
   * Check if value is in set
   * @param {string} key - Set key
   * @param {string} value - Value to check
   * @returns {Promise<boolean>}
   */
  async sismember(key, value) {
    if (this.useRedis && this.redis) {
      try {
        return await this.redis.sIsMember(key, value);
      } catch (error) {
        console.error('Redis sismember error:', error);
        // Fallback to memory cache
        const set = memoryCache.get(key);
        return set instanceof Set ? set.has(value) : false;
      }
    } else {
      const set = memoryCache.get(key);
      return set instanceof Set ? set.has(value) : false;
    }
  }

  // Memory cache helpers
  _setMemory(key, value, ttl) {
    memoryCache.set(key, value);
    
    if (ttl) {
      setTimeout(() => {
        memoryCache.delete(key);
      }, ttl * 1000);
    }
  }

  _getMemory(key) {
    return memoryCache.get(key) || null;
  }

  _saddMemory(key, value) {
    let set = memoryCache.get(key);
    if (!(set instanceof Set)) {
      set = new Set();
      memoryCache.set(key, set);
    }
    set.add(value);
  }

  _smembersMemory(key) {
    const set = memoryCache.get(key);
    return set instanceof Set ? Array.from(set) : [];
  }

  /**
   * Clear all cache (for testing)
   */
  async clear() {
    if (this.useRedis && this.redis) {
      try {
        await this.redis.flushDb();
      } catch (error) {
        console.error('Redis clear error:', error);
      }
    }
    memoryCache.clear();
  }
}

// Singleton instance
const cacheService = new CacheService();

export default cacheService;
