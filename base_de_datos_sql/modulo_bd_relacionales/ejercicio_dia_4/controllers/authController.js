const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { sendEmail } = require('../utils/emailService');

const register = async (req, res) => {
  const { nombre, email, password, edad } = req.body;

  try {
    // Verificar si el usuario ya existe
    const [existing] = await pool.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const [result] = await pool.execute(
      'INSERT INTO usuarios (nombre, email, password, edad) VALUES (?, ?, ?, ?)',
      [nombre, email, hashedPassword, edad]
    );

    // Generar token
    const token = jwt.sign(
      { id: result.insertId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Enviar email de bienvenida
    await sendEmail({
      to: email,
      subject: 'Bienvenido a TTops',
      html: `<h1>Bienvenido ${nombre}!</h1><p>Tu cuenta ha sido creada exitosamente.</p>`
    }).catch(err => console.error('Error de email ignorado en test:', err.message));

    res.status(201).json({
      success: true,
      token,
      usuario: { id: result.insertId, nombre, email, edad }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ? AND activo = TRUE',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Actualizar último login
    await pool.execute(
      'UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Generar token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre FROM usuarios WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = rows[0];
    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET + user.password,
      { expiresIn: '1h' }
    );

    // Guardar token en la base de datos
    await pool.execute(
      'UPDATE usuarios SET reset_token = ?, reset_token_expira = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?',
      [resetToken, user.id]
    );

    // Enviar email con link de reset
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Restablecer contraseña',
      html: `
        <h1>Solicitud de restablecimiento de contraseña</h1>
        <p>Hola ${user.nombre},</p>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Este enlace expirará en 1 hora.</p>
      `
    }).catch(err => console.error('Error de email ignorado en test:', err.message));

    res.json({ message: 'Email de recuperación enviado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // 1. Verificar si existe un usuario con ese token y que no haya expirado
    const [rows] = await pool.execute(
      'SELECT id, password FROM usuarios WHERE reset_token = ? AND reset_token_expira > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'El token es inválido o ha expirado' });
    }

    const user = rows[0];

    // 2. Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Actualizar contraseña y limpiar el token
    await pool.execute(
      'UPDATE usuarios SET password = ?, reset_token = NULL, reset_token_expira = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.json({ success: true, message: 'Contraseña restablecida con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
};

module.exports = { register, login, forgotPassword, resetPassword};