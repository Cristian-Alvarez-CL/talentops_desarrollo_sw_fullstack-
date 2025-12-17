const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const DataModel = require('../models/DataModel');
const User = new DataModel('users');
const { JWT_SECRET } = require('../config/constants');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  
  // 1. Obtener usuarios
  const users = await User.getAll();
  
  // 2. Buscar usuario
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  // 3. Verificar contraseña
  const validPassword = await bcrypt.compare(password, user.password);
  
  if (!validPassword) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  // 4. Generar Token
  const token = jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '4h' }
  );

  res.json({
    message: 'Autenticación exitosa',
    token,
    user: { id: user.id, role: user.role }
  });
};

exports.register = async (req, res) => {
  res.status(501).json({ message: "Registro no habilitado en esta versión demo" });
};