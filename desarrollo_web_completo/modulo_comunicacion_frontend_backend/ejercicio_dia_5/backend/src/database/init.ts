import { dbConfig, createClient } from '../config/database.js';

const createDatabaseIfNotExists = async () => {
  const adminClient = createClient({ database: 'postgres' });

  try {
    await adminClient.connect();
    console.log('Conectado al servidor PostgreSQL...');
    const checkResult = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbConfig.database]
    );

    if (checkResult.rows.length === 0) {
      console.log(`La base de datos '${dbConfig.database}' no existe. Creando...`);
      await adminClient.query(`CREATE DATABASE ${dbConfig.database}`);
      console.log(`Base de datos '${dbConfig.database}' creada exitosamente!`);
    } else {
      console.log(`La base de datos '${dbConfig.database}' ya existe.`);
    }
  } finally {
    await adminClient.end();
  }
};

const initializeTables = async () => {
  const client = createClient();

  try {
    await client.connect();
    console.log(`Conectado a la base de datos '${dbConfig.database}'...`);
    console.log('Creando tablas...');

    await client.query(`
      -- Habilitar extensión UUID
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Tabla de usuarios
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
        avatar VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de refresh tokens
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de proyectos
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de miembros de proyecto
      CREATE TABLE IF NOT EXISTS project_members (
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (project_id, user_id)
      );

      -- Tabla de tareas
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
        due_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de archivos adjuntos
      CREATE TABLE IF NOT EXISTS task_attachments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mimetype VARCHAR(100) NOT NULL,
        size INTEGER NOT NULL,
        uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Crear índices para mejor rendimiento
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
      CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);

      -- Función trigger para updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Aplicar trigger a tabla users
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- Aplicar trigger a tabla projects
      DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
      CREATE TRIGGER update_projects_updated_at
        BEFORE UPDATE ON projects
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- Aplicar trigger a tabla tasks
      DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
      CREATE TRIGGER update_tasks_updated_at
        BEFORE UPDATE ON tasks
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('Tablas creadas exitosamente!');
  } finally {
    await client.end();
  }
};

const initDatabase = async () => {
  try {
    console.log('='.repeat(50));
    console.log('TaskFlow - Inicialización de Base de Datos');
    console.log('='.repeat(50));
    console.log(`Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`Database: ${dbConfig.database}`);
    console.log(`User: ${dbConfig.user}`);
    console.log('='.repeat(50));

    await createDatabaseIfNotExists();

    await initializeTables();

    console.log('='.repeat(50));
    console.log('Inicialización completada exitosamente!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  }
};

initDatabase();
