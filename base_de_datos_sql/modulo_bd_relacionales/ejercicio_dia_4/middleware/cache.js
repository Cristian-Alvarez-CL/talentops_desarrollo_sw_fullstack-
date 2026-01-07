const redisClient = require('../config/redis');

const cache = (duration = 3600) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedData = await redisClient.get(key);
      
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      const originalJson = res.json;
      res.json = function(data) {
        redisClient.setEx(key, duration, JSON.stringify(data));
        originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache error:', error);
      next();
    }
  };
};

const clearCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

module.exports = { cache, clearCache };