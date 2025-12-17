const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Configuración
const DATA_PATH = path.join(__dirname, 'data/users.json');
const PASSWORD_TEXTO = '123456';

async function resetUsers() {
  console.log('🔄 Generando nueva contraseña segura...');
  
  // 1. Crear el hash real para "123456"
  const hashedPassword = await bcrypt.hash(PASSWORD_TEXTO, 10);

  // 2. Crear la lista de usuarios con el hash válido
  const users = [
    {
      "id": "u1",
      "username": "admin",
      "password": hashedPassword,
      "role": "admin",
      "email": "admin@blog.com"
    },
    {
      "id": "u2",
      "username": "autor_tech",
      "password": hashedPassword,
      "role": "autor",
      "email": "autor@blog.com"
    }
  ];

  // 3. Sobrescribir el archivo users.json
  fs.writeFileSync(DATA_PATH, JSON.stringify(users, null, 2));
  
  console.log(`✅ Archivo data/users.json actualizado con éxito.`);
  console.log(`🔑 Usuario: admin`);
  console.log(`🔑 Password: ${PASSWORD_TEXTO}`);
  console.log(`🔒 Hash generado: ${hashedPassword}`);
}

resetUsers();