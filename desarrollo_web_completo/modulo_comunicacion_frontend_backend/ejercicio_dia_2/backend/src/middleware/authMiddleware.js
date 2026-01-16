const JWTUtils = require('../utils/jwtUtils');

const authMiddleware = {
  // Middleware para verificar token de acceso
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Acceso denegado. Token no proporcionado.' 
      });
    }

    const decoded = JWTUtils.verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(403).json({ 
        error: 'Token inválido o expirado.' 
      });
    }

    req.user = decoded;
    next();
  },

  // Middleware para verificar token de refresh
  authenticateRefreshToken: (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'Refresh token no proporcionado.' 
      });
    }

    const decoded = JWTUtils.verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      return res.status(403).json({ 
        error: 'Refresh token inválido o expirado.' 
      });
    }

    req.user = decoded;
    next();
  },

  // Middleware para roles específicos
  authorizeRole: (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuario no autenticado.' });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          error: 'No tienes permisos para acceder a este recurso.' 
        });
      }

      next();
    };
  }
};

module.exports = authMiddleware;