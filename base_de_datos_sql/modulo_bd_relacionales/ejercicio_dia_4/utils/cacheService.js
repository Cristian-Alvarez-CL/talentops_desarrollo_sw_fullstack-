const redisClient = require('../config/redis');

class CacheService {
  async get(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, data, ttl = 3600) {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Cache del error:', error);
      return false;
    }
  }

  async clearPattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache clearPattern error:', error);
      return false;
    }
  }

  async getOrSet(key, fetchData, ttl = 3600) {
    const cached = await this.get(key);
    if (cached) {
      return cached;
    }

    const data = await fetchData();
    await this.set(key, data, ttl);
    return data;
  }
}

module.exports = new CacheService();