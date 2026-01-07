const pool = require('../config/database');

const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      usuario: req.user
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el perfil' });
  }
};

const updateProfile = async (req, res) => {
  const { nombre, edad } = req.body;
  const usuario_id = req.user.id;

  try {
    await pool.execute(
      'UPDATE usuarios SET nombre = ?, edad = ? WHERE id = ?',
      [nombre, edad, usuario_id]
    );
    res.json({ success: true, message: 'Perfil actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, email, rol, activo, fecha_registro FROM usuarios'
    );
    res.json({ success: true, usuarios: rows });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

module.exports = { getProfile, updateProfile, getAllUsers };