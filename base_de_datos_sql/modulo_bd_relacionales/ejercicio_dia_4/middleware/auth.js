const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const [rows] = await pool.execute(
        'SELECT id, nombre, email, rol FROM usuarios WHERE id = ? AND activo = TRUE',
        [decoded.id]
      );

      if (rows.length === 0) {
        return res.status(401).json({ message: 'Usuario no autorizado' });
      }

      req.user = rows[0];
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Token inválido' });
    }
  } else {
    res.status(401).json({ message: 'No autorizado, token no proporcionado' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.rol === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado, se requieren privilegios de administrador' });
  }
};

module.exports = { protect, admin };