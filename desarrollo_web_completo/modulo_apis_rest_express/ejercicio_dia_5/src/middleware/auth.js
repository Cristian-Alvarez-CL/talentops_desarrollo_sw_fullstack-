const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');

module.exports = (roles = []) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acceso denegado' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};