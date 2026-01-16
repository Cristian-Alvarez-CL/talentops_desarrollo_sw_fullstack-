const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const JWTUtils = require('../utils/jwtUtils');
const authMiddleware = require('../middleware/authMiddleware');

// Base de datos simulada (en producción usarías MongoDB, PostgreSQL, etc.)
let users = [];
let refreshTokens = [];

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validaciones básicas
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos.' 
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ 
        error: 'El usuario ya existe.' 
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      name,
      role: 'user',
      createdAt: new Date()
    };

    users.push(newUser);

    // Generar tokens
    const accessToken = JWTUtils.generateAccessToken(newUser);
    const refreshToken = JWTUtils.generateRefreshToken(newUser);

    // Guardar refresh token
    refreshTokens.push(refreshToken);

    res.status(201).json({
      message: 'Usuario registrado exitosamente.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      },
      tokens: {
        accessToken,
        refreshToken,
        accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Login de usuario
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos.' 
      });
    }

    // Buscar usuario
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas.' 
      });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas.' 
      });
    }

    // Generar tokens
    const accessToken = JWTUtils.generateAccessToken(user);
    const refreshToken = JWTUtils.generateRefreshToken(user);

    // Guardar refresh token
    refreshTokens.push(refreshToken);

    // Si rememberMe es true, configurar expiración más larga
    let refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY;
    if (rememberMe) {
      refreshTokenExpiry = '30d';
    }

    res.json({
      message: 'Login exitoso.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken,
        accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY,
        refreshTokenExpiry
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Refrescar token
router.post('/refresh', authMiddleware.authenticateRefreshToken, (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verificar si el refresh token está en la lista
    if (!refreshTokens.includes(refreshToken)) {
      return res.status(403).json({ 
        error: 'Refresh token inválido.' 
      });
    }

    // Generar nuevo access token
    const accessToken = JWTUtils.generateAccessToken(req.user);

    res.json({
      accessToken,
      accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY
    });
  } catch (error) {
    console.error('Error al refrescar token:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Remover refresh token de la lista
    refreshTokens = refreshTokens.filter(token => token !== refreshToken);

    res.json({ 
      message: 'Logout exitoso.' 
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Verificar token
router.get('/verify', authMiddleware.authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

// Ruta protegida de ejemplo
router.get('/profile', authMiddleware.authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt
  });
});

module.exports = router;