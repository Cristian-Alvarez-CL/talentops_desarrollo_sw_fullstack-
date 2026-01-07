const Redis = require('redis');
require('dotenv').config();

const redisClient = Redis.createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
  password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis connected'));

(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;