const crypto = require('crypto');

// 1. Métricas
const metrics = {
    requests: 0,
    startTime: Date.now(),
    paths: {}
};

function trackMetrics(req) {
    metrics.requests++;
    const path = req.url.split('?')[0];
    metrics.paths[path] = (metrics.paths[path] || 0) + 1;
}

function getMetrics() {
    return {
        uptime: (Date.now() - metrics.startTime) / 1000 + 's',
        totalRequests: metrics.requests,
        pathHits: metrics.paths
    };
}

// 2. Caché Simple en Memoria
const apiCache = new Map();
const CACHE_DURATION = 60000; // 60 segundos

function getCached(key) {
    const item = apiCache.get(key);
    if (item && Date.now() < item.expiry) return item.data;
    return null;
}

function setCache(key, data) {
    apiCache.set(key, { data, expiry: Date.now() + CACHE_DURATION });
}

// 3. Autenticación (Sesiones simples en memoria)
const sessions = new Map();

function createSession(user) {
    const token = crypto.randomUUID();
    sessions.set(token, user);
    return token;
}

function getUserFromRequest(req) {
    // Parsear cookies manualmente
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;
    
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['session_id'];
    
    return sessions.get(token) || null;
}

module.exports = { 
    trackMetrics, 
    getMetrics, 
    getCached, 
    setCache, 
    createSession, 
    getUserFromRequest 
};